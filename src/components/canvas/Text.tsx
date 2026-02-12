import { useMutation } from "~/lib/liveblocks";
import { useEffect, useRef, useState } from "react";
import { type TextLayer } from "~/types";
import { colorToCss, layerTransform, shadowToCss } from "~/utils";

export default function Text({
  id,
  layer,
  onPointerDown,
}: {
  id: string;
  layer: TextLayer;
  onPointerDown: (e: React.PointerEvent, layerId: string) => void;
}) {
  const {
    x = 0,
    y = 0,
    width,
    height,
    text,
    fontSize,
    fill,
    stroke,
    fillOpacity,
    strokeOpacity,
    strokeWidth,
    opacity,
    fontFamily,
    fontWeight,
    rotation,
    shadow,
  } = layer;

  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(text);
  const inputRef = useRef<HTMLInputElement>(null);

  const updateText = useMutation(
    ({ storage }, newText: string) => {
      const liveLayers = storage.get("layers");
      const layer = liveLayers.get(id);
      if (layer) {
        layer.update({ text: newText });
      }
    },
    [id],
  );

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleDoubleClick = () => {
    setIsEditing(true);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleBlur = () => {
    setIsEditing(false);
    updateText(inputValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      setIsEditing(false);
      updateText(inputValue);
    }
  };

  return (
    <g
      className="group"
      onDoubleClick={handleDoubleClick}
      transform={layerTransform(x, y, width, height, rotation ?? 0)}
      style={{
        filter: shadowToCss(shadow),
        opacity: (opacity ?? 100) / 100,
      }}
    >
      {isEditing ? (
        <foreignObject
          x={0}
          y={0}
          width={Math.max(width, 120)}
          height={Math.max(height, fontSize + 16)}
        >
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={handleChange}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            style={{
              fontSize: `${fontSize}px`,
              color: colorToCss(fill),
              width: "100%",
              border: "none",
              outline: "none",
              background: "transparent",
            }}
          />
        </foreignObject>
      ) : (
        <>
          <rect
            width={Math.max(width, 8)}
            height={Math.max(height, 8)}
            fill="none"
            stroke="#0b99ff"
            strokeWidth={1}
            className="pointer-events-none opacity-0 group-hover:opacity-100"
          />
          <rect
            onPointerDown={(e) => onPointerDown(e, id)}
            width={Math.max(width, 8)}
            height={Math.max(height, 8)}
            fill="transparent"
          />
          <text
            onPointerDown={(e) => onPointerDown(e, id)}
            x={0}
            y={fontSize}
            fontSize={fontSize}
            fill={colorToCss(fill)}
            fillOpacity={(fillOpacity ?? 100) / 100}
            stroke={colorToCss(stroke)}
            strokeOpacity={(strokeOpacity ?? 100) / 100}
            strokeWidth={Math.max(0, strokeWidth ?? 0)}
            fontFamily={fontFamily}
            fontWeight={fontWeight}
          >
            {text}
          </text>
        </>
      )}
    </g>
  );
}
