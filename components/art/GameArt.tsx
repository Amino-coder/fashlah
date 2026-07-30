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
function Buddy({ x, y, s, body, rot }: { x: number; y: number; s: number; body: string; rot: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
      {/* leaf sprig */}
      <path d="M 0 -46 q 3 -13 14 -17 q 1 12 -10 18 Z" fill={MINT} />
      <path d="M 0 -46 q -3 -13 -14 -17 q -1 12 10 18 Z" fill="#25C48D" />
      <path d="M 0 -32 v -16" stroke="#1E9E73" strokeWidth="4" strokeLinecap="round" />
      {/* body */}
      <ellipse cx="0" cy="0" rx="40" ry="37" fill={body} />
      {/* laughing eyes */}
      <path d="M -20 -8 q 7 -9 14 0" stroke={INK} strokeWidth="4.5" fill="none" strokeLinecap="round" />
      <path d="M 6 -8 q 7 -9 14 0" stroke={INK} strokeWidth="4.5" fill="none" strokeLinecap="round" />
      {/* open laugh */}
      <path d="M -15 8 q 15 22 30 0 q -15 7 -30 0 Z" fill={INK} />
      <path d="M -9 13 q 9 12 18 0 q -9 4 -18 0 Z" fill="#FF6B8E" />
      {/* blush */}
      <ellipse cx="-29" cy="6" rx="7" ry="4.5" fill={PINK} opacity=".45" />
      <ellipse cx="29" cy="6" rx="7" ry="4.5" fill={PINK} opacity=".45" />
    </g>
  );
}

export function FashlahArt({ size = 120 }: P) {
  return (
    <Tile bg={PINK}>
      <Confetti />
      {/* sides first so the middle one lands in front */}
      <Buddy x={54} y={118} s={0.78} body={YELLOW} rot={-13} />
      <Buddy x={146} y={118} s={0.78} body={PURPLE} rot={13} />
      <Buddy x={100} y={104} s={0.95} body={MINT} rot={-4} />
    </Tile>
  );
}

/* ─── أبي أتزوج — ring overlapping a heart ─── */
export function ShofahArt({ size = 120 }: P) {
  return (
    <Tile bg={PURPLE}>
      <Confetti a={MINT} />
      <g transform="rotate(-8 100 104)">
        {/* heart, sitting behind */}
        <path
          d="M 108 148 q -34 -24 -44 -46 q -9 -21 8 -30 q 18 -9 36 14 q 18 -23 36 -14 q 17 9 8 30 q -10 22 -44 46 Z"
          fill={PINK}
          stroke={INK}
          strokeWidth="4"
          strokeLinejoin="round"
        />
        <ellipse cx="88" cy="86" rx="9" ry="6" fill={CREAM} opacity=".45" transform="rotate(-28 88 86)" />
      </g>
      {/* ring in front, overlapping the heart's lower-left */}
      <g transform="rotate(10 74 128)">
        <circle cx="74" cy="128" r="27" fill="none" stroke={INK} strokeWidth="12" />
        <circle cx="74" cy="128" r="27" fill="none" stroke={GOLD} strokeWidth="7" />
        <path d="M 74 92 l 9 13 -18 0 Z" fill={MINT} stroke={INK} strokeWidth="3.4" strokeLinejoin="round" />
        <path d="M 62 122 q 12 -9 24 0" stroke={CREAM} strokeWidth="3" fill="none" strokeLinecap="round" opacity=".8" />
      </g>
      <Sp x={150} y={70} s={9} f={YELLOW} />
    </Tile>
  );
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
