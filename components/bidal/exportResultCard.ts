import { CARD_W, CARD_H, PAD_X, RADIUS, FRAME_INSET, TEAL, CORAL, CREAM, FONT_DISPLAY, FONT_UI, BRAND_URL } from "@/lib/bidal-card";
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

const WORD_FONT = `800 58px "${FONT_DISPLAY}", sans-serif`;
const ARROW_FONT = `700 38px "${FONT_UI}", sans-serif`;
const FLOW_LINE_HEIGHT = 84;
const ARROW = "  ←  ";

/** Splits the word flow into wrapped lines WITHOUT drawing anything —
 *  used first to measure total height for centering, then reused by the
 *  actual draw pass so the two can never disagree with each other. */
function layoutWordFlow(ctx: CanvasRenderingContext2D, words: string[], maxWidth: number): string[][] {
  const lines: string[][] = [];
  let current: string[] = [];
  let currentWidth = 0;

  words.forEach((word, i) => {
    ctx.font = WORD_FONT;
    const wordWidth = ctx.measureText(word).width;
    ctx.font = ARROW_FONT;
    const arrowWidth = i < words.length - 1 ? ctx.measureText(ARROW).width : 0;
    const segmentWidth = wordWidth + arrowWidth;

    if (currentWidth + segmentWidth > maxWidth && current.length > 0) {
      lines.push(current);
      current = [];
      currentWidth = 0;
    }
    current.push(word);
    currentWidth += segmentWidth;
  });
  if (current.length > 0) lines.push(current);
  return lines;
}

function drawWordFlowLines(ctx: CanvasRenderingContext2D, lines: string[][], allWords: string[], startY: number): number {
  let y = startY;
  let globalIndex = 0;

  for (const line of lines) {
    let x = CARD_W / 2;
    // measure the line's total width first so we can center it as a unit
    let lineWidth = 0;
    line.forEach((word, i) => {
      ctx.font = WORD_FONT;
      lineWidth += ctx.measureText(word).width;
      const isLastInLine = i === line.length - 1;
      const isLastOverall = globalIndex + i === allWords.length - 1;
      if (!isLastInLine || !isLastOverall) { ctx.font = ARROW_FONT; lineWidth += ctx.measureText(ARROW).width; }
    });

    x = CARD_W / 2 + lineWidth / 2; // rightmost edge of this line (RTL)
    ctx.textAlign = "right";

    line.forEach((word, i) => {
      ctx.font = WORD_FONT;
      ctx.fillStyle = CREAM;
      ctx.fillText(word, x, y);
      x -= ctx.measureText(word).width;

      const isLastOverall = globalIndex === allWords.length - 1;
      if (!isLastOverall) {
        ctx.font = ARROW_FONT;
        ctx.fillStyle = "rgba(255,255,255,0.65)";
        ctx.fillText(ARROW, x, y);
        x -= ctx.measureText(ARROW).width;
      }
      globalIndex++;
    });

    y += FLOW_LINE_HEIGHT;
  }
  return y;
}

