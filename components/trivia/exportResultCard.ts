import { CARD_W, CARD_H, PAD_X, RADIUS, FRAME_INSET, INDIGO, NAVY, CREAM, FONT_DISPLAY, FONT_UI, BRAND_URL } from "@/lib/trivia-card";
import type { TriviaPlayerRow } from "@/lib/trivia-types";

/**
 * سؤال وجواب's shareable result card — deliberately built on the exact
 * same canvas-drawn, 1080x1920 (Instagram Story ratio) architecture
 * every other score-based game's card already uses (see
 * components/ihj/exportResultCard.ts, which this mirrors closely), not
 * a new image-generation setup. Same gradient-card-with-inset-frame
 * treatment, same footer branding placement, same share/download
 * fallback — the only real differences are trivia-specific content
 * (a correct/total hero stat instead of a round-by-category grid) and
 * this game's own indigo/navy identity instead of purple/pink.
 */

function roundedRectPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

async function ensureFonts() {
  if (typeof document === "undefined" || !("fonts" in document)) return;
  try {
    await Promise.all([
      document.fonts.load(`800 70px "${FONT_DISPLAY}"`),
      document.fonts.load(`700 34px "${FONT_UI}"`),
    ]);
    await document.fonts.ready;
  } catch { /* fallback face beats no card */ }
}

function drawCardBackground(ctx: CanvasRenderingContext2D) {
  const grad = ctx.createLinearGradient(0, 0, CARD_W, CARD_H);
  grad.addColorStop(0, INDIGO);
  grad.addColorStop(1, NAVY);
  ctx.fillStyle = grad;
  roundedRectPath(ctx, 0, 0, CARD_W, CARD_H, RADIUS);
  ctx.fill();

  ctx.save();
  ctx.strokeStyle = "rgba(255,255,255,0.35)";
  ctx.lineWidth = 2;
  roundedRectPath(ctx, FRAME_INSET, FRAME_INSET, CARD_W - FRAME_INSET * 2, CARD_H - FRAME_INSET * 2, RADIUS - 16);
  ctx.stroke();
  ctx.restore();
}

function drawFooter(ctx: CanvasRenderingContext2D) {
  ctx.direction = "ltr";
  ctx.font = `800 42px "${FONT_DISPLAY}", sans-serif`;
  ctx.fillStyle = CREAM;
  ctx.textAlign = "center";
  ctx.fillText(BRAND_URL, CARD_W / 2, CARD_H - 110);
  ctx.direction = "rtl";
  ctx.font = `700 28px "${FONT_UI}", sans-serif`;
  ctx.fillStyle = "rgba(255,255,255,0.75)";
  ctx.fillText("\u{1F9E0} جرب سؤال وجواب", CARD_W / 2, CARD_H - 62);
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob failed"))), "image/png");
  });
}

export type ShareResult = "shared" | "downloaded" | "cancelled" | "failed";

async function shareOrDownload(canvas: HTMLCanvasElement, filename: string): Promise<ShareResult> {
  try {
    const blob = await canvasToBlob(canvas);
    const file = new File([blob], filename, { type: "image/png" });

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
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
    return "downloaded";
  } catch {
    return "failed";
  }
}

// ============================================================================
// MULTIPLAYER — leaderboard card
// ============================================================================

const MEDALS = ["\u{1F947}", "\u{1F948}", "\u{1F949}"];

/** Ranked with ties sharing a position, same rule the on-screen results
 *  screen already uses — a shareable card that disagreed with the
 *  game's own ranking would be a worse bug than not sharing at all. */
function rankPlayers(players: TriviaPlayerRow[]): { player: TriviaPlayerRow; position: number }[] {
  const sorted = [...players].sort((a, b) => b.score - a.score);
  const positions: number[] = [];
  sorted.forEach((p, i) => {
    positions.push(i === 0 ? 1 : (sorted[i - 1].score === p.score ? positions[i - 1] : i + 1));
  });
  return sorted.map((player, i) => ({ player, position: positions[i] }));
}

export async function renderTriviaCardToCanvas(players: TriviaPlayerRow[]): Promise<HTMLCanvasElement> {
  await ensureFonts();

  const canvas = document.createElement("canvas");
  canvas.width = CARD_W;
  canvas.height = CARD_H;
  const ctx = canvas.getContext("2d")!;
  ctx.direction = "rtl";
  ctx.textAlign = "center";

  drawCardBackground(ctx);

  const ranked = rankPlayers(players);
  const winner = ranked.find((r) => r.position === 1);
  const others = ranked.filter((r) => r.position !== 1);

  const eyebrowH = 100;
  const winnerBlockH = 320;
  const rowH = 90;
  const listH = others.length * rowH + (others.length > 0 ? 40 : 0);
  const footerReserve = 220;
  const totalH = eyebrowH + winnerBlockH + listH;
  const topMargin = Math.max(140, (CARD_H - footerReserve - totalH) / 2);

  let y = topMargin;

  ctx.font = `800 46px "${FONT_DISPLAY}", sans-serif`;
  ctx.fillStyle = CREAM;
  ctx.fillText("\u{1F9E0} سؤال وجواب", CARD_W / 2, y);
  y += eyebrowH;

  if (winner) {
    ctx.font = `140px sans-serif`;
    ctx.fillText("\u{1F3C6}", CARD_W / 2, y + 40);
    y += 170;
    ctx.font = `800 60px "${FONT_DISPLAY}", sans-serif`;
    ctx.fillStyle = CREAM;
    ctx.fillText(winner.player.nickname, CARD_W / 2, y);
    y += 66;
    ctx.font = `700 40px "${FONT_UI}", sans-serif`;
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.fillText(`${winner.player.score} نقطة`, CARD_W / 2, y);
    y += 84;
  }

  if (others.length > 0) {
    ctx.strokeStyle = "rgba(255,255,255,0.3)";
    ctx.beginPath();
    ctx.moveTo(CARD_W / 2 - 120, y);
    ctx.lineTo(CARD_W / 2 + 120, y);
    ctx.stroke();
    y += 50;

    const boxW = CARD_W - PAD_X * 2;
    for (const { player, position } of others) {
      const boxY = y - 46;
      ctx.fillStyle = "rgba(255,255,255,0.14)";
      roundedRectPath(ctx, PAD_X, boxY, boxW, 66, 20);
      ctx.fill();

      ctx.textAlign = "right";
      ctx.font = `700 34px "${FONT_UI}", sans-serif`;
      ctx.fillStyle = CREAM;
      const medal = MEDALS[position - 1] || "\u{1F3AE}";
      ctx.fillText(`${medal} ${player.nickname}`, CARD_W - PAD_X - 24, y - 4);

      ctx.textAlign = "left";
      ctx.font = `800 36px "${FONT_DISPLAY}", sans-serif`;
      ctx.fillText(`${player.score}`, PAD_X + 24, y - 4);

      ctx.textAlign = "center";
      y += rowH;
    }
  }

  drawFooter(ctx);
  return canvas;
}

