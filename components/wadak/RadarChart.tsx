"use client";

import { DIMENSION_LABELS, type Dimension } from "@/lib/wadak-content";

const ORDER: Dimension[] = ["spontaneity", "overthinking", "comfort", "recklessness", "drama", "control"];

/** Hexagonal radar/web chart — 6 axes, one per dimension. Pure SVG, reused
 *  as-is by the canvas card export (see exportResultCard.ts, which draws
 *  the same geometry directly onto canvas rather than re-rendering this
 *  component, since canvas export can't embed a React component). */
export function radarPoints(percentages: Record<Dimension, number>, cx: number, cy: number, maxR: number) {
  return ORDER.map((dim, i) => {
    const angle = (Math.PI * 2 * i) / ORDER.length - Math.PI / 2;
    const r = (percentages[dim] / 100) * maxR;
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
  const cx = size / 2, cy = size / 2, maxR = size * 0.32;
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
        const lx = cx + (maxR + 34) * Math.cos(angle);
        const ly = cy + (maxR + 34) * Math.sin(angle);
        return (
          <text key={dim} x={lx} y={ly} textAnchor="middle" dominantBaseline="middle" fontSize={size * 0.036} fontWeight={700} fill={labelColor} fontFamily="Tajawal, sans-serif">
            {DIMENSION_LABELS[dim]}
          </text>
        );
      })}
    </svg>
  );
}
