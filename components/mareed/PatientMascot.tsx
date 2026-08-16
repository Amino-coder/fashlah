/**
 * Replaces PatientGirl/PatientGuy everywhere they were used as a
 * decorative mascot during gameplay (RoundScreen, FinalConversation,
 * FinalReveal, solo mode). There's no player-chosen avatar anymore —
 * this renders the same 🧠 the rest of the game already uses, at
 * whatever size the call site asks for, so every `<Character size={N}/>`
 * call site across the game keeps working unchanged even though what
 * `Character` actually IS was swapped out underneath it.
 */
export default function PatientMascot({ size = 100 }: { size?: number }) {
  return (
    <span
      role="img"
      aria-label="🧠"
      style={{ fontSize: size * 0.72, lineHeight: 1, display: "inline-block" }}
    >
      🧠
    </span>
  );
}
