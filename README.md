# Bagdoonis (بقدونس)

A bilingual (Arabic-first RTL / English) party game for friend groups.
This repo currently implements the **Session Engine** end-to-end: create a
session, share a real room code, join from another device, and watch
players appear live in the waiting room via Supabase Realtime. Rounds 1–3,
scoring, results, and the admin panel are specified in `BUILD_BRIEF.md` and
not yet built — that's the next step, ideally in Claude Code so it can run
and test as it goes.

## 1. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. Go to **Authentication → Providers** and enable **Anonymous sign-ins**.
3. Go to **SQL Editor**, paste in `supabase/schema.sql`, run it.
4. Paste in `supabase/seed.sql`, run it. This loads the Friends pack:
   Round 1/2/3 questions, awards, score formulas, and result templates.
5. Go to **Database → Replication** and enable Realtime for the `players`
   and `sessions` tables (needed for the live waiting room).
6. Go to **Project Settings → API** and copy your **Project URL** and
   **anon public key**.

## 2. Run locally

```bash
npm install
cp .env.example .env.local
# paste your Supabase URL + anon key into .env.local
npm run dev
```

Open http://localhost:3000 — you should see the Arabic home screen. Open a
second browser (or incognito window) to test create/join with two players
at once.

## 3. Push to GitHub

```bash
git init
git add .
git commit -m "Bagdoonis: session engine"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/bagdoonis.git
git push -u origin main
```

## 4. Deploy on Vercel

1. Import the GitHub repo in Vercel.
2. Add the same two environment variables (`NEXT_PUBLIC_SUPABASE_URL`,
   `NEXT_PUBLIC_SUPABASE_ANON_KEY`) under **Project Settings → Environment
   Variables**.
3. Deploy. Vercel auto-builds on every push to `main`.

## 5. What's next

Open `BUILD_BRIEF.md` for the full architecture and hand this repo to
Claude Code to continue with:
- Round 1 (self questions) / Round 2 (friend voting) / Round 3 (bonus) UI
- The Scoring Engine (Supabase Edge Function)
- The Results Engine (story-mode reveal screen)
- The admin panel

`bagdoonis-prototype.jsx` in this folder is the original mock-data design
prototype — use it as the visual/interaction reference when building the
remaining screens so they match the established look and feel.

## Project structure

```
app/
  page.tsx                 Home
  create/page.tsx          Create a session (writes real Supabase rows)
  join/page.tsx             Join a session by code
  session/[code]/page.tsx   Live waiting room (Realtime)
lib/
  supabase.ts               Client + anonymous auth helpers
  i18n.ts                   Arabic/English strings
  types.ts                  DB row types
  usePrefs.ts                Language/dark-mode preference hook
components/
  Mascot.tsx                 The parsley mascot
supabase/
  schema.sql                  Full DB schema + RLS
  seed.sql                    Friends pack seed data
BUILD_BRIEF.md                 Architecture doc for continuing the build
```
