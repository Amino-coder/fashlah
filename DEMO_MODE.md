# Demo Mode

## What it is

A single-player "play against 2 computer players" experience, reachable
from every game's lobby for hosts who don't have anyone to play with yet.
Entirely local — no session row, no room code, no realtime channel, no
Supabase writes of any kind. The whole game exists in React state for as
long as the tab is open and vanishes the moment it's closed.

## Isolation from multiplayer

Every file this feature touches is **new**:

```
lib/demo/demoContent.ts             — Saudi bot names + hand-written response banks
lib/demo/useDemoRoundGame.ts        — write→vote→reveal engine (شوفة / مين بيتوظف / كمل القصيدة)
lib/demo/useDemoQissa.ts            — write→pass engine (كمل القصة, no voting)
components/demo/DemoRoundScreen.tsx
components/demo/DemoQaseedaRoundScreen.tsx
components/demo/DemoQissaRoundScreen.tsx
components/demo/DemoEndScreen.tsx
app/shofah/demo/page.tsx
app/job/demo/page.tsx
app/qaseeda/demo/page.tsx
app/qissa/demo/page.tsx
app/fashlah/demo/page.tsx           — bespoke, see below
```

The **only** existing files touched are the five session/lobby pages, and
only to insert a small secondary link directly beneath the host's real
"Start Game" button — visible exactly when a host looks down and realizes
they don't have enough players yet — no existing lobby logic changed.
Nothing in `components/demo/` imports from `components/shofah/`,
`components/job/`, `components/qaseeda/` (except the pure, stateless
`ShatrLine` presentational component), `components/qissa/` (except the
pure passing-math functions in `lib/qissa-story.ts`, zero Supabase calls),
or `components/rounds/`. Someone playing a real multiplayer game never
touches any of this code.

**Deliberate exceptions to "no Supabase contact," all read-only:**
شوفة/مين بيتوظف fetch 5 real prompts from `shofah_prompts`/`job_prompts`
on mount; فشلة fetches real questions from `questions` (pack slug
`"friends"`, the same pack every real game uses) for all 4 rounds. Nothing
is ever written back, and each falls back to a small local list if the
fetch fails for any reason. Every demo uses the real round count — 5 for
شوفة/مين بيتوظف/كمل القصيدة, 6 for كمل القصة (its fixed count regardless
of player number), all 4 real rounds for فشلة — rather than an abbreviated
demo length.

## Bot answers are question-aware, not generic

شوفة and مين بيتوظف use exact-match answer maps (`SHOFAH_ANSWER_MAP`,
`JOB_ANSWER_MAP` in `demoContent.ts`) keyed by the literal prompt text,
copied verbatim from the real seed banks
(`shofah_migration_005_prompt_bank_v2.sql`, `job_update_prompts.sql`) —
every bot answer genuinely responds to the specific question drawn that
round, not a generic one-liner sampled from an unrelated pool. A
category-keyed fallback (`SHOFAH_CATEGORY_FALLBACK`, `JOB_CATEGORY_
FALLBACK`) covers anything drawn from the live bank that isn't in the
exact map (gendered شوفة prompts, or a future bank update).
`useDemoRoundGame` takes `getBotAnswers(round)` from the caller rather
than a flat random-sampled bank, since only the caller — who fetched the
actual prompt — can know what a relevant answer looks like.

كمل القصة isn't affected by this: it has no fixed prompt bank to match
against, since every round's "prompt" is whatever the previous round's
sentence was, not a database question.

## Results screens

شوفة, مين بيتوظف, and كمل القصيدة each show their actual outcome before
the closing "come play for real" screen, instead of jumping straight to
it. شوفة/مين بيتوظف show the score-ranked player list and who "won"
(married/hired) — the engine tracks the same 5/3/2/1 points-by-rank
scoring the real games use, exposed as `scores` and `overallWinnerId`.
كمل القصيدة shows the complete finished poem with per-line authorship.
كمل القصة already showed its 3 completed stories before the close, and
فشلة shows a full 4-round summary — both unchanged in spirit here, just
confirming the pattern is now consistent across every game with a demo.

## فشلة demo

Scoped down from "replicate all four round types with full multiplayer
fidelity" to what was actually needed: the human plays through all 4 real
rounds using real fetched questions, the two bots get predetermined
answers (fixed personality traits for Round 1's solo trait quiz,
independent random picks for Rounds 2-4, never reactive to the human),
and everything shows together in one results summary. Bespoke
implementation (`app/fashlah/demo/page.tsx`) rather than built on
`useDemoRoundGame` — that hook is shaped for the write→vote→reveal loop
the other four games share, and فشلة's four rounds (solo trait quiz,
"who's most likely" player voting, agree/disagree hot takes, would-you-
rather + fill-in-the-blank) don't fit that shape. No countdown timer,
matching the real `Round1-4.tsx` components exactly — they're self-paced
with no timer pressure, so the demo follows suit rather than inventing
pressure that isn't in the actual game.

## Content

Bot responses are hand-written, not generated at runtime — this app has
no LLM API wired in anywhere, and adding one just for a local demo would
be a much larger and riskier change than the feature calls for.

## Bugs found and fixed along the way

**Timer race skipping straight to voting.** The engine originally reset
`remaining` via a separate effect keyed on `phase`. On the exact render
where phase flipped from countdown to writing, the phase-transition
effects ran in the same commit and read the *old* `remaining` (still 0,
left over from the countdown's last tick) before the reset effect had
applied — so "everyone's answered or time's up" read true instantly, with
zero answers submitted. Fixed by deriving `remaining` from a phase-start
timestamp instead (`goToPhase()` stamps `Date.now()` in the same call
that changes phase, so there's nothing to reset and nothing to race) —
the same approach the real multiplayer games use with `phase_started_at`.

**Draft text leaking into the next round.** The textarea state in all
three write→vote demo round screens was local `useState("")` with no
reset effect, so whatever was typed (or left unsubmitted) carried into
the next round's writing phase. Fixed by resetting on `round` change in
all three. كمل القصة's round screen had the same gap for its placeholder
hint text too — it was picked once for the entire demo via a bare
`useState` initializer instead of freshly each round.
