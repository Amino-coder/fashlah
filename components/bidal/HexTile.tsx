"use client";

const INK = "#17122B";

/**
 * A single hexagon letter tile. Border is faked with a slightly larger
 * ink-colored hex behind a smaller colored one — clip-path doesn't
 * support a real border, and this is the same two-layer trick used
 * elsewhere in the app for bordered circular icons.
 *
 * `used` renders the tile as an empty gap — a faint, non-interactive hex
 * silhouette left behind at the letter's original spot in the hand once
 * it's been played. This is deliberate: the honeycomb is a fixed set of
 * 15 positions for the whole game, not a list that shrinks, so a used
 * letter's slot stays exactly where it was instead of the remaining
 * letters sliding over to fill the hole.
 */
export default function HexTile({
  letter, size = 58, bg = "var(--card)", color = "var(--ink)", selected = false, dimmed = false, dragging = false, used = false,
  onPointerDown, onClick, style,
}: {
  letter: string;
  size?: number;
  bg?: string;
  color?: string;
  selected?: boolean;
  dimmed?: boolean;
  dragging?: boolean;
  used?: boolean;
  onPointerDown?: (e: React.PointerEvent) => void;
  onClick?: () => void;
  style?: React.CSSProperties;
}) {
  const hexClip = "polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)";
  const borderPad = 4;

  if (used) {
    return (
      <div
        aria-hidden="true"
        style={{
          width: size, height: size * 0.88, clipPath: hexClip,
          background: "var(--ring)", opacity: 0.28,
          userSelect: "none", WebkitUserSelect: "none", pointerEvents: "none",
          ...style,
        }}
      />
    );
  }

  return (
    <div
      onPointerDown={onPointerDown}
      onClick={onClick}
      style={{
        width: size, height: size * 0.88, clipPath: hexClip, background: INK,
        display: "flex", alignItems: "center", justifyContent: "center",
        touchAction: "none", cursor: onPointerDown || onClick ? "pointer" : "default",
        opacity: dimmed ? 0.35 : dragging ? 0.25 : 1,
        transform: selected ? "scale(1.08) translateY(-4px)" : "scale(1)",
        transition: "transform .12s, opacity .12s",
        boxShadow: selected ? "0 6px 14px rgba(0,0,0,0.3)" : "none",
        userSelect: "none", WebkitUserSelect: "none",
        ...style,
      }}
    >
      <div
        style={{
          width: size - borderPad * 2, height: size * 0.88 - borderPad * 2, clipPath: hexClip,
          background: selected ? `linear-gradient(135deg, #FFD400, #FF8A3D)` : bg,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}
      >
        <span className="font-display" style={{ fontSize: size * 0.4, fontWeight: 800, color: selected ? INK : color }}>
          {letter}
        </span>
      </div>
    </div>
  );
}
