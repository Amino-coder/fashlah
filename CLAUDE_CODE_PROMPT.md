I'm continuing a Next.js + TypeScript + Supabase web app called Bagdoonis
(بقدونس) — a bilingual (Arabic-first RTL, English toggle) party game for
friend groups. This folder already has a working Session Engine: home
screen, create session, join session, and a live waiting room wired to
Supabase Realtime.

Read BUILD_BRIEF.md first — it's the architecture doc for the whole app.
Also look at bagdoonis-prototype.jsx, which is the mock-data design
reference for visual style, copy tone, and screen flow (colors, fonts,
mascot, the story-mode results reveal) — match that look and feel exactly
in whatever you build.

Please work entirely on local files in this repo — I'll handle GitHub,
Vercel, and Supabase myself by copying files over manually, so you don't
need any GitHub/Vercel/Supabase connection, MCP server, or account access
to do this. Just edit and create files in this project the way you would
for any local codebase, and tell me what changed when you're done.

Build in this order, one piece at a time, and pause after each so I can
test it before you move on:

1. Round 1 (self-answer questions) — fetch enabled questions for the
   session's pack where round=1, render one at a time with the emoji
   multiple-choice UI, write answers to the `answers` table, advance
   through all questions, then move the session into round 2.

2. Round 2 (friend voting) — fetch round=2 questions, let the player vote
   for another player in the session for each prompt, write to `votes`,
   advance to round 3. Remember votes must never be readable per-voter
   from the client (see the RLS policy already in schema.sql) — read
   tallies through an aggregate query/RPC, not a direct select on votes.

3. Round 3 (bonus "guess the percentage" mini-game) — same pattern as the
   prototype: guess, reveal, compare to the real percentage.

4. The Scoring Engine — a Supabase Edge Function (or a Next.js Route
   Handler using the service role key, never exposed client-side) that
   runs once Round 3 completes for all players, reads `score_formulas`,
   computes each player's trait scores from their answers/votes, and
   writes to `scores` and `award_results` per the rules in BUILD_BRIEF.md.

5. The Results Engine — the story-mode reveal screen (radar chart, top
   award with confetti, more awards, best friend match, hidden stats,
   personal summary assembled from `result_templates`, and a final share
   card), matching the prototype's design.

Don't build the admin panel yet — the app should be fully playable end to
end with the seeded Friends pack first. We'll do the admin panel last.

If you hit anything ambiguous in BUILD_BRIEF.md, ask me rather than
guessing — I'd rather answer a quick question than have you build the
wrong thing.
