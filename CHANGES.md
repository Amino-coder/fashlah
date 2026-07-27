# Bagdoonis — full review changes

Build verified green (`next build`, 15/15 routes, no warnings).

---

## ⚠️ Two manual steps

**1. Delete these three folders** — they were orphaned pre-namespacing duplicates
of the Fashlah routes (~550 lines). `next.config.js` now 308-redirects them to
`/fashlah/*`, so old WhatsApp invite links like `/join?code=ABC123` keep working.

```
app/create/
app/join/
app/session/
```

**2. `app/fashlah/session/page.tsx` and `app/shofah/session/page.tsx`** in this
bundle are flattened for delivery. They belong at:

```
app/fashlah/session/[code]/page.tsx
app/shofah/session/[code]/page.tsx
```

Everything else drops in at its matching path.

---

## Bugs fixed

**`next build` failed without the service-role key.** `lib/supabaseAdmin.ts`
called `createClient` at module scope, so Next importing the API routes during
page-data collection threw `supabaseKey is required`. Builds needed a production
secret just to compile — CI, fresh clones, preview builds all broken. The client
is now created lazily inside the request handler, so a missing key returns a
clean 500 on the one request that needs it instead of failing the whole build.

**`themeColor` deprecation.** It was in `metadata`; Next 14 wants it on the
`viewport` export. Also now has light/dark variants so mobile browser chrome
matches the theme instead of always being pink.

---

## Performance

**`/fashlah/session/[code]`: 306 kB → 211 kB first load** (route code 143 kB →
48 kB). `Results.tsx` statically imported recharts, so every player downloaded
the whole charting library the moment they joined the lobby — before the waiting
room, before all four rounds, for a radar chart only shown at the very end. Now
lazy-loaded via `next/dynamic`.

**Dropped the `Cairo` font** — imported in `globals.css` but never referenced in
`tailwind.config.ts`. A wasted font download on every page load.

---

## The white flash (biggest visual fix)

All 12 pages did `if (!ready) return null` while waiting on `localStorage`, so
every navigation flashed white before the theme applied.

`layout.tsx` now runs a small pre-paint inline script that applies theme and
direction to `<html>` before React hydrates. Combined with `html { background:
var(--bg) }`, the correct background is painted on the very first frame.

Related, in `usePrefs.ts`:

- Dark mode now lives on `<html>`, not a per-page wrapper `div`. Previously the
  iOS overscroll/rubber-band strip stayed white in dark mode.
- Defaults to the OS colour scheme instead of always light, and follows it live
  if the user has never explicitly picked a theme.
- `<html lang>`/`dir` now track the chosen language — they were hardcoded to
  `ar`/`rtl` even in English.

---

## New: How to play

`components/HowToPlay.tsx` — the app had no rules anywhere, which matters for a
party game that gets opened cold in front of a group.

Bilingual, one set of steps per game, matching each game's accent colour.
Auto-opens on first visit to each game (stored per game, so learning Fashlah
doesn't skip Shofah's rules), then lives behind a `?` button. Escape to close,
background scroll locked, respects safe-area insets.

Wired into: both game landings, and both waiting rooms (hidden once play starts).

**Worth checking:** I wrote the rules copy from reading the code. Please read it
over — especially the Arabic — and adjust the tone to your voice.

---

## New: Share invite

`components/ShareInvite.tsx` replaces near-identical copies in both waiting
rooms. Previously the only options were WhatsApp or copying a bare 6-character
code with no link attached.

Now: the OS share sheet where supported (covers iMessage, Telegram, Snapchat,
Discord in one tap), copy puts the actual join *link* on the clipboard, WhatsApp
kept as a shortcut, and the code is still shown large and tappable for anyone
typing it in across the room.

---

## Mobile input UX

No input in the app had any of this. Applied across both join and both create
pages:

- **Enter submits** (`enterKeyHint` so the phone key reads "go" / "next")
- **Room codes**: `autoCapitalize="characters"`, `autoCorrect="off"`,
  `spellCheck={false}` — mobile keyboards were mangling codes
- **`maxLength`** on names (20) and group names (30) — long names could blow out
  the lobby grid and scoreboards
- **Autofocus** on the first field that needs typing (nickname when arriving via
  a share link, since the code is already filled)
- **Disabled buttons now explain themselves** — "Enter the room code to join" /
  "Enter your name to join" instead of a silently greyed-out button

Shofah answer box got a placeholder and autofocus — it was a completely blank
box with a 30-second timer running.

---

## Accessibility

- **`:focus-visible` rings** — there were none at all; tabbing was untrackable
- **aria-labels** on every icon-only button (theme, language, help, close)
- **Avatar pickers** are now proper `radiogroup`s with `aria-checked`, and have a
  visible "Pick your avatar" label
- **`prefers-reduced-motion`** — the app runs a lot of continuous animation
  (drifting blobs, bobbing mascots, blinking eyes, confetti). Decorative loops
  stop, confetti hides, entrance animations still resolve to their final state
  so nothing gets stuck invisible
- Removed the grey tap-highlight flash on mobile; proper cursors on buttons

---

## Not done

- Pages still `return null` while prefs load. The flash is fixed (background is
  correct immediately), but a themed skeleton would be smoother still.
- `Results.tsx` (542 lines) and `RoundScreen.tsx` (620 lines) are large enough to
  be worth splitting, but I left them alone — too risky to refactor without a
  test pass.
