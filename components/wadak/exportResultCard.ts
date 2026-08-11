import { CARD_W, CARD_H, PAD_X, RADIUS, FRAME_INSET, TEAL, INDIGO, CREAM, FONT_DISPLAY, FONT_UI, BRAND_URL } from "@/lib/wadak-card";
import { type Archetype } from "@/lib/wadak-content";
import type { ScoreResult } from "@/lib/wadak-engine";
import { radarPoints } from "./RadarChart";

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

const DIMENSION_LABELS_AR: Record<string, string> = {
  spontaneity: "العفوية", overthinking: "التفكير الزايد", comfort: "حب الراحة",
  recklessness: "التهور", drama: "الدراما", control: "حب التحكم",
};

function drawRadar(ctx: CanvasRenderingContext2D, result: ScoreResult, cx: number, cy: number, maxR: number) {
  const order: (keyof typeof DIMENSION_LABELS_AR)[] = ["spontaneity", "overthinking", "comfort", "recklessness", "drama", "control"];
  const rings = [0.25, 0.5, 0.75, 1];

  ctx.save();
  ctx.strokeStyle = "rgba(255,255,255,0.25)";
  ctx.lineWidth = 1.5;
  for (const r of rings) {
    ctx.beginPath();
    order.forEach((_, i) => {
      const angle = (Math.PI * 2 * i) / order.length - Math.PI / 2;
      const x = cx + maxR * r * Math.cos(angle), y = cy + maxR * r * Math.sin(angle);
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.stroke();
  }
  order.forEach((_, i) => {
    const angle = (Math.PI * 2 * i) / order.length - Math.PI / 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + maxR * Math.cos(angle), cy + maxR * Math.sin(angle));
    ctx.stroke();
  });
  ctx.restore();

  const pts = radarPoints(result.percentages, cx, cy, maxR);
  ctx.beginPath();
  pts.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
  ctx.closePath();
  ctx.fillStyle = "rgba(255,249,240,0.5)";
  ctx.fill();
  ctx.strokeStyle = CREAM;
  ctx.lineWidth = 4;
  ctx.stroke();
  for (const p of pts) {
    ctx.beginPath();
    ctx.arc(p.x, p.y, 7, 0, Math.PI * 2);
    ctx.fillStyle = CREAM;
    ctx.fill();
  }

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `700 26px "${FONT_UI}", sans-serif`;
  ctx.fillStyle = CREAM;
  order.forEach((dim, i) => {
    const angle = (Math.PI * 2 * i) / order.length - Math.PI / 2;
    const lx = cx + (maxR + 60) * Math.cos(angle), ly = cy + (maxR + 60) * Math.sin(angle);
    ctx.fillText(DIMENSION_LABELS_AR[dim], lx, ly);
  });
}

export async function renderResultCardToCanvas(archetype: Archetype, result: ScoreResult, nickname?: string): Promise<HTMLCanvasElement> {
  await ensureFonts();

  const canvas = document.createElement("canvas");
  canvas.width = CARD_W;
  canvas.height = CARD_H;
  const ctx = canvas.getContext("2d")!;

  const grad = ctx.createLinearGradient(0, 0, CARD_W, CARD_H);
  grad.addColorStop(0, TEAL);
  grad.addColorStop(1, INDIGO);
  ctx.fillStyle = grad;
  roundedRectPath(ctx, 0, 0, CARD_W, CARD_H, RADIUS);
  ctx.fill();

  ctx.save();
  ctx.strokeStyle = "rgba(255,255,255,0.35)";
  ctx.lineWidth = 2;
  roundedRectPath(ctx, FRAME_INSET, FRAME_INSET, CARD_W - FRAME_INSET * 2, CARD_H - FRAME_INSET * 2, RADIUS - 16);
  ctx.stroke();
  ctx.restore();

  ctx.textAlign = "center";
  ctx.direction = "rtl";

  ctx.font = `800 32px "${FONT_UI}", sans-serif`;
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.fillText("وش وضعك؟ 👀", CARD_W / 2, 130);

  if (nickname?.trim()) {
    ctx.font = `700 30px "${FONT_UI}", sans-serif`;
    ctx.fillStyle = "rgba(255,255,255,0.75)";
    ctx.fillText(nickname.trim(), CARD_W / 2, 172);
  }

  ctx.font = `130px sans-serif`;
  ctx.fillText(archetype.emoji, CARD_W / 2, 330);

  ctx.font = `800 70px "${FONT_DISPLAY}", sans-serif`;
  ctx.fillStyle = CREAM;
  ctx.fillText(archetype.name, CARD_W / 2, 420);

  ctx.font = `700 32px "${FONT_UI}", sans-serif`;
  ctx.fillStyle = "rgba(255,255,255,0.92)";
  const lineWrapped = wrapText(ctx, archetype.cardLine, CARD_W - PAD_X * 2);
  let ly = 470;
  for (const line of lineWrapped) { ctx.fillText(line, CARD_W / 2, ly); ly += 42; }

  // Radar chart — the main visual centerpiece now, replacing flat bars.
  drawRadar(ctx, result, CARD_W / 2, ly + 300, 210);

  // Top dimension callout below the chart
  const topStat = result.ranked[0];
  const calloutY = ly + 610;
  ctx.font = `700 28px "${FONT_UI}", sans-serif`;
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.fillText(`أعلى صفة: ${DIMENSION_LABELS_AR[topStat.dimension]} — ${topStat.percentage}%`, CARD_W / 2, calloutY);

  // Strength + flaw, brief, for more information on the card
  ctx.font = `700 26px "${FONT_UI}", sans-serif`;
  ctx.fillStyle = CREAM;
  const strengthLines = wrapText(ctx, `💪 ${archetype.strengths[0]}`, CARD_W - PAD_X * 2);
  let sy = calloutY + 56;
  for (const line of strengthLines) { ctx.fillText(line, CARD_W / 2, sy); sy += 36; }
  const flawLines = wrapText(ctx, `💀 ${archetype.flaw}`, CARD_W - PAD_X * 2);
  sy += 10;
  for (const line of flawLines) { ctx.fillText(line, CARD_W / 2, sy); sy += 36; }

  // Footer branding
  ctx.font = `800 40px "${FONT_DISPLAY}", sans-serif`;
  ctx.fillStyle = CREAM;
  ctx.direction = "ltr";
  ctx.fillText(BRAND_URL, CARD_W / 2, CARD_H - 110);
  ctx.font = `700 26px "${FONT_UI}", sans-serif`;
  ctx.fillStyle = "rgba(255,255,255,0.75)";
  ctx.direction = "rtl";
  ctx.fillText("جرب وشوف وش وضعك انت", CARD_W / 2, CARD_H - 62);

  return canvas;
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob failed"))), "image/png");
  });
}

export type ShareResult = "shared" | "downloaded" | "cancelled" | "failed";

export async function shareResultCard(archetype: Archetype, result: ScoreResult, nickname?: string): Promise<ShareResult> {
  try {
    const canvas = await renderResultCardToCanvas(archetype, result, nickname);
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
