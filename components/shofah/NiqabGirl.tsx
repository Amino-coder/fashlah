// مزنة — the girl character. Gradient IDs are prefixed "n5" so they can't
// collide with ShemaghGuy's defs when both render on the same page (the
// Shofah landing page shows them side by side around the ring emoji).
//
// NOTE: the filename is a leftover from an earlier design that had a niqab;
// the character no longer wears one. Kept as-is only to avoid churning the
// six files that import it — safe to rename whenever convenient.
export default function NiqabGirl({
  size = 140,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg width={size} height={size} viewBox="0 0 240 250" className={`shofah-float ${className}`}>
      <defs>
        <radialGradient id="n5Skin" cx="40%" cy="34%">
          <stop offset="0%" stopColor="#FFE0C8" />
          <stop offset="100%" stopColor="#F3BE99" />
        </radialGradient>
        <linearGradient id="n5Hair" x1="0.2" y1="0" x2="0.8" y2="1">
          <stop offset="0%" stopColor="#4A3350" />
          <stop offset="45%" stopColor="#2E1F38" />
          <stop offset="100%" stopColor="#1C1226" />
        </linearGradient>
        <linearGradient id="n5Dress" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#8E4FC4" />
          <stop offset="100%" stopColor="#5E2E8E" />
        </linearGradient>
      </defs>

      {/* ground shadow */}
      <ellipse cx="120" cy="240" rx="62" ry="8" fill="#7C3AED" opacity=".12" />

      {/* back hair mass, behind everything */}
      <path d="M120 30 Q52 34 46 108 Q40 160 52 214 Q84 202 120 204 Q156 202 188 214 Q200 160 194 108 Q188 34 120 30 Z" fill="url(#n5Hair)" />

      {/* dress + arms */}
      <path d="M74 240 Q76 198 120 192 Q164 198 166 240 Z" fill="url(#n5Dress)" />
      <path d="M82 212 Q58 202 50 214" stroke="#F3BE99" strokeWidth="11" fill="none" strokeLinecap="round" />
      <path d="M158 212 Q184 200 192 212" stroke="#F3BE99" strokeWidth="11" fill="none" strokeLinecap="round" />
      <circle cx="48" cy="216" r="9" fill="url(#n5Skin)" />
      <circle cx="194" cy="213" r="9" fill="url(#n5Skin)" />

      {/* round face + ears */}
      <circle cx="120" cy="110" r="58" fill="url(#n5Skin)" />
      <circle cx="62" cy="118" r="9" fill="#F3BE99" />
      <circle cx="178" cy="118" r="9" fill="#F3BE99" />

      <g className="shofah-sway">
        {/* front hair: side-swept fringe framing the face */}
        <path d="M120 42 Q66 44 60 106 Q58 84 74 74 Q92 92 120 88 Q152 92 172 72 Q184 84 180 106 Q176 44 120 42 Z" fill="url(#n5Hair)" />
        {/* side locks falling past the cheeks */}
        <path d="M62 96 Q52 140 60 186 Q72 156 68 100 Z" fill="url(#n5Hair)" />
        <path d="M178 96 Q188 140 180 186 Q168 156 172 100 Z" fill="url(#n5Hair)" />
        {/* shine — what stops the hair reading as a flat silhouette */}
        <path d="M88 60 Q76 76 74 96" fill="none" stroke="#7E6693" strokeWidth="4" opacity=".45" strokeLinecap="round" />
        <path d="M150 58 Q166 74 168 94" fill="none" stroke="#7E6693" strokeWidth="3.5" opacity=".38" strokeLinecap="round" />
        <path d="M64 150 Q58 178 62 200" fill="none" stroke="#7E6693" strokeWidth="3" opacity=".28" strokeLinecap="round" />
        <path d="M176 150 Q182 178 178 200" fill="none" stroke="#7E6693" strokeWidth="3" opacity=".28" strokeLinecap="round" />
        {/* flower tucked in */}
        <g transform="translate(168,62)">
          <circle r="5" cx="0" cy="-7" fill="#F4708F" />
          <circle r="5" cx="7" cy="0" fill="#F4708F" />
          <circle r="5" cx="0" cy="7" fill="#F4708F" />
          <circle r="5" cx="-7" cy="0" fill="#F4708F" />
          <circle r="4" fill="#FFC93C" />
        </g>
      </g>

      <path d="M84 92 Q98 82 112 90" stroke="#3A2A44" strokeWidth="5" fill="none" strokeLinecap="round" />
      <path d="M130 90 Q144 82 158 92" stroke="#3A2A44" strokeWidth="5" fill="none" strokeLinecap="round" />
      <path d="M78 104 L68 96" stroke="#1C1226" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M162 104 L172 96" stroke="#1C1226" strokeWidth="3.5" strokeLinecap="round" />

      <g className="shofah-blink" style={{ transformOrigin: "120px 116px" }}>
        <ellipse cx="97" cy="116" rx="15" ry="16" fill="#fff" />
        <circle cx="99" cy="118" r="10" fill="#6B3FA0" />
        <circle cx="99" cy="118" r="5" fill="#3A1F5C" />
        <circle cx="103" cy="113" r="4" fill="#fff" />
        <circle cx="95" cy="123" r="2" fill="#fff" opacity=".85" />
        <circle cx="92" cy="111" r="1.4" fill="#fff" opacity=".6" />
        <ellipse cx="145" cy="116" rx="15" ry="16" fill="#fff" />
        <circle cx="147" cy="118" r="10" fill="#6B3FA0" />
        <circle cx="147" cy="118" r="5" fill="#3A1F5C" />
        <circle cx="151" cy="113" r="4" fill="#fff" />
        <circle cx="143" cy="123" r="2" fill="#fff" opacity=".85" />
        <circle cx="140" cy="111" r="1.4" fill="#fff" opacity=".6" />
      </g>

      <path d="M120 126 Q116 136 122 139" stroke="#D89A72" strokeWidth="3" fill="none" strokeLinecap="round" />
      <ellipse cx="80" cy="138" rx="11" ry="5.5" fill="#F4708F" opacity=".42" />
      <ellipse cx="162" cy="138" rx="11" ry="5.5" fill="#F4708F" opacity=".42" />
      <path d="M108 150 Q120 160 132 150" stroke="#B85C7A" strokeWidth="3.5" fill="none" strokeLinecap="round" />

      <path className="shofah-twinkle" d="M204 70 Q204 60 212 60 Q220 60 220 70 Q220 82 204 94 Q188 82 188 70 Q188 60 196 60 Q204 60 204 70" fill="#F4708F" opacity=".75" />
      <g fill="#FFC93C">
        <path className="shofah-twinkle-b" d="M26 92 l3 8 8 3 -8 3 -3 8 -3-8 -8-3 8-3z" />
        <path className="shofah-twinkle" d="M32 160 l2 5 5 2 -5 2 -2 5 -2-5 -5-2 5-2z" />
      </g>
    </svg>
  );
}
