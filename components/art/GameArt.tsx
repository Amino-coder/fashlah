/**
 * Home-page game tiles — object-led illustrations rather than characters.
 *
 * Each tile is a full-bleed brand-colour square with a simple, playful
 * motif sitting slightly off-axis, plus a little confetti behind it.
 */

const PINK = "#FF2E93";
const PURPLE = "#7C3AED";
const MINT = "#2EE6A6";
const YELLOW = "#FFD400";
const INK = "#17122B";
const CREAM = "#FFFDF7";
const GOLD = "#F2B705";

type P = { size?: number };

/** Tile backed by a supplied image file, filling the square edge to edge. */
function ImageTile({ src, alt }: { src: string; alt: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      style={{ display: "block", width: "100%", height: "100%", objectFit: "cover" }}
    />
  );
}

function Sp({ x, y, s = 8, f = CREAM, o = 1 }: { x: number; y: number; s?: number; f?: string; o?: number }) {
  return (
    <path
      d={`M ${x} ${y - s} Q ${x + s * 0.22} ${y - s * 0.22} ${x + s} ${y} Q ${x + s * 0.22} ${y + s * 0.22} ${x} ${y + s} Q ${x - s * 0.22} ${y + s * 0.22} ${x - s} ${y} Q ${x - s * 0.22} ${y - s * 0.22} ${x} ${y - s} Z`}
      fill={f}
      opacity={o}
    />
  );
}

/** Confetti layer shared by every tile. */
function Confetti({ a = YELLOW, b = CREAM }: { a?: string; b?: string }) {
  return (
    <g>
      <circle cx="26" cy="30" r="5" fill={b} opacity=".55" />
      <circle cx="176" cy="42" r="4" fill={a} />
      <circle cx="30" cy="164" r="4.5" fill={a} opacity=".9" />
      <Sp x={170} y={166} s={8} f={b} o={0.8} />
      <Sp x={100} y={22} s={6} f={b} o={0.7} />
    </g>
  );
}

function Tile({ bg, children }: { bg: string; children: React.ReactNode }) {
  return (
    <svg viewBox="0 0 200 200" style={{ display: "block", width: "100%", height: "100%" }} aria-hidden="true">
      <rect width="200" height="200" fill={bg} />
      {children}
    </svg>
  );
}

/* ─── فشلة — three laughing parsley buddies, middle one in front ─── */
export function FashlahArt({ size = 120 }: P) {
  return <ImageTile src="/game-icons/fashlah.jpg" alt="" />;
}

/* ─── أبي أتزوج — ring overlapping a heart ─── */
export function ShofahArt({ size = 120 }: P) {
  return <ImageTile src="/game-icons/shofah.jpg" alt="" />;
}

/* ─── مين بيتوظف — briefcase overlapping papers ─── */
export function JobArt({ size = 120 }: P) {
  return (
    <Tile bg={MINT}>
      <Confetti a={PINK} />
      {/* fanned papers behind */}
      <g>
        <rect x="58" y="42" width="70" height="90" rx="7" fill={CREAM} stroke={INK} strokeWidth="3.4" transform="rotate(-15 100 90)" />
        <rect x="66" y="40" width="70" height="90" rx="7" fill={CREAM} stroke={INK} strokeWidth="3.4" transform="rotate(-5 100 90)" />
        <g transform="rotate(-5 100 90)" opacity=".4">
          <path d="M 78 62 h 46 M 78 76 h 34 M 78 90 h 42" stroke={INK} strokeWidth="4" strokeLinecap="round" />
        </g>
      </g>
      {/* briefcase in front, tilted */}
      <g transform="rotate(7 104 136)">
        <path d="M 86 96 q 0 -12 18 -12 q 18 0 18 12" fill="none" stroke={INK} strokeWidth="6" strokeLinecap="round" />
        <rect x="52" y="100" width="104" height="66" rx="12" fill={PURPLE} stroke={INK} strokeWidth="4" />
        <rect x="52" y="122" width="104" height="13" fill={INK} opacity=".22" />
        <rect x="94" y="120" width="20" height="17" rx="4" fill={YELLOW} stroke={INK} strokeWidth="3.2" />
      </g>
      <Sp x={44} y={62} s={9} f={CREAM} o={0.9} />
    </Tile>
  );
}

