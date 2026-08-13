/**
 * Renders one line of the song. Unlike قصيدة's ShatrLine (which prints a
 * بيت's two hemistichs side by side with a ❖ separator, the traditional
 * way poetry is typeset), a song's opening verse is naturally TWO
 * separate lines stacked vertically — exactly how every example in the
 * spec is written out — so line1/line2 here are two stacked <p>s instead
 * of one flowing line. Round submissions only ever have line1 (line2 is
 * always null), so they render as a single line automatically.
 */
function scaledFontSize(longestLineLength: number, ceiling: number): number {
  let scale = 1;
  if (longestLineLength > 55) scale = 0.68;
  else if (longestLineLength > 42) scale = 0.8;
  else if (longestLineLength > 30) scale = 0.9;
  return Math.max(13, Math.round(ceiling * scale));
}

export default function SongLine({
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
  const longest = Math.max(line1.length, line2?.length ?? 0);
  const size = scaledFontSize(longest, fontSize);

  return (
    <div dir="rtl" style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <p className={className} style={{ fontSize: size, fontWeight: weight, lineHeight: 1.6, margin: 0, color }}>
        {line1}
      </p>
      {line2 && (
        <p className={className} style={{ fontSize: size, fontWeight: weight, lineHeight: 1.6, margin: 0, color }}>
          {line2}
        </p>
      )}
    </div>
  );
}
