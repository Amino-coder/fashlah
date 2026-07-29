/**
 * Bagdoonis game art — full-bleed square panels.
 *
 * Playful flat vector on the original brand palette (pink / purple / mint /
 * yellow). Each panel fills its whole tile edge to edge, so it sits on the
 * page as a solid colour block rather than a picture floating inside a
 * white card. Chunky simplified characters, confetti and stars, no
 * architectural or ornamental framing.
 */

const INK = "#17122B";
const CREAM = "#FFFDF7";
const PINK = "#FF2E93";
const PURPLE = "#7C3AED";
const MINT = "#2EE6A6";
const YELLOW = "#FFD400";
const SKIN = "#F3C79C";
const SKIN_D = "#E0AC7D";

/** Four-point sparkle used as scattered punctuation. */
function Sp({ x, y, s = 8, f = CREAM, o = 1 }: { x: number; y: number; s?: number; f?: string; o?: number }) {
  return (
    <path
      d={`M ${x} ${y - s} Q ${x + s * 0.22} ${y - s * 0.22} ${x + s} ${y} Q ${x + s * 0.22} ${y + s * 0.22} ${x} ${y + s} Q ${x - s * 0.22} ${y + s * 0.22} ${x - s} ${y} Q ${x - s * 0.22} ${y - s * 0.22} ${x} ${y - s} Z`}
      fill={f}
      opacity={o}
    />
  );
}

function Dot({ x, y, r = 4, f = CREAM, o = 1 }: { x: number; y: number; r?: number; f?: string; o?: number }) {
  return <circle cx={x} cy={y} r={r} fill={f} opacity={o} />;
}

type P = { size?: number };
const box = { display: "block" as const };

/* ───────────── فشلة — the whole group, one of them caught out ───────────── */
export function FashlahArt({ size = 120 }: P) {
  return (
    <svg width="100%" height="100%" viewBox="0 0 200 200" style={box} aria-hidden="true">
      <rect width="200" height="200" rx="30" fill={PINK} />
      <Dot x={26} y={30} r={5} o={0.55} />
      <Dot x={176} y={40} r={4} f={YELLOW} />
      <Dot x={168} y={168} r={5} f={MINT} o={0.8} />
      <Sp x={34} y={166} s={8} f={YELLOW} />
      <Sp x={100} y={26} s={9} f={CREAM} o={0.85} />

      {/* left friend — laughing and pointing */}
      <g>
        <path d="M 14 190 q 2 -34 26 -40 q 24 6 26 40 Z" fill={PURPLE} />
        <circle cx="40" cy="118" r="21" fill={SKIN} />
        <path d="M 19 116 q 0 -25 21 -25 q 21 0 21 25 q -7 -11 -21 -11 q -14 0 -21 11 Z" fill={INK} />
        <path d="M 31 114 q 4 -4 9 -1 M 44 113 q 5 -3 9 1" stroke={INK} strokeWidth="2.6" fill="none" strokeLinecap="round" />
        <ellipse cx="40" cy="132" rx="9" ry="7" fill={INK} />
        <ellipse cx="40" cy="135" rx="5" ry="3.4" fill={PINK} />
        <ellipse cx="24" cy="128" rx="5" ry="3.4" fill={PINK} opacity=".55" />
      </g>

      {/* right friend — hand to mouth, gasping */}
      <g>
        <path d="M 134 190 q 2 -34 26 -40 q 24 6 26 40 Z" fill={MINT} />
        <circle cx="160" cy="118" r="21" fill={SKIN} />
        <path d="M 139 118 q 0 -27 21 -27 q 21 0 21 27 q 0 20 -21 22 q -21 -2 -21 -22 Z" fill={INK} />
        <circle cx="160" cy="120" r="16" fill={SKIN} />
        <path d="M 144 116 q 0 -22 16 -22 q 16 0 16 22 q -6 -10 -16 -10 q -10 0 -16 10 Z" fill={INK} />
        <circle cx="153" cy="120" r="2.8" fill={INK} />
        <circle cx="167" cy="120" r="2.8" fill={INK} />
        <ellipse cx="160" cy="133" rx="5.5" ry="6.5" fill={INK} />
        <ellipse cx="145" cy="129" rx="4.5" ry="3" fill={PINK} opacity=".5" />
      </g>

      {/* centre — the one who got caught, hands clapped over the face */}
      <g>
        <path d="M 62 192 q 3 -42 38 -49 q 35 7 38 49 Z" fill={YELLOW} />
        <circle cx="100" cy="100" r="30" fill={SKIN} />
        <path d="M 70 98 q 0 -34 30 -34 q 30 0 30 34 q -10 -15 -30 -15 q -20 0 -30 15 Z" fill={INK} />
        <ellipse cx="88" cy="100" rx="6" ry="7" fill={CREAM} />
        <ellipse cx="112" cy="100" rx="6" ry="7" fill={CREAM} />
        <circle cx="88.5" cy="101" r="3.2" fill={INK} />
        <circle cx="112.5" cy="101" r="3.2" fill={INK} />
        <path d="M 78 84 q 8 -6 15 -2 M 107 82 q 8 -4 15 2" stroke={INK} strokeWidth="3" fill="none" strokeLinecap="round" />
        <ellipse cx="74" cy="112" rx="7" ry="4.6" fill={PINK} opacity=".6" />
        <ellipse cx="126" cy="112" rx="7" ry="4.6" fill={PINK} opacity=".6" />
        {/* hands */}
        <rect x="70" y="118" width="32" height="30" rx="13" fill={SKIN_D} />
        <rect x="98" y="118" width="32" height="30" rx="13" fill={SKIN_D} />
        <path d="M 79 121 v 24 M 87 119 v 26 M 95 119 v 26" stroke={SKIN} strokeWidth="2.2" strokeLinecap="round" />
        <path d="M 105 119 v 26 M 113 119 v 26 M 121 121 v 24" stroke={SKIN} strokeWidth="2.2" strokeLinecap="round" />
      </g>
    </svg>
  );
}

