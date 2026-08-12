const CARD_W = 1080;
const CARD_H = 1920;
const RADIUS = 56;
const PAD_X = Math.round(CARD_W * 0.1);
const FRAME_INSET = 36;
const ROSE = "#E63946";
const WINE = "#C2185B";
const CREAM = "#FFF9F0";
const FONT_DISPLAY = "Baloo Bhaijaan 2";
const FONT_UI = "Tajawal";

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

export async function renderShofahSoloCard(married: boolean, luckyCount: number, maxLucky: number): Promise<HTMLCanvasElement> {
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

  // Two-pass: measure first, then draw a vertically centered block.
  ctx.font = `800 60px "${FONT_DISPLAY}", sans-serif`;
  const titleText = married ? "مبروك! انكتب لك نصيب 🎉" : "ما انكتب نصيب... بعدها 😅";
  const titleLines = wrapText(ctx, titleText, CARD_W - PAD_X * 2);

  const eyebrowH = 90;
  const emojiH = 220;
  const titleH = titleLines.length * 76 + 20;
  const subH = 70;
  const footerReserve = 220;
  const totalH = eyebrowH + emojiH + titleH + subH;
  const topMargin = Math.max(140, (CARD_H - footerReserve - totalH) / 2);

  let y = topMargin;
  ctx.font = `800 44px "${FONT_DISPLAY}", sans-serif`;
  ctx.fillStyle = CREAM;
  ctx.fillText("💍 أبي أتزوج — العب لحالك", CARD_W / 2, y);
  y += eyebrowH;

  ctx.font = `160px sans-serif`;
  ctx.fillText(married ? "💍" : "😅", CARD_W / 2, y + 60);
  y += emojiH;

  ctx.font = `800 60px "${FONT_DISPLAY}", sans-serif`;
  ctx.fillStyle = CREAM;
  for (const line of titleLines) { ctx.fillText(line, CARD_W / 2, y); y += 76; }
  y += 20;

  ctx.font = `700 38px "${FONT_UI}", sans-serif`;
  ctx.fillStyle = "rgba(255,255,255,0.9)";
  ctx.fillText(`الحظ وقف معك بـ ${luckyCount}/${maxLucky} من علامات اليوم`, CARD_W / 2, y);

  ctx.direction = "ltr";
  ctx.font = `800 42px "${FONT_DISPLAY}", sans-serif`;
  ctx.fillStyle = CREAM;
  ctx.fillText("bagdoonis.app", CARD_W / 2, CARD_H - 110);
  ctx.direction = "rtl";
  ctx.font = `700 28px "${FONT_UI}", sans-serif`;
  ctx.fillStyle = "rgba(255,255,255,0.75)";
  ctx.fillText("🎉 جرب أبي أتزوج", CARD_W / 2, CARD_H - 62);

  return canvas;
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob failed"))), "image/png");
  });
}

export async function shareShofahSoloCard(married: boolean, luckyCount: number, maxLucky: number): Promise<"shared" | "downloaded" | "cancelled" | "failed"> {
  try {
    const canvas = await renderShofahSoloCard(married, luckyCount, maxLucky);
    const blob = await canvasToBlob(canvas);
    const file = new File([blob], "bagdoonis-shofah-solo.png", { type: "image/png" });

    if (typeof navigator !== "undefined" && navigator.canShare?.({ files: [file] })) {
      try { await navigator.share({ files: [file] }); return "shared"; }
      catch (err) { if (err instanceof Error && err.name === "AbortError") return "cancelled"; }
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "bagdoonis-shofah-solo.png";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
    return "downloaded";
  } catch {
    return "failed";
  }
}
