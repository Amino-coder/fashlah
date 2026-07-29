/**
 * Bagdoonis illustration set.
 *
 * Original artwork, drawn in a flat ornamental Gulf-modernist idiom:
 * flat fills with no gradients on figures, thin gold outlines on every
 * shape, strict bilateral symmetry, a pointed-arch frame as the recurring
 * architectural motif, four-point stars as punctuation, and a diamond tile
 * band along the base. Figures are geometric and minimally featured so
 * they read as motifs rather than cartoons.
 *
 * Everything here is built from primitives (arches, cups, dallah, palm
 * fronds, stars) rather than copied from any existing artwork.
 */

const GOLD = "#D9A441";
const INK = "#241539";
const CREAM = "#F5E9D7";

/** Four-point concave star — the recurring accent across the set. */
function Star({ x, y, s = 10, fill = GOLD, o = 1 }: { x: number; y: number; s?: number; fill?: string; o?: number }) {
  return (
    <path
      d={`M ${x} ${y - s} Q ${x + s * 0.2} ${y - s * 0.2} ${x + s} ${y} Q ${x + s * 0.2} ${y + s * 0.2} ${x} ${y + s} Q ${x - s * 0.2} ${y + s * 0.2} ${x - s} ${y} Q ${x - s * 0.2} ${y - s * 0.2} ${x} ${y - s} Z`}
      fill={fill}
      opacity={o}
    />
  );
}

/** Diamond tile band that sits along the bottom edge of each panel. */
function TileBand({ y, fillA, fillB }: { y: number; fillA: string; fillB: string }) {
  const tiles = [];
  for (let i = 0; i < 9; i++) {
    const cx = 12 + i * 22;
    tiles.push(
      <path
        key={i}
        d={`M ${cx} ${y} l 9 7 -9 7 -9 -7 Z`}
        fill={i % 2 === 0 ? fillA : fillB}
        stroke={GOLD}
        strokeWidth="0.8"
      />
    );
  }
  return <g>{tiles}</g>;
}

/** The pointed arch that frames every composition. */
function Arch({ fill, stroke = GOLD }: { fill: string; stroke?: string }) {
  return (
    <path
      d="M 52 172 L 52 92 Q 52 44 100 22 Q 148 44 148 92 L 148 172 Z"
      fill={fill}
      stroke={stroke}
      strokeWidth="2"
    />
  );
}

type IconProps = { size?: number };

/* ─────────────── فشلة — secrets spilled over coffee ─────────────── */
export function FashlahArt({ size = 96 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" aria-hidden="true">
      <rect x="0" y="0" width="200" height="200" rx="34" fill="#C7405F" />
      <rect x="8" y="8" width="184" height="184" rx="28" fill="none" stroke={GOLD} strokeWidth="1.6" opacity=".7" />
      <Arch fill="#F0DFC6" />

      {/* seated figure, hands clapped over the mouth */}
      <path d="M 70 172 Q 72 132 100 126 Q 128 132 130 172 Z" fill="#2F6B5E" stroke={GOLD} strokeWidth="1.6" />
      <circle cx="100" cy="98" r="26" fill="#E8B98C" stroke={GOLD} strokeWidth="1.6" />
      {/* hair / head covering */}
      <path d="M 74 96 Q 74 62 100 62 Q 126 62 126 96 Q 118 82 100 82 Q 82 82 74 96 Z" fill={INK} />
      {/* wide eyes */}
      <ellipse cx="90" cy="98" rx="4.6" ry="5.4" fill={CREAM} />
      <ellipse cx="110" cy="98" rx="4.6" ry="5.4" fill={CREAM} />
      <circle cx="90.5" cy="99" r="2.5" fill={INK} />
      <circle cx="110.5" cy="99" r="2.5" fill={INK} />
      {/* hands over the mouth */}
      <path d="M 82 128 Q 100 118 118 128 Q 118 142 100 144 Q 82 142 82 128 Z" fill="#E8B98C" stroke={GOLD} strokeWidth="1.4" />
      <path d="M 92 122 v 20 M 100 120 v 24 M 108 122 v 20" stroke="#C99468" strokeWidth="1.4" strokeLinecap="round" />

      {/* mirrored finjan cups — the majlis where secrets get spilled */}
      <g>
        <path d="M 22 132 h 20 l -3 14 h -14 Z" fill={GOLD} stroke={INK} strokeWidth="1.2" />
        <ellipse cx="32" cy="132" rx="10" ry="3" fill={CREAM} stroke={INK} strokeWidth="1" />
        <path d="M 178 132 h -20 l 3 14 h 14 Z" fill={GOLD} stroke={INK} strokeWidth="1.2" />
        <ellipse cx="168" cy="132" rx="10" ry="3" fill={CREAM} stroke={INK} strokeWidth="1" />
      </g>

      <Star x={30} y={44} s={9} />
      <Star x={170} y={44} s={9} />
      <Star x={100} y={40} s={6} fill={CREAM} />
      <TileBand y={176} fillA="#2F6B5E" fillB="#F0DFC6" />
    </svg>
  );
}

