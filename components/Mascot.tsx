export default function Mascot({
  mood = "happy",
  size = 72,
  className = "",
}: {
  mood?: "happy" | "excited" | "wink";
  size?: number;
  className?: string;
}) {
  const wink = mood === "wink";
  const excited = mood === "excited";
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className={className}>
      <path d="M50 8 C54 18 60 20 58 28 C54 24 46 24 42 28 C40 20 46 18 50 8 Z" fill="#FFD400" />
      <ellipse cx="50" cy="58" rx="36" ry="32" fill="#2EE6A6" />
      <circle cx="37" cy="52" r="9" fill="white" />
      {wink ? (
        <path d="M30 52 Q37 58 44 52" stroke="#17122B" strokeWidth={3} fill="none" strokeLinecap="round" />
      ) : (
        <circle cx={excited ? 39 : 37} cy="53" r="4" fill="#17122B" />
      )}
      <circle cx="63" cy="52" r="9" fill="white" />
      <circle cx={excited ? 65 : 63} cy="53" r="4" fill="#17122B" />
      <path
        d={excited ? "M38 68 Q50 82 62 68" : "M38 68 Q50 76 62 68"}
        stroke="#17122B" strokeWidth={4} fill="none" strokeLinecap="round"
      />
      <circle cx="24" cy="62" r="5" fill="#FF2E93" opacity={0.6} />
      <circle cx="76" cy="62" r="5" fill="#FF2E93" opacity={0.6} />
    </svg>
  );
}
