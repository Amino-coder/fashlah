# عبارات — quote cards

No database step. It's fully static: no APIs, no login, no Supabase tables.
Drops in and works.

Route: **`/ibarat`**. Also appears as a tile in the home-screen library
alongside the three games.

---

## Files

```
app/ibarat/page.tsx              the experience (home + reveal)
components/ibarat/QuoteCard.tsx  the card
components/ibarat/CardDeck.tsx   the deck + shuffle
components/ibarat/exportCard.ts  1080×1920 PNG export + share
lib/ibarat-card.ts               design system (palettes, layout, typography)
lib/ibarat-texture.ts            paper grain + lattice, generated at runtime
lib/ibarat-quotes.json           the 80 quotes
lib/ibarat-quotes-types.ts       Quote type
```

Also touched: `app/page.tsx` (library tile), `app/globals.css` (Amiri import
+ deck animations), `tailwind.config.ts` (`font-quote`).

---

## How the export stays identical to the on-screen card

This was the main design decision. The card is laid out in one fixed
**1080×1920 coordinate space** — the exact story size. On screen it's
rendered at those literal pixel dimensions and then CSS-scaled down to fit
the viewport; the export draws the same coordinates 1:1 onto a canvas. Both
import their geometry from `lib/ibarat-card.ts`, so they can't drift.

The export is drawn with the Canvas 2D API rather than by screenshotting the
DOM. Beyond avoiding a heavy dependency, the usual DOM-to-image routes
rasterise through an `<img>`, which refuses to load external fonts — that
would silently drop Amiri and fall back to a system face. For Arabic that's
the difference between a card people post and one they don't.

One intentional difference: the export has square corners while the
on-screen card is rounded. Story surfaces don't honour transparency, so
rounded corners would come out as black wedges.

---

## Typography

Now **El Messiri** — modern Arabic with calligraphic bones. Amiri (the first
pass) is a lovely face but it's a classical book type, which is what made it
read as generic here. Tajawal still handles the small UI text.

I downloaded and compared seven Arabic faces before choosing: Amiri, IBM Plex
Sans Arabic, El Messiri, Reem Kufi, Readex Pro, Alexandria and Noto Kufi
Arabic. Two close runners-up are documented in `lib/ibarat-card.ts` —
switching is a one-line change there plus the font import in `globals.css`:

- **IBM Plex Sans Arabic** — cleaner and more neutral, slightly corporate
- **Reem Kufi** — geometric kufi, more striking but more stylised

Quote sizes are ~5% smaller than the first pass (95px → 53px ladder). El
Messiri also sets about 11% wider than Amiri at the same nominal px, so the
effective reduction is larger than 5% and the quote has noticeably more room.
Re-verified with real El Messiri metrics: **all 80 quotes still wrap to at
most 3 lines**, with no overflow and no collisions.

---

## Card identity

A card's palette is derived from its id, so **card #27 always looks exactly
the same**. Ten deep jewel-toned palettes with warm cream text. That
consistency is what makes the set feel collectible rather than randomly
skinned.

The ids from your dataset are preserved exactly, including the gap at 3–4 —
which, incidentally, helps the collection feel real.

---

## Background depth

Three layers, all deliberately quiet:

1. **Three-stop gradient** (light → mid → deep) instead of the previous two.
   A single ramp read flat at this size.
2. **Directional light** from the upper left, so the card looks lit rather
   than tinted.
3. **Paper texture** — fine grain plus a very faint diamond lattice, peaking
   at 3.9% opacity.

Measured against the first pass: the cards are **31% brighter overall**, and
the dynamic range widened (10th percentile 17→12, 90th 39→54) — so they read
as having more depth, not just being uniformly lighter.

The texture is generated once in the browser onto an offscreen canvas from a
seeded PRNG, then used both as a CSS background and as the canvas pattern in
the export. That keeps it out of the bundle (a noise PNG compresses badly for
something under 5% opacity) and guarantees the two renderers show the same
grain. It's tileable by construction — built from per-pixel maths on a modulo
grid — so there are no seams.

---

## Branding

No QR code. It's just `bagdoonis.app` centred near the bottom, under the
divider — a signature rather than a call to action.

---

## Behaviour notes

- **No immediate repeats** — the draw pool excludes the card currently shown.
- **Haptics** — a single 12ms tick on tap, where supported.
- **Reduced motion** — respected; the shuffle is skipped rather than played fast.
- **Share** — uses `navigator.canShare({files})` (checked separately from
  `navigator.share`, since several browsers expose the latter but reject file
  payloads), falls back to download. A dismissed share sheet is treated as a
  cancel, not a failure, so it doesn't wrongly trigger the download.

---

## Worth your eyes

**The typeface especially.** I compared seven faces and picked El Messiri on
its merits, but that's a taste call and I'd rather you saw it. I've included
`ibarat-font-comparison.png` showing the same two cards in the three
finalists — if you prefer one of the others it's a one-line swap.

Also judgement calls, all easy to tune: palette brightness, texture strength
(`lib/ibarat-texture.ts`, currently peaking near 4% opacity), and the deck
timing (950ms).
