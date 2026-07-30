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
type Topper = "sprig" | "stem" | "daisy";
type Mood = "laugh" | "mad" | "cry";

function Buddy({
  x, y, s, body, rot, topper, mood,
}: {
  x: number; y: number; s: number; body: string; rot: number; topper: Topper; mood: Mood;
}) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
      {/* topper */}
      {topper === "sprig" && (
        /* the original mascot's pointy yellow sprig */
        <g fill={YELLOW} stroke={INK} strokeWidth="2.6" strokeLinejoin="round">
          <path d="M 0 -78 L 7 -50 L -7 -50 Z" />
          <path d="M -13 -70 L -4 -48 L -19 -52 Z" />
          <path d="M 13 -70 L 4 -48 L 19 -52 Z" />
        </g>
      )}
      {topper === "stem" && (
        <>
          <path d="M 0 -46 q 3 -13 14 -17 q 1 12 -10 18 Z" fill={MINT} stroke={INK} strokeWidth="2.4" />
          <path d="M 0 -46 q -3 -13 -14 -17 q -1 12 10 18 Z" fill="#25C48D" stroke={INK} strokeWidth="2.4" />
          <path d="M 0 -32 v -16" stroke={INK} strokeWidth="4" strokeLinecap="round" />
        </>
      )}
      {topper === "daisy" && (
        <>
          <path d="M 0 -34 v -16" stroke={INK} strokeWidth="4" strokeLinecap="round" />
          <g fill={CREAM} stroke={INK} strokeWidth="2.2">
            <ellipse cx="0" cy="-62" rx="6" ry="9" />
            <ellipse cx="0" cy="-46" rx="6" ry="9" />
            <ellipse cx="-9" cy="-54" rx="9" ry="6" />
            <ellipse cx="9" cy="-54" rx="9" ry="6" />
          </g>
          <circle cx="0" cy="-54" r="5.5" fill={YELLOW} stroke={INK} strokeWidth="2.2" />
        </>
      )}

      {/* body */}
      <ellipse cx="0" cy="0" rx="40" ry="37" fill={body} stroke={INK} strokeWidth="3" />

      {/* face */}
      {mood === "laugh" && (
        <>
          <path d="M -20 -8 q 7 -9 14 0" stroke={INK} strokeWidth="4.5" fill="none" strokeLinecap="round" />
          <path d="M 6 -8 q 7 -9 14 0" stroke={INK} strokeWidth="4.5" fill="none" strokeLinecap="round" />
          <path d="M -15 8 q 15 22 30 0 q -15 7 -30 0 Z" fill={INK} />
          <path d="M -9 13 q 9 12 18 0 q -9 4 -18 0 Z" fill="#FF6B8E" />
        </>
      )}
      {mood === "mad" && (
        <>
          {/* angled-down brows + glaring eyes + flat scowl */}
          <path d="M -24 -19 L -8 -12" stroke={INK} strokeWidth="4.6" strokeLinecap="round" />
          <path d="M 24 -19 L 8 -12" stroke={INK} strokeWidth="4.6" strokeLinecap="round" />
          <circle cx="-14" cy="-3" r="5" fill={INK} />
          <circle cx="14" cy="-3" r="5" fill={INK} />
          <path d="M -13 16 q 13 -7 26 0" stroke={INK} strokeWidth="4.4" fill="none" strokeLinecap="round" />
        </>
      )}
      {mood === "cry" && (
        <>
          {/* squeezed-shut downturned eyes, wailing mouth, tears */}
          <path d="M -22 -6 q 7 8 14 0" stroke={INK} strokeWidth="4.5" fill="none" strokeLinecap="round" />
          <path d="M 8 -6 q 7 8 14 0" stroke={INK} strokeWidth="4.5" fill="none" strokeLinecap="round" />
          <ellipse cx="0" cy="16" rx="11" ry="9" fill={INK} />
          <path d="M -16 2 q -4 12 2 16 q 6 -5 2 -16 Z" fill="#7CC9F0" stroke={INK} strokeWidth="2.2" />
          <path d="M 16 2 q 4 12 -2 16 q -6 -5 -2 -16 Z" fill="#7CC9F0" stroke={INK} strokeWidth="2.2" />
        </>
      )}
    </g>
  );
}

export function FashlahArt({ size = 120 }: P) {
  return (
    <Tile bg={PINK}>
      <Confetti />
      {/* sides first so the middle one lands in front */}
      <Buddy x={54} y={120} s={0.74} body={YELLOW} rot={-13} topper="stem" mood="mad" />
      <Buddy x={146} y={120} s={0.74} body={PURPLE} rot={13} topper="daisy" mood="cry" />
      <Buddy x={100} y={106} s={0.92} body={MINT} rot={-4} topper="sprig" mood="laugh" />
    </Tile>
  );
}

/* ─── أبي أتزوج — ring overlapping a heart ─── */
export function ShofahArt({ size = 120 }: P) {
  return (
    <Tile bg={PURPLE}>
      <Confetti a={MINT} />
      <g transform="rotate(-7 100 116)">
        {/* band, drawn as a tilted ellipse so it reads as a 3D ring:
            dark base for depth, gold body, warm highlight on the upper-left */}
        <ellipse cx="100" cy="140" rx="40" ry="31" fill="none" stroke={INK} strokeWidth="17" />
        <ellipse cx="100" cy="140" rx="40" ry="31" fill="none" stroke="#B07A06" strokeWidth="12" />
        <ellipse cx="100" cy="139" rx="40" ry="31" fill="none" stroke={GOLD} strokeWidth="8" />
        <path d="M 66 124 q 12 -16 34 -17" stroke="#FFE9A3" strokeWidth="4" fill="none" strokeLinecap="round" />

        {/* prongs */}
        <path d="M 86 112 L 89 100 M 114 112 L 111 100" stroke={GOLD} strokeWidth="6" strokeLinecap="round" />
        <path d="M 86 112 L 89 100 M 114 112 L 111 100" stroke={INK} strokeWidth="2.4" strokeLinecap="round" />

        {/* brilliant-cut diamond: table, crown, pavilion + facet lines */}
        <path d="M 87 62 L 113 62 L 123 79 L 77 79 Z" fill="#DFF6FF" stroke={INK} strokeWidth="3.2" strokeLinejoin="round" />
        <path d="M 77 79 L 123 79 L 100 110 Z" fill="#A8DFF5" stroke={INK} strokeWidth="3.2" strokeLinejoin="round" />
        {/* lit facet on the crown */}
        <path d="M 87 62 L 100 62 L 100 79 L 77 79 Z" fill="#F4FCFF" stroke="none" />
        {/* facet lines */}
        <g stroke={INK} strokeWidth="2" opacity=".55" fill="none">
          <path d="M 87 62 L 77 79 M 113 62 L 123 79 M 100 62 L 100 79" />
          <path d="M 88 79 L 100 110 M 112 79 L 100 110" />
        </g>
        {/* sparkle glint */}
        <path d="M 92 70 l 6 3 -6 3 -3 -3 Z" fill={CREAM} opacity=".95" />
      </g>
      <Sp x={150} y={64} s={9} f={YELLOW} />
      <Sp x={48} y={78} s={7} f={CREAM} o={0.85} />
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
