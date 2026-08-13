"use client";

import {
  CARD_W, CARD_H, PAD_X, RADIUS, FRAME_INSET,
  FONT_QUOTE, FONT_UI, SIZE, RULE, BRAND_URL, paletteForCode,
  songFontSizeFor, lineUnitsFor,
} from "@/lib/lifoo-card";
import type { SongLine } from "@/lib/lifoo-song";

/**
 * Same technique as قصيدة's PoemShareCard — real DOM flow at the card's
 * native 1080x1920, scaled via CSS transform. The one layout difference:
 * each song line's line1/line2 (when both exist, i.e. the opening verse)
 * stack vertically instead of sitting side by side with a separator,
 * matching SongLine.tsx's "song lyrics" rendering rather than a poetry
 * hemistich.
 */
export default function SongShareCard({
  song, code, cheerLabel, titleLabel, creditLabel, playerNames, scale,
}: {
  song: SongLine[];
  code: string;
  cheerLabel: string;
  titleLabel: string;
  creditLabel: string;
  playerNames: string[];
  scale: number;
}) {
  const palette = paletteForCode(code);
  const songFontSize = songFontSizeFor(lineUnitsFor(song));

  return (
    <div style={{ width: CARD_W * scale, height: CARD_H * scale, position: "relative" }}>
      <div
        dir="rtl"
        style={{
          width: CARD_W, height: CARD_H,
          transform: `scale(${scale})`, transformOrigin: "top right",
          position: "absolute", top: 0, right: 0,
          borderRadius: RADIUS, overflow: "hidden",
          background: `radial-gradient(130% 85% at 50% 0%, ${palette.from} 0%, ${palette.mid} 55%, ${palette.to} 100%)`,
          display: "flex", flexDirection: "column", alignItems: "center",
        }}
      >
        <div
          aria-hidden="true"
          style={{
            position: "absolute", inset: FRAME_INSET,
            border: `2px solid ${palette.gold}66`, borderRadius: RADIUS - 16,
            pointerEvents: "none",
          }}
        />

        <div style={{ flex: 1, width: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: `170px ${PAD_X}px 40px` }}>
          <p style={{ fontFamily: `'${FONT_UI}', sans-serif`, fontSize: SIZE.eyebrow, fontWeight: 700, letterSpacing: "0.16em", color: palette.gold, margin: 0, textTransform: "uppercase" }}>
            {cheerLabel}
          </p>
          <p style={{ fontFamily: `'${FONT_QUOTE}', serif`, fontSize: SIZE.title, fontWeight: 700, color: palette.ink, margin: "10px 0 26px" }}>
            {titleLabel}
          </p>

          <div aria-hidden="true" style={{ display: "flex", alignItems: "center", gap: RULE.gap, marginBottom: 46 }}>
            <div style={{ width: RULE.lineWidth, height: 1, background: palette.gold, opacity: 0.6 }} />
            <div style={{ width: RULE.diamond, height: RULE.diamond, background: palette.gold, transform: "rotate(45deg)", opacity: 0.85 }} />
            <div style={{ width: RULE.lineWidth, height: 1, background: palette.gold, opacity: 0.6 }} />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 24, width: "100%" }}>
            {song.map((line, i) => (
              <div key={i} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <p style={{ fontFamily: `'${FONT_QUOTE}', serif`, fontSize: songFontSize, fontWeight: 600, lineHeight: 1.5, color: palette.ink, margin: 0, textAlign: "center" }}>
                  {line.line1}
                </p>
                {line.line2 && (
                  <p style={{ fontFamily: `'${FONT_QUOTE}', serif`, fontSize: songFontSize, fontWeight: 600, lineHeight: 1.5, color: palette.ink, margin: 0, textAlign: "center" }}>
                    {line.line2}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        <div style={{ paddingBottom: 96, textAlign: "center", width: "100%" }}>
          {playerNames.length > 0 && (
            <>
              <p style={{ fontFamily: `'${FONT_UI}', sans-serif`, fontSize: SIZE.footerLabel, fontWeight: 700, letterSpacing: "0.1em", color: palette.gold, margin: 0, textTransform: "uppercase" }}>
                {creditLabel}
              </p>
              <p style={{ fontFamily: `'${FONT_UI}', sans-serif`, fontSize: SIZE.footerNames, fontWeight: 600, color: palette.ink, margin: "10px 0 0", padding: `0 ${PAD_X}px` }}>
                {playerNames.join("  •  ")}
              </p>
            </>
          )}
          <p style={{ fontFamily: `'${FONT_UI}', sans-serif`, fontSize: SIZE.brand, fontWeight: 700, letterSpacing: "0.18em", color: palette.faint, margin: "30px 0 0", textTransform: "uppercase" }}>
            {BRAND_URL}
          </p>
        </div>
      </div>
    </div>
  );
}
