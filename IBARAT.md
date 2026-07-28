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
lib/ibarat-quotes.json           the 80 quotes
lib/ibarat-qr.json               pre-generated QR matrix
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

The platform's existing fonts (Baloo, Tajawal) are playful — the wrong
register here. Added **Amiri**, a classical Arabic serif, for the quote
itself. Tajawal still handles the small UI text (card number, author,
wordmark).

Quote size steps down as the text grows (100px → 56px). I verified with real
Amiri metrics that **all 80 quotes wrap to at most 3 lines** and none collide
with the card number above or the rule below.

---

## Card identity

A card's palette is derived from its id, so **card #27 always looks exactly
the same**. Ten deep jewel-toned palettes with warm cream text. That
consistency is what makes the set feel collectible rather than randomly
skinned.

The ids from your dataset are preserved exactly, including the gap at 3–4 —
which, incidentally, helps the collection feel real.

---

## QR code

Generated offline and committed as a 25×25 matrix (`lib/ibarat-qr.json`), so
there's no API call and nothing to fail at runtime. Dark modules on a light
plate regardless of palette, because dark-on-light scans far more reliably.

Verified end to end: rendered a card at true 1080×1920 and decoded the QR
back out of the pixels — reads `https://bagdoonis.app`, at 5.44px per module
(comfortably above the ~4px threshold for screen scanning).

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

The palettes and the Amiri sizing are judgement calls — have a look on a real
phone and tell me if you want them warmer, darker, or the quote larger. The
deck animation timing (950ms) is also easy to tune.