export async function shareTriviaResultCard(players: TriviaPlayerRow[]): Promise<ShareResult> {
  const canvas = await renderTriviaCardToCanvas(players);
  return shareOrDownload(canvas, "bagdoonis-trivia-result.png");
}

// ============================================================================
// SOLO — score card. Correct/total is the hero stat (matches the
// spec's own example card copy, "النتيجة: 8/10") rather than leading
// with raw points, since that's the more immediately legible number to
// someone glancing at a shared card with no other context.
// ============================================================================

export type TriviaSoloCardData = {
  correctCount: number;
  totalQuestions: number;
  score: number;
  /** One entry per question played, in order — true = answered
   *  correctly. Rendered as a compact dot row underneath the hero
   *  stat, the same "quick visual scan" idea as IHJ's per-round grid,
   *  just simplified since trivia has no per-question sub-categories
   *  the way IHJ's rounds do. */
  correctByQuestion: boolean[];
};

export async function renderTriviaSoloCardToCanvas(data: TriviaSoloCardData): Promise<HTMLCanvasElement> {
  await ensureFonts();

  const canvas = document.createElement("canvas");
  canvas.width = CARD_W;
  canvas.height = CARD_H;
  const ctx = canvas.getContext("2d")!;
  ctx.direction = "rtl";
  ctx.textAlign = "center";

  drawCardBackground(ctx);

  const eyebrowH = 90;
  const scoreBlockH = 180;
  const pointsLineH = 70;
  const dotsLabelH = 60;
  const dividerGap = 50;
  // Dots wrap at 10 per row, matching the max question count (15) with
  // a sensible line break rather than one very long unreadable row.
  const perRow = 10;
  const dotRows = Math.ceil(data.correctByQuestion.length / perRow);
  const dotsGridH = dotRows * 56;
  const footerReserve = 220;
  const totalH = eyebrowH + scoreBlockH + pointsLineH + dotsLabelH + dividerGap + dotsGridH;
  const topMargin = Math.max(140, (CARD_H - footerReserve - totalH) / 2);

  let y = topMargin;

  ctx.font = `800 46px "${FONT_DISPLAY}", sans-serif`;
  ctx.fillStyle = CREAM;
  ctx.fillText("\u{1F9E0} سؤال وجواب", CARD_W / 2, y);
  y += eyebrowH;

  ctx.font = `800 110px "${FONT_DISPLAY}", sans-serif`;
  ctx.fillText(`${data.correctCount}/${data.totalQuestions}`, CARD_W / 2, y + 80);
  y += 106;
  ctx.font = `700 36px "${FONT_UI}", sans-serif`;
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.fillText("إجابة صحيحة", CARD_W / 2, y);
  y += scoreBlockH - 106;

  ctx.font = `700 34px "${FONT_UI}", sans-serif`;
  ctx.fillStyle = CREAM;
  ctx.fillText(`${data.score} نقطة`, CARD_W / 2, y);
  y += pointsLineH;

  ctx.strokeStyle = "rgba(255,255,255,0.3)";
  ctx.beginPath();
  ctx.moveTo(CARD_W / 2 - 120, y);
  ctx.lineTo(CARD_W / 2 + 120, y);
  ctx.stroke();
  y += dividerGap;

  // ---- per-question dot grid ----
  const gridW = perRow * 56;
  const gridStartX = CARD_W / 2 - gridW / 2 + 28;
  ctx.font = "40px sans-serif";
  data.correctByQuestion.forEach((correct, i) => {
    const row = Math.floor(i / perRow);
    const col = i % perRow;
    const dotX = gridStartX + col * 56;
    const dotY = y + row * 56;
    ctx.fillText(correct ? "\u{1F7E2}" : "\u{1F534}", dotX, dotY);
  });

  drawFooter(ctx);
  return canvas;
}

export async function shareTriviaSoloResultCard(data: TriviaSoloCardData): Promise<ShareResult> {
  const canvas = await renderTriviaSoloCardToCanvas(data);
  return shareOrDownload(canvas, "bagdoonis-trivia-solo-result.png");
}
