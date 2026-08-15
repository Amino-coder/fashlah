const CARD_W = 1080;
const CARD_H = 1920;
const RADIUS = 56;
const PAD_X = Math.round(CARD_W * 0.1);
const FRAME_INSET = 36;
const ROSE = "#E63946";
const WINE = "#C2185B";
const CREAM = "#FFF9F0";
const INK = "#17122B";
const FONT_DISPLAY = "Baloo Bhaijaan 2";
const FONT_UI = "Tajawal";

export type MareedSoloConversationBeat = { question: string; answer: string };

function roundedRectPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** Same asymmetric-corner shape as the app's chat bubbles (borderRadius
 *  18, one corner flattened to 4 on the side that "points" at its
 *  sender) — `flatCorner` picks which bottom corner gets flattened, so
 *  question bubbles (bottom-left) and answer bubbles (bottom-right)
 *  read as the same two-way conversation shape used everywhere else in
 *  the app (see ConversationReveal / FinalConversation). */
function bubblePath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, radius: number, flatCorner: "bl" | "br") {
  const flat = radius * 0.22;
  const brR = flatCorner === "br" ? flat : radius;
  const blR = flatCorner === "bl" ? flat : radius;
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.arcTo(x + w, y, x + w, y + radius, radius);
  ctx.lineTo(x + w, y + h - brR);
  ctx.arcTo(x + w, y + h, x + w - brR, y + h, brR);
  ctx.lineTo(x + blR, y + h);
  ctx.arcTo(x, y + h, x, y + h - blR, blR);
  ctx.lineTo(x, y + radius);
  ctx.arcTo(x, y, x + radius, y, radius);
  ctx.closePath();
}