/* ─────────────── أبي أتزوج — the marriage viewing ─────────────── */
export function ShofahArt({ size = 96 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" aria-hidden="true">
      <rect x="0" y="0" width="200" height="200" rx="34" fill="#2F6B5E" />
      <rect x="8" y="8" width="184" height="184" rx="28" fill="none" stroke={GOLD} strokeWidth="1.6" opacity=".7" />
      <Arch fill="#F0DFC6" />

      {/* the ring, centred in the arch */}
      <circle cx="100" cy="52" r="11" fill="none" stroke={GOLD} strokeWidth="4" />
      <path d="M 100 32 l 5 8 h -10 Z" fill="#C7405F" />

      {/* two figures facing centre, mirrored */}
      <g>
        <path d="M 56 172 Q 58 138 80 133 Q 92 138 93 172 Z" fill="#C7405F" stroke={GOLD} strokeWidth="1.5" />
        <circle cx="76" cy="110" r="19" fill="#E8B98C" stroke={GOLD} strokeWidth="1.5" />
        <path d="M 57 108 Q 57 82 76 82 Q 95 82 95 108 Q 88 96 76 96 Q 64 96 57 108 Z" fill={CREAM} stroke={GOLD} strokeWidth="1.4" />
        <rect x="60" y="82" width="32" height="6" rx="3" fill={INK} />
        <circle cx="70" cy="112" r="2.4" fill={INK} />
        <circle cx="82" cy="112" r="2.4" fill={INK} />
      </g>
      <g>
        <path d="M 144 172 Q 142 138 120 133 Q 108 138 107 172 Z" fill="#C7405F" stroke={GOLD} strokeWidth="1.5" />
        <path d="M 105 112 Q 105 84 124 84 Q 143 84 143 112 Q 143 134 124 137 Q 105 134 105 112 Z" fill={INK} stroke={GOLD} strokeWidth="1.4" />
        <circle cx="124" cy="112" r="15" fill="#E8B98C" />
        <path d="M 109 110 Q 109 90 124 90 Q 139 90 139 110 Q 133 100 124 100 Q 115 100 109 110 Z" fill={INK} />
        <circle cx="118" cy="114" r="2.4" fill={INK} />
        <circle cx="130" cy="114" r="2.4" fill={INK} />
      </g>

      {/* mirrored dallah — the coffee that opens every shofah */}
      <g>
        <path d="M 20 128 q -4 -18 10 -20 q 14 2 10 20 Z" fill="#C7405F" stroke={GOLD} strokeWidth="1.3" />
        <path d="M 30 108 l 0 -8 l 6 4 Z" fill={GOLD} />
        <path d="M 20 128 h 20 l -3 10 h -14 Z" fill={GOLD} stroke={INK} strokeWidth="1" />
        <path d="M 180 128 q 4 -18 -10 -20 q -14 2 -10 20 Z" fill="#C7405F" stroke={GOLD} strokeWidth="1.3" />
        <path d="M 170 108 l 0 -8 l -6 4 Z" fill={GOLD} />
        <path d="M 180 128 h -20 l 3 10 h 14 Z" fill={GOLD} stroke={INK} strokeWidth="1" />
      </g>

      <Star x={30} y={46} s={8} />
      <Star x={170} y={46} s={8} />
      <TileBand y={176} fillA="#C7405F" fillB="#F0DFC6" />
    </svg>
  );
}

