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

/* ─── وش شخصيتك — uploaded brain+gears icon ─── */
export function WadakArt({ size = 120 }: P) {
  return (
    <div style={{ width: "100%", height: "100%", position: "relative", lineHeight: 0 }}>
      <img
        src="/game-icons/wadak.jpg"
        alt=""
        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
      />
    </div>
  );
}

/* ─── بدل الكلمة — two hex letter tiles swapping ─── */
export function BidalArt({ size = 120 }: P) {
  const ORANGE = "#FF8A3D";
  const CORAL = "#FF5A5F";
  const TEAL = "#14B8A6";
  // Centered at its own local (0,0) so translate/rotate never fight a
  // scale-from-origin pivot the way the previous version did.
  const hex = "M0 -36 L31 -18 L31 18 L0 36 L-31 18 L-31 -18 Z";
  return (
    <Tile bg={ORANGE}>
      <Confetti a={CORAL} b={CREAM} />
      {/* ل — leftmost, since Arabic reads right-to-left: ب (right) د (center) ل (left) */}
      <g transform="translate(52 104) rotate(-8)">
        <path d={hex} fill={CREAM} stroke={INK} strokeWidth="7" strokeLinejoin="round" />
        <text x="0" y="13" textAnchor="middle" fontSize="34" fontWeight="800" fill={INK} fontFamily="sans-serif">ل</text>
      </g>
      <g transform="translate(100 88)">
        <path d={hex} fill={TEAL} stroke={INK} strokeWidth="7" strokeLinejoin="round" />
        <text x="0" y="13" textAnchor="middle" fontSize="34" fontWeight="800" fill={CREAM} fontFamily="sans-serif">د</text>
      </g>
      <g transform="translate(148 104) rotate(8)">
        <path d={hex} fill={CORAL} stroke={INK} strokeWidth="7" strokeLinejoin="round" />
        <text x="0" y="13" textAnchor="middle" fontSize="34" fontWeight="800" fill={CREAM} fontFamily="sans-serif">ب</text>
      </g>
    </Tile>
  );
}

/* ─── الِّفوا أغنية — a music note with a growing sound-wave tail ─── */
export function LifooArt({ size = 120 }: P) {
  const BABY_BLUE = "#8ECAE6";
  const CORAL = "#FF5A5F";
  return (
    <Tile bg={BABY_BLUE}>
      <Confetti a={CORAL} b={CREAM} />
      {/* the music emoji itself, rendered directly as the tile's motif */}
      <text x="100" y="122" textAnchor="middle" fontSize="92" fontFamily="sans-serif">
        🎶
      </text>
    </Tile>
  );
}

/* ─── إنسان حيوان جماد — a letter card with the 3 core category marks ─── */
export function IhjArt({ size = 120 }: P) {
  const PURPLE = "#7C3AED";
  const PINK = "#FF2E93";
  return (
    <Tile bg={PURPLE}>
      <Confetti a={PINK} b={CREAM} />
      <g transform="translate(0 -4)">
        <rect x="62" y="46" width="76" height="92" rx="16" fill={CREAM} stroke={INK} strokeWidth="6" transform="rotate(-4 100 92)" />
        <text x="100" y="106" textAnchor="middle" fontSize="46" fontWeight="800" fill={INK} fontFamily="sans-serif" transform="rotate(-4 100 92)">؟</text>
      </g>
      {/* person */}
      <g transform="translate(46 150)">
        <circle r="14" fill={PINK} stroke={INK} strokeWidth="4" />
        <circle cy="-3" r="4.5" fill={CREAM} />
        <path d="M-6 5 Q0 10 6 5" stroke={CREAM} strokeWidth="2.4" fill="none" strokeLinecap="round" />
      </g>
      {/* paw */}
      <g transform="translate(100 158)">
        <circle r="13" fill="#2EE6A6" stroke={INK} strokeWidth="4" />
        <circle cx="-5" cy="-4" r="2.6" fill={INK} opacity=".8" />
        <circle cx="5" cy="-4" r="2.6" fill={INK} opacity=".8" />
        <circle cy="4" r="3.4" fill={INK} opacity=".8" />
      </g>
      {/* leaf */}
      <g transform="translate(154 150)">
        <circle r="14" fill="#FFD400" stroke={INK} strokeWidth="4" />
        <path d="M-5 6 Q-5 -6 6 -6 Q6 6 -5 6 Z" fill={INK} opacity=".75" />
      </g>
    </Tile>
  );
}

/* ─── مريض نفسي — a dizzy, cross-eyed head with racing thoughts above it ─── */
export function MareedArt({ size = 120 }: P) {
  const ROSE = "#FF2E93";
  const WINE = "#7C3AED";
  return (
    <Tile bg={WINE}>
      <Confetti a={ROSE} b={CREAM} />
      {/* dizzy head, off-axis like the other tiles' motifs */}
      <g transform="translate(100 112) rotate(-4)">
        <circle cx="0" cy="0" r="46" fill={CREAM} stroke={INK} strokeWidth="6" />
        {/* dizzy spiral eyes */}
        <path d="M -22 -6 q 5 -9 11 -1 q 5 8 -3 9 q -8 1 -8 -8" fill="none" stroke={INK} strokeWidth="4.5" strokeLinecap="round" />
        <path d="M 11 -6 q 5 -9 11 -1 q 5 8 -3 9 q -8 1 -8 -8" fill="none" stroke={INK} strokeWidth="4.5" strokeLinecap="round" />
        {/* wavy confused mouth */}
        <path d="M -16 22 q 8 10 16 0 q 8 -10 16 0" fill="none" stroke={INK} strokeWidth="5" strokeLinecap="round" />
      </g>
      {/* racing-thoughts swirl above the head, echoing "scrambled brain" */}
      <g transform="translate(102 42)">
        <path d="M -28 8 q 8 -20 28 -12 q 20 8 10 22 q -10 12 -24 4" fill="none" stroke={ROSE} strokeWidth="7" strokeLinecap="round" />
      </g>
    </Tile>
  );
}

