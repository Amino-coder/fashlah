import {
  CARD_W, CARD_H, PAD_X, QR, QR_MATRIX, SIZE, Y, BRAND_URL,
  FONT_QUOTE, FONT_UI, QUOTE_LINE_HEIGHT, quoteFontSize, type Palette,
} from "@/lib/ibarat-card";
import type { Quote } from "@/lib/ibarat-quotes-types";

/**
 * Renders a card to a 1080x1920 PNG and hands it to the OS share sheet,
 * falling back to a download.
 *
 * Drawn with the Canvas 2D API rather than by screenshotting the DOM. Two
 * reasons: it avoids adding a heavyweight dependency for one feature, and
 * — more importantly — the usual DOM-to-image routes rasterise through an
 * <img>, which refuses to load external fonts. That would silently drop
 * Amiri and fall back to a system face, which for Arabic is the difference
 * between the card people want to post and one they don't. Canvas draws
 * with the real loaded font and shapes Arabic correctly.
 *
 * The layout constants are imported from the same module the on-screen card
 * uses, so the two can't drift.
 */

/** CSS gradient angles are measured clockwise from "to top"; canvas wants two points. */
function cssAngleGradient(
  ctx: CanvasRenderingContext2D, deg: number, w: number, h: number
): CanvasGradient {
  const rad = (deg * Math.PI) / 180;
  const dx = Math.sin(rad);
  const dy = -Math.cos(rad);
  const len = Math.abs(w * dx) + Math.abs(h * dy);
  const cx = w / 2;
  const cy = h / 2;
  return ctx.createLinearGradient(
    cx - (dx * len) / 2, cy - (dy * len) / 2,
    cx + (dx * len) / 2, cy + (dy * len) / 2
  );
}

function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/**
 * Greedy word wrap. Splitting on spaces and re-joining keeps the text in
 * logical order, so the browser's shaper still handles the bidi/RTL layout
 * of each line correctly when it's drawn.
 */
function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (ctx.measureText(candidate).width <= maxWidth || !line) {
      line = candidate;
    } else {
      lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  return lines;
}

/** Web fonts must be resolved before the first fillText, or canvas silently uses a fallback. */
async function ensureFonts(quoteSize: number) {
  if (typeof document === "undefined" || !("fonts" in document)) return;
  try {
    await Promise.all([
      document.fonts.load(`700 ${quoteSize}px "${FONT_QUOTE}"`),
      document.fonts.load(`400 ${SIZE.author}px "${FONT_UI}"`),
      document.fonts.load(`500 ${SIZE.cardNumber}px "${FONT_UI}"`),
    ]);
    await document.fonts.ready;
  } catch {
    /* If loading reports a problem we still draw — a fallback face beats no card. */
  }
}

