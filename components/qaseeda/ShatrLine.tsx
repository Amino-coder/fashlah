import { SHATR_SEPARATOR } from "@/lib/qaseeda-poem";

const GOLD = "#D9A441";

/**
 * `fontSize` is a ceiling, not a fixed size — the actual rendered size
 * scales down as the combined line gets longer. Famous أبيات run
 * noticeably longer than a quick round submission, so a single fixed size
 * either looks too small for short lines or wraps awkwardly for long ones;
 * scaling by length keeps both looking intentional and gives long lines a
 * real shot at fitting on one line instead of wrapping mid-word.
 */
function scaledFontSize(combinedLength: number, ceiling: number): number {
  let scale = 1;
  if (combinedLength > 70) scale = 0.62;
  else if (combinedLength > 55) scale = 0.72;
  else if (combinedLength > 42) scale = 0.82;
  else if (combinedLength > 30) scale = 0.92;
  return Math.max(12, Math.round(ceiling * scale));
}

/**
 * Renders "شطر ١  ❖  شطر ٢" as one flowing, RTL-correct line (first
 * hemistich on the right, second on the left, matching how a بيت is
 * traditionally printed) rather than stacking them as two paragraphs.
 * A single <p> with normal text flow, so an unusually long custom line
 * still wraps gracefully instead of needing manual layout math.
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
  const combinedLength = line1.length + (line2 ? line2.length + 3 : 0);
  const size = scaledFontSize(combinedLength, fontSize);

  return (
    <p
      dir="rtl"
      className={className}
      style={{ fontSize: size, fontWeight: weight, lineHeight: 1.65, margin: 0, color }}
    >
      {line1}
      {line2 && (
        <span
          aria-hidden="true"
          style={{ color: GOLD, fontSize: size * 0.6, margin: "0 10px", opacity: 0.85 }}
        >
          {" "}{SHATR_SEPARATOR}{" "}
        </span>
      )}
      {line2}
    </p>
  );
}