/* ───────────── أبي أتزوج — two of them, and a heart ───────────── */
export function ShofahArt({ size = 120 }: P) {
  return (
    <svg width="100%" height="100%" viewBox="0 0 200 200" style={box} aria-hidden="true">
      <rect width="200" height="200" rx="30" fill={PURPLE} />
      <Dot x={28} y={38} r={5} f={YELLOW} />
      <Dot x={172} y={54} r={4} f={MINT} />
      <Dot x={30} y={158} r={4.5} f={PINK} />
      <Sp x={170} y={160} s={8} f={YELLOW} />
      <Sp x={100} y={34} s={7} f={CREAM} o={0.8} />

      {/* heart between them */}
      <path d="M 100 74 q -13 -16 -24 -6 q -10 9 2 22 l 22 21 22 -21 q 12 -13 2 -22 q -11 -10 -24 6 Z" fill={PINK} />
      <Sp x={82} y={62} s={5} f={CREAM} o={0.9} />

      {/* left — ghutra */}
      <g>
        <path d="M 12 192 q 3 -38 32 -45 q 29 7 32 45 Z" fill={MINT} />
        <circle cx="44" cy="126" r="25" fill={SKIN} />
        <path d="M 19 124 q 0 -31 25 -31 q 25 0 25 31 q -8 -13 -25 -13 q -17 0 -25 13 Z" fill={CREAM} />
        <rect x="22" y="92" width="44" height="8" rx="4" fill={INK} />
        <circle cx="36" cy="128" r="3.2" fill={INK} />
        <circle cx="52" cy="128" r="3.2" fill={INK} />
        <path d="M 36 140 q 8 6 16 0" stroke={INK} strokeWidth="3" fill="none" strokeLinecap="round" />
        <ellipse cx="26" cy="136" rx="5" ry="3.4" fill={PINK} opacity=".5" />
      </g>

      {/* right — hijab */}
      <g>
        <path d="M 124 192 q 3 -38 32 -45 q 29 7 32 45 Z" fill={PINK} />
        <path d="M 131 126 q 0 -33 25 -33 q 25 0 25 33 q 0 25 -25 28 q -25 -3 -25 -28 Z" fill={INK} />
        <circle cx="156" cy="128" r="19" fill={SKIN} />
        <path d="M 137 124 q 0 -26 19 -26 q 19 0 19 26 q -7 -11 -19 -11 q -12 0 -19 11 Z" fill={INK} />
        <circle cx="148" cy="130" r="3.2" fill={INK} />
        <circle cx="164" cy="130" r="3.2" fill={INK} />
        <path d="M 148 142 q 8 6 16 0" stroke={INK} strokeWidth="3" fill="none" strokeLinecap="round" />
        <ellipse cx="138" cy="138" rx="5" ry="3.4" fill={PINK} opacity=".6" />
      </g>
    </svg>
  );
}

