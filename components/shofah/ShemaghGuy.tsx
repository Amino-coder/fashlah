export default function ShemaghGuy({
  size = 140,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg width={size} height={size} viewBox="0 0 140 140" className={`shofah-tilt ${className}`}>
      {/* thobe / shoulders */}
      <path d="M20 138 Q20 92 70 88 Q120 92 120 138 Z" fill="#FFFDF7" stroke="#e5e0d0" strokeWidth="1" />
      {/* face */}
      <ellipse cx="70" cy="66" rx="34" ry="36" fill="#F2B98A" />
      {/* shemagh (red/white check, simplified) */}
      <path d="M24 58 Q24 4 70 4 Q116 4 116 58 L124 100 Q70 116 16 100 Z" fill="#fff" />
      <g opacity="0.9">
        <path d="M30 20 L110 20" stroke="#E63946" strokeWidth="4" />
        <path d="M26 36 L114 36" stroke="#E63946" strokeWidth="4" />
        <path d="M22 92 L36 108 M40 90 L54 108 M58 88 L72 108 M76 88 L90 108 M94 90 L108 108 M112 92 L118 100"
          stroke="#E63946" strokeWidth="3" strokeLinecap="round" />
      </g>
      {/* iqal (black cord ring) */}
      <ellipse cx="70" cy="18" rx="44" ry="9" fill="none" stroke="#17122B" strokeWidth="5" />
      {/* eyes */}
      <circle cx="56" cy="62" r="5" fill="#17122B" />
      <circle cx="84" cy="62" r="5" fill="#17122B" />
      <circle cx="57.5" cy="60" r="1.5" fill="#fff" />
      <circle cx="85.5" cy="60" r="1.5" fill="#fff" />
      {/* eyebrows */}
      <path d="M48 52 Q56 47 64 52" stroke="#3B2A1A" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M76 52 Q84 47 92 52" stroke="#3B2A1A" strokeWidth="3" fill="none" strokeLinecap="round" />
      {/* mustache */}
      <path className="shofah-smile" d="M52 80 Q60 74 70 80 Q80 74 88 80 Q80 86 70 82 Q60 86 52 80 Z" fill="#3B2A1A" />
      {/* smile */}
      <path d="M58 90 Q70 98 82 90" stroke="#8C4A2F" strokeWidth="2.5" fill="none" strokeLinecap="round" />
    </svg>
  );
}
