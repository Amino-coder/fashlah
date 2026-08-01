# Demo Mode

## What it is

A single-player "play against 2 computer players" experience for people who
land on a join page without a code. Entirely local — no session row, no
room code, no realtime channel, no Supabase writes of any kind. The whole
game exists in React state for as long as the tab is open and vanishes the
moment it's closed.

## Isolation from multiplayer

Every file this feature touches is **new**:

```
lib/demo/demoContent.ts           — Saudi bot names + hand-written response banks
lib/demo/useDemoRoundGame.ts      — write→vote→reveal engine (شوفة / مين بيتوظف / كمل القصيدة)
lib/demo/useDemoQissa.ts          — write→pass engine (كمل القصة, no voting)
components/demo/DemoRoundScreen.tsx
components/demo/DemoQaseedaRoundScreen.tsx
components/demo/DemoQissaRoundScreen.tsx
components/demo/DemoEndScreen.tsx
app/shofah/demo/page.tsx
app/job/demo/page.tsx
app/qaseeda/demo/page.tsx
app/qissa/demo/page.tsx
```

The **only** existing files touched are the four session/lobby pages, and
only to insert a small secondary link directly beneath the host's real
"Start Game" button — visible exactly when a host looks down and realizes
they don't have enough players yet — no existing logic in those files was
changed. Nothing in `components/demo/` imports from `components/shofah/`,
`components/job/`, `components/qaseeda/` (except the pure, stateless
`ShatrLine` presentational component), or `components/qissa/` (except the
pure passing-math functions in `lib/qissa-story.ts`, which contain zero
Supabase calls — importing them doesn't run any of that file's actual
data-fetching functions). Someone playing a real multiplayer game never
touches any of this code.

One deliberate exception to "no Supabase contact": شوفة and مين بيتوظف's
demo pages fetch 5 real prompts from `shofah_prompts`/`job_prompts` on
mount (public SELECT, the same table and shape the real game draws from)
so the demo plays the actual game's questions instead of a hand-picked
local sample, and stays in sync automatically if those banks are updated
later. This is read-only — nothing is ever written back — and falls back
to a small local prompt list if the fetch fails for any reason. All four
games use the real 5-round count (6 for كمل القصة, matching its fixed
round count regardless of player number) rather than an abbreviated demo
length, so it plays out like the actual game, just against bots.

## Why فشلة isn't included

فشلة isn't one game loop — it's four architecturally different round types
chained together (`components/rounds/Round1-4.tsx`): a "vote for a
player" round, a hot-takes round, and a round mixing binary choice with
open text, each with its own scoring path into `awards`/`compatibility`.
Reproducing this faithfully in demo mode means rebuilding four distinct
mechanics, not writing one config for an existing engine — a meaningfully
larger, separate piece of work rather than a natural extension of the
shared write→vote loop the other four games already have in common. Left
out of this pass rather than shipped as a shallow, unfaithful version.

## Content

Bot responses are hand-written banks (`lib/demo/demoContent.ts`), randomly
sampled so the two bots never repeat each other within a round, rather
than generated at runtime — this app has no LLM API wired in anywhere, and
adding one just for a local demo would be a much larger and riskier change
than the feature calls for.

## Bugs found and fixed after the first pass

**Timer race skipping straight to voting.** The engine originally reset
`remaining` via a separate effect keyed on `phase`. On the exact render
where phase flipped from countdown to writing, the phase-transition
effects ran in the same commit and read the *old* `remaining` (still 0,
left over from the countdown's last tick) before the reset effect had
applied — so "everyone's answered or time's up" read true instantly, with
zero answers submitted. Fixed by deriving `remaining` from a
phase-start timestamp instead (`goToPhase()` stamps `Date.now()` in the
same call that changes phase), the same approach the real multiplayer
games already use with `phase_started_at`. There's nothing left to
"reset", so there's nothing to race.

**Draft text leaking into the next round.** The textarea state in all
three demo round-screen components was local `useState("")` with no reset
effect, so whatever was typed (or left unsubmitted) in one round was still
sitting in the box when the next round's writing phase began. Fixed by
resetting on `round` change in all three components. قصة's round screen
had the same gap for its placeholder text too — it was picked once via a
bare `useState` initializer for the entire demo instead of fresh each
round.