/* ───────────── مين بيتوظف — the interview ───────────── */
export function JobArt({ size = 120 }: P) {
  return (
    <svg width="100%" height="100%" viewBox="0 0 200 200" style={box} aria-hidden="true">
      <rect width="200" height="200" rx="30" fill={MINT} />
      <Dot x={28} y={34} r={5} f={PINK} />
      <Dot x={174} y={44} r={4.5} f={YELLOW} />
      <Sp x={32} y={150} s={8} f={CREAM} o={0.9} />
      <Sp x={100} y={26} s={7} f={CREAM} o={0.75} />

      {/* flying paperwork */}
      <g>
        <rect x="14" y="60" width="28" height="22" rx="4" fill={CREAM} transform="rotate(-16 28 71)" />
        <path d="M 20 68 h 16 M 20 74 h 11" stroke={INK} strokeWidth="2" strokeLinecap="round" opacity=".45" transform="rotate(-16 28 71)" />
        <rect x="158" y="66" width="28" height="22" rx="4" fill={CREAM} transform="rotate(14 172 77)" />
        <path d="M 164 74 h 16 M 164 80 h 11" stroke={INK} strokeWidth="2" strokeLinecap="round" opacity=".45" transform="rotate(14 172 77)" />
      </g>

      {/* interviewer */}
      <circle cx="100" cy="86" r="27" fill={SKIN} />
      <path d="M 73 84 q 0 -33 27 -33 q 27 0 27 33 q -9 -14 -27 -14 q -18 0 -27 14 Z" fill={INK} />
      <circle cx="90" cy="88" r="3.2" fill={INK} />
      <circle cx="110" cy="88" r="3.2" fill={INK} />
      <path d="M 80 74 q 8 -6 15 -2 M 105 72 q 8 -4 15 2" stroke={INK} strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M 92 100 q 8 6 16 0" stroke="#C4703F" strokeWidth="3" fill="none" strokeLinecap="round" />
      <ellipse cx="76" cy="96" rx="6" ry="4" fill={PINK} opacity=".45" />
      <ellipse cx="124" cy="96" rx="6" ry="4" fill={PINK} opacity=".45" />

      {/* suit */}
      <path d="M 54 158 q 3 -32 26 -40 l 40 0 q 23 8 26 40 Z" fill={PURPLE} />
      <path d="M 80 118 l 20 24 20 -24 q -9 -5 -20 -5 q -11 0 -20 5 Z" fill={CREAM} />
      <path d="M 100 126 l 6 8 -4 26 -2 3 -2 -3 -4 -26 Z" fill={PINK} />

      {/* desk */}
      <rect x="22" y="158" width="156" height="14" rx="6" fill={YELLOW} />
      <rect x="34" y="172" width="132" height="10" rx="4" fill="#E0B800" />
    </svg>
  );
}

/* ───────────── عبارات — the daily card ───────────── */
export function IbaratArt({ size = 120 }: P) {
  return (
    <svg width="100%" height="100%" viewBox="0 0 200 200" style={box} aria-hidden="true">
      <rect width="200" height="200" rx="30" fill={YELLOW} />
      <Dot x={28} y={38} r={5} f={PINK} />
      <Dot x={172} y={48} r={4.5} f={PURPLE} />
      <Dot x={34} y={166} r={4} f={MINT} />
      <Sp x={168} y={162} s={8} f={CREAM} />
      <Sp x={100} y={26} s={7} f={CREAM} o={0.8} />

      <rect x="52" y="52" width="66" height="94" rx="12" fill={PURPLE} transform="rotate(-14 100 100)" />
      <rect x="62" y="50" width="66" height="94" rx="12" fill={MINT} transform="rotate(-4 100 100)" />
      <rect x="68" y="48" width="66" height="96" rx="12" fill={CREAM} transform="rotate(8 100 100)" />
      <g transform="rotate(8 100 100)">
        <Sp x={101} y={82} s={19} f={PINK} />
        <path d="M 78 116 h 46 M 86 130 h 30" stroke={INK} strokeWidth="5" strokeLinecap="round" opacity=".22" />
      </g>
      <Sp x={54} y={92} s={7} f={PINK} />
      <Sp x={150} y={118} s={6} f={PURPLE} />
    </svg>
  );
}
