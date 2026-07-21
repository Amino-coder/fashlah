import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// Runs once, server-side, when the last player in a session finishes Round
// 3. Never runs client-side and never calls an LLM — pure computation over
// the session's own answers/votes/hot-take responses, per the brief.
//
// Idempotent: guarded by flipping sessions.status from 'in_progress' to
// 'completed' with an eq() filter, so if multiple players' clients race to
// call this at once, only the first one actually computes anything.

type Option = { id: string; emoji?: string; text_ar?: string; text_en?: string; trait_weights?: Record<string, number> };
type QuestionRow = { id: string; category: string | null; round: number; options: Option[] };
type AnswerRow = { player_id: string; question_id: string; selected_option_id: string | null };
type VoteRow = { question_id: string; voter_player_id: string; voted_for_player_id: string };
type PlayerRow = { id: string; nickname: string; avatar_emoji: string; joined_at: string };
type FormulaRow = { trait_key: string; components: { source: string; weight: number; category?: string }[] };
type AwardRow = { id: string; slug: string; emoji: string; name_ar: string; name_en: string; rule: any };
type TemplateRow = { id: string; template_type: string; conditions: { trait?: string; vote_category?: string; op: string; value: number }[]; text_ar: string; text_en: string; weight: number };

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

function checkCondition(op: string, actual: number, target: number): boolean {
  switch (op) {
    case ">": return actual > target;
    case ">=": return actual >= target;
    case "<": return actual < target;
    case "<=": return actual <= target;
    case "==": return actual === target;
    default: return false;
  }
}

function weightedPick<T extends { weight: number }>(items: T[]): T | null {
  if (items.length === 0) return null;
  const total = items.reduce((s, i) => s + (i.weight || 1), 0);
  let r = Math.random() * total;
  for (const item of items) {
    r -= item.weight || 1;
    if (r <= 0) return item;
  }
  return items[items.length - 1];
}

// Deterministic tie-break: earliest joined_at wins, so results are
// reproducible if the engine is ever re-run.
function earliestJoined(players: PlayerRow[]): PlayerRow {
  return players.reduce((a, b) => (a.joined_at < b.joined_at ? a : b));
}