/* ─── كمل القصيدة — a feather quill dipped in an inkwell ─── */
const CARD_NAVY = "#1B3A55";
const CARD_GOLD = "#D9A441";
const CARD_CREAM = "#FBF6E9";
const CARD_INK = "#0A1526";

export function QaseedaArt({ size = 120 }: P) {
  return (
    <Tile bg={CARD_NAVY}>
      <Sp x={28} y={32} s={7} f={CARD_GOLD} o={0.8} />
      <Sp x={178} y={54} s={6} f={CARD_GOLD} o={0.6} />
      <circle cx="30" cy="168" r="4" fill={CARD_GOLD} opacity=".7" />

      {/* inkwell */}
      <g>
        <path
          d="M 46 152 Q 46 140 58 140 L 84 140 Q 96 140 96 152 L 96 176 Q 96 186 84 186 L 58 186 Q 46 186 46 176 Z"
          fill={CARD_CREAM} stroke={CARD_GOLD} strokeWidth="3"
        />
        <ellipse cx="71" cy="140" rx="21" ry="7" fill={CARD_INK} />
        <ellipse cx="71" cy="140" rx="21" ry="7" fill="none" stroke={CARD_GOLD} strokeWidth="2.4" />
        <ellipse cx="58" cy="153" rx="5.5" ry="15" fill="#FFFFFF" opacity=".16" transform="rotate(-12 58 153)" />
      </g>

      {/* quill feather, nib dipping toward the ink */}
      <g>
        <path d="M 72 136 L 64 150 L 76 140 Z" fill={CARD_GOLD} />
        <path
          d="M 74 138 Q 84 62 158 42 Q 128 101 74 138 Z"
          fill={CARD_CREAM} stroke={CARD_GOLD} strokeWidth="3" strokeLinejoin="round"
        />
        <path d="M 74 138 Q 107 82 158 42" fill="none" stroke={CARD_GOLD} strokeWidth="2.2" opacity=".55" strokeLinecap="round" />
        <path d="M 99 109 L 92 96 M 116 90 L 109 77 M 133 71 L 126 58" stroke={CARD_GOLD} strokeWidth="2" opacity=".4" strokeLinecap="round" />
        <path d="M 118 80 Q 130 66 149 51" stroke="#FFFFFF" strokeWidth="1.6" opacity=".22" strokeLinecap="round" fill="none" />
      </g>
    </Tile>
  );
}

/* ─── عبارات — the fanned cards (unchanged) ─── */
export function IbaratArt({ size = 120 }: P) {
  return (
    <Tile bg={YELLOW}>
      <circle cx="28" cy="38" r="5" fill={PINK} />
      <circle cx="172" cy="48" r="4.5" fill={PURPLE} />
      <Sp x={168} y={162} s={8} f={CREAM} />
      <Sp x={100} y={24} s={7} f={CREAM} o={0.8} />
      <rect x="52" y="52" width="66" height="94" rx="12" fill={PURPLE} transform="rotate(-14 100 100)" />
      <rect x="62" y="50" width="66" height="94" rx="12" fill={MINT} transform="rotate(-4 100 100)" />
      <rect x="68" y="48" width="66" height="96" rx="12" fill={CREAM} transform="rotate(8 100 100)" />
      <g transform="rotate(8 100 100)">
        <Sp x={101} y={82} s={19} f={PINK} />
        <path d="M 78 116 h 46 M 86 130 h 30" stroke={INK} strokeWidth="5" strokeLinecap="round" opacity=".22" />
      </g>
    </Tile>
  );
}
