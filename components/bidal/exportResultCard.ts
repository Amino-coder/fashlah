import { CARD_W, CARD_H, PAD_X, RADIUS, FRAME_INSET, TEAL, CORAL, CREAM, INK, FONT_DISPLAY, FONT_UI, BRAND_URL } from "@/lib/bidal-card";
import { formatDuration, type BidalResult } from "@/lib/bidal-results";
import { honeycombGeometry, honeycombSlotPosition } from "@/components/bidal/Honeycomb";

const GOLD = "#FFD400";

function roundedRectPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** Flat-top hexagon outline, same 6-point proportions as HexTile's CSS
 *  clip-path — (x, y) is the tile's top-left corner, matching how
 *  Honeycomb.tsx positions each slot, so the two stay pixel-consistent. */
function hexPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  ctx.beginPath();
  ctx.moveTo(x + 0.25 * w, y);
  ctx.lineTo(x + 0.75 * w, y);
  ctx.lineTo(x + w, y + 0.5 * h);
  ctx.lineTo(x + 0.75 * w, y + h);
  ctx.lineTo(x + 0.25 * w, y + h);
  ctx.lineTo(x, y + 0.5 * h);
  ctx.closePath();
}

/** The pointy-top hex mark used for the app icon (components/art/GameArt.tsx
 *  BidalArt) — a different orientation from the letter-tile hexes above.
 *  Redrawn here point-for-point from that SVG's path/coordinates rather
 *  than rasterizing the component, so it stays crisp at card resolution
 *  and needs no image loading/CORS handling. */
function drawLogoHex(ctx: CanvasRenderingContext2D, cx: number, cy: number, scale: number, rotationDeg: number, fill: string, letter: string, letterColor: string) {
  const pts: [number, number][] = [[0, -36], [31, -18], [31, 18], [0, 36], [-31, 18], [-31, -18]];
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate((rotationDeg * Math.PI) / 180);
  ctx.scale(scale, scale);
  ctx.beginPath();
  pts.forEach(([px, py], i) => (i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py)));
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.lineWidth = 7;
  ctx.strokeStyle = INK;
  ctx.lineJoin = "round";
  ctx.stroke();
  ctx.font = `800 34px sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = letterColor;
  ctx.fillText(letter, 0, 13);
  ctx.restore();
}

/** The 3-hex ل/د/ب cluster from the app's own game icon, drawn at the
 *  top of the card so the share image is recognizably "بدل الكلمة" at a
 *  glance even before anyone reads the text. */
function drawBidalIcon(ctx: CanvasRenderingContext2D, cx: number, cy: number, scale: number) {
  const toCard = (vx: number, vy: number): [number, number] => [cx + (vx - 100) * scale, cy + (vy - 96) * scale];
  const [lx, ly] = toCard(52, 104);
  const [dx, dy] = toCard(100, 88);
  const [bx, by] = toCard(148, 104);
  drawLogoHex(ctx, lx, ly, scale, -8, CREAM, "ل", INK);
  drawLogoHex(ctx, dx, dy, scale, 0, TEAL, "د", CREAM);
  drawLogoHex(ctx, bx, by, scale, 8, CORAL, "ب", CREAM);
}

/** Draws the exact honeycomb the player was looking at in-game: same
 *  geometry function as the live board (honeycombGeometry/
 *  honeycombSlotPosition, imported straight from Honeycomb.tsx rather
 *  than reimplemented), used letters left as a faint gap in place
 *  instead of being omitted — the card should look like a screenshot of
 *  the board's shape, not a fresh list. */
function drawResultHoneycomb(ctx: CanvasRenderingContext2D, slots: BidalResult["slots"], centerX: number, topY: number, tileSize: number) {
  const geom = honeycombGeometry(tileSize);
  const originX = centerX - geom.width / 2;

  slots.forEach((slot, index) => {
    const { x, y } = honeycombSlotPosition(index, tileSize);
    const left = originX + x;
    const top = topY + y;

    if (slot.used) {
      ctx.save();
      ctx.globalAlpha = 0.16;
      ctx.fillStyle = CREAM;
      hexPath(ctx, left, top, geom.tileW, geom.tileH);
      ctx.fill();
      ctx.restore();
      return;
    }

    hexPath(ctx, left, top, geom.tileW, geom.tileH);
    ctx.fillStyle = INK;
    ctx.fill();

    const pad = geom.tileW * 0.07;
    hexPath(ctx, left + pad, top + pad, geom.tileW - pad * 2, geom.tileH - pad * 2);
    ctx.fillStyle = CREAM;
    ctx.fill();

    ctx.font = `800 ${Math.round(geom.tileW * 0.4)}px "${FONT_DISPLAY}", sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = INK;
    ctx.fillText(slot.letter, left + geom.tileW / 2, top + geom.tileH / 2 + 2);
  });

  ctx.textBaseline = "alphabetic"; // reset — the rest of this file relies on the canvas default
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

export async function renderBidalCardToCanvas(result: BidalResult): Promise<HTMLCanvasElement> {
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

  const iconH = 210;
  const eyebrowH = 100;
  const statusH = 150;
  const flowH = flowLines.length * FLOW_LINE_HEIGHT + 30;
  const dividerH = 90;
  const statsLineH = 100;
  const showHoneycomb = !result.finished && result.slots.length > 0;
  const honeycombTileSize = 130;
  const honeycombGeom = honeycombGeometry(honeycombTileSize);
  const honeycombH = showHoneycomb ? honeycombGeom.height + 36 : 0;
  const footerReserve = 220;

  const totalContentH = iconH + eyebrowH + statusH + flowH + dividerH + statsLineH + honeycombH;
  const topMargin = Math.max(140, (CARD_H - footerReserve - totalContentH) / 2);

  // ---- Pass 2: draw, using the centered starting position ----
  let y = topMargin;
  ctx.textAlign = "center";

  drawBidalIcon(ctx, CARD_W / 2, y + iconH / 2 - 10, 2.0);
  y += iconH;

  ctx.font = `800 46px "${FONT_DISPLAY}", sans-serif`;
  ctx.fillStyle = CREAM;
  ctx.fillText("بدل الكلمة", CARD_W / 2, y);
  y += eyebrowH;

  // Status headline — a plain trophy line when finished, otherwise the
  // score as a percentage in gold with an ink outline so it pops off
  // the teal/coral gradient instead of blending into it like the rest
  // of the cream text.
  if (result.finished) {
    ctx.font = `800 64px "${FONT_DISPLAY}", sans-serif`;
    ctx.fillStyle = CREAM;
    ctx.fillText("🏆 خلصتها!", CARD_W / 2, y);
  } else {
    const pct = ((result.lettersUsed / result.totalLetters) * 100).toFixed(2);
    ctx.font = `800 78px "${FONT_DISPLAY}", sans-serif`;
    ctx.lineWidth = 6;
    ctx.strokeStyle = INK;
    ctx.lineJoin = "round";
    ctx.strokeText(`النتيجة ${pct}%`, CARD_W / 2, y);
    ctx.fillStyle = GOLD;
    ctx.fillText(`النتيجة ${pct}%`, CARD_W / 2, y);
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
  } else {
    ctx.fillText(`📝 استخدمت ${result.lettersUsed} من ${result.totalLetters} حرف`, CARD_W / 2, y);
  }
  y += statsLineH;

  if (showHoneycomb) {
    drawResultHoneycomb(ctx, result.slots, CARD_W / 2, y, honeycombTileSize);
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

export async function shareBidalResultCard(result: BidalResult): Promise<ShareResult> {
  try {
    const canvas = await renderBidalCardToCanvas(result);
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