export async function POST(req: NextRequest) {
  try {
    const { session_id } = await req.json();
    if (!session_id) {
      return NextResponse.json({ error: "session_id is required" }, { status: 400 });
    }

    // --- Idempotency guard: only the winner of this race actually computes ---
    const { data: claimedSession, error: claimErr } = await supabaseAdmin
      .from("sessions")
      .update({ status: "completed", ended_at: new Date().toISOString() })
      .eq("id", session_id)
      .eq("status", "in_progress")
      .select()
      .single();

    if (claimErr || !claimedSession) {
      // Someone else already claimed it (or it wasn't in_progress) — that's
      // fine, just report success so the caller proceeds to fetch results.
      return NextResponse.json({ ok: true, already_computed: true });
    }

    const session = claimedSession;

    const [{ data: players }, { data: formulas }, { data: awards }, { data: templates }] = await Promise.all([
      supabaseAdmin.from("players").select("id, nickname, avatar_emoji, joined_at").eq("session_id", session_id),
      supabaseAdmin.from("score_formulas").select("*").eq("enabled", true),
      supabaseAdmin.from("awards").select("*").eq("enabled", true).order("sort_order"),
      supabaseAdmin.from("result_templates").select("*").eq("enabled", true),
    ]);

    const playerList = (players || []) as PlayerRow[];
    const formulaList = (formulas || []) as FormulaRow[];
    const awardList = (awards || []) as AwardRow[];
    const templateList = (templates || []) as TemplateRow[];

    if (playerList.length === 0) {
      return NextResponse.json({ error: "No players found for session" }, { status: 400 });
    }

    const { data: answers } = await supabaseAdmin
      .from("answers")
      .select("player_id, question_id, selected_option_id")
      .eq("session_id", session_id);
    const answerList = (answers || []) as AnswerRow[];

    const { data: votes } = await supabaseAdmin
      .from("votes")
      .select("question_id, voter_player_id, voted_for_player_id")
      .eq("session_id", session_id);
    const voteList = (votes || []) as VoteRow[];

    const questionIds = Array.from(new Set([...answerList.map((a) => a.question_id), ...voteList.map((v) => v.question_id)]));
    const { data: questions } = await supabaseAdmin
      .from("questions")
      .select("id, category, round, options")
      .in("id", questionIds.length > 0 ? questionIds : ["00000000-0000-0000-0000-000000000000"]);
    const questionById = new Map<string, QuestionRow>((questions || []).map((q: QuestionRow) => [q.id, q]));

    // Also need ALL round-2 category->question lookups for vote-category awards,
    // even for categories that didn't appear in this session's random subset.
    const { data: allR2Questions } = await supabaseAdmin
      .from("questions")
      .select("id, category, round, options")
      .eq("pack_id", session.pack_id)
      .eq("round", 2);
    const r2QuestionByCategory = new Map<string, QuestionRow>((allR2Questions || []).map((q: QuestionRow) => [q.category || "", q]));

    const { data: allR1Questions } = await supabaseAdmin
      .from("questions")
      .select("id, category, round, options")
      .eq("pack_id", session.pack_id)
      .eq("round", 1);
    const r1QuestionByCategory = new Map<string, QuestionRow>((allR1Questions || []).map((q: QuestionRow) => [q.category || "", q]));

    // ---------------------------------------------------------------------
    // 1. TRAIT SCORES — average of trait_weights[trait_key] across whichever
    //    Round 1 questions this player actually saw this session.
    // ---------------------------------------------------------------------
    const scoresByPlayer = new Map<string, Record<string, number>>();
    for (const player of playerList) {
      const myAnswers = answerList.filter((a) => a.player_id === player.id);
      const traitScores: Record<string, number> = {};

      for (const formula of formulaList) {
        const sums: number[] = [];
        for (const ans of myAnswers) {
          const q = questionById.get(ans.question_id);
          if (!q || q.round !== 1 || !ans.selected_option_id) continue;
          const opt = q.options.find((o) => o.id === ans.selected_option_id);
          const w = opt?.trait_weights?.[formula.trait_key];
          if (typeof w === "number") sums.push(w);
        }
        const avg = sums.length > 0 ? sums.reduce((a, b) => a + b, 0) / sums.length : 0;
        const scaled = clamp(((avg + 1) / 2) * 100, 0, 100);
        traitScores[formula.trait_key] = Math.round(scaled);
      }
      scoresByPlayer.set(player.id, traitScores);
    }

    // Write scores
    const scoreRows = playerList.flatMap((p) =>
      Object.entries(scoresByPlayer.get(p.id) || {}).map(([trait_key, value]) => ({
        session_id, player_id: p.id, trait_key, value,
      }))
    );
    if (scoreRows.length > 0) {
      await supabaseAdmin.from("scores").upsert(scoreRows, { onConflict: "player_id,trait_key" });
    }

    // ---------------------------------------------------------------------
    // 2. AWARDS
    // ---------------------------------------------------------------------
    const awardResultRows: { session_id: string; player_id: string; award_id: string; rank: number }[] = [];

    for (const award of awardList) {
      const rule = award.rule;
      let winners: PlayerRow[] = [];

      if (rule.type === "top_trait") {
        let best = -Infinity;
        for (const p of playerList) {
          const v = scoresByPlayer.get(p.id)?.[rule.trait_key] ?? -Infinity;
          if (v > best) { best = v; winners = [p]; }
          else if (v === best) { winners.push(p); }
        }
        if (best === -Infinity) winners = [];
      } else if (rule.type === "top_trait_combo") {
        let best = -Infinity;
        for (const p of playerList) {
          const sum = (rule.trait_keys as string[]).reduce((s, k) => s + (scoresByPlayer.get(p.id)?.[k] ?? 0), 0);
          if (sum > best) { best = sum; winners = [p]; }
          else if (sum === best) { winners.push(p); }
        }
      } else if (rule.type === "top_vote_category") {
        const q = r2QuestionByCategory.get(rule.category);
        if (q) {
          const relevantVotes = voteList.filter((v) => v.question_id === q.id);
          const tally = new Map<string, number>();
          for (const v of relevantVotes) tally.set(v.voted_for_player_id, (tally.get(v.voted_for_player_id) || 0) + 1);
          let best = 0;
          for (const [playerId, count] of tally) {
            if (count > best) { best = count; winners = playerList.filter((p) => p.id === playerId); }
            else if (count === best && count > 0) { winners.push(...playerList.filter((p) => p.id === playerId)); }
          }
        }
      } else if (rule.type === "top_self_category") {
        const q = r1QuestionByCategory.get(rule.category);
        if (q) {
          const pickers = answerList.filter((a) => a.question_id === q.id && a.selected_option_id === rule.option_id);
          winners = playerList.filter((p) => pickers.some((a) => a.player_id === p.id));
        }
      }

      if (winners.length > 0) {
        const winner = winners.length === 1 ? winners[0] : earliestJoined(winners);
        awardResultRows.push({ session_id, player_id: winner.id, award_id: award.id, rank: 1 });
      }
    }

    if (awardResultRows.length > 0) {
      await supabaseAdmin.from("award_results").insert(awardResultRows);
    }

    // ---------------------------------------------------------------------
    // 3. COMPATIBILITY — every player pair
    // ---------------------------------------------------------------------
    const compatibilityRows: { session_id: string; player_a_id: string; player_b_id: string; score: number; shared_interests: string[] }[] = [];

    for (let i = 0; i < playerList.length; i++) {
      for (let j = i + 1; j < playerList.length; j++) {
        const [pa, pb] = [playerList[i], playerList[j]].sort((x, y) => (x.id < y.id ? -1 : 1));

        const aAnswers = new Map(answerList.filter((a) => a.player_id === pa.id).map((a) => [a.question_id, a.selected_option_id]));
        const bAnswers = new Map(answerList.filter((a) => a.player_id === pb.id).map((a) => [a.question_id, a.selected_option_id]));
        const sharedQ = Array.from(aAnswers.keys()).filter((qid) => bAnswers.has(qid));
        let agreeCount = 0;
        const sharedInterests: string[] = [];
        for (const qid of sharedQ) {
          if (aAnswers.get(qid) === bAnswers.get(qid)) {
            agreeCount++;
            const cat = questionById.get(qid)?.category;
            if (cat) sharedInterests.push(cat);
          }
        }
        const answerAgreementPct = sharedQ.length > 0 ? (agreeCount / sharedQ.length) * 100 : null;

        const aVotes = new Map(voteList.filter((v) => v.voter_player_id === pa.id).map((v) => [v.question_id, v.voted_for_player_id]));
        const bVotes = new Map(voteList.filter((v) => v.voter_player_id === pb.id).map((v) => [v.question_id, v.voted_for_player_id]));
        const sharedV = Array.from(aVotes.keys()).filter((qid) => bVotes.has(qid));
        let matchCount = 0;
        for (const qid of sharedV) if (aVotes.get(qid) === bVotes.get(qid)) matchCount++;
        const voteAlignmentPct = sharedV.length > 0 ? (matchCount / sharedV.length) * 100 : null;

        const parts = [answerAgreementPct, voteAlignmentPct].filter((v): v is number => v !== null);
        const combined = parts.length > 0 ? parts.reduce((a, b) => a + b, 0) / parts.length : 50;

        compatibilityRows.push({
          session_id,
          player_a_id: pa.id,
          player_b_id: pb.id,
          score: Math.round(combined),
          shared_interests: Array.from(new Set(sharedInterests)).slice(0, 3),
        });
      }
    }

    if (compatibilityRows.length > 0) {
      await supabaseAdmin.from("compatibility").upsert(compatibilityRows, { onConflict: "player_a_id,player_b_id" });
    }

    // ---------------------------------------------------------------------
    // 4. PERSONAL SUMMARY + HIDDEN STATS per player (template composition)
    // ---------------------------------------------------------------------
    const openers = templateList.filter((t) => t.template_type === "summary_opener");
    const traits = templateList.filter((t) => t.template_type === "summary_trait");
    const closers = templateList.filter((t) => t.template_type === "summary_closer");
    const hiddenStatTemplates = templateList.filter((t) => t.template_type === "hidden_stat");

    function matchesConditions(conds: TemplateRow["conditions"], scores: Record<string, number>): boolean {
      if (!conds || conds.length === 0) return true;
      return conds.every((c) => c.trait && checkCondition(c.op, scores[c.trait] ?? 0, c.value));
    }

    const playerSummaries: Record<string, {
      nickname: string; avatar_emoji: string; scores: Record<string, number>;
      summary_ar: string; summary_en: string;
      hidden_stats: { text_ar: string; text_en: string; percent: number }[];
    }> = {};

    for (const player of playerList) {
      const myScores = scoresByPlayer.get(player.id) || {};

      const openerMatches = openers.filter((t) => matchesConditions(t.conditions, myScores));
      const traitMatches = traits.filter((t) => matchesConditions(t.conditions, myScores));
      const closerMatches = closers.filter((t) => matchesConditions(t.conditions, myScores));

      const opener = weightedPick(openerMatches);
      const traitPick = weightedPick(traitMatches);
      const closer = weightedPick(closerMatches);

      const summary_ar = [opener?.text_ar, traitPick?.text_ar, closer?.text_ar].filter(Boolean).join(" ");
      const summary_en = [opener?.text_en, traitPick?.text_en, closer?.text_en].filter(Boolean).join(" ");

      // Hidden stats: this player's own share of votes in a given category,
      // as a % of all votes cast in that category this session.
      const hiddenStats: { text_ar: string; text_en: string; percent: number }[] = [];
      for (const tmpl of hiddenStatTemplates) {
        const cond = tmpl.conditions?.[0];
        if (!cond?.vote_category) continue;
        const q = r2QuestionByCategory.get(cond.vote_category);
        if (!q) continue;
        const relevantVotes = voteList.filter((v) => v.question_id === q.id);
        if (relevantVotes.length === 0) continue;
        const forMe = relevantVotes.filter((v) => v.voted_for_player_id === player.id).length;
        const percent = Math.round((forMe / relevantVotes.length) * 100);
        if (checkCondition(cond.op, percent, cond.value)) {
          hiddenStats.push({
            text_ar: tmpl.text_ar.replace("{percent}", String(percent)),
            text_en: tmpl.text_en.replace("{percent}", String(percent)),
            percent,
          });
        }
        if (hiddenStats.length >= 2) break;
      }

      playerSummaries[player.id] = {
        nickname: player.nickname,
        avatar_emoji: player.avatar_emoji,
        scores: myScores,
        summary_ar: summary_ar || "باختصار، القروب ما يكتمل بدونك.",
        summary_en: summary_en || "Bottom line — the group isn't complete without you.",
        hidden_stats: hiddenStats,
      };
    }

    // ---------------------------------------------------------------------
    // 5. Top award per player (for the story-mode reveal) + full award list
    // ---------------------------------------------------------------------
    const awardsByPlayer: Record<string, { slug: string; emoji: string; name_ar: string; name_en: string }[]> = {};
    for (const row of awardResultRows) {
      const award = awardList.find((a) => a.id === row.award_id);
      if (!award) continue;
      if (!awardsByPlayer[row.player_id]) awardsByPlayer[row.player_id] = [];
      awardsByPlayer[row.player_id].push({ slug: award.slug, emoji: award.emoji, name_ar: award.name_ar, name_en: award.name_en });
    }

    // ---------------------------------------------------------------------
    // 6. Best friend match per player (highest compatibility partner)
    // ---------------------------------------------------------------------
    const bestMatchByPlayer: Record<string, { player_id: string; nickname: string; avatar_emoji: string; score: number; shared_interests: string[] } | null> = {};
    for (const player of playerList) {
      let best: typeof compatibilityRows[number] | null = null;
      for (const row of compatibilityRows) {
        if (row.player_a_id !== player.id && row.player_b_id !== player.id) continue;
        if (!best || row.score > best.score) best = row;
      }
      if (best) {
        const otherId = best.player_a_id === player.id ? best.player_b_id : best.player_a_id;
        const other = playerList.find((p) => p.id === otherId);
        bestMatchByPlayer[player.id] = other
          ? { player_id: other.id, nickname: other.nickname, avatar_emoji: other.avatar_emoji, score: best.score, shared_interests: best.shared_interests }
          : null;
      } else {
        bestMatchByPlayer[player.id] = null;
      }
    }

    // ---------------------------------------------------------------------
    // 7. Cache everything into game_history so re-opening Results is free
    // ---------------------------------------------------------------------
    const summary = {
      players: playerList.map((p) => ({
        player_id: p.id,
        nickname: p.nickname,
        avatar_emoji: p.avatar_emoji,
        scores: playerSummaries[p.id].scores,
        summary_ar: playerSummaries[p.id].summary_ar,
        summary_en: playerSummaries[p.id].summary_en,
        hidden_stats: playerSummaries[p.id].hidden_stats,
        awards: awardsByPlayer[p.id] || [],
        best_match: bestMatchByPlayer[p.id],
      })),
      computed_at: new Date().toISOString(),
    };

    await supabaseAdmin.from("game_history").insert({
      group_id: session.group_id,
      session_id,
      summary,
    });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("Scoring engine error:", err);
    return NextResponse.json({ error: err?.message || "Unknown error" }, { status: 500 });
  }
}
