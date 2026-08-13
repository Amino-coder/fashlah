/**
 * Shared design system for the الِّفوا أغنية share card — same
 * "no fixed artwork, gradient + gold frame" approach as قصيدة's card
 * (lib/qaseeda-card.ts), since a song can be anywhere from one opening
 * verse to a full 5-line creation and there's no single image that fits
 * every length.
 */

export const CARD_W = 1080;
export const CARD_H = 1920;
export const RADIUS = 56;

export const PAD_X = Math.round(CARD_W * 0.14);
export const FRAME_INSET = 36;

export type LifooPalette = {
  name: string;
  from: string;
  mid: string;
  to: string;
  gold: string;
  ink: string;
  soft: string;
  faint: string;
};

// A warmer, more "night out" palette set than قصيدة's — leans coral/teal
// (Bagdoonis's core party-game accent colors) rather than the calmer
// gold-on-navy poetry register, since this is meant to feel like a fun
// group song, not a literary keepsake.
export const LIFOO_PALETTES: LifooPalette[] = [
  { name: "coral-night",  from: "#3A1420", mid: "#2A0F18", to: "#160810", gold: "#FF8A3D", ink: "#FFF3E8", soft: "rgba(255,243,232,0.66)", faint: "rgba(255,138,61,0.55)" },
  { name: "magenta-pop",  from: "#4A0E3D", mid: "#33092A", to: "#180413", gold: "#FF2E93", ink: "#FDF2FA", soft: "rgba(253,242,250,0.66)", faint: "rgba(255,46,147,0.55)" },
  { name: "purple-pop",   from: "#3A1350", mid: "#280D38", to: "#14061C", gold: "#FF2E93", ink: "#FBF3FF", soft: "rgba(251,243,255,0.66)", faint: "rgba(255,46,147,0.55)" },
];

export function paletteForCode(code: string): LifooPalette {
  let hash = 0;
  for (let i = 0; i < code.length; i++) hash = (hash * 31 + code.charCodeAt(i)) >>> 0;
  return LIFOO_PALETTES[hash % LIFOO_PALETTES.length];
}

export const FONT_QUOTE = "El Messiri";
export const FONT_UI = "Tajawal";

export const SIZE = {
  eyebrow: 30,
  title: 62,
  author: 30,
  footerLabel: 26,
  footerNames: 32,
  brand: 24,
};

export const LINE_HEIGHT = 1.5;

export const RULE = {
  lineWidth: 90,
  gap: 14,
  diamond: 6,
};

export const BRAND_URL = "bagdoonis.app";

/**
 * Same idea as قصيدة's poemFontSizeFor — shared between the on-screen
 * preview and the canvas export. `lineUnits` here counts actual printed
 * lines (the opening contributes 2, each round contributes 1), not
 * "couplets", since song lines stack instead of sitting side by side.
 */
export function songFontSizeFor(lineUnits: number): number {
  if (lineUnits <= 3) return 44;
  if (lineUnits <= 4) return 40;
  if (lineUnits <= 5) return 36;
  if (lineUnits <= 6) return 32;
  return 28;
}

export function lineUnitsFor(song: { line1: string; line2?: string | null }[]): number {
  return song.reduce((sum, l) => sum + (l.line2 ? 2 : 1), 0);
}
