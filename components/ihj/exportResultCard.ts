import { CARD_W, CARD_H, PAD_X, RADIUS, FRAME_INSET, PURPLE, PINK, CREAM, FONT_DISPLAY, FONT_UI, BRAND_URL } from "@/lib/ihj-card";
import type { IhjPlayerRow } from "@/lib/ihj-types";

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

const MEDALS = ["🥇", "🥈", "🥉"];

/** Ranked with ties sharing a position, same rule as the on-screen final
 *  results — a shareable card that disagreed with the game's own ranking
 *  would be a worse bug than not sharing at all. */
function rankPlayers(players: IhjPlayerRow[]): { player: IhjPlayerRow; position: number }[] {
  const sorted = [...players].sort((a, b) => b.total_score - a.total_score);
  const positions: number[] = [];
  sorted.forEach((p, i) => {
    positions.push(i === 0 ? 1 : (sorted[i - 1].total_score === p.total_score ? positions[i - 1] : i + 1));
  });
  return sorted.map((player, i) => ({ player, position: positions[i] }));
}

export async function renderIhjCardToCanvas(players: IhjPlayerRow[], myPlayerId?: string): Promise<HTMLCanvasElement> {
  await ensureFonts();

  const canvas = document.createElement("canvas");
  canvas.width = CARD_W;
  canvas.height = CARD_H;
  const ctx = canvas.getContext("2d")!;
  ctx.direction = "rtl";
  ctx.textAlign = "center";

  const grad = ctx.createLinearGradient(0, 0, CARD_W, CARD_H);
  grad.addColorStop(0, PURPLE);
  grad.addColorStop(1, PINK);
  ctx.fillStyle = grad;
  roundedRectPath(ctx, 0, 0, CARD_W, CARD_H, RADIUS);
  ctx.fill();

  ctx.save();
  ctx.strokeStyle = "rgba(255,255,255,0.35)";
  ctx.lineWidth = 2;
  roundedRectPath(ctx, FRAME_INSET, FRAME_INSET, CARD_W - FRAME_INSET * 2, CARD_H - FRAME_INSET * 2, RADIUS - 16);
  ctx.stroke();
  ctx.restore();

  const ranked = rankPlayers(players);
  const winner = ranked.find((r) => r.position === 1);
  const others = ranked.filter((r) => r.position !== 1);

  // ---- measure first, so the whole block can be vertically centered ----
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
  ctx.fillText("🧠 إنسان حيوان جماد", CARD_W / 2, y);
  y += eyebrowH;

  if (winner) {
    ctx.font = `140px sans-serif`;
    ctx.fillText("🏆", CARD_W / 2, y + 40);
    y += 170;
    ctx.font = `800 60px "${FONT_DISPLAY}", sans-serif`;
    ctx.fillStyle = CREAM;
    ctx.fillText(winner.player.nickname, CARD_W / 2, y);
    y += 66;
    ctx.font = `700 40px "${FONT_UI}", sans-serif`;
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.fillText(`${winner.player.total_score} نقطة`, CARD_W / 2, y);
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
      const medal = MEDALS[position - 1] || "🎮";
      ctx.fillText(`${medal} ${player.nickname}`, CARD_W - PAD_X - 24, y - 4);

      ctx.textAlign = "left";
      ctx.font = `800 36px "${FONT_DISPLAY}", sans-serif`;
      ctx.fillText(`${player.total_score}`, PAD_X + 24, y - 4);

      ctx.textAlign = "center";
      y += rowH;
    }
  }

  // ---- footer branding, fixed near the bottom ----
  ctx.direction = "ltr";
  ctx.font = `800 42px "${FONT_DISPLAY}", sans-serif`;
  ctx.fillStyle = CREAM;
  ctx.fillText(BRAND_URL, CARD_W / 2, CARD_H - 110);
  ctx.direction = "rtl";
  ctx.font = `700 28px "${FONT_UI}", sans-serif`;
  ctx.fillStyle = "rgba(255,255,255,0.75)";
  ctx.fillText("🎉 جرب إنسان حيوان جماد", CARD_W / 2, CARD_H - 62);

  return canvas;
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob failed"))), "image/png");
  });
}

export type ShareResult = "shared" | "downloaded" | "cancelled" | "failed";

