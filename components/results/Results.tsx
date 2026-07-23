"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer } from "recharts";
import { supabase } from "@/lib/supabase";
import type { Lang } from "@/lib/i18n";
import type { PlayerRow, SessionRow } from "@/lib/types";

const TRAIT_LABELS: Record<string, { ar: string; en: string }> = {
  leadership: { ar: "القيادة", en: "Leadership" },
  humor: { ar: "الفكاهة", en: "Humor" },
  energy: { ar: "الطاقة", en: "Energy" },
  organization: { ar: "التنظيم", en: "Organization" },
  adventure: { ar: "المغامرة", en: "Adventure" },
  kindness: { ar: "اللطف", en: "Kindness" },
  confidence: { ar: "الثقة", en: "Confidence" },
  responsibility: { ar: "المسؤولية", en: "Responsibility" },
};

const BG_COLORS = ["var(--purple)", "var(--pink)", "var(--yellow)", "var(--mint)"];
const CONFETTI_EMOJI = ["🎉", "✨", "🌿", "🔥", "💫", "🎊"];

type PlayerSummary = {
  player_id: string;
  nickname: string;
  avatar_emoji: string;
  scores: Record<string, number>;
  summary_ar: string;
  summary_en: string;
  hidden_stats: { text_ar: string; text_en: string; percent: number }[];
  awards: { slug: string; emoji: string; name_ar: string; name_en: string }[];
  best_match: { player_id: string; nickname: string; avatar_emoji: string; score: number; shared_interests: string[] } | null;
};

function Confetti() {
  const [pieces] = useState(() =>
    Array.from({ length: 28 }).map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      duration: 2.5 + Math.random() * 2,
      delay: Math.random() * 0.6,
      emoji: CONFETTI_EMOJI[Math.floor(Math.random() * CONFETTI_EMOJI.length)],
    }))
  );
  return (
    <>
      {pieces.map((p) => (
        <div
          key={p.id}
          className="confetti-piece"
          style={{ left: `${p.left}%`, animationDuration: `${p.duration}s`, animationDelay: `${p.delay}s` }}
        >
          {p.emoji}
        </div>
      ))}
    </>
  );
}

function ShareSlide({ lang, whatsappHref }: { lang: Lang; whatsappHref: string }) {
  // position:relative + a higher z-index than the tap-to-navigate overlay
  // (zIndex 1) and the arrow buttons (zIndex 2), so these buttons — which
  // live inside the slide content, a normal non-positioned element — don't
  // get click-intercepted by the full-screen tap layer sitting above it.
  const btnStyle: CSSProperties = {
    position: "relative", zIndex: 3,
    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
    padding: "14px 26px", borderRadius: 999, fontWeight: 800, fontSize: 15,
    border: "none", width: "100%",
  };

  return (
    <>
      <span style={{ fontSize: 56, display: "block", marginBottom: 14 }}>🌿</span>
      <h2 className="font-display" style={{ fontSize: 24, fontWeight: 800, marginBottom: 24 }}>
        {lang === "ar" ? "خلصنا! شكرًا للعب 🎉" : "That's a wrap! Thanks for playing 🎉"}
      </h2>

      <div style={{ display: "flex", flexDirection: "column", gap: 12, width: "100%", maxWidth: 280 }}>
        <a
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="font-display"
          style={{ ...btnStyle, background: "#25D366", color: "white", textDecoration: "none" }}
        >
          💬 {lang === "ar" ? "شارك على واتساب" : "Share on WhatsApp"}
        </a>

        <a
          href="/"
          onClick={(e) => e.stopPropagation()}
          className="font-display"
          style={{ ...btnStyle, background: "white", color: "var(--purple)", textDecoration: "none" }}
        >
          {lang === "ar" ? "رجوع للرئيسية" : "Back Home"}
        </a>
      </div>
    </>
  );
}

