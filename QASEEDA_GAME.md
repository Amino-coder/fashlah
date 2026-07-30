# كمل القصيدة / Complete the Poem — setup

## One Supabase step

Run **`supabase/qaseeda_schema.sql`** once in the Supabase SQL editor. That's it.

Single consolidated file, same convention as `job_schema.sql`: tables, indexes,
RLS policies, realtime wiring, the scoring function, and the seed content
(the four curated opening أبيات) are all created together. Nothing here
touches `fashlah_`/`shofah_`/`job_`'s tables — the only shared table is
`users`, which already exists.

`supabase/qaseeda_reset_test_data.sql` clears test sessions while keeping the
opening bank, same as the other games' reset scripts.

---

## What it is

A new mode built directly on the شوفة round engine — same lobby, same
realtime sync + polling fallback, same countdown → timed-write → timed-vote →
reveal loop, same 5/3/2/1 scoring, same reconnect handling. The mechanic
underneath is different:

- **No per-round prompt bank.** Round N's "prompt" *is* the poem so far — the
  opening بيت plus every previous round's winning line. There's no
  `qaseeda_round_prompts` table; the client assembles it live by joining
  `qaseeda_round_results → qaseeda_answers → qaseeda_players`
  (`lib/qaseeda-poem.ts`).
- **A new `opening_select` phase** before round 1. The host picks one of four
  famous أبيات (`qaseeda_openings`, a small fixed curated set — not drawn at
  random) or writes a custom one. The chosen line is denormalized straight
  onto the session row, since it's picked once and never changes.
- **No prewarm round.** There's nothing to warm up with here — it's one
  continuous collaborative write, so that phase and its tables are skipped
  entirely.
- **Self-voting is allowed.** Unlike شوفة/job, a player's own submission is
  shown during voting like any other and can be selected — with groups
  sometimes playing solo, and since the "prize" is just which line joins
  the poem rather than a competitive win, blocking it would be more
  annoyance than safeguard.
- **Solo play is supported.** The lobby only requires one player to start.
  Whenever a round ends with 0 or 1 submissions (a solo game, or a round
  where only one person got their line in before time), voting is skipped
  entirely and that line becomes the round's line uncontested — no empty
  20-second timer over nothing to vote on.
- **The ending is a poem, not a winner.** Instead of شوفة's two-step
  chat-recap → single-winner reveal, round 5's reveal hands off straight to
  one cinematic sequence (`components/qaseeda/FinalReveal.tsx`): fade →
  "صح لسانكم" → "القصيدة" title → the poem revealed one line at a time (with
  "✍️ كتبها: <name>" under each community line) → a shareable card. There's
  no overall "winner" screen — the poem itself, credited line by line, is
  the payoff.

## Visual identity

Deliberately calmer than the other games' bright pink/purple/mint chrome —
warm gold (`#D9A441`) over deep navy (`#1B3A55`), the same premium register
عبارات uses (`El Messiri` for the poem text, `Tajawal` for UI), no cartoon
mascot. The design brief was explicit about avoiding playful/childish
styling here, so the countdown screen etc. use a simple gold feather/quill
mark instead of a bouncing character.

## The share card

`components/qaseeda/PoemShareCard.tsx` (on-screen preview) and
`components/qaseeda/exportPoemCard.ts` (canvas PNG export) are a from-scratch
sibling to عبارات's card system — same 1080×1920 story-size canvas and
share/download flow, but with **no uploaded art asset**. There isn't a fixed
piece of artwork that could work for a poem of variable length (one opening
بيت up to a full seven-line poem), so the background is a palette-driven
gradient + a thin gold frame, drawn programmatically
(`lib/qaseeda-card.ts:paletteForCode` picks one of three curated palettes
deterministically from the room code, so the same poem always exports the
same look). The card intentionally shows only the poem itself plus one
collective "كتبها: <all player names>" credit line at the bottom — no
per-line attribution — so it reads as a poetry card, not a game results
screen; the line-by-line "who wrote what" moment lives in the in-app reveal
instead.

## Content

Four curated opening أبيات, exactly as specified: أبو العتاهية (حكمة),
امرؤ القيس (غزل), الأمير خالد الفيصل (سعودي عامي), and المتنبي (هجاء) — plus
the fifth "write your own" option, which is always available and isn't part
of the `qaseeda_openings` table at all.
