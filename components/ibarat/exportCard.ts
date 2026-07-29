import {
  CARD_W, CARD_H, PAD_X, SIZE, QUOTE_CENTER_Y,
  FONT_QUOTE, FONT_UI, QUOTE_LINE_HEIGHT, quoteFontSize, FRONT_IMAGES,
} from "@/lib/ibarat-card";
import type { Quote } from "@/lib/ibarat-quotes-types";

/**
 * Renders a card to a 1080x1920 PNG (the uploaded artwork plus the quote
 * text drawn on top, in the same position the on-screen card uses) and
 * hands it to the OS share sheet, falling back to a download.
 */

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

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

async function ensureFonts(quoteSize: number) {
  if (typeof document === "undefined" || !("fonts" in document)) return;
  try {
    await Promise.all([
      document.fonts.load(`600 ${quoteSize}px "${FONT_QUOTE}"`),
      document.fonts.load(`500 ${SIZE.author}px "${FONT_UI}"`),
    ]);
    await document.fonts.ready;
  } catch { /* fallback face beats no card */ }
}

export async function renderCardToCanvas(quote: Quote, frontIndex: number): Promise<HTMLCanvasElement> {
  const qSize = quoteFontSize(quote.text);
  const [img] = await Promise.all([
    loadImage(FRONT_IMAGES[frontIndex % FRONT_IMAGES.length]),
    ensureFonts(qSize),
  ]);

  const canvas = document.createElement("canvas");
  canvas.width = CARD_W;
  canvas.height = CARD_H;
  const ctx = canvas.getContext("2d")!;

  // Cover-fit the artwork onto the 1080x1920 canvas.
  const s = Math.max(CARD_W / img.width, CARD_H / img.height);
  const dw = img.width * s, dh = img.height * s;
  ctx.drawImage(img, (CARD_W - dw) / 2, (CARD_H - dh) / 2, dw, dh);

  ctx.textAlign = "center";
  ctx.direction = "rtl";
  ctx.textBaseline = "middle";

  const maxWidth = CARD_W - PAD_X * 2;
  ctx.font = `600 ${qSize}px "${FONT_QUOTE}", serif`;
  const lines = wrapText(ctx, quote.text, maxWidth);
  const lineH = qSize * QUOTE_LINE_HEIGHT;
  const authorGap = quote.author ? Math.round(qSize * 0.85) : 0;
  const authorLineH = quote.author ? SIZE.author * 1.4 : 0;
  const blockH = lines.length * lineH + authorGap + authorLineH;
  const top = QUOTE_CENTER_Y - blockH / 2;

  ctx.fillStyle = "#241539";
  lines.forEach((line, i) => ctx.fillText(line, CARD_W / 2, top + i * lineH + lineH / 2));

  if (quote.author) {
    ctx.font = `500 ${SIZE.author}px "${FONT_UI}", sans-serif`;
    ctx.fillStyle = "#5c5045";
    ctx.fillText(`— ${quote.author}`, CARD_W / 2, top + lines.length * lineH + authorGap + authorLineH / 2);
  }

  return canvas;
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob failed"))), "image/png");
  });
}

export type ShareResult = "shared" | "downloaded" | "cancelled" | "failed";

export async function shareCard(quote: Quote, frontIndex: number): Promise<ShareResult> {
  try {
    const canvas = await renderCardToCanvas(quote, frontIndex);
    const blob = await canvasToBlob(canvas);
    const file = new File([blob], `bagdoonis-${quote.id}.png`, { type: "image/png" });

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
    a.download = `bagdoonis-${quote.id}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
    return "downloaded";
  } catch {
    return "failed";
  }
}