export async function shareIhjResultCard(players: IhjPlayerRow[], myPlayerId?: string): Promise<ShareResult> {
  try {
    const canvas = await renderIhjCardToCanvas(players, myPlayerId);
    const blob = await canvasToBlob(canvas);
    const file = new File([blob], "bagdoonis-ihj-result.png", { type: "image/png" });

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
    a.download = "bagdoonis-ihj-result.png";
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
// SOLO VARIANT — extends this same file rather than a separate image-
// generation setup, per the spec this was built from. Reuses
// roundedRectPath, ensureFonts, canvasToBlob, and ShareResult defined
// above, plus the identical gradient/frame/footer treatment, so a solo
// card is recognizably the same game's card, just with solo-shaped
// content (score + title + a round-by-round grid) instead of a
// leaderboard.
// ============================================================================

export type IhjSoloCardData = {
  score: number;
  title: { emoji: string; ar: string };
  totalRounds: number;
  /** One entry per round played, correctByCategory in the same order as
   *  IHJ_CATEGORIES (human, animal, object, plant, country). */
  rounds: { letter: string; correctByCategory: boolean[] }[];
};

export async function renderIhjSoloCardToCanvas(data: IhjSoloCardData): Promise<HTMLCanvasElement> {
  await ensureFonts();

  const canvas = document.createElement("canvas");
  canvas.width = CARD_W;
  canvas.height = CARD_H;
  const ctx = canvas.getContext("2d")!;
  ctx.direction = "rtl";
  ctx.textAlign = "center";

  const grad = ctx.createLinearGradient(0, 0, CARD_W, CARD_H);
  grad.addColorStop(0, PURPLE);
  grad.addColorStop(1, PINK);
  ctx.fillStyle = grad;
  roundedRectPath(ctx, 0, 0, CARD_W, CARD_H, RADIUS);
  ctx.fill();

  ctx.save();
  ctx.strokeStyle = "rgba(255,255,255,0.35)";
  ctx.lineWidth = 2;
  roundedRectPath(ctx, FRAME_INSET, FRAME_INSET, CARD_W - FRAME_INSET * 2, CARD_H - FRAME_INSET * 2, RADIUS - 16);
  ctx.stroke();
  ctx.restore();

  // ---- measure first, so the whole block can be vertically centered ----
  const eyebrowH = 90;
  const scoreBlockH = 150;
  const titleH = 66;
  const roundsLabelH = 60;
  const dividerGap = 60;
  const rowH = 64;
  const gridH = data.rounds.length * rowH;
  const footerReserve = 220;
  const totalH = eyebrowH + scoreBlockH + titleH + roundsLabelH + dividerGap + gridH;
  const topMargin = Math.max(140, (CARD_H - footerReserve - totalH) / 2);

  let y = topMargin;

  ctx.font = `800 46px "${FONT_DISPLAY}", sans-serif`;
  ctx.fillStyle = CREAM;
  ctx.fillText("🧠 إنسان حيوان جماد", CARD_W / 2, y);
  y += eyebrowH;

  ctx.font = `800 100px "${FONT_DISPLAY}", sans-serif`;
  ctx.fillText(`${data.score}`, CARD_W / 2, y + 70);
  y += 96;
  ctx.font = `700 34px "${FONT_UI}", sans-serif`;
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.fillText("نقطة", CARD_W / 2, y);
  y += scoreBlockH - 96;

  ctx.font = `800 42px "${FONT_DISPLAY}", sans-serif`;
  ctx.fillStyle = CREAM;
  ctx.fillText(`${data.title.emoji} ${data.title.ar}`, CARD_W / 2, y);
  y += titleH;

  ctx.font = `700 32px "${FONT_UI}", sans-serif`;
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.fillText(`${data.totalRounds} جولات`, CARD_W / 2, y);
  y += roundsLabelH;

  ctx.strokeStyle = "rgba(255,255,255,0.3)";
  ctx.beginPath();
  ctx.moveTo(CARD_W / 2 - 120, y);
  ctx.lineTo(CARD_W / 2 + 120, y);
  ctx.stroke();
  y += dividerGap;

  // ---- round-by-round grid: letter + a colored dot per category ----
  const boxW = CARD_W - PAD_X * 2;
  for (const round of data.rounds) {
    const rowY = y;
    ctx.fillStyle = "rgba(255,255,255,0.14)";
    roundedRectPath(ctx, PAD_X, rowY - 40, boxW, 56, 18);
    ctx.fill();

    ctx.textAlign = "right";
    ctx.font = `800 32px "${FONT_DISPLAY}", sans-serif`;
    ctx.fillStyle = CREAM;
    ctx.fillText(round.letter, CARD_W - PAD_X - 24, rowY - 4);

    ctx.textAlign = "left";
    ctx.font = "30px sans-serif";
    let dotX = PAD_X + 24;
    for (const correct of round.correctByCategory) {
      ctx.fillText(correct ? "🟢" : "🔴", dotX, rowY - 2);
      dotX += 42;
    }
    ctx.textAlign = "center";
    y += rowH;
  }

  // ---- footer branding, identical to the multiplayer card ----
  ctx.direction = "ltr";
  ctx.font = `800 42px "${FONT_DISPLAY}", sans-serif`;
  ctx.fillStyle = CREAM;
  ctx.fillText(BRAND_URL, CARD_W / 2, CARD_H - 110);
  ctx.direction = "rtl";
  ctx.font = `700 28px "${FONT_UI}", sans-serif`;
  ctx.fillStyle = "rgba(255,255,255,0.75)";
  ctx.fillText("🎉 جرب إنسان حيوان جماد", CARD_W / 2, CARD_H - 62);

  return canvas;
}

export async function shareIhjSoloResultCard(data: IhjSoloCardData): Promise<ShareResult> {
  try {
    const canvas = await renderIhjSoloCardToCanvas(data);
    const blob = await canvasToBlob(canvas);
    const file = new File([blob], "bagdoonis-ihj-solo-result.png", { type: "image/png" });

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
    a.download = "bagdoonis-ihj-solo-result.png";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
    return "downloaded";
  } catch {
    return "failed";
  }
}
