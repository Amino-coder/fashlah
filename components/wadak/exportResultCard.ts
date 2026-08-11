import { CARD_W, CARD_H, PAD_X, RADIUS, FRAME_INSET, TEAL, INDIGO, CREAM, FONT_DISPLAY, FONT_UI, BRAND_URL } from "@/lib/wadak-card";
import { DIMENSION_LABELS, type Archetype } from "@/lib/wadak-content";
import type { ScoreResult } from "@/lib/wadak-engine";

function roundedRectPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
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

async function ensureFonts() {
  if (typeof document === "undefined" || !("fonts" in document)) return;
  try {
    await Promise.all([
      document.fonts.load(`800 90px "${FONT_DISPLAY}"`),
      document.fonts.load(`700 40px "${FONT_UI}"`),
      document.fonts.load(`800 34px "${FONT_UI}"`),
    ]);
    await document.fonts.ready;
  } catch { /* fallback face beats no card */ }
}

export async function renderResultCardToCanvas(archetype: Archetype, result: ScoreResult): Promise<HTMLCanvasElement> {
  await ensureFonts();

  const canvas = document.createElement("canvas");
  canvas.width = CARD_W;
  canvas.height = CARD_H;
  const ctx = canvas.getContext("2d")!;

  // Background
  const grad = ctx.createLinearGradient(0, 0, CARD_W, CARD_H);
  grad.addColorStop(0, TEAL);
  grad.addColorStop(1, INDIGO);
  ctx.fillStyle = grad;
  roundedRectPath(ctx, 0, 0, CARD_W, CARD_H, RADIUS);
  ctx.fill();

  // Frame
  ctx.save();
  ctx.strokeStyle = "rgba(255,255,255,0.35)";
  ctx.lineWidth = 2;
  roundedRectPath(ctx, FRAME_INSET, FRAME_INSET, CARD_W - FRAME_INSET * 2, CARD_H - FRAME_INSET * 2, RADIUS - 16);
  ctx.stroke();
  ctx.restore();

  ctx.textAlign = "center";
  ctx.direction = "rtl";

  // Eyebrow
  ctx.font = `800 34px "${FONT_UI}", sans-serif`;
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.fillText("وش وضعك؟ 👀", CARD_W / 2, 190);

  // Emoji (big)
  ctx.font = `160px sans-serif`;
  ctx.fillText(archetype.emoji, CARD_W / 2, 400);

  // Archetype name
  ctx.font = `800 88px "${FONT_DISPLAY}", sans-serif`;
  ctx.fillStyle = CREAM;
  ctx.fillText(archetype.name, CARD_W / 2, 500);

  // Card line (funny one-liner)
  ctx.font = `700 38px "${FONT_UI}", sans-serif`;
  ctx.fillStyle = "rgba(255,255,255,0.92)";
  const lineWrapped = wrapText(ctx, archetype.cardLine, CARD_W - PAD_X * 2);
  let ly = 580;
  for (const line of lineWrapped) { ctx.fillText(line, CARD_W / 2, ly); ly += 50; }

  // Stat bars — top 2 dimensions
  const statsY = ly + 90;
  const barW = CARD_W - PAD_X * 2;
  const barH = 30;
  const gap = 130;
  result.ranked.slice(0, 3).forEach((stat, i) => {
    const y = statsY + i * gap;
    ctx.textAlign = "right";
    ctx.font = `700 34px "${FONT_UI}", sans-serif`;
    ctx.fillStyle = CREAM;
    ctx.fillText(DIMENSION_LABELS[stat.dimension], CARD_W - PAD_X, y - 14);
    ctx.textAlign = "left";
    ctx.fillText(`${stat.percentage}%`, PAD_X, y - 14);

    // track
    ctx.fillStyle = "rgba(255,255,255,0.2)";
    roundedRectPath(ctx, PAD_X, y, barW, barH, barH / 2);
    ctx.fill();
    // fill
    ctx.fillStyle = CREAM;
    const fillW = Math.max(barH, (barW * stat.percentage) / 100);
    roundedRectPath(ctx, PAD_X, y, fillW, barH, barH / 2);
    ctx.fill();
  });

  // Footer branding
  ctx.textAlign = "center";
  ctx.font = `800 40px "${FONT_DISPLAY}", sans-serif`;
  ctx.fillStyle = CREAM;
  ctx.direction = "ltr";
  ctx.fillText(BRAND_URL, CARD_W / 2, CARD_H - 110);
  ctx.font = `700 28px "${FONT_UI}", sans-serif`;
  ctx.fillStyle = "rgba(255,255,255,0.75)";
  ctx.direction = "rtl";
  ctx.fillText("جرب وشوف وش وضعك انت", CARD_W / 2, CARD_H - 60);

  return canvas;
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob failed"))), "image/png");
  });
}

export type ShareResult = "shared" | "downloaded" | "cancelled" | "failed";

export async function shareResultCard(archetype: Archetype, result: ScoreResult): Promise<ShareResult> {
  try {
    const canvas = await renderResultCardToCanvas(archetype, result);
    const blob = await canvasToBlob(canvas);
    const file = new File([blob], `bagdoonis-wadak-${archetype.key}.png`, { type: "image/png" });

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
    a.download = `bagdoonis-wadak-${archetype.key}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
    return "downloaded";
  } catch {
    return "failed";
  }
}
