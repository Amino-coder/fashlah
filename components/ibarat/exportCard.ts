import {
  CARD_W, CARD_H, PAD_X, SIZE, Y, RULE, BRAND_URL,
  FONT_QUOTE, FONT_UI, QUOTE_LINE_HEIGHT, quoteFontSize, type Palette,
} from "@/lib/ibarat-card";
import { getTextureCanvas } from "@/lib/ibarat-texture";
import type { Quote } from "@/lib/ibarat-quotes-types";

/**
 * Renders a card to a 1080x1920 PNG and hands it to the OS share sheet,
 * falling back to a download.
 *
 * Drawn with the Canvas 2D API rather than by screenshotting the DOM. Beyond
 * avoiding a heavyweight dependency, the usual DOM-to-image routes rasterise
 * through an <img>, which refuses to load external fonts — that would
 * silently drop the Arabic face and fall back to a system one, which for
 * this card is the whole point of the design.
 *
 * Layout constants and the texture tile are imported from the same modules
 * the on-screen card uses, so the two renderers can't drift.
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
      document.fonts.load(`600 ${quoteSize}px "${FONT_QUOTE}"`),
      document.fonts.load(`400 ${SIZE.author}px "${FONT_UI}"`),
      document.fonts.load(`500 ${SIZE.cardNumber}px "${FONT_UI}"`),
    ]);
    await document.fonts.ready;
  } catch {
    /* If loading reports a problem we still draw — a fallback face beats no card. */
  }
}

/** Draws an ellipse-shaped radial falloff, matching CSS's `radial-gradient(ellipse Wx H at X Y)`. */
function ellipseGlow(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number, rx: number, ry: number,
  inner: string, outer: string, stop: number
) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(1, ry / rx);
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, rx);
  g.addColorStop(0, inner);
  g.addColorStop(stop, outer);
  g.addColorStop(1, outer);
  ctx.fillStyle = g;
  // Generous rect in the transformed space so the gradient covers the card.
  ctx.fillRect(-CARD_W * 2, -CARD_H * 2, CARD_W * 4, CARD_H * 4);
  ctx.restore();
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
  const bg = cssAngleGradient(ctx, 158, CARD_W, CARD_H);
  bg.addColorStop(0, palette.from);
  bg.addColorStop(0.52, palette.mid);
  bg.addColorStop(1, palette.to);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, CARD_W, CARD_H);

  // Directional light from upper-left
  ellipseGlow(
    ctx,
    CARD_W * 0.28, CARD_H * 0.08,
    CARD_W * 0.78, CARD_H * 0.52,
    "rgba(255,255,255,0.10)", "rgba(255,255,255,0)", 0.62
  );

  // Bloom behind the quote
  const glowCx = CARD_W * 0.5;
  const glowCy = CARD_H * 0.40;
  const glowR = Math.hypot(glowCx, CARD_H - glowCy) * 0.56;
  const glow = ctx.createRadialGradient(glowCx, glowCy, 0, glowCx, glowCy, glowR);
  glow.addColorStop(0, hexToRgba(palette.glow, 0.133)); // 0x22/255
  glow.addColorStop(1, hexToRgba(palette.glow, 0));
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, CARD_W, CARD_H);

  // Paper grain + faint lattice — the identical tile the live card uses
  const tile = getTextureCanvas();
  if (tile) {
    const pattern = ctx.createPattern(tile, "repeat");
    if (pattern) {
      ctx.fillStyle = pattern;
      ctx.fillRect(0, 0, CARD_W, CARD_H);
    }
  }

  // Vignette
  const vCx = CARD_W * 0.5;
  const vCy = CARD_H * 0.44;
  const vR = Math.hypot(vCx, CARD_H - vCy);
  const vig = ctx.createRadialGradient(vCx, vCy, vR * 0.56, vCx, vCy, vR);
  vig.addColorStop(0, "rgba(0,0,0,0)");
  vig.addColorStop(1, "rgba(0,0,0,0.26)");
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, CARD_W, CARD_H);

  ctx.textAlign = "center";
  ctx.direction = "rtl";
  ctx.textBaseline = "middle";

  // Card number
  ctx.font = `500 ${SIZE.cardNumber}px "${FONT_UI}", sans-serif`;
  ctx.fillStyle = palette.faint;
  ctx.fillText(`بطاقة #${quote.id}`, CARD_W / 2, Y.cardNumber + SIZE.cardNumber / 2);

  // Quote block, vertically centred on Y.quoteCenter (mirrors the CSS
  // translateY(-50%) the on-screen card uses)
  const maxWidth = CARD_W - PAD_X * 2;
  ctx.font = `600 ${qSize}px "${FONT_QUOTE}", serif`;
  const lines = wrapText(ctx, quote.text, maxWidth);
  const lineH = qSize * QUOTE_LINE_HEIGHT;
  const authorGap = quote.author ? Math.round(qSize * 0.85) : 0;
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

  // Divider
  const half = RULE.lineWidth + RULE.gap / 2;
  ctx.save();
  ctx.fillStyle = palette.faint;
  ctx.globalAlpha = RULE.lineOpacity;
  ctx.fillRect(CARD_W / 2 - half, Y.rule, RULE.lineWidth, 1);
  ctx.fillRect(CARD_W / 2 + RULE.gap / 2, Y.rule, RULE.lineWidth, 1);
  ctx.globalAlpha = RULE.diamondOpacity;
  ctx.translate(CARD_W / 2, Y.rule);
  ctx.rotate(Math.PI / 4);
  ctx.fillRect(-RULE.diamond / 2, -RULE.diamond / 2, RULE.diamond, RULE.diamond);
  ctx.restore();

  // Signature (LTR — it's a domain). Canvas has no letter-spacing in older
  // engines, so it's applied by hand to match the CSS.
  ctx.direction = "ltr";
  ctx.font = `400 ${SIZE.url}px "${FONT_UI}", sans-serif`;
  ctx.fillStyle = palette.soft;
  drawTracked(ctx, BRAND_URL, CARD_W / 2, Y.url + SIZE.url / 2, SIZE.url * 0.2);

  return canvas;
}

/**
 * Letter-spaced text. `ctx.letterSpacing` only landed recently and isn't
 * everywhere yet, so the glyphs are placed individually — the signature is
 * widely tracked and would look wrong bunched up.
 */
function drawTracked(
  ctx: CanvasRenderingContext2D, text: string, cx: number, y: number, tracking: number
) {
  const chars = [...text];
  const widths = chars.map((c) => ctx.measureText(c).width);
  const total = widths.reduce((a, b) => a + b, 0) + tracking * (chars.length - 1);
  const prevAlign = ctx.textAlign;
  ctx.textAlign = "left";
  let x = cx - total / 2;
  chars.forEach((c, i) => {
    ctx.fillText(c, x, y);
    x += widths[i] + tracking;
  });
  ctx.textAlign = prevAlign;
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
