import { SHATR_SEPARATOR } from "@/lib/qaseeda-poem";

const GOLD = "#D9A441";

/**
 * Renders "شطر ١  ❖  شطر ٢" as one flowing, RTL-correct line (first
 * hemistich on the right, second on the left, matching how a بيت is
 * traditionally printed) rather than stacking them as two paragraphs.
 * A single <p> with normal text flow, so long custom lines still wrap
 * naturally instead of needing manual layout math.
 */
export default function ShatrLine({
  line1,
  line2,
  fontSize = 18,
  color = "var(--ink)",
  className = "font-quote",
  weight = 600,
}: {
  line1: string;
  line2?: string | null;
  fontSize?: number;
  color?: string;
  className?: string;
  weight?: number;
}) {
  return (
    <p
      dir="rtl"
      className={className}
      style={{ fontSize, fontWeight: weight, lineHeight: 1.75, margin: 0, color }}
    >
      {line1}
      {line2 && (
        <span
          aria-hidden="true"
          style={{ color: GOLD, fontSize: fontSize * 0.6, margin: "0 12px", opacity: 0.85 }}
        >
          {" "}{SHATR_SEPARATOR}{" "}
        </span>
      )}
      {line2}
    </p>
  );
}
