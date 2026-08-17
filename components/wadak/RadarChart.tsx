"use client";

import { DIMENSION_LABELS, type Dimension } from "@/lib/wadak-content";

const ORDER: Dimension[] = ["spontaneity", "overthinking", "comfort", "recklessness", "drama", "control"];

/**
 * Hexagonal radar/web chart — 6 axes, one per dimension. Pure SVG, reused
 * as-is by the canvas card export (see exportResultCard.ts, which draws
 * the same geometry directly onto canvas rather than re-rendering this
 * component, since canvas export can't embed a React component).
 *
 * AMPLITUDE: a plain `r = (pct/100) * maxR` mapping (the previous version)
 * makes every score look small and centered — even a 100% score only
 * reaches maxR, and anything in a realistic 30-70% middle range sits
 * timidly near the center, which is exactly the "tiny shape in the
 * middle" this was rewritten to fix. RADIUS_FLOOR gives every dimension
 * a minimum radius regardless of score (so nothing ever collapses toward
 * the center point), and the remaining 0-100% range is stretched across
 * the space between that floor and the outer edge. This is a plain
 * linear (affine) rescale, not a curve — equal score DIFFERENCES between
 * dimensions still map to equal visual gaps, just stretched by a bigger
 * constant factor, so relative proportions between dimensions are
 * unchanged; only how much of the chart's area gets used is different.
 * The underlying scores/percentages themselves are never touched here.
 */
const RADIUS_FLOOR = 0.34; // every dimension's minimum radius, as a fraction of maxR

export function radarPoints(percentages: Record<Dimension, number>, cx: number, cy: number, maxR: number) {
  return ORDER.map((dim, i) => {
    const angle = (Math.PI * 2 * i) / ORDER.length - Math.PI / 2;
    const pct = percentages[dim] / 100;
    const r = (RADIUS_FLOOR + pct * (1 - RADIUS_FLOOR)) * maxR;
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle), dim, angle };
  });
}

export default function RadarChart({
  percentages, size = 320, fill = "#14B8A6", stroke = "#FFF9F0", labelColor = "#FFF9F0",
}: {
  percentages: Record<Dimension, number>;
  size?: number;
  fill?: string;
  stroke?: string;
  labelColor?: string;
}) {
  // Bigger fraction of the SVG's own size than before (0.32 → 0.36) —
  // combined with the floor above, this uses much more of the available
  // chart area. Deliberately not pushed higher than 0.36: the axis
  // labels are drawn just outside maxR (see the label offset below), and
  // the viewBox only has size/2 of radius total to work with — going
  // much further would start clipping the labels against the SVG edge.
  const cx = size / 2, cy = size / 2, maxR = size * 0.36;
  const rings = [0.25, 0.5, 0.75, 1];
  const dataPoints = radarPoints(percentages, cx, cy, maxR);
  const dataPath = dataPoints.map((p) => `${p.x},${p.y}`).join(" ");

  return (
    <svg viewBox={`0 0 ${size} ${size}`} width="100%" style={{ maxWidth: size }}>
      {rings.map((r, i) => {
        const pts = ORDER.map((_, idx) => {
          const angle = (Math.PI * 2 * idx) / ORDER.length - Math.PI / 2;
          return `${cx + maxR * r * Math.cos(angle)},${cy + maxR * r * Math.sin(angle)}`;
        }).join(" ");
        return <polygon key={i} points={pts} fill="none" stroke={stroke} strokeOpacity={0.25} strokeWidth={1.5} />;
      })}
      {ORDER.map((dim, i) => {
        const angle = (Math.PI * 2 * i) / ORDER.length - Math.PI / 2;
        const x2 = cx + maxR * Math.cos(angle), y2 = cy + maxR * Math.sin(angle);
        return <line key={dim} x1={cx} y1={cy} x2={x2} y2={y2} stroke={stroke} strokeOpacity={0.25} strokeWidth={1.5} />;
      })}
      <polygon points={dataPath} fill={fill} fillOpacity={0.55} stroke={fill} strokeWidth={3} strokeLinejoin="round" />
      {dataPoints.map((p) => (
        <circle key={p.dim} cx={p.x} cy={p.y} r={5} fill={fill} stroke={stroke} strokeWidth={2} />
      ))}
      {ORDER.map((dim, i) => {
        const angle = (Math.PI * 2 * i) / ORDER.length - Math.PI / 2;
        // Proportional offset, not a fixed pixel value — a fixed offset
        // was sized for the old, smaller maxR and would sit too close to
        // (or past) the viewBox edge now that maxR is bigger; scaling
        // with `size` keeps the same safe margin at every chart size.
        const labelR = maxR + size * 0.075;
        const lx = cx + labelR * Math.cos(angle);
        const ly = cy + labelR * Math.sin(angle);
        return (
          <text key={dim} x={lx} y={ly} textAnchor="middle" dominantBaseline="middle" fontSize={size * 0.036} fontWeight={700} fill={labelColor} fontFamily="Tajawal, sans-serif">
            {DIMENSION_LABELS[dim]}
          </text>
        );
      })}
    </svg>
  );
}
