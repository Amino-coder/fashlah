// The interviewer — a guy in a suit behind a desk, sizing you up.
//
// Drawn in the same flat-vector style as Shofah's ShemaghGuy/NiqabGirl
// (radial-gradient skin, oversized expressive eyes, idle blink, a couple of
// twinkles) so the two games feel like they come from the same place, just
// recoloured to the blue palette. Gradient IDs are prefixed "j7" so they
// can't collide with the Shofah characters' defs if both ever render on the
// same page.
//
// Composition order matters: torso and arms are drawn first, then the head,
// then the desk on top — so the desk properly occludes the body and he
// reads as sitting *behind* it rather than floating in front.
export default function SuitGuy({
  size = 140,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg width={size} height={size} viewBox="0 0 240 250" className={`job-float ${className}`}>
      <defs>
        <radialGradient id="j7Skin" cx="38%" cy="32%">
          <stop offset="0%" stopColor="#FFD3A8" />
          <stop offset="100%" stopColor="#E9A16E" />
        </radialGradient>
        <linearGradient id="j7Suit" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2D4A8A" />
          <stop offset="100%" stopColor="#1E3366" />
        </linearGradient>
        <linearGradient id="j7Shirt" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#E8EEF7" />
        </linearGradient>
        <linearGradient id="j7Desk" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#8C6647" />
          <stop offset="100%" stopColor="#6B4A32" />
        </linearGradient>
        <linearGradient id="j7Tie" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#60A5FA" />
          <stop offset="100%" stopColor="#3B82F6" />
        </linearGradient>
      </defs>

      {/* ground shadow */}
      <ellipse cx="120" cy="243" rx="76" ry="7" fill="#3B82F6" opacity=".14" />

      {/* ---- torso, drawn before the desk so the desk overlaps it ---- */}
      {/* neck */}
      <rect x="108" y="138" width="24" height="26" rx="10" fill="#E9A16E" />

      {/* suit shoulders */}
      <path d="M64 214 Q66 166 100 156 L140 156 Q174 166 176 214 Z" fill="url(#j7Suit)" />

      {/* shirt V + lapels */}
      <path d="M100 156 L120 186 L140 156 Q132 150 120 150 Q108 150 100 156 Z" fill="url(#j7Shirt)" />
      <path d="M100 156 L120 186 L104 200 Q92 176 96 160 Z" fill="#24407A" />
      <path d="M140 156 L120 186 L136 200 Q148 176 144 160 Z" fill="#24407A" />

      {/* tie */}
      <path d="M120 168 L127 176 L124 206 L120 210 L116 206 L113 176 Z" fill="url(#j7Tie)" />
      <path d="M120 162 L126 169 L120 174 L114 169 Z" fill="#2563EB" />

      {/* arms reaching toward the desk */}
      <path d="M72 196 Q58 206 62 216" stroke="#24407A" strokeWidth="15" fill="none" strokeLinecap="round" />
      <path d="M168 196 Q182 206 178 216" stroke="#24407A" strokeWidth="15" fill="none" strokeLinecap="round" />

      {/* ---- head ---- */}
      <circle cx="120" cy="92" r="53" fill="url(#j7Skin)" />
      <circle cx="68" cy="98" r="9.5" fill="#E9A16E" />
      <circle cx="172" cy="98" r="9.5" fill="#E9A16E" />

      {/* tidy business haircut with a side part */}
      <path d="M68 84 Q66 36 120 34 Q176 36 172 84 Q166 60 138 54 Q104 48 86 62 Q72 70 68 84 Z" fill="#2E2320" />
      <path d="M86 62 Q108 46 142 56" stroke="#3E312C" strokeWidth="5" fill="none" strokeLinecap="round" />

      {/* brows — one raised, the "go on, impress me" look */}
      <path d="M88 78 Q101 68 115 76" stroke="#3A2415" strokeWidth="5.5" fill="none" strokeLinecap="round" />
      <path d="M127 74 Q142 62 155 72" stroke="#3A2415" strokeWidth="5.5" fill="none" strokeLinecap="round" />

      <g className="job-blink" style={{ transformOrigin: "120px 98px" }}>
        <ellipse cx="101" cy="98" rx="12.5" ry="13.5" fill="#fff" />
        <circle cx="103" cy="100" r="8" fill="#2A1B33" />
        <circle cx="106" cy="96" r="3.2" fill="#fff" />
        <ellipse cx="141" cy="98" rx="12.5" ry="13.5" fill="#fff" />
        <circle cx="143" cy="100" r="8" fill="#2A1B33" />
        <circle cx="146" cy="96" r="3.2" fill="#fff" />
      </g>

      {/* nose + faint cheeks + a small unconvinced smile */}
      <path d="M120 106 Q115 117 122 120" stroke="#C8845A" strokeWidth="3.2" fill="none" strokeLinecap="round" />
      <ellipse cx="84" cy="118" rx="11" ry="6" fill="#4F8DF7" opacity=".22" />
      <ellipse cx="158" cy="118" rx="11" ry="6" fill="#4F8DF7" opacity=".22" />
      <path d="M107 130 Q120 138 133 129" stroke="#9E4F2E" strokeWidth="4" fill="none" strokeLinecap="round" />

      {/* ---- desk, on top so he sits behind it ---- */}
      <rect x="16" y="212" width="208" height="16" rx="5" fill="url(#j7Desk)" />
      <rect x="16" y="212" width="208" height="5" rx="2.5" fill="#A17C58" opacity=".75" />
      <rect x="26" y="228" width="188" height="14" rx="4" fill="#5A3E2A" />

      {/* CV on the desk, with a couple of text ruled lines */}
      <g transform="rotate(-7 92 210)">
        <rect x="66" y="192" width="52" height="22" rx="3" fill="#FFFFFF" stroke="#D3DCEA" strokeWidth="1.5" />
        <rect x="72" y="197" width="30" height="2.6" rx="1.3" fill="#9DB0CC" />
        <rect x="72" y="202" width="38" height="2.6" rx="1.3" fill="#C2CEE0" />
        <rect x="72" y="207" width="24" height="2.6" rx="1.3" fill="#C2CEE0" />
      </g>

      {/* hand + pen, mid-note */}
      <circle cx="150" cy="206" r="9" fill="url(#j7Skin)" />
      <path d="M156 202 L172 188" stroke="#1E3366" strokeWidth="5" strokeLinecap="round" />
      <path d="M172 188 L176 184" stroke="#60A5FA" strokeWidth="5" strokeLinecap="round" />

      {/* coffee — every interviewer has one */}
      <rect x="188" y="194" width="20" height="18" rx="3" fill="#FFFFFF" stroke="#D3DCEA" strokeWidth="1.5" />
      <path d="M208 199 q7 0 7 5 t-7 5" fill="none" stroke="#D3DCEA" strokeWidth="1.5" />
      <rect x="188" y="194" width="20" height="5" rx="2" fill="#3B82F6" opacity=".55" />

      <g fill="#FFC93C">
        <path className="job-twinkle" d="M34 66 l3 8 8 3 -8 3 -3 8 -3-8 -8-3 8-3z" />
        <path className="job-twinkle-b" d="M204 96 l2 6 6 2 -6 2 -2 6 -2-6 -6-2 6-2z" />
      </g>
    </svg>
  );
}
