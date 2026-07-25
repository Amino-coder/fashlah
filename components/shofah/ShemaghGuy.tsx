export default function ShemaghGuy({
  size = 140,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg width={size} height={size} viewBox="0 0 220 220" className={`shofah-float ${className}`}>
      {/* tiny body */}
      <path d="M80 180 Q80 160 110 155 Q140 160 140 180 L140 210 L80 210 Z" fill="#FFFDF7" stroke="#e8e0d0" strokeWidth="1.5" />
      {/* waving arms */}
      <path d="M80 170 Q60 158 52 168" stroke="#EDAB77" strokeWidth="8" fill="none" strokeLinecap="round" />
      <path d="M140 170 Q160 155 168 164" stroke="#EDAB77" strokeWidth="8" fill="none" strokeLinecap="round" />
      <circle cx="49" cy="170" r="7" fill="#EDAB77" />
      <circle cx="171" cy="166" r="7" fill="#EDAB77" />

      {/* big round head */}
      <circle cx="110" cy="96" r="62" fill="#EDAB77" />

      {/* shemagh wrap */}
      <path d="M44 82 Q40 30 110 20 Q180 30 176 82 Q178 100 170 106 L168 90 Q170 44 110 34 Q50 44 52 90 L50 106 Q42 100 44 82 Z" fill="#fff" />
      <defs>
        <pattern id="shofahCheck" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width="10" height="10" fill="#fff" />
          <rect width="5" height="5" fill="#E63946" rx="1" />
          <rect x="5" y="5" width="5" height="5" fill="#E63946" rx="1" />
        </pattern>
      </defs>
      <path d="M44 82 Q40 30 110 20 Q180 30 176 82 Q178 100 170 106 L168 90 Q170 44 110 34 Q50 44 52 90 L50 106 Q42 100 44 82 Z" fill="url(#shofahCheck)" opacity="0.8" />
      <ellipse cx="110" cy="30" rx="48" ry="8" fill="none" stroke="#17122B" strokeWidth="5" />
      <path d="M170 106 Q176 130 168 150" stroke="url(#shofahCheck)" strokeWidth="12" fill="none" strokeLinecap="round" opacity="0.7" />

      {/* eyes */}
      <g className="shofah-blink">
        <circle cx="88" cy="92" r="14" fill="#fff" />
        <circle cx="90" cy="94" r="9" fill="#17122B" />
        <circle cx="93" cy="89" r="3.5" fill="#fff" />
        <circle cx="87" cy="97" r="1.5" fill="#fff" opacity="0.7" />
        <circle cx="132" cy="92" r="14" fill="#fff" />
        <circle cx="134" cy="94" r="9" fill="#17122B" />
        <circle cx="137" cy="89" r="3.5" fill="#fff" />
        <circle cx="131" cy="97" r="1.5" fill="#fff" opacity="0.7" />
      </g>

      {/* eyebrows */}
      <path d="M74 74 Q88 64 102 74" stroke="#2A1B0E" strokeWidth="4.5" fill="none" strokeLinecap="round" />
      <path d="M118 74 Q132 64 146 74" stroke="#2A1B0E" strokeWidth="4.5" fill="none" strokeLinecap="round" />

      {/* blush */}
      <ellipse cx="78" cy="112" rx="10" ry="5" fill="#FFB3B3" opacity="0.5" />
      <ellipse cx="142" cy="112" rx="10" ry="5" fill="#FFB3B3" opacity="0.5" />

      {/* big looped mustache */}
      <path d="M92 118 Q86 112 78 116 Q66 122 62 112 Q58 104 64 108 Q74 116 80 110 Q88 104 96 112" stroke="#2A1B0E" strokeWidth="5" fill="none" strokeLinecap="round" />
      <path d="M128 118 Q134 112 142 116 Q154 122 158 112 Q162 104 156 108 Q146 116 140 110 Q132 104 124 112" stroke="#2A1B0E" strokeWidth="5" fill="none" strokeLinecap="round" />
      <circle cx="33" cy="83" r="6" fill="none" stroke="#2A1B0E" strokeWidth="5" />
      <circle cx="107" cy="83" r="6" fill="none" stroke="#2A1B0E" strokeWidth="5" />

      <path className="shofah-smile" d="M100 130 Q110 140 120 130" stroke="#C97A50" strokeWidth="3" fill="none" strokeLinecap="round" />

      <g fill="#FFD400">
        <path d="M46 52 l2 6 6 2 -6 2 -2 6 -2-6 -6-2 6-2z" opacity="0.8" />
        <path d="M176 66 l1.5 4.5 4.5 1.5 -4.5 1.5 -1.5 4.5 -1.5-4.5 -4.5-1.5 4.5-1.5z" opacity="0.6" />
      </g>
    </svg>
  );
}