/* ─────────────── مين بيتوظف — the interview ─────────────── */
export function JobArt({ size = 96 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" aria-hidden="true">
      <rect x="0" y="0" width="200" height="200" rx="34" fill="#2B4C9B" />
      <rect x="8" y="8" width="184" height="184" rx="28" fill="none" stroke={GOLD} strokeWidth="1.6" opacity=".7" />
      <Arch fill="#F0DFC6" />

      {/* interviewer */}
      <circle cx="100" cy="86" r="23" fill="#E8B98C" stroke={GOLD} strokeWidth="1.6" />
      <path d="M 77 84 Q 77 54 100 54 Q 123 54 123 84 Q 115 70 100 70 Q 85 70 77 84 Z" fill={INK} />
      <circle cx="91" cy="88" r="2.6" fill={INK} />
      <circle cx="109" cy="88" r="2.6" fill={INK} />
      <path d="M 84 76 q 7 -5 13 -1 M 103 75 q 7 -4 13 1" stroke={INK} strokeWidth="2.2" fill="none" strokeLinecap="round" />
      {/* suit */}
      <path d="M 64 150 Q 66 118 86 111 L 114 111 Q 134 118 136 150 Z" fill="#1B3068" stroke={GOLD} strokeWidth="1.5" />
      <path d="M 86 111 L 100 132 L 114 111 Q 107 107 100 107 Q 93 107 86 111 Z" fill={CREAM} />
      <path d="M 100 118 l 5 6 -3 22 -2 3 -2 -3 -3 -22 Z" fill="#C7405F" stroke={GOLD} strokeWidth="0.9" />
      {/* desk */}
      <rect x="34" y="150" width="132" height="11" rx="4" fill="#8A5A2B" stroke={GOLD} strokeWidth="1.4" />
      <rect x="34" y="150" width="132" height="4" rx="2" fill={GOLD} opacity=".55" />

      {/* mirrored CVs on the desk */}
      <g>
        <rect x="24" y="126" width="24" height="22" rx="3" fill={CREAM} stroke={INK} strokeWidth="1.2" transform="rotate(-8 36 137)" />
        <path d="M 29 133 h 14 M 29 139 h 10" stroke="#8C8299" strokeWidth="1.6" strokeLinecap="round" transform="rotate(-8 36 137)" />
        <rect x="152" y="126" width="24" height="22" rx="3" fill={CREAM} stroke={INK} strokeWidth="1.2" transform="rotate(8 164 137)" />
        <path d="M 157 133 h 14 M 157 139 h 10" stroke="#8C8299" strokeWidth="1.6" strokeLinecap="round" transform="rotate(8 164 137)" />
      </g>

      <Star x={30} y={44} s={9} />
      <Star x={170} y={44} s={9} />
      <Star x={100} y={38} s={6} fill={CREAM} />
      <TileBand y={176} fillA="#C9A227" fillB="#F0DFC6" />
    </svg>
  );
}

/* ─────────────── عبارات — the daily card ─────────────── */
export function IbaratArt({ size = 96 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" aria-hidden="true">
      <rect x="0" y="0" width="200" height="200" rx="34" fill="#C9A227" />
      <rect x="8" y="8" width="184" height="184" rx="28" fill="none" stroke={INK} strokeWidth="1.6" opacity=".45" />
      <Arch fill="#1B3A55" stroke={GOLD} />

      {/* fanned cards inside the arch */}
      <rect x="62" y="66" width="54" height="76" rx="7" fill="#C7405F" stroke={GOLD} strokeWidth="1.5" transform="rotate(-11 100 104)" />
      <rect x="70" y="64" width="54" height="76" rx="7" fill="#2F6B5E" stroke={GOLD} strokeWidth="1.5" transform="rotate(-2 100 104)" />
      <rect x="74" y="62" width="54" height="78" rx="7" fill={CREAM} stroke={GOLD} strokeWidth="1.8" transform="rotate(8 100 104)" />
      <g transform="rotate(8 100 104)">
        <Star x={101} y={88} s={13} fill={GOLD} />
        <path d="M 84 116 h 34 M 89 126 h 24" stroke="#B9A98F" strokeWidth="3" strokeLinecap="round" />
      </g>

      {/* mirrored palm fronds */}
      <g stroke={GOLD} strokeWidth="1.6" fill="#2F6B5E">
        <path d="M 26 150 q -8 -26 4 -44 q 12 18 4 44 Z" />
        <path d="M 174 150 q 8 -26 -4 -44 q -12 18 -4 44 Z" />
      </g>

      <Star x={32} y={44} s={8} fill={CREAM} />
      <Star x={168} y={44} s={8} fill={CREAM} />
      <TileBand y={176} fillA="#C7405F" fillB="#1B3A55" />
    </svg>
  );
}

/* ─────────── Ornamental arch used as the home-page crest ─────────── */
export function Crest({ size = 120 }: IconProps) {
  return (
    <svg width={size} height={(size * 100) / 140} viewBox="0 0 140 100" aria-hidden="true">
      <path
        d="M 26 96 L 26 52 Q 26 18 70 6 Q 114 18 114 52 L 114 96"
        fill="none"
        stroke={GOLD}
        strokeWidth="2.4"
      />
      <path
        d="M 40 96 L 40 56 Q 40 30 70 20 Q 100 30 100 56 L 100 96"
        fill="none"
        stroke={GOLD}
        strokeWidth="1.4"
        opacity=".6"
      />
      <Star x={70} y={44} s={11} />
      <Star x={22} y={80} s={6} o={0.75} />
      <Star x={118} y={80} s={6} o={0.75} />
    </svg>
  );
}
