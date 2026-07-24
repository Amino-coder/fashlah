export default function NiqabGirl({
  size = 140,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg width={size} height={size} viewBox="0 0 140 140" className={`shofah-tilt ${className}`}>
      {/* abaya / shoulders */}
      <path d="M20 138 Q20 92 70 88 Q120 92 120 138 Z" fill="#2A2440" />
      {/* niqab head covering */}
      <path d="M32 60 Q32 8 70 8 Q108 8 108 60 L108 78 Q70 96 32 78 Z" fill="#17122B" />
      {/* eye opening band */}
      <rect x="30" y="52" width="80" height="26" rx="13" fill="#FFDDC7" />
      {/* eyes */}
      <g className="shofah-blink">
        <ellipse cx="55" cy="64" rx="9" ry="11" fill="#fff" />
        <circle cx="56" cy="65" r="5.5" fill="#17122B" />
        <circle cx="58" cy="62" r="1.6" fill="#fff" />
        <ellipse cx="85" cy="64" rx="9" ry="11" fill="#fff" />
        <circle cx="86" cy="65" r="5.5" fill="#17122B" />
        <circle cx="88" cy="62" r="1.6" fill="#fff" />
      </g>
      {/* lashes */}
      <path d="M46 55 L42 51" stroke="#17122B" strokeWidth="2" strokeLinecap="round" />
      <path d="M94 55 L98 51" stroke="#17122B" strokeWidth="2" strokeLinecap="round" />
      {/* gold trim accent */}
      <path d="M32 60 Q70 74 108 60" stroke="#FFD400" strokeWidth="2.5" fill="none" opacity="0.85" />
    </svg>
  );
}