export async function renderBidalCardToCanvas(result: BidalResult, nickname?: string): Promise<HTMLCanvasElement> {
  await ensureFonts();

  const canvas = document.createElement("canvas");
  canvas.width = CARD_W;
  canvas.height = CARD_H;
  const ctx = canvas.getContext("2d")!;
  ctx.direction = "rtl";

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

  // ---- Pass 1: measure everything before drawing anything, so the
  // whole content block can be vertically centered on the card instead
  // of pinned to the top with empty space below it. ----
  const flowMaxWidth = CARD_W - PAD_X * 2;
  const flowLines = layoutWordFlow(ctx, result.wordFlow, flowMaxWidth);

  const eyebrowH = 100;
  const nicknameH = nickname?.trim() ? 60 : 0;
  const statusH = 130;
  const flowH = flowLines.length * FLOW_LINE_HEIGHT + 30;
  const dividerH = 90;
  const statsH = (result.finished || (!result.isSolo && result.position === 1)) ? 90 : (result.remainingLetters.length > 0 ? 190 : 100);
  const footerReserve = 220;

  const totalContentH = eyebrowH + nicknameH + statusH + flowH + dividerH + statsH;
  const topMargin = Math.max(140, (CARD_H - footerReserve - totalContentH) / 2);

  // ---- Pass 2: draw, using the centered starting position ----
  let y = topMargin;
  ctx.textAlign = "center";

  ctx.font = `800 46px "${FONT_DISPLAY}", sans-serif`;
  ctx.fillStyle = CREAM;
  ctx.fillText("🔤 بدل الكلمة", CARD_W / 2, y);
  y += eyebrowH;

  if (nickname?.trim()) {
    ctx.font = `700 32px "${FONT_UI}", sans-serif`;
    ctx.fillStyle = "rgba(255,255,255,0.8)";
    ctx.fillText(nickname.trim(), CARD_W / 2, y);
    y += nicknameH;
  }

  ctx.fillStyle = CREAM;
  if (result.isSolo) {
    ctx.font = `800 64px "${FONT_DISPLAY}", sans-serif`;
    ctx.fillText(result.finished ? "🏆 خلصتها!" : `${result.lettersUsed}/${result.totalLetters} حروف 🔤`, CARD_W / 2, y);
  } else if (result.position === 1) {
    ctx.font = `800 64px "${FONT_DISPLAY}", sans-serif`;
    ctx.fillText(`${medalFor(1)} المركز الأول`, CARD_W / 2, y);
  } else if (result.position) {
    ctx.font = `800 56px "${FONT_DISPLAY}", sans-serif`;
    const medal = medalFor(result.position);
    ctx.fillText(`${medal ? medal + " " : "🎮 "}المركز ${ordinalAr(result.position)}`, CARD_W / 2, y);
  }
  y += statusH;

  y = drawWordFlowLines(ctx, flowLines, result.wordFlow, y) + 30;
  ctx.textAlign = "center"; // drawWordFlowLines sets "right" for its own manual positioning and never resets it — without this, every line drawn after (divider, stats, footer) would inherit that

  ctx.strokeStyle = "rgba(255,255,255,0.3)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(CARD_W / 2 - 120, y);
  ctx.lineTo(CARD_W / 2 + 120, y);
  ctx.stroke();
  y += 70;

  ctx.font = `700 44px "${FONT_UI}", sans-serif`;
  ctx.fillStyle = CREAM;
  if (result.finished && result.completionSeconds !== null) {
    ctx.fillText(`⏱️ انتهيت في ${formatDuration(result.completionSeconds)}`, CARD_W / 2, y);
  } else if (!result.isSolo && result.position === 1 && result.completionSeconds !== null) {
    ctx.fillText(`⏱️ خلصتها في ${formatDuration(result.completionSeconds)}`, CARD_W / 2, y);
  } else {
    ctx.fillText(`📝 استخدمت ${result.lettersUsed}/${result.totalLetters} حرف`, CARD_W / 2, y);
    if (result.remainingLetters.length > 0) {
      y += 66;
      ctx.font = `800 46px "${FONT_DISPLAY}", sans-serif`;
      ctx.fillText(`🔠 باقي لي: ${result.remainingLetters.join(" ")}`, CARD_W / 2, y);
    }
  }

  // Footer branding — fixed near the bottom regardless of content length
  ctx.direction = "ltr";
  ctx.font = `800 42px "${FONT_DISPLAY}", sans-serif`;
  ctx.fillStyle = CREAM;
  ctx.fillText(BRAND_URL, CARD_W / 2, CARD_H - 110);
  ctx.direction = "rtl";
  ctx.font = `700 28px "${FONT_UI}", sans-serif`;
  ctx.fillStyle = "rgba(255,255,255,0.75)";
  ctx.fillText("🎉 جرب بدل الكلمة", CARD_W / 2, CARD_H - 62);

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
