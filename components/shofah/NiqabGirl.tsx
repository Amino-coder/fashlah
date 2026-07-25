export default function NiqabGirl({
  size = 140,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg width={size} height={size} viewBox="0 0 220 220" className={`shofah-float ${className}`}>
      {/* tiny body */}
      <path d="M76 180 Q76 156 110 152 Q144 156 144 180 L144 210 L76 210 Z" fill="#2A2440" />

      {/* big round head */}
      <circle cx="110" cy="96" r="62" fill="#FBD7BD" />

      {/* draped niqab fabric */}
      <path
        d="M44 90 Q36 40 60 20 Q80 6 110 6 Q140 6 160 20 Q184 40 176 90
           Q180 120 170 138 Q155 155 140 158 L140 130 Q160 120 164 90
           Q170 50 110 28 Q50 50 56 90 Q60 120 80 130 L80 158
           Q65 155 50 138 Q40 120 44 90 Z"
        fill="#2A2440"
      />
      <path d="M80 158 Q72 180 78 210" fill="#2A2440" />
      <path d="M140 158 Q148 180 142 210" fill="#2A2440" />
      {/* fold texture */}
      <path d="M76 22 Q74 60 78 100" stroke="#3D3460" strokeWidth="1.8" fill="none" opacity="0.5" />
      <path d="M144 22 Q146 60 142 100" stroke="#3D3460" strokeWidth="1.8" fill="none" opacity="0.5" />
      <path d="M110 10 Q108 50 110 90" stroke="#3D3460" strokeWidth="1.2" fill="none" opacity="0.3" />

      {/* face opening */}
      <path d="M60 70 Q56 90 62 104 Q80 120 110 122 Q140 120 158 104 Q164 90 160 70 Q150 56 110 52 Q70 56 60 70 Z" fill="#FBD7BD" />

      {/* eyes */}
      <g className="shofah-blink">
        <circle cx="86" cy="88" r="16" fill="#fff" />
        <circle cx="89" cy="90" r="10.5" fill="#7C3AED" />
        <circle cx="93" cy="85" r="4" fill="#fff" />
        <circle cx="86" cy="94" r="2" fill="#fff" opacity="0.7" />
        <circle cx="83" cy="83" r="1.2" fill="#fff" opacity="0.5" />

        <circle cx="134" cy="88" r="16" fill="#fff" />
        <circle cx="137" cy="90" r="10.5" fill="#7C3AED" />
        <circle cx="141" cy="85" r="4" fill="#fff" />
        <circle cx="134" cy="94" r="2" fill="#fff" opacity="0.7" />
        <circle cx="131" cy="83" r="1.2" fill="#fff" opacity="0.5" />
      </g>

      {/* lashes */}
      <path d="M70 78 L64 72" stroke="#2A2440" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M74 74 L70 66" stroke="#2A2440" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M150 78 L156 72" stroke="#2A2440" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M146 74 L150 66" stroke="#2A2440" strokeWidth="2.5" strokeLinecap="round" />

      {/* blush */}
      <ellipse cx="78" cy="106" rx="10" ry="5" fill="#FFB3C6" opacity="0.55" />
      <ellipse cx="142" cy="106" rx="10" ry="5" fill="#FFB3C6" opacity="0.55" />

      <path className="shofah-smile" d="M102 112 Q110 120 118 112" stroke="#C97A50" strokeWidth="3" fill="none" strokeLinecap="round" />

      <g className="shofah-heart" style={{ transformOrigin: "180px 50px" }}>
        <path d="M176 50 Q176 42 182 42 Q188 42 188 50 Q188 58 176 66 Q164 58 164 50 Q164 42 170 42 Q176 42 176 50" fill="#FF6B9D" opacity="0.7" />
      </g>
      <g fill="#FFD400">
        <path d="M38 60 l2 6 6 2 -6 2 -2 6 -2-6 -6-2 6-2z" opacity="0.7" />
        <path d="M178 100 l1.5 4 4 1.5 -4 1.5 -1.5 4 -1.5-4 -4-1.5 4-1.5z" opacity="0.5" />
      </g>
    </svg>
  );
}
