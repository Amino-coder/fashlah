// مرعي — the guy character. Gradient IDs are prefixed "g5" so they can't
// collide with PatientGirl's defs when both render on the same page (the
// Mareed landing page shows them side by side around the ring emoji).
export default function PatientGuy({
  size = 140,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg width={size} height={size} viewBox="0 0 240 250" className={`mareed-float ${className}`}>
      <defs>
        <radialGradient id="g5Skin" cx="38%" cy="32%">
          <stop offset="0%" stopColor="#FFD3A8" />
          <stop offset="100%" stopColor="#E9A16E" />
        </radialGradient>
        <linearGradient id="g5Cloth" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#F0E9E2" />
        </linearGradient>
        <pattern id="g5Check" width="15" height="15" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width="15" height="15" fill="url(#g5Cloth)" />
          <rect width="7.5" height="7.5" fill="#E23B47" opacity=".82" rx="1.5" />
          <rect x="7.5" y="7.5" width="7.5" height="7.5" fill="#E23B47" opacity=".82" rx="1.5" />
        </pattern>
        <linearGradient id="g5Thobe" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#EDE6DC" />
        </linearGradient>
      </defs>

      {/* ground shadow */}
      <ellipse cx="120" cy="240" rx="62" ry="8" fill="#E63946" opacity=".12" />

      {/* body + arms */}
      <path d="M74 238 Q74 196 120 190 Q166 196 166 238 Z" fill="url(#g5Thobe)" stroke="#E0D6C8" strokeWidth="2" />
      <path d="M80 208 Q54 198 46 210" stroke="#E9A16E" strokeWidth="11" fill="none" strokeLinecap="round" />
      <path d="M160 208 Q188 194 196 206" stroke="#E9A16E" strokeWidth="11" fill="none" strokeLinecap="round" />
      <circle cx="44" cy="212" r="9" fill="url(#g5Skin)" />
      <circle cx="198" cy="207" r="9" fill="url(#g5Skin)" />

      {/* rose — he is trying far too hard */}
      <path d="M198 200 L198 182" stroke="#3E8E5A" strokeWidth="3" strokeLinecap="round" />
      <circle cx="198" cy="176" r="8" fill="#E23B47" />
      <circle cx="196" cy="174" r="4" fill="#F4626C" />

      {/* head + ears */}
      <circle cx="120" cy="105" r="60" fill="url(#g5Skin)" />
      <circle cx="60" cy="112" r="10" fill="#E9A16E" />
      <circle cx="180" cy="112" r="10" fill="#E9A16E" />

      <g className="mareed-sway">
        {/* shemagh: back drape, then the face-framing layer over it */}
        <path d="M52 108 Q48 40 120 30 Q192 40 188 108 L200 190 Q160 178 120 180 Q80 178 40 190 Z" fill="url(#g5Check)" />
        <path d="M66 100 Q64 60 120 52 Q176 60 174 100 Q176 150 168 168 L192 186 Q158 174 120 176 Q82 174 48 186 L72 168 Q64 150 66 100 Z" fill="url(#g5Check)" />
        {/* contact shadow so the cloth sits ON the face, not beside it */}
        <path d="M70 94 Q120 60 170 94" fill="none" stroke="#C9B9A6" strokeWidth="3" opacity=".45" />
        {/* round face opening */}
        <ellipse cx="120" cy="112" rx="52" ry="53" fill="url(#g5Skin)" />
        {/* doubled iqal cord */}
        <ellipse cx="120" cy="42" rx="56" ry="12" fill="none" stroke="#241C33" strokeWidth="9" />
        <ellipse cx="120" cy="50" rx="55" ry="11" fill="none" stroke="#3A2F52" strokeWidth="7" opacity=".85" />
      </g>

      {/* one raised brow — most of the personality lives here */}
      <path d="M84 92 Q98 80 114 90" stroke="#3A2415" strokeWidth="6" fill="none" strokeLinecap="round" />
      <path d="M128 88 Q144 74 158 86" stroke="#3A2415" strokeWidth="6" fill="none" strokeLinecap="round" />

      <g className="mareed-blink" style={{ transformOrigin: "120px 112px" }}>
        <ellipse cx="99" cy="112" rx="13" ry="14" fill="#fff" />
        <circle cx="101" cy="114" r="8.5" fill="#2A1B33" />
        <circle cx="104" cy="110" r="3.4" fill="#fff" />
        <circle cx="98" cy="118" r="1.6" fill="#fff" opacity=".8" />
        <ellipse cx="143" cy="112" rx="13" ry="14" fill="#fff" />
        <circle cx="145" cy="114" r="8.5" fill="#2A1B33" />
        <circle cx="148" cy="110" r="3.4" fill="#fff" />
        <circle cx="142" cy="118" r="1.6" fill="#fff" opacity=".8" />
      </g>

      <path d="M120 120 Q115 132 122 135" stroke="#C8845A" strokeWidth="3.5" fill="none" strokeLinecap="round" />
      <ellipse cx="82" cy="134" rx="12" ry="6.5" fill="#F4626C" opacity=".32" />
      <ellipse cx="160" cy="134" rx="12" ry="6.5" fill="#F4626C" opacity=".32" />

      {/* big curled handlebar mustache */}
      <path d="M120 146 Q104 136 88 142 Q72 149 70 136 Q69 126 78 130 Q86 137 94 132"
        stroke="#2E1D10" strokeWidth="9" fill="none" strokeLinecap="round" />
      <path d="M120 146 Q136 136 152 142 Q168 149 170 136 Q171 126 162 130 Q154 137 146 132"
        stroke="#2E1D10" strokeWidth="9" fill="none" strokeLinecap="round" />
      <path d="M106 159 Q122 170 138 156" stroke="#9E4F2E" strokeWidth="4" fill="none" strokeLinecap="round" />

      <g fill="#FFC93C">
        <path className="mareed-twinkle" d="M32 76 l3 8 8 3 -8 3 -3 8 -3-8 -8-3 8-3z" />
        <path className="mareed-twinkle-b" d="M208 118 l2 6 6 2 -6 2 -2 6 -2-6 -6-2 6-2z" />
      </g>
    </svg>
  );
}