async function ensureFonts() {
  if (typeof document === "undefined" || !("fonts" in document)) return;
  try {
    await Promise.all([document.fonts.load(`800 70px "${FONT_DISPLAY}"`), document.fonts.load(`700 34px "${FONT_UI}"`)]);
    await document.fonts.ready;
  } catch { /* fallback face beats no card */ }
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

const BUBBLE_FONT = `700 34px "${FONT_UI}", sans-serif`;
const BUBBLE_PAD_X = 34;
const BUBBLE_PAD_Y = 26;
const BUBBLE_LINE_H = 46;
const BUBBLE_RADIUS = 40;
const BUBBLE_MAX_W = 660;
const BUBBLE_GAP = 16;      // between question and its answer
const PAIR_GAP = 26;        // between one Q&A pair and the next
const SIDE_MARGIN = 96;     // how close a bubble can get to the card edge

type MeasuredBubble = { lines: string[]; width: number; height: number };

function measureBubble(ctx: CanvasRenderingContext2D, text: string): MeasuredBubble {
  ctx.font = BUBBLE_FONT;
  const maxTextWidth = BUBBLE_MAX_W - BUBBLE_PAD_X * 2;
  const lines = wrapText(ctx, text, maxTextWidth);
  const textWidth = Math.min(maxTextWidth, Math.max(...lines.map((l) => ctx.measureText(l).width)));
  return {
    lines,
    width: Math.min(BUBBLE_MAX_W, textWidth + BUBBLE_PAD_X * 2),
    height: lines.length * BUBBLE_LINE_H + BUBBLE_PAD_Y * 2,
  };
}

/** side: "left" = question (from the character), "right" = answer (from
 *  the player) — mirrors ConversationReveal's fromMe flag exactly:
 *  right-aligned + gradient fill for the player's own line, left-aligned
 *  + flat card-toned fill for the other side. */
function drawBubble(ctx: CanvasRenderingContext2D, bubble: MeasuredBubble, side: "left" | "right", y: number) {
  const x = side === "left" ? SIDE_MARGIN : CARD_W - SIDE_MARGIN - bubble.width;
  bubblePath(ctx, x, y, bubble.width, bubble.height, BUBBLE_RADIUS, side === "left" ? "bl" : "br");

  if (side === "left") {
    ctx.fillStyle = "rgba(255,255,255,0.14)";
    ctx.fill();
    ctx.save();
    ctx.strokeStyle = "rgba(255,255,255,0.4)";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
  } else {
    ctx.fillStyle = CREAM;
    ctx.fill();
  }

  ctx.font = BUBBLE_FONT;
  ctx.textAlign = "right";
  ctx.fillStyle = side === "left" ? CREAM : INK;
  const textRight = x + bubble.width - BUBBLE_PAD_X;
  let ty = y + BUBBLE_PAD_Y + 26;
  for (const line of bubble.lines) {
    ctx.fillText(line, textRight, ty);
    ty += BUBBLE_LINE_H;
  }
}

export async function renderMareedSoloCard(
  diagnosed: boolean, luckyCount: number, maxLucky: number, conversation: MareedSoloConversationBeat[]
): Promise<HTMLCanvasElement> {
  await ensureFonts();
  const canvas = document.createElement("canvas");
  canvas.width = CARD_W;
  canvas.height = CARD_H;
  const ctx = canvas.getContext("2d")!;
  ctx.direction = "rtl";
  ctx.textAlign = "center";

  const grad = ctx.createLinearGradient(0, 0, CARD_W, CARD_H);
  grad.addColorStop(0, ROSE);
  grad.addColorStop(1, WINE);
  ctx.fillStyle = grad;
  roundedRectPath(ctx, 0, 0, CARD_W, CARD_H, RADIUS);
  ctx.fill();

  ctx.save();
  ctx.strokeStyle = "rgba(255,255,255,0.35)";
  ctx.lineWidth = 2;
  roundedRectPath(ctx, FRAME_INSET, FRAME_INSET, CARD_W - FRAME_INSET * 2, CARD_H - FRAME_INSET * 2, RADIUS - 16);
  ctx.stroke();
  ctx.restore();

  // ---- Pass 1: measure everything — verdict block, then every bubble in
  // the conversation — before drawing anything, so the whole thing can be
  // centered as one block instead of pinned to the top. ----
  ctx.font = `800 52px "${FONT_DISPLAY}", sans-serif`;
  const titleText = diagnosed ? "مبروك! رسمياً عندك مرض نفسي 🎉" : "ما طلع عندك شي... هالمرة 🥲";
  const titleLines = wrapText(ctx, titleText, CARD_W - PAD_X * 2);

  const emojiH = 170;
  const titleH = titleLines.length * 66 + 16;
  const subH = 60;
  const dividerH = 60;
  const labelH = conversation.length > 0 ? 66 : 0;

  const measured = conversation.map((beat) => ({
    q: measureBubble(ctx, beat.question),
    a: measureBubble(ctx, beat.answer),
  }));
  const conversationH = measured.reduce(
    (sum, { q, a }) => sum + q.height + BUBBLE_GAP + a.height + PAIR_GAP,
    0
  );

  const footerReserve = 220;
  const totalH = emojiH + titleH + subH + dividerH + labelH + conversationH;
  const topMargin = Math.max(130, (CARD_H - footerReserve - totalH) / 2);

  // ---- Pass 2: draw ----
  let y = topMargin;
  ctx.textAlign = "center";
  ctx.font = `140px sans-serif`;
  ctx.fillText(diagnosed ? "🧠" : "😅", CARD_W / 2, y + 50);
  y += emojiH;

  ctx.font = `800 52px "${FONT_DISPLAY}", sans-serif`;
  ctx.fillStyle = CREAM;
  for (const line of titleLines) { ctx.fillText(line, CARD_W / 2, y); y += 66; }
  y += 8;

  ctx.font = `700 34px "${FONT_UI}", sans-serif`;
  ctx.fillStyle = "rgba(255,255,255,0.9)";
  ctx.fillText(`طلعت عندك ${luckyCount}/${maxLucky} من علامات الجنون 🧠`, CARD_W / 2, y);
  y += subH;

  if (conversation.length > 0) {
    ctx.strokeStyle = "rgba(255,255,255,0.3)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(CARD_W / 2 - 120, y);
    ctx.lineTo(CARD_W / 2 + 120, y);
    ctx.stroke();
    y += 46;

    ctx.font = `800 30px "${FONT_UI}", sans-serif`;
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.fillText("المحادثة", CARD_W / 2, y);
    y += labelH;

    for (const { q, a } of measured) {
      drawBubble(ctx, q, "left", y);
      y += q.height + BUBBLE_GAP;
      drawBubble(ctx, a, "right", y);
      y += a.height + PAIR_GAP;
    }
  }

  ctx.textAlign = "center";
  ctx.direction = "ltr";
  ctx.font = `800 42px "${FONT_DISPLAY}", sans-serif`;
  ctx.fillStyle = CREAM;
  ctx.fillText("bagdoonis.app", CARD_W / 2, CARD_H - 110);
  ctx.direction = "rtl";
  ctx.font = `700 28px "${FONT_UI}", sans-serif`;
  ctx.fillStyle = "rgba(255,255,255,0.75)";
  ctx.fillText("🎉 جرب مريض نفسي", CARD_W / 2, CARD_H - 62);

  return canvas;
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob failed"))), "image/png");
  });
}

export async function shareMareedSoloCard(
  diagnosed: boolean, luckyCount: number, maxLucky: number, conversation: MareedSoloConversationBeat[]
): Promise<"shared" | "downloaded" | "cancelled" | "failed"> {
  try {
    const canvas = await renderMareedSoloCard(diagnosed, luckyCount, maxLucky, conversation);
    const blob = await canvasToBlob(canvas);
    const file = new File([blob], "bagdoonis-mareed-solo.png", { type: "image/png" });

    if (typeof navigator !== "undefined" && navigator.canShare?.({ files: [file] })) {
      try { await navigator.share({ files: [file] }); return "shared"; }
      catch (err) { if (err instanceof Error && err.name === "AbortError") return "cancelled"; }
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "bagdoonis-mareed-solo.png";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
    return "downloaded";
  } catch {
    return "failed";
  }
}
