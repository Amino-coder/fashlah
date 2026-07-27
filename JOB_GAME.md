# مين بيتوظف! / Job Interview — setup

## One Supabase step

Run **`supabase/job_schema.sql`** once in the Supabase SQL editor. That's it.

It's a single consolidated file (not a migration chain) since the game is new:
tables, indexes, RLS policies, realtime wiring, the scoring function, and all
the seed content are created together. Fashlah and Shofah are untouched — the
only shared table is `users`, which already exists.

`supabase/job_reset_test_data.sql` clears test sessions while keeping the
question banks, same as the Shofah one.

---

## What it is

A sibling of Shofah with the same structure, so everything you already tested
there carries over: warm-up round → 5 answer/vote rounds → interview recap →
hiring decision. Same timers, same 5/3/2/1 scoring, same realtime and
reconnect handling, and all the bug fixes from the Shofah sessions (background
scoring, retry-polling on the recap, guard-clearing on failed writes).

**Two intentional differences from Shofah:**

- **No character selection.** Shofah lets you pick Mazna or Mar'i and filters
  prompts by `audience`. Here there's a single interviewer, so there's no
  `/job/select` route, no `character` column, and no audience filtering —
  every prompt is always eligible.
- **New ending.** "الشخص اللي بيتوظف هو..." → "🎉 مبروك، توظفت!" → and then
  "أما الباقين... لسه عاطلين 😂", with a handshake instead of a heart.

---

## Content

**30 interview questions** across opening / experience / weakness / salary /
awkward / teamwork / wildcard, written to match Shofah's tone. A few:

- ليش تركت شغلك اللي راح؟ (قول شي حتى لو ما عندك جواب.)
- وش أكبر كذبة في سيرتك الذاتية؟
- اقنعني أوظفك بدون لا تستخدم حرف الألف "ا".
- وين تشوف نفسك بعد ٥ سنين؟ (أجوبة خاطئة فقط)
- المقابلة خلصت — اسألني انت سؤال.

**8 warm-up questions** (vote on each other, doesn't affect scoring):
مين أول واحد بينطرد من الشغل، مين بينام في الاجتماع، مين بيصير مدير خلال سنة…

Five of each are drawn per session, so no two games are the same.

---

## Look

Corporate blues throughout — `#3B82F6` → `#1E40AF`, replacing Shofah's
rose/wine. Applied to every screen, the home-page tile, and the How to Play.

New avatar: `components/job/SuitGuy.tsx` — an interviewer in a suit behind a
desk with a CV, pen and coffee. Drawn in the same flat-vector style as the
Shofah characters (radial-gradient skin, oversized eyes, idle blink, twinkles)
and checked for legibility down to 56px.

---

## How this was verified

Beyond the type-check and a clean `next build` (19/19 routes):

The schema was run against a real Postgres 16 instance with the Supabase bits
stubbed (`auth.uid()`, the realtime publication, `users`). It executed clean —
all tables, 13 policies, realtime, the function, 30 + 8 seeded rows.

Then a full round was simulated in that database: 3 players, 3 answers, votes
including a self-vote. Confirmed the scoring function picks the right winner,
awards 5/3/2, flips the phase to `reveal`, and is idempotent — calling it twice
returns `already_computed: true` and does not double-score. The reset script
was verified to clear sessions while keeping the question bank.

---

## Worth your eyes

The Arabic copy — questions, warm-up prompts, and the ending lines. I wrote it
to match Shofah's register, but the voice should be yours.