export async function renderCardToCanvas(quote: Quote, palette: Palette): Promise<HTMLCanvasElement> {
  const qSize = quoteFontSize(quote.text);
  await ensureFonts(qSize);

  const canvas = document.createElement("canvas");
  canvas.width = CARD_W;
  canvas.height = CARD_H;
  const ctx = canvas.getContext("2d")!;

  // Full-bleed background. Unlike the on-screen card this has square
  // corners: story surfaces don't respect transparency, so rounded corners
  // would come out as black wedges.
  const bg = cssAngleGradient(ctx, 160, CARD_W, CARD_H);
  bg.addColorStop(0, palette.from);
  bg.addColorStop(1, palette.to);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, CARD_W, CARD_H);

  // Bloom behind the quote
  const glowCx = CARD_W * 0.5;
  const glowCy = CARD_H * 0.42;
  const glowR = Math.hypot(glowCx, CARD_H - glowCy) * 0.58;
  const glow = ctx.createRadialGradient(glowCx, glowCy, 0, glowCx, glowCy, glowR);
  glow.addColorStop(0, hexToRgba(palette.glow, 0.22));
  glow.addColorStop(1, hexToRgba(palette.glow, 0));
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, CARD_W, CARD_H);

  // Vignette
  const vCx = CARD_W * 0.5;
  const vCy = CARD_H * 0.45;
  const vR = Math.hypot(vCx, CARD_H - vCy);
  const vig = ctx.createRadialGradient(vCx, vCy, vR * 0.55, vCx, vCy, vR);
  vig.addColorStop(0, "rgba(0,0,0,0)");
  vig.addColorStop(1, "rgba(0,0,0,0.32)");
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, CARD_W, CARD_H);

  ctx.textAlign = "center";
  ctx.direction = "rtl";

  // Card number
  ctx.font = `500 ${SIZE.cardNumber}px "${FONT_UI}", sans-serif`;
  ctx.fillStyle = palette.soft;
  ctx.textBaseline = "middle";
  ctx.fillText(`بطاقة #${quote.id}`, CARD_W / 2, Y.cardNumber + SIZE.cardNumber / 2);

  // Quote block, vertically centred on Y.quoteCenter (mirrors the CSS
  // translateY(-50%) the on-screen card uses)
  const maxWidth = CARD_W - PAD_X * 2;
  ctx.font = `700 ${qSize}px "${FONT_QUOTE}", serif`;
  const lines = wrapText(ctx, quote.text, maxWidth);
  const lineH = qSize * QUOTE_LINE_HEIGHT;
  const authorGap = quote.author ? Math.round(qSize * 0.9) : 0;
  const authorLineH = quote.author ? SIZE.author * 1.4 : 0;
  const blockH = lines.length * lineH + authorGap + authorLineH;
  const top = Y.quoteCenter - blockH / 2;

  ctx.fillStyle = palette.ink;
  lines.forEach((line, i) => {
    ctx.fillText(line, CARD_W / 2, top + i * lineH + lineH / 2);
  });

  if (quote.author) {
    ctx.font = `400 ${SIZE.author}px "${FONT_UI}", sans-serif`;
    ctx.fillStyle = palette.soft;
    ctx.fillText(
      `— ${quote.author}`,
      CARD_W / 2,
      top + lines.length * lineH + authorGap + authorLineH / 2
    );
  }

  // Hairline rule with centre diamond
  ctx.save();
  ctx.globalAlpha = 0.4;
  ctx.fillStyle = palette.soft;
  ctx.fillRect(CARD_W / 2 - 18 - 150, Y.rule, 150, 1);
  ctx.fillRect(CARD_W / 2 + 18, Y.rule, 150, 1);
  ctx.globalAlpha = 0.55;
  ctx.translate(CARD_W / 2, Y.rule);
  ctx.rotate(Math.PI / 4);
  ctx.fillRect(-4.5, -4.5, 9, 9);
  ctx.restore();

  // QR — dark modules on a light plate, so it scans on every palette
  const plateX = (CARD_W - QR.plate) / 2;
  ctx.fillStyle = QR.light;
  roundRect(ctx, plateX, Y.qrPlateTop, QR.plate, QR.plate, QR.plateRadius);
  ctx.fill();

  const modules = QR_MATRIX.length;
  const moduleSize = (QR.plate - QR.quiet * 2) / modules;
  ctx.fillStyle = QR.dark;
  for (let y = 0; y < modules; y++) {
    const row = QR_MATRIX[y];
    for (let x = 0; x < modules; x++) {
      if (row[x] === "1") {
        // Rounded up by a hair to avoid hairline seams between modules,
        // which can confuse scanners.
        ctx.fillRect(
          plateX + QR.quiet + x * moduleSize,
          Y.qrPlateTop + QR.quiet + y * moduleSize,
          Math.ceil(moduleSize),
          Math.ceil(moduleSize)
        );
      }
    }
  }

  // Wordmark (LTR — it's a domain)
  ctx.direction = "ltr";
  ctx.font = `500 ${SIZE.url}px "${FONT_UI}", sans-serif`;
  ctx.fillStyle = palette.soft;
  ctx.fillText(BRAND_URL, CARD_W / 2, Y.url + SIZE.url / 2);

  return canvas;
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob failed"))), "image/png");
  });
}

export type ShareResult = "shared" | "downloaded" | "cancelled" | "failed";

export async function shareCard(quote: Quote, palette: Palette): Promise<ShareResult> {
  try {
    const canvas = await renderCardToCanvas(quote, palette);
    const blob = await canvasToBlob(canvas);
    const file = new File([blob], `bagdoonis-${quote.id}.png`, { type: "image/png" });

    // canShare({files}) must be checked separately from share() — several
    // browsers expose navigator.share but reject file payloads.
    if (typeof navigator !== "undefined" && navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file] });
        return "shared";
      } catch (err) {
        // AbortError means the user dismissed the sheet — not a failure,
        // and it must not trigger the download fallback.
        if (err instanceof Error && err.name === "AbortError") return "cancelled";
      }
    }

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bagdoonis-${quote.id}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    // Revoked on a delay so Safari has time to start the download.
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
    return "downloaded";
  } catch {
    return "failed";
  }
}
