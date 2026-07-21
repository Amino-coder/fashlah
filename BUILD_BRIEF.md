# Bagdoonis (بقدونس) — Build Brief for Claude Code

Hand this file, `schema.sql`, and `seed.sql` to Claude Code as the first
message in a new project. They contain everything needed to start building
correctly instead of improvising the data model.

There is also a working **design/interaction prototype**
(`bagdoonis-prototype.jsx`, built earlier in a Claude.ai chat) — use it as
the source of truth for visual language, copy tone, and screen flow. It is
mock-data only; this brief is about wiring it to a real backend.

---

## 1. Tech stack

- Next.js (App Router) + TypeScript
- TailwindCSS
- Framer Motion (animations — the chat prototype used CSS keyframes only
  because artifacts can't import it; use it properly here)
- Supabase (Postgres + Realtime + Anonymous Auth) — run `schema.sql` then
  `seed.sql` in the Supabase SQL editor before writing app code
- Deploy target: Vercel
- PWA: `next-pwa` or manual manifest + service worker
- next-intl or a lightweight custom i18n layer for ar/en (RTL via `dir` attr)

## 2. Non-negotiable architecture rule

**Nothing game-specific is hardcoded.** Questions, packs, awards, scoring
formulas, and result copy all live in the database (see `schema.sql`).
Adding a new pack (Couples, Family, Coworkers, ...) must be possible by
inserting rows only — no code changes, no redeploy. Application code reads
`question_packs`, `questions`, `score_formulas`, `awards`, and
`result_templates` at runtime.

## 3. The four engines

### Session Engine
- Anonymous auth: `supabase.auth.signInAnonymously()` on first load; store
  the resulting `auth.uid()` as `users.id`.
- Create session: generate a unique 6-char code (retry on collision),
  insert into `sessions`, insert host into `players` with `is_host = true`.
- Join session: look up `sessions` by code, validate `status = 'waiting'`
  and `players.count < max_players`, insert into `players`.
- Waiting room: subscribe to `players` via Supabase Realtime, filtered by
  `session_id`. Show join/leave live.
- Reconnect: on load, check local storage for `{session_id, user_id}`; if
  the player row still exists, rejoin the realtime channel and resume at
  `sessions.current_round`.
- Host controls: only `host_user_id` may call `start_game`, which sets
  `sessions.status = 'in_progress'`, `current_round = 1`, `started_at = now()`.

### Question Engine
- Fetch `questions` where `pack_id = session.pack_id and round = current_round
  and enabled = true`, ordered randomly (seeded by session id so all
  players in a session who need the same order — e.g. Round 3 bonus — see
  it consistently).
- Round 1 (`self`) and Round 3 (`guess_percentage`) questions render from
  `question_type`; the UI component for each type should be a pure
  function of the `questions` row — no per-question special-casing in code.
- Round 2 (`friend_vote`) questions don't need `options` — the "options"
  are the other players in the session, fetched from `players`.
- Writing answers: `answers` insert for Round 1, `votes` insert for Round 2.
  Both use `unique(player_id, question_id)` / `unique(voter_player_id,
  question_id)` to make re-submission idempotent (last write via upsert).

### Scoring Engine
- Runs server-side (a Supabase Edge Function or a Next.js Route Handler
  using the service role key) once a session's answers/votes are complete
  — never in the client, and never via an LLM/external API.
- For each row in `score_formulas`, compute each `component`:
  - `self_answers`: average of `options[].trait_weights[trait_key]` for
    the player's answers in questions matching `category`, scaled 0-100.
  - `peer_votes`: (votes received for this player in the matching
    `category`) / (total votes cast in that category) × 100.
  - `behavioral`: same shape as `self_answers` but drawn from a different
    `category` — the split exists so a formula can mix two question
    categories, e.g. leadership = identity self-answers + crisis
    self-answers + become_ceo peer votes.
  - Weighted sum of components → insert into `scores`.
- Award assignment reads `awards.rule`:
  - `top_trait`: player with the highest `scores.value` for that trait.
  - `top_vote_category`: player with the most `votes` in that category.
  - `top_self_category` / `option_id`: player who picked that option most.
  - `top_trait_combo`: highest sum across listed traits.
  - Ties: break by earliest `joined_at` (deterministic, not random) so
    results are reproducible if recomputed.
- Compatibility: for every player pair, compare Round 1 answers
  (agreement %) and Round 2 votes (how often they voted the same way) into
  a single 0-100 score; store the top interests they share (matching
  `category` where both picked emotionally-positive options) as
  `shared_interests`.

### Results Engine
- Pure template composition, no AI:
  - Pick one `summary_opener` template whose `conditions` match the
    player's `scores` (weighted-random among matches).
  - Pick 1-2 `summary_trait` templates similarly.
  - Pick one `summary_closer`.
  - Concatenate → thousands of realistic combinations from ~40 seeded rows;
    grows every time someone adds templates in the admin panel.
  - `hidden_stat` templates work the same way but interpolate `{percent}`
    from the live vote tally for the matching `vote_category`.
- Cache the computed results per session in `game_history.summary` so
  re-opening results doesn't recompute (and so History screens are cheap).

## 4. Screen list (already designed — see the prototype)

Home → Create Session → Share (code + WhatsApp/link) → Waiting Room →
Round 1 → Round 2 → Round 3 → Results (story-mode: intro → radar chart →
top award → more awards → best friend match → 2 hidden stats → personal
summary → share card) → History.

Match the prototype's palette, type choices, and story-mode reveal pattern
— they were designed deliberately, not defaults. Re-implement the mascot,
confetti, and count-up number animations with Framer Motion for smoother
easing than the CSS-only version.

## 5. Admin panel

Separate route group (`/admin`), gated by `admin_users` + a real session
(not anonymous auth). CRUD screens for `questions`, `question_packs`,
`awards`, `result_templates`, `score_formulas`, with:
- enable/disable toggles (never hard-delete — keep history intact)
- weight/condition editors that write raw `jsonb`, validated client-side
- a "preview results" tool that runs the Scoring + Results engines against
  fake mock answers so an admin can sanity-check a new template or formula
  without playing a full game
- basic analytics: sessions played, most-triggered awards, average
  compatibility score, pack popularity

## 6. Safety rules to enforce in the Question/Award CRUD validation

- No appearance-based awards or questions.
- No political or religious categories.
- Reject/flag templates or awards containing a blocklist of negative-only
  language (the brief requires everything stays playful, not mean).
- Votes are never individually attributable in any client-facing query —
  only the `get_vote_tallies(session_id)` style aggregate RPC should be
  callable from the client; direct `select` on `votes` is blocked by RLS
  (already set up in `schema.sql`).

## 7. Suggested build order

1. `schema.sql` + `seed.sql` into a fresh Supabase project.
2. Anonymous auth + Session Engine (create/join/waiting room) with Realtime.
3. Question Engine + Round 1/2/3 UI, wired to the prototype's visual design.
4. Scoring Engine as an Edge Function, triggered when Round 3 completes.
5. Results Engine + story-mode results screen.
6. Sharing (image export via `html-to-image` or `satori`, real WhatsApp/IG
   share intents).
7. History screen (reads `game_history`).
8. Admin panel last — the app is fully playable without it once seed data
   exists; the panel just removes the need to hand-edit SQL later.

## 8. Files provided alongside this brief

- `schema.sql` — full DDL + RLS policies, ready to run as-is.
- `seed.sql` — the Friends pack: Round 1/2/3 questions, 13 awards, 10 score
  formulas, ~14 result templates. Enough to fully playtest before writing
  more content from the admin panel.
- `bagdoonis-prototype.jsx` — visual/interaction reference (mock data).
