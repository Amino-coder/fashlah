import {
  CARD_W, CARD_H, PAD_X, RADIUS, FRAME_INSET,
  FONT_QUOTE, FONT_UI, SIZE, RULE, BRAND_URL, paletteForCode,
  poemFontSizeFor, lineUnitsFor,
} from "@/lib/qaseeda-card";
import type { PoemLine } from "@/lib/qaseeda-poem";

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (ctx.measureText(candidate).width <= maxWidth || !line) line = candidate;
    else { lines.push(line); line = word; }
  }
  if (line) lines.push(line);
  return lines;
}

function roundedRectPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

async function ensureFonts(poemSize: number) {
  if (typeof document === "undefined" || !("fonts" in document)) return;
  try {
    await Promise.all([
      document.fonts.load(`600 ${poemSize}px "${FONT_QUOTE}"`),
      document.fonts.load(`700 ${SIZE.title}px "${FONT_QUOTE}"`),
      document.fonts.load(`600 ${SIZE.footerNames}px "${FONT_UI}"`),
      document.fonts.load(`700 ${SIZE.eyebrow}px "${FONT_UI}"`),
    ]);
    await document.fonts.ready;
  } catch { /* fallback face beats no card */ }
}

export async function renderPoemCardToCanvas(
  poem: PoemLine[],
  code: string,
  cheerLabel: string,
  titleLabel: string,
  creditLabel: string,
  playerNames: string[]
): Promise<HTMLCanvasElement> {
  const palette = paletteForCode(code);
  const poemSize = poemFontSizeFor(lineUnitsFor(poem));
  await ensureFonts(poemSize);

  const canvas = document.createElement("canvas");
  canvas.width = CARD_W;
  canvas.height = CARD_H;
  const ctx = canvas.getContext("2d")!;

  // Background — a radial wash from the palette's light stop at the top
  // down through mid to the deep stop, approximating the CSS
  // radial-gradient(...at 50% 0%...) the on-screen preview uses.
  const grad = ctx.createRadialGradient(CARD_W / 2, 0, 40, CARD_W / 2, 0, CARD_H * 1.05);
  grad.addColorStop(0, palette.from);
  grad.addColorStop(0.55, palette.mid);
  grad.addColorStop(1, palette.to);
  ctx.fillStyle = grad;
  roundedRectPath(ctx, 0, 0, CARD_W, CARD_H, RADIUS);
  ctx.fill();

  // Gold frame
  ctx.save();
  ctx.strokeStyle = `${palette.gold}66`;
  ctx.lineWidth = 2;
  roundedRectPath(ctx, FRAME_INSET, FRAME_INSET, CARD_W - FRAME_INSET * 2, CARD_H - FRAME_INSET * 2, RADIUS - 16);
  ctx.stroke();
  ctx.restore();

  ctx.textAlign = "center";
  ctx.direction = "rtl";
  ctx.textBaseline = "alphabetic";

  const maxWidth = CARD_W - PAD_X * 2;
  let y = 330;

  // Eyebrow + title
  ctx.font = `700 ${SIZE.eyebrow}px "${FONT_UI}", sans-serif`;
  ctx.fillStyle = palette.gold;
  ctx.fillText(cheerLabel, CARD_W / 2, y);
  y += SIZE.title + 6;

  ctx.font = `700 ${SIZE.title}px "${FONT_QUOTE}", serif`;
  ctx.fillStyle = palette.ink;
  ctx.fillText(titleLabel, CARD_W / 2, y);
  y += 70;

  // Divider
  const cx = CARD_W / 2;
  ctx.strokeStyle = palette.gold;
  ctx.globalAlpha = 0.6;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cx - RULE.lineWidth - RULE.gap - RULE.diamond, y);
  ctx.lineTo(cx - RULE.gap - RULE.diamond, y);
  ctx.moveTo(cx + RULE.gap + RULE.diamond, y);
  ctx.lineTo(cx + RULE.lineWidth + RULE.gap + RULE.diamond, y);
  ctx.stroke();
  ctx.globalAlpha = 0.85;
  ctx.save();
  ctx.translate(cx, y);
  ctx.rotate(Math.PI / 4);
  ctx.fillStyle = palette.gold;
  ctx.fillRect(-RULE.diamond / 2, -RULE.diamond / 2, RULE.diamond, RULE.diamond);
  ctx.restore();
  ctx.globalAlpha = 1;
  y += 76;

  // Poem body — wrap each hemistich independently so a long custom line
  // still fits, then stack with generous spacing between couplets.
  ctx.font = `600 ${poemSize}px "${FONT_QUOTE}", serif`;
  ctx.fillStyle = palette.ink;
  const poemLineH = poemSize * 1.55;
  const coupletGap = 32;

  // Compute total height first so the block can be vertically balanced
  // within the remaining card space, same idea as the عبارات export.
  const wrapped = poem.map((l) => {
    const l1 = wrapText(ctx, l.line1, maxWidth);
    const l2 = l.line2 ? wrapText(ctx, l.line2, maxWidth) : [];
    return { l1, l2 };
  });
  const bodyLineCount = wrapped.reduce((sum, w) => sum + w.l1.length + w.l2.length, 0);
  const bodyHeight = bodyLineCount * poemLineH + Math.max(0, poem.length - 1) * coupletGap;

  const footerTop = CARD_H - 96 - (playerNames.length > 0 ? SIZE.footerLabel + SIZE.footerNames + 40 : 0) - SIZE.brand - 40;
  const bodyTop = y;
  const bodyAvailable = footerTop - bodyTop;
  const extraSpace = Math.max(0, bodyAvailable - bodyHeight);
  y += extraSpace / 2;

  for (const w of wrapped) {
    for (const line of w.l1) { ctx.fillText(line, CARD_W / 2, y); y += poemLineH; }
    for (const line of w.l2) { ctx.fillText(line, CARD_W / 2, y); y += poemLineH; }
    y += coupletGap;
  }

  // Footer — collective credit + brand mark
  let fy = footerTop + 40;
  if (playerNames.length > 0) {
    ctx.font = `700 ${SIZE.footerLabel}px "${FONT_UI}", sans-serif`;
    ctx.fillStyle = palette.gold;
    ctx.fillText(creditLabel, CARD_W / 2, fy);
    fy += SIZE.footerNames + 14;

    ctx.font = `600 ${SIZE.footerNames}px "${FONT_UI}", sans-serif`;
    ctx.fillStyle = palette.ink;
    const nameLines = wrapText(ctx, playerNames.join("   •   "), maxWidth);
    for (const line of nameLines) { ctx.fillText(line, CARD_W / 2, fy); fy += SIZE.footerNames * 1.3; }
    fy += 16;
  }

  ctx.font = `700 ${SIZE.brand}px "${FONT_UI}", sans-serif`;
  ctx.fillStyle = palette.faint;
  ctx.direction = "ltr";
  ctx.fillText(BRAND_URL.toUpperCase(), CARD_W / 2, CARD_H - 70);

  return canvas;
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob failed"))), "image/png");
  });
}

export type ShareResult = "shared" | "downloaded" | "cancelled" | "failed";

export async function sharePoemCard(
  poem: PoemLine[],
  code: string,
  cheerLabel: string,
  titleLabel: string,
  creditLabel: string,
  playerNames: string[]
): Promise<ShareResult> {
  try {
    const canvas = await renderPoemCardToCanvas(poem, code, cheerLabel, titleLabel, creditLabel, playerNames);
    const blob = await canvasToBlob(canvas);
    const file = new File([blob], `bagdoonis-qaseeda-${code}.png`, { type: "image/png" });

    if (typeof navigator !== "undefined" && navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file] });
        return "shared";
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return "cancelled";
      }
    }

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bagdoonis-qaseeda-${code}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
    return "downloaded";
  } catch {
    return "failed";
  }
}
