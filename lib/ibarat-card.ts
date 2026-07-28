import QR_ROWS from "./ibarat-qr.json";

/**
 * Shared design system for the عبارات cards.
 *
 * Everything here is expressed in one fixed 1080x1920 coordinate space —
 * the exact Instagram/WhatsApp/Snapchat story size. The on-screen card is
 * rendered at those literal pixel dimensions and then CSS-scaled down to
 * fit the viewport, while the PNG export draws the same coordinates 1:1
 * onto a canvas.
 *
 * That's deliberate: the brief asks for the exported image to look
 * identical to the in-app card, and the usual approaches (screenshotting
 * the DOM, or rasterising an SVG) either pull in a heavy dependency or
 * silently drop the web font, which would wreck the Arabic. Sharing one
 * coordinate system means the two renderers can't drift on layout, and
 * the only thing each has to get right independently is drawing text.
 */

export const CARD_W = 1080;
export const CARD_H = 1920;

/** Horizontal breathing room. Arabic at this size needs a lot of it. */
export const PAD_X = 108;

export const RADIUS = 56;

export type Palette = {
  name: string;
  from: string;
  to: string;
  /** Soft radial bloom behind the quote, keeps flat gradients from looking dead. */
  glow: string;
  /** Primary text. */
  ink: string;
  /** Card number, author, branding. */
  soft: string;
};

/**
 * Deep, muted, jewel-toned backgrounds with warm cream text — the register
 * the brief asks for (calm, premium, Gulf-appropriate) rather than the
 * bright playful palette the games use.
 *
 * A card's palette is derived from its id, so card #27 always looks exactly
 * the same. That consistency is what makes the set feel collectible.
 */
export const PALETTES: Palette[] = [
  { name: "emerald",    from: "#0F3D2E", to: "#06231A", glow: "#2FA37A", ink: "#F7F3EA", soft: "rgba(247,243,234,0.58)" },
  { name: "midnight",   from: "#10203F", to: "#060E1F", glow: "#3B6FC4", ink: "#F4F2EC", soft: "rgba(244,242,236,0.58)" },
  { name: "sand",       from: "#4A3620", to: "#221709", glow: "#C89B5A", ink: "#FAF4E7", soft: "rgba(250,244,231,0.60)" },
  { name: "plum",       from: "#35163A", to: "#1A0A1E", glow: "#9B4FA8", ink: "#F7F0F5", soft: "rgba(247,240,245,0.58)" },
  { name: "teal",       from: "#0B3A3F", to: "#041F23", glow: "#2E9AA5", ink: "#F2F6F5", soft: "rgba(242,246,245,0.58)" },
  { name: "terracotta", from: "#4A2318", to: "#240F09", glow: "#C4643C", ink: "#FBF1E9", soft: "rgba(251,241,233,0.60)" },
  { name: "slate",      from: "#232830", to: "#0E1116", glow: "#6B7A8F", ink: "#F2F3F5", soft: "rgba(242,243,245,0.55)" },
  { name: "burgundy",   from: "#401325", to: "#1E0710", glow: "#A8365C", ink: "#FAF0F3", soft: "rgba(250,240,243,0.58)" },
  { name: "olive",      from: "#2E3A1C", to: "#14190B", glow: "#7E9440", ink: "#F5F6EC", soft: "rgba(245,246,236,0.58)" },
  { name: "azure",      from: "#123048", to: "#061620", glow: "#3E8AB8", ink: "#F0F5F9", soft: "rgba(240,245,249,0.58)" },
];

export function paletteFor(id: number): Palette {
  // Stable per card id — never random, so a card's look is part of its identity.
  return PALETTES[Math.abs(id) % PALETTES.length];
}

/** 25x25 module QR for https://bagdoonis.app, generated offline (no API calls). */
export const QR_MATRIX: string[] = QR_ROWS as string[];

export const QR = {
  /** Size of the light plate the modules sit on. */
  plate: 168,
  /** Quiet zone inside the plate — required for reliable scanning. */
  quiet: 16,
  plateRadius: 20,
  /** Dark-on-light regardless of palette, so it scans every time. */
  light: "#F5F1E6",
  dark: "#14100C",
};

export const FONT_QUOTE = "Amiri";
export const FONT_UI = "Tajawal";

/**
 * Arabic script carries a lot of visual weight, and these quotes range from
 * four words to roughly thirty. A single fixed size would either overflow
 * the long ones or leave the short ones looking lost in the middle of the
 * card, so the size steps down as the text grows.
 */
export function quoteFontSize(text: string): number {
  const n = text.length;
  if (n <= 28) return 100;
  if (n <= 42) return 88;
  if (n <= 58) return 78;
  if (n <= 78) return 70;
  if (n <= 100) return 62;
  return 56;
}

/** Generous, because Arabic diacritics need vertical room to not collide. */
export const QUOTE_LINE_HEIGHT = 1.72;

export const SIZE = {
  cardNumber: 30,
  author: 36,
  url: 27,
};

export const Y = {
  cardNumber: 150,
  /** Quote block is centred on this line, not top-aligned. */
  quoteCenter: 880,
  /** Sits above the QR plate. The plate spans qrPlateTop..+QR.plate, so
   *  this must stay clear of that range. */
  rule: 1400,
  qrPlateTop: 1500,
  url: 1740,
};

export const BRAND_URL = "bagdoonis.app";