export default function Results({
  summary,
  session,
  player,
  lang,
}: {
  summary: {
    players: PlayerSummary[];
    vote_reveals?: {
      text_ar: string; text_en: string;
      winner: { player_id: string; nickname: string; avatar_emoji: string };
      winner_votes: number; total_votes: number; share: number;
      breakdown: { player_id: string; nickname: string; avatar_emoji: string; votes: number }[];
    }[];
  };
  session: SessionRow;
  player: PlayerRow;
  lang: Lang;
}) {
  const [slide, setSlide] = useState(0);
  const [hotTakes, setHotTakes] = useState<
    { question_ar: string; question_en: string; emoji?: string; agree: PlayerRow[]; disagree: PlayerRow[] }[] | null
  >(null);

  const me = summary.players.find((p) => p.player_id === player.id) || summary.players[0];

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: responses } = await supabase
        .from("hot_take_responses")
        .select("question_id, player_id, stance")
        .eq("session_id", session.id);
      if (!responses || responses.length === 0) {
        if (!cancelled) setHotTakes([]);
        return;
      }
      const questionIds = Array.from(new Set(responses.map((r: any) => r.question_id)));
      const { data: questions } = await supabase
        .from("questions")
        .select("id, text_ar, text_en, options")
        .in("id", questionIds);

      const { data: allPlayers } = await supabase.from("players").select("*").eq("session_id", session.id);

      const grouped = (questions || []).map((q: any) => {
        const forThis = responses.filter((r: any) => r.question_id === q.id);
        const agreeIds = forThis.filter((r: any) => r.stance === "agree").map((r: any) => r.player_id);
        const disagreeIds = forThis.filter((r: any) => r.stance === "disagree").map((r: any) => r.player_id);
        const byId = (ids: string[]) => (allPlayers || []).filter((p: PlayerRow) => ids.includes(p.id));
        return {
          question_ar: q.text_ar,
          question_en: q.text_en,
          emoji: q.options?.[0]?.emoji,
          agree: byId(agreeIds),
          disagree: byId(disagreeIds),
        };
      });
      if (!cancelled) setHotTakes(grouped);
    })();
    return () => {
      cancelled = true;
    };
  }, [session.id]);

  const slides: { key: string; render: () => JSX.Element }[] = [];

  slides.push({
    key: "intro",
    render: () => (
      <>
        <p className="font-body" style={{ fontSize: 16, fontWeight: 700, opacity: 0.85 }}>
          {lang === "ar" ? "جاهزين؟" : "Ready?"}
        </p>
        <h2 className="font-display" style={{ fontSize: 30, fontWeight: 800, margin: "10px 0" }}>
          {lang === "ar" ? "نتائج بقدونس وصلت 🌿✨" : "Your Bagdoonis results are in 🌿✨"}
        </h2>
      </>
    ),
  });

  const radarData = Object.entries(me.scores).map(([trait, value]) => ({
    trait: TRAIT_LABELS[trait]?.[lang] || trait,
    value,
  }));
  if (radarData.length > 0) {
    slides.push({
      key: "radar",
      render: () => (
        <>
          <p className="font-body" style={{ fontSize: 14, fontWeight: 700, opacity: 0.85, marginBottom: 8 }}>
            {lang === "ar" ? "شخصيتك" : "Your Personality"}
          </p>
          <div style={{ width: "100%", height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData} outerRadius="75%">
                <PolarGrid stroke="rgba(255,255,255,0.3)" />
                <PolarAngleAxis dataKey="trait" tick={{ fill: "white", fontSize: 11 }} />
                <Radar dataKey="value" stroke="white" fill="white" fillOpacity={0.35} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </>
      ),
    });
  }

  if (me.awards.length > 0) {
    const top = me.awards[0];
    slides.push({
      key: "top-award",
      render: () => (
        <>
          <Confetti />
          <p className="font-body" style={{ fontSize: 14, fontWeight: 700, opacity: 0.85 }}>
            {lang === "ar" ? "لقبك الأول" : "Your Top Award"}
          </p>
          <span style={{ fontSize: 72, display: "block", margin: "16px 0" }}>{top.emoji}</span>
          <h2 className="font-display" style={{ fontSize: 26, fontWeight: 800 }}>
            {lang === "ar" ? top.name_ar : top.name_en}
          </h2>
        </>
      ),
    });
  }

  if (me.awards.length > 1) {
    slides.push({
      key: "more-awards",
      render: () => (
        <>
          <p className="font-body" style={{ fontSize: 14, fontWeight: 700, opacity: 0.85, marginBottom: 16 }}>
            {lang === "ar" ? "ألقاب ثانية" : "More Awards"}
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            {me.awards.slice(1).map((a) => (
              <div key={a.slug} style={{ background: "rgba(255,255,255,0.15)", borderRadius: 18, padding: 14 }}>
                <span style={{ fontSize: 30 }}>{a.emoji}</span>
                <p className="font-body" style={{ fontSize: 12, fontWeight: 700, marginTop: 6 }}>
                  {lang === "ar" ? a.name_ar : a.name_en}
                </p>
              </div>
            ))}
          </div>
        </>
      ),
    });
  }

  if (summary.vote_reveals && summary.vote_reveals.length > 0) {
    summary.vote_reveals.forEach((reveal, i) => {
      const isUnanimous = reveal.winner_votes === reveal.total_votes && reveal.total_votes > 1;
      const pct = Math.round(reveal.share * 100);
      slides.push({
        key: `vote-reveal-${i}`,
        render: () => (
          <>
            {isUnanimous && <Confetti />}
            <p className="font-body" style={{ fontSize: 13, fontWeight: 700, opacity: 0.8, marginBottom: 10 }}>
              {lang === "ar" ? "الأغلبية قالت..." : "The group has spoken..."}
            </p>
            <h3 className="font-display" style={{ fontSize: 20, fontWeight: 800, marginBottom: 20, lineHeight: 1.4 }}>
              {lang === "ar" ? reveal.text_ar : reveal.text_en}
            </h3>

            <span style={{ fontSize: 64, display: "block", marginBottom: 8 }}>{reveal.winner.avatar_emoji}</span>
            <h2 className="font-display" style={{ fontSize: 26, fontWeight: 800 }}>{reveal.winner.nickname}</h2>
            <p className="font-mono" style={{ fontSize: 16, fontWeight: 700, marginTop: 6, opacity: 0.9 }}>
              {isUnanimous
                ? (lang === "ar" ? "بالإجماع! 🎉" : "Unanimous! 🎉")
                : `${pct}% (${reveal.winner_votes}/${reveal.total_votes})`}
            </p>

            {reveal.breakdown.length > 1 && (
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center", marginTop: 22 }}>
                {reveal.breakdown.map((b) => (
                  <div key={b.player_id} style={{ display: "flex", flexDirection: "column", alignItems: "center", opacity: b.player_id === reveal.winner.player_id ? 1 : 0.55 }}>
                    <span style={{ fontSize: 22 }}>{b.avatar_emoji}</span>
                    <span className="font-body" style={{ fontSize: 10, fontWeight: 700 }}>{b.votes}</span>
                  </div>
                ))}
              </div>
            )}
          </>
        ),
      });
    });
  }

  if (me.best_match) {
    const bm = me.best_match;
    slides.push({
      key: "best-match",
      render: () => (
        <>
          <p className="font-body" style={{ fontSize: 14, fontWeight: 700, opacity: 0.85 }}>
            {lang === "ar" ? "أفضل توافق" : "Best Friend Match"}
          </p>
          <span style={{ fontSize: 56, display: "block", margin: "14px 0 6px" }}>{bm.avatar_emoji}</span>
          <h2 className="font-display" style={{ fontSize: 24, fontWeight: 800 }}>{bm.nickname}</h2>
          <p className="font-mono" style={{ fontSize: 40, fontWeight: 700, margin: "10px 0" }}>{bm.score}%</p>
          <p className="font-body" style={{ fontSize: 13, opacity: 0.85 }}>
            {lang === "ar" ? "نسبة التوافق" : "Compatibility"}
          </p>
          {bm.shared_interests.length > 0 && (
            <p className="font-body" style={{ fontSize: 12, opacity: 0.75, marginTop: 10 }}>
              {(lang === "ar" ? "قواسم مشتركة: " : "Shared interests: ") +
                bm.shared_interests.map((s) => s.replace(/_/g, " ")).join(", ")}
            </p>
          )}
        </>
      ),
    });
  }

  if (me.hidden_stats.length > 0) {
    slides.push({
      key: "hidden-stats",
      render: () => (
        <>
          {me.hidden_stats.map((h, i) => (
            <div key={i} style={{ marginBottom: i < me.hidden_stats.length - 1 ? 24 : 0 }}>
              <p className="font-mono" style={{ fontSize: 40, fontWeight: 700 }}>{h.percent}%</p>
              <p className="font-body" style={{ fontSize: 14, opacity: 0.9 }}>
                {lang === "ar" ? h.text_ar : h.text_en}
              </p>
            </div>
          ))}
        </>
      ),
    });
  }

  slides.push({
    key: "summary",
    render: () => (
      <>
        <p className="font-body" style={{ fontSize: 14, fontWeight: 700, opacity: 0.85, marginBottom: 12 }}>
          {lang === "ar" ? "ملخصك" : "Your Summary"}
        </p>
        <p className="font-body" style={{ fontSize: 16, lineHeight: 1.7 }}>
          {lang === "ar" ? me.summary_ar : me.summary_en}
        </p>
      </>
    ),
  });

  if (hotTakes && hotTakes.length > 0) {
    slides.push({
      key: "hot-takes",
      render: () => (
        <>
          <p className="font-body" style={{ fontSize: 14, fontWeight: 700, opacity: 0.85, marginBottom: 16 }}>
            {lang === "ar" ? "آراء القروب الجريئة" : "The Group's Hot Takes"}
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 18, textAlign: "start", width: "100%" }}>
            {hotTakes.map((ht, i) => (
              <div key={i} style={{ background: "rgba(255,255,255,0.12)", borderRadius: 16, padding: 14 }}>
                <p className="font-body" style={{ fontWeight: 700, fontSize: 13, marginBottom: 8 }}>
                  {ht.emoji} {lang === "ar" ? ht.question_ar : ht.question_en}
                </p>
                <div style={{ display: "flex", gap: 16, fontSize: 12 }}>
                  <span>👍 {ht.agree.map((p) => p.avatar_emoji).join(" ") || "—"}</span>
                  <span>👎 {ht.disagree.map((p) => p.avatar_emoji).join(" ") || "—"}</span>
                </div>
              </div>
            ))}
          </div>
        </>
      ),
    });
  }

  slides.push({
    key: "share",
    render: () => {
      const appUrl = typeof window !== "undefined" ? window.location.origin : "";
      const shareText =
        lang === "ar"
          ? `🌿 خلصت ألعب بقدونس مع أصحابي! جربوها: ${appUrl}`
          : `🌿 Just played Bagdoonis with my friends! Try it: ${appUrl}`;
      const whatsappHref = `https://wa.me/?text=${encodeURIComponent(shareText)}`;

      return (
        <ShareSlide lang={lang} whatsappHref={whatsappHref} />
      );
    },
  });

  const total = slides.length;
  const bg = BG_COLORS[slide % BG_COLORS.length];

  return (
    <div
      style={{
        position: "fixed", inset: 0, background: bg, transition: "background .5s ease",
        zIndex: 10, display: "flex", flexDirection: "column", color: "white",
        maxWidth: 480, margin: "0 auto", overflow: "hidden",
      }}
    >
      <div style={{ display: "flex", gap: 6, padding: "16px 16px 0" }}>
        {Array.from({ length: total }).map((_, i) => (
          <div key={i} className="story-seg">
            <div className="story-seg-fill" style={{ width: i <= slide ? "100%" : "0%", transition: "width .3s" }} />
          </div>
        ))}
      </div>

      <div
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const clickX = e.clientX - rect.left;
          const isBack = clickX < rect.width * 0.35;
          setSlide((s) => (isBack ? Math.max(0, s - 1) : Math.min(total - 1, s + 1)));
        }}
        style={{ position: "absolute", inset: 0, top: 30, cursor: "pointer", zIndex: 1 }}
      />

      <div style={{ position: "absolute", bottom: 20, left: 0, right: 0, display: "flex", justifyContent: "space-between", padding: "0 16px", pointerEvents: "none", zIndex: 2 }}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setSlide((s) => Math.max(0, s - 1));
          }}
          disabled={slide === 0}
          style={{
            pointerEvents: "auto", width: 40, height: 40, borderRadius: 999,
            background: "rgba(255,255,255,0.2)", border: "none", color: "white",
            display: "flex", alignItems: "center", justifyContent: "center",
            opacity: slide === 0 ? 0.3 : 1,
          }}
        >
          <ChevronLeft size={20} />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setSlide((s) => Math.min(total - 1, s + 1));
          }}
          disabled={slide === total - 1}
          style={{
            pointerEvents: "auto", width: 40, height: 40, borderRadius: 999,
            background: "rgba(255,255,255,0.2)", border: "none", color: "white",
            display: "flex", alignItems: "center", justifyContent: "center",
            opacity: slide === total - 1 ? 0.3 : 1,
          }}
        >
          <ChevronRight size={20} />
        </button>
      </div>

      <div
        key={slide}
        className="pop"
        style={{
          flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          padding: "20px 30px", textAlign: "center", position: "relative", overflow: "hidden",
        }}
      >
        {slides[slide].render()}
      </div>
    </div>
  );
}
