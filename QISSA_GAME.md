# كمل القصة / Complete the Story — setup

## One Supabase step

Run **`supabase/qissa_schema.sql`** once in the Supabase SQL editor. That's it —
single consolidated file (tables, indexes, RLS, realtime), same convention as
the other games' schema files. It's also self-contained: no shared tables
with fashlah_/shofah_/job_/qaseeda_ beyond the base `users` table.

`supabase/qissa_reset_test_data.sql` clears test sessions for a clean slate.

---

## What it is

A "telephone" game built on the same round-engine skeleton as the other
games (lobby, realtime sync + polling fallback, host-driven phase
transitions, standard countdown timer) — but with the vote/score machinery
entirely absent, because this game doesn't need it:

- **Every player starts their own story.** Round 1: everyone writes one
  sentence, no prompt, no context — `n` players means `n` stories start
  simultaneously.
- **Stories rotate after every round**, in a fixed circular order
  (`turn_order`, assigned once at game start by join order). The circle
  goes around **twice** — total rounds is `2 * playerCount`
  (`lib/qissa-story.ts:totalRoundsFor`), not a fixed number — so every
  finished story has `2 * playerCount` sentences, two from every player.
  The passing math needed zero changes to support this: it's plain
  modular arithmetic over the round number, so a second lap (rounds
  `n+1..2n`) falls out of the same formula for free.
- **The one-sentence rule is enforced by what the client fetches, not by
  hiding UI.** A writer's client only ever queries for *one* row — the
  immediately previous round's sentence for whichever story their
  `turn_order` currently maps to. The rest of that story's sentences are
  never fetched, so there's nothing to accidentally leak; this isn't a
  matter of hiding already-loaded content client-side.

## The passing math (`lib/qissa-story.ts`)

The entire "which story does this player see this round" question reduces
to one formula, with nothing extra persisted to track story assignment:

```
authorTurnOrderForStory(storyIndex, round, n) = (storyIndex + round - 1) mod n
storyIndexForTurnOrder(turnOrder, round, n)   = (turnOrder - (round - 1)) mod n
```

Both are pure functions of `(story index or turn order, round, player
count)` — no `qissa_stories`/assignment table exists at all. The final
reveal doesn't need this math either; by then every `qissa_answers` row
already carries its own `story_index`, so reconstruction is just "group by
story_index, order by round_number."

## Never getting stuck

The spec is explicit that a slow/absent player must never stall the game.
Two layers handle this:

1. **Client-side timeout still always submits** — but unlike the other
   games (which only auto-submit if something was typed), this one
   submits an **empty sentence** if the box is empty when time runs out.
   An empty sentence is a valid, complete turn here.
2. **`/api/qissa-round-advance`** (host-triggered, service-role) is the
   real safety net: once the writing timer hits zero, before advancing the
   round it checks for any `story_index` with no submitted row at all
   (i.e. a client that never got a chance to auto-submit — closed tab,
   dead connection) and backfills an empty sentence for the rightful
   author, computed via the same passing formula. Every story is
   guaranteed exactly 3 rows by the time the final reveal runs.

## The reveal

`components/qissa/FinalReveal.tsx` reuses the `.story-seg`/`.story-seg-fill`
swipeable-progress-bar pattern already established in فشلة's `Results.tsx`
— one segment per story, filled as you move through them. Within each
story, sentences reveal one at a time (auto-paced, tap-to-skip), authors
only after all three sentences are shown; moving to the *next story*
always needs a deliberate tap or the explicit "next story" button, so a
large group's reveal never blows past a story before everyone's read it.

True swipe-gesture detection (as opposed to tap-to-continue) was
deliberately left out — a naive touchstart/touchend handler alongside the
tap handler double-fires on mobile (a tap generates both a touchend *and*
a synthetic click afterward), and de-duplicating that reliably added more
risk than the gesture was worth given the explicit "next story" button
already covers the same need.

## Solo play

Unlike كمل القصيدة, this game requires **at least 2 players** to start —
the entire mechanic is "hand your sentence to someone else," which doesn't
degrade gracefully to n=1 the way a collaborative-but-independently-scored
game can.

## Content

The 8 rotating placeholder prompts are exactly as specified, never
submitted as real content — purely a nudge, cleared the moment someone
starts typing.
