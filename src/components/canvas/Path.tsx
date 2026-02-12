import { getStroke } from "perfect-freehand";
import { type LayerShadow } from "~/types";
import { getSvgPathFromStroke, shadowToCss } from "~/utils";

export default function Path({
  x,
  y,
  stroke,
  fill,
  fillOpacity,
  strokeOpacity,
  strokeWidth,
  opacity,
  rotation,
  shadow,
  points,
  onPointerDown,
}: {
  x: number;
  y: number;
  stroke?: string;
  fill: string;
  fillOpacity?: number;
  strokeOpacity?: number;
  strokeWidth?: number;
  opacity: number;
  rotation?: number;
  shadow?: LayerShadow;
  points: number[][];
  onPointerDown?: (e: React.PointerEvent) => void;
}) {
  const pathData = getSvgPathFromStroke(
    getStroke(points, {
      size: 16,
      thinning: 0.5,
      smoothing: 0.5,
      streamline: 0.5,
    }),
  );

  return (
    <g
      className="group"
      transform={`translate(${x} ${y}) rotate(${rotation ?? 0})`}
      style={{
        filter: shadowToCss(shadow),
        opacity: (opacity ?? 100) / 100,
      }}
    >
      <path
        className="pointer-events-none opacity-0 group-hover:opacity-100"
        d={pathData}
        fill="none"
        stroke="#0b99ff"
        strokeWidth={1}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        onPointerDown={onPointerDown}
        d={pathData}
        fill={fill}
        fillOpacity={(fillOpacity ?? 100) / 100}
        stroke={stroke ?? "#CCC"}
        strokeOpacity={(strokeOpacity ?? 100) / 100}
        strokeWidth={Math.max(0, strokeWidth ?? 1)}
      />
    </g>
  );
}
