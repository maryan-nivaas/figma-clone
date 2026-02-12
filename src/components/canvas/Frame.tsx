import { type FrameLayer } from "~/types";
import { colorToCss, layerTransform, shadowToCss } from "~/utils";

export default function Frame({
  id,
  layer,
  onPointerDown,
}: {
  id: string;
  layer: FrameLayer;
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
    strokeAlign,
    opacity,
    cornerRadius,
    rotation,
    shadow,
  } = layer;

  const normalizedStrokeWidth = Math.max(0, strokeWidth ?? 1);
  const align = strokeAlign ?? "center";
  const inset =
    align === "inside"
      ? normalizedStrokeWidth / 2
      : align === "outside"
        ? -normalizedStrokeWidth / 2
        : 0;

  const strokeRectWidth = Math.max(0, width - inset * 2);
  const strokeRectHeight = Math.max(0, height - inset * 2);
  const radius = cornerRadius ?? 0;
  const strokeRadius = Math.max(0, radius - inset);

  return (
    <g
      className="group"
      transform={layerTransform(x, y, width, height, rotation ?? 0)}
      style={{
        filter: shadowToCss(shadow),
        opacity: (opacity ?? 100) / 100,
      }}
    >
      <rect
        width={width}
        height={height}
        fill="none"
        stroke="#0b99ff"
        strokeWidth={1}
        className="pointer-events-none opacity-0 group-hover:opacity-100"
      />
      <rect
        width={width}
        height={height}
        fill={fill ? colorToCss(fill) : "#9e55fe"}
        fillOpacity={(fillOpacity ?? 100) / 100}
        rx={radius}
        ry={radius}
      />
      <rect
        x={inset}
        y={inset}
        width={strokeRectWidth}
        height={strokeRectHeight}
        fill="none"
        stroke={stroke ? colorToCss(stroke) : "#ffffff"}
        strokeOpacity={(strokeOpacity ?? 100) / 100}
        strokeWidth={normalizedStrokeWidth}
        rx={strokeRadius}
        ry={strokeRadius}
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
