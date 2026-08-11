import { CARD_W, CARD_H, PAD_X, RADIUS, FRAME_INSET, TEAL, CORAL, CREAM, INK, FONT_DISPLAY, FONT_UI, BRAND_URL } from "@/lib/bidal-card";
import { ordinalAr, medalFor, formatDuration, type BidalResult } from "@/lib/bidal-results";

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

/** Lays the word flow out right-to-left, wrapping to new lines as needed —
 *  the signature visual of this game's result, so it gets the most
 *  careful layout treatment on the card. */
function drawWordFlow(ctx: CanvasRenderingContext2D, words: string[], startY: number, maxWidth: number): number {
  const wordFont = `800 44px "${FONT_DISPLAY}", sans-serif`;
  const arrowFont = `700 30px "${FONT_UI}", sans-serif`;
  const lineHeight = 66;
  const arrow = "  ←  ";

  ctx.textBaseline = "alphabetic";
  let y = startY;
  let x = CARD_W / 2 + maxWidth / 2; // start at the right edge (RTL)
  let lineStartX = x;
  const lineMinX = CARD_W / 2 - maxWidth / 2;

  words.forEach((word, i) => {
    ctx.font = wordFont;
    const wordWidth = ctx.measureText(word).width;
    ctx.font = arrowFont;
    const arrowWidth = i < words.length - 1 ? ctx.measureText(arrow).width : 0;
    const segmentWidth = wordWidth + arrowWidth;

    if (x - segmentWidth < lineMinX && x !== lineStartX) {
      y += lineHeight;
      x = lineStartX;
    }

    ctx.font = wordFont;
    ctx.fillStyle = CREAM;
    ctx.textAlign = "right";
    ctx.fillText(word, x, y);
    x -= wordWidth;

    if (i < words.length - 1) {
      ctx.font = arrowFont;
      ctx.fillStyle = "rgba(255,255,255,0.65)";
      ctx.fillText(arrow, x, y);
      x -= arrowWidth;
    }
  });

  return y + lineHeight * 0.4;
}

export async function renderBidalCardToCanvas(result: BidalResult, nickname?: string): Promise<HTMLCanvasElement> {
  await ensureFonts();

  const canvas = document.createElement("canvas");
  canvas.width = CARD_W;
  canvas.height = CARD_H;
  const ctx = canvas.getContext("2d")!;

  const grad = ctx.createLinearGradient(0, 0, CARD_W, CARD_H);
  grad.addColorStop(0, TEAL);
  grad.addColorStop(1, CORAL);
  ctx.fillStyle = grad;
  roundedRectPath(ctx, 0, 0, CARD_W, CARD_H, RADIUS);
  ctx.fill();

  ctx.save();
  ctx.strokeStyle = "rgba(255,255,255,0.35)";
  ctx.lineWidth = 2;
  roundedRectPath(ctx, FRAME_INSET, FRAME_INSET, CARD_W - FRAME_INSET * 2, CARD_H - FRAME_INSET * 2, RADIUS - 16);
  ctx.stroke();
  ctx.restore();

  ctx.direction = "rtl";
  ctx.textAlign = "center";

  // Game name
  ctx.font = `800 42px "${FONT_DISPLAY}", sans-serif`;
  ctx.fillStyle = CREAM;
  ctx.fillText("بدل الكلمة", CARD_W / 2, 150);

  if (nickname?.trim()) {
    ctx.font = `700 28px "${FONT_UI}", sans-serif`;
    ctx.fillStyle = "rgba(255,255,255,0.8)";
    ctx.fillText(nickname.trim(), CARD_W / 2, 192);
  }

  // Position / status line
  let y = 300;
  ctx.font = `800 56px "${FONT_DISPLAY}", sans-serif`;
  ctx.fillStyle = CREAM;
  if (result.isSolo) {
    ctx.fillText(result.finished ? "🏆 خلصتها!" : `${result.lettersUsed}/${result.totalLetters} حروف`, CARD_W / 2, y);
  } else if (result.position === 1) {
    ctx.fillText(`${medalFor(1)} المركز ${ordinalAr(1)}`, CARD_W / 2, y);
  } else if (result.position) {
    ctx.font = `800 48px "${FONT_DISPLAY}", sans-serif`;
    ctx.fillText(`المركز ${ordinalAr(result.position)}`, CARD_W / 2, y);
  }
  y += 90;

  // Word flow
  const flowMaxWidth = CARD_W - PAD_X * 2;
  y = drawWordFlow(ctx, result.wordFlow, y, flowMaxWidth) + 40;

  // Divider
  ctx.strokeStyle = "rgba(255,255,255,0.25)";
  ctx.beginPath();
  ctx.moveTo(CARD_W / 2 - 100, y);
  ctx.lineTo(CARD_W / 2 + 100, y);
  ctx.stroke();
  y += 60;

  // Stats block
  ctx.font = `700 38px "${FONT_UI}", sans-serif`;
  ctx.fillStyle = CREAM;
  if (result.finished && result.completionSeconds !== null) {
    ctx.fillText(`انتهيت في ${formatDuration(result.completionSeconds)}`, CARD_W / 2, y);
  } else if (!result.isSolo && result.position === 1 && result.completionSeconds !== null) {
    ctx.fillText(`خلصتها في ${formatDuration(result.completionSeconds)}`, CARD_W / 2, y);
  } else {
    ctx.fillText(`استخدمت ${result.lettersUsed}/${result.totalLetters} حرف`, CARD_W / 2, y);
    y += 56;
    ctx.font = `700 34px "${FONT_UI}", sans-serif`;
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    const remainingText = result.remainingLetters.length > 0
      ? `باقي لي: ${result.remainingLetters.join(" ")}`
      : "";
    if (remainingText) ctx.fillText(remainingText, CARD_W / 2, y);
  }

  // Footer branding
  ctx.direction = "ltr";
  ctx.font = `800 40px "${FONT_DISPLAY}", sans-serif`;
  ctx.fillStyle = CREAM;
  ctx.fillText(BRAND_URL, CARD_W / 2, CARD_H - 110);
  ctx.direction = "rtl";
  ctx.font = `700 26px "${FONT_UI}", sans-serif`;
  ctx.fillStyle = "rgba(255,255,255,0.75)";
  ctx.fillText("جرب بدل الكلمة", CARD_W / 2, CARD_H - 62);

  return canvas;
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob failed"))), "image/png");
  });
}

export type ShareResult = "shared" | "downloaded" | "cancelled" | "failed";

export async function shareBidalResultCard(result: BidalResult, nickname?: string): Promise<ShareResult> {
  try {
    const canvas = await renderBidalCardToCanvas(result, nickname);
    const blob = await canvasToBlob(canvas);
    const file = new File([blob], "bagdoonis-bidal-result.png", { type: "image/png" });

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
    a.download = "bagdoonis-bidal-result.png";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
    return "downloaded";
  } catch {
    return "failed";
  }
}
