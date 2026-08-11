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

/* ─── كمل القصيدة — scroll and quill ─── */
export function QaseedaArt({ size = 120 }: P) {
  return <ImageTile src="/game-icons/qaseeda.jpg" alt="" />;
}

/* ─── كمل القصة — open book with a relay arrow ─── */
export function QissaArt({ size = 120 }: P) {
  return <ImageTile src="/game-icons/qissa.jpg" alt="" />;
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

/* ─── وش شخصيتك — a bold cartoon brain ─── */
export function WadakArt({ size = 120 }: P) {
  const TEAL = "#14B8A6";
  const INDIGO = "#4C1D95";
  return (
    <Tile bg={TEAL}>
      <Confetti a={INDIGO} b={CREAM} />
      <g transform="rotate(-4 100 100)">
        <path
          d="M 100 44
             C 78 44 66 56 64 70
             C 48 72 38 84 40 98
             C 30 102 26 116 34 126
             C 32 140 44 152 60 150
             C 64 158 76 162 86 156
             C 90 160 110 160 114 156
             C 124 162 136 158 140 150
             C 156 152 168 140 166 126
             C 174 116 170 102 160 98
             C 162 84 152 72 136 70
             C 134 56 122 44 100 44 Z"
          fill={CREAM} stroke={INK} strokeWidth="6" strokeLinejoin="round"
        />
        <path
          d="M 100 50 V 152 M 64 70 Q 78 80 76 96 Q 90 104 84 118 Q 96 122 92 138
             M 136 70 Q 122 80 124 96 Q 110 104 116 118 Q 104 122 108 138"
          fill="none" stroke={INDIGO} strokeWidth="5" strokeLinecap="round" opacity=".55"
        />
      </g>
    </Tile>
  );
}
