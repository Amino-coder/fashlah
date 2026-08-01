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

The **only** existing files touched are the four join pages, and only to
append a small secondary link below the real join button — no existing
logic in those files was changed. Nothing in `components/demo/` imports
from `components/shofah/`, `components/job/`, `components/qaseeda/`
(except the pure, stateless `ShatrLine` presentational component), or
`components/qissa/` (except the pure passing-math functions in
`lib/qissa-story.ts`, which contain zero Supabase calls — importing them
doesn't run any of that file's actual data-fetching functions). Someone
playing a real multiplayer game never touches any of this code.

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
