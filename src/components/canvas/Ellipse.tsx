import { type EllipseLayer } from "~/types";
import { colorToCss, layerTransform, shadowToCss } from "~/utils";

export default function Ellipse({
  id,
  layer,
  onPointerDown,
}: {
  id: string;
  layer: EllipseLayer;
  onPointerDown: (e: React.PointerEvent, layerId: string) => void;
}) {
  const {
    x,
    y,
    width,
    height,
    fill,
    stroke,
    fillOpacity,
    strokeOpacity,
    strokeWidth,
    opacity,
    rotation,
    shadow,
  } = layer;

  const normalizedStrokeWidth = Math.max(0, strokeWidth ?? 1);

  return (
    <g
      className="group"
      transform={layerTransform(x, y, width, height, rotation ?? 0)}
      style={{
        filter: shadowToCss(shadow),
        opacity: (opacity ?? 100) / 100,
      }}
    >
      <ellipse
        cx={width / 2}
        cy={height / 2}
        rx={width / 2}
        ry={height / 2}
        fill="none"
        stroke="#0b99ff"
        strokeWidth={1}
        className="pointer-events-none opacity-0 group-hover:opacity-100"
      />
      <ellipse
        fill={fill ? colorToCss(fill) : "#CCC"}
        fillOpacity={(fillOpacity ?? 100) / 100}
        stroke={stroke ? colorToCss(stroke) : "#CCC"}
        strokeOpacity={(strokeOpacity ?? 100) / 100}
        cx={width / 2}
        cy={height / 2}
        rx={width / 2}
        ry={height / 2}
        strokeWidth={normalizedStrokeWidth}
      />
      <rect
        onPointerDown={(e) => onPointerDown(e, id)}
        width={Math.max(width, 8)}
        height={Math.max(height, 8)}
        fill="transparent"
      />
    </g>
  );
}
