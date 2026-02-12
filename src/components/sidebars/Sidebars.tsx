"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useSelf, useStorage } from "~/lib/liveblocks";
import { type Color, type Layer, type LayerShadow, LayerType, type StrokeAlign } from "~/types";
import { colorToCss, connectionIdToColor, hexToRgb } from "~/utils";
import { AiOutlineFontSize } from "react-icons/ai";
import { IoEllipseOutline, IoSquareOutline } from "react-icons/io5";
import {
  PiFrameCornersBold,
  PiPathLight,
  PiSidebarSimpleThin,
} from "react-icons/pi";
import { BiChevronDown } from "react-icons/bi";
import {
  FiAlignCenter,
  FiAlignLeft,
  FiAlignRight,
  FiCheck,
  FiCode,
  FiColumns,
  FiCopy,
  FiDroplet,
  FiEye,
  FiGrid,
  FiLayout,
  FiMaximize2,
  FiMinus,
  FiMoon,
  FiMove,
  FiPlus,
  FiRotateCw,
  FiSliders,
} from "react-icons/fi";
import UserAvatar from "./UserAvatar";

type LeftTab = "file" | "assets";
type RightTab = "design" | "prototype";

type LayerUpdates = {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  rotation?: number;
  opacity?: number;
  cornerRadius?: number;
  clipContent?: boolean;
  fill?: string;
  fillOpacity?: number;
  stroke?: string;
  strokeOpacity?: number;
  strokeWidth?: number;
  strokeAlign?: StrokeAlign;
  fontSize?: number;
  fontWeight?: number;
  fontFamily?: string;
  text?: string;
  shadow?: Partial<LayerShadow>;
};

const INPUT_SHELL =
  "flex h-11 w-full items-center rounded-[14px] border border-[#3b3f48] bg-[#31353d] px-3";
const TITLE_TEXT = "text-[10px] font-medium uppercase tracking-[0.08em] text-[#9fa2aa]";

const DEFAULT_SHADOW: LayerShadow = {
  enabled: false,
  x: 0,
  y: 6,
  blur: 18,
  color: { r: 0, g: 0, b: 0 },
  opacity: 24,
};

function clamp(value: number, min?: number, max?: number) {
  let next = value;
  if (min !== undefined) next = Math.max(min, next);
  if (max !== undefined) next = Math.min(max, next);
  return next;
}

function normalizeHex(value: string) {
  let normalized = value.trim();
  if (normalized.startsWith("#")) {
    normalized = normalized.slice(1);
  }

  if (normalized.length === 3) {
    normalized = normalized
      .split("")
      .map((char) => `${char}${char}`)
      .join("");
  }

  if (/^[0-9a-fA-F]{6}$/.test(normalized)) {
    return `#${normalized.toUpperCase()}`;
  }

  return null;
}

function NumberField({
  label,
  value,
  onCommit,
  min,
  max,
}: {
  label: string;
  value: number;
  onCommit: (value: number) => void;
  min?: number;
  max?: number;
}) {
  const [draft, setDraft] = useState(String(value));

  useEffect(() => {
    setDraft(String(value));
  }, [value]);

  const commit = () => {
    const parsed = Number.parseFloat(draft);
    if (Number.isNaN(parsed)) {
      setDraft(String(value));
      return;
    }

    const next = clamp(parsed, min, max);
    setDraft(String(next));
    onCommit(next);
  };

  return (
    <div className="w-full">
      <div className={INPUT_SHELL}>
        <span className="mr-2 text-[13px] font-medium text-[#9ea4ae]">{label}</span>
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              commit();
              (e.currentTarget as HTMLInputElement).blur();
            }
          }}
          className="w-full bg-transparent text-[14px] font-semibold text-[#f2f4f7] outline-none"
        />
      </div>
    </div>
  );
}

function SelectField({
  value,
  options,
  onChange,
}: {
  value: string;
  options: Array<{ label: string; value: string }>;
  onChange: (value: string) => void;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-11 w-full rounded-[14px] border border-[#3b3f48] bg-[#31353d] px-3 text-[14px] font-medium text-[#f2f4f7] outline-none"
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

function ColorField({
  value,
  onCommit,
}: {
  value: string;
  onCommit: (value: string) => void;
}) {
  const [draft, setDraft] = useState(value.toUpperCase());

  useEffect(() => {
    setDraft(value.toUpperCase());
  }, [value]);

  const commit = () => {
    const normalized = normalizeHex(draft);
    if (!normalized) {
      setDraft(value.toUpperCase());
      return;
    }

    setDraft(normalized);
    onCommit(normalized);
  };

  const colorValue = normalizeHex(draft) ?? value;

  return (
    <div className={INPUT_SHELL}>
      <label className="relative mr-2 h-7 w-7 overflow-hidden rounded-[8px] border border-white/20">
        <input
          type="color"
          value={colorValue}
          onChange={(e) => {
            const next = e.target.value.toUpperCase();
            setDraft(next);
            onCommit(next);
          }}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        />
        <span
          className="block h-full w-full"
          style={{ backgroundColor: colorValue }}
        />
      </label>
      <input
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            commit();
            (e.currentTarget as HTMLInputElement).blur();
          }
        }}
        className="w-full bg-transparent text-[14px] font-semibold uppercase text-[#f2f4f7] outline-none"
      />
    </div>
  );
}

function PaintRow({
  color,
  opacity,
  onColorCommit,
  onOpacityCommit,
}: {
  color: string;
  opacity: number;
  onColorCommit: (value: string) => void;
  onOpacityCommit: (value: number) => void;
}) {
  const [hexDraft, setHexDraft] = useState(color.toUpperCase());
  const [opacityDraft, setOpacityDraft] = useState(String(opacity));

  useEffect(() => {
    setHexDraft(color.toUpperCase());
  }, [color]);

  useEffect(() => {
    setOpacityDraft(String(opacity));
  }, [opacity]);

  const commitHex = () => {
    const normalized = normalizeHex(hexDraft);
    if (!normalized) {
      setHexDraft(color.toUpperCase());
      return;
    }
    setHexDraft(normalized);
    onColorCommit(normalized);
  };

  const commitOpacity = () => {
    const parsed = Number.parseFloat(opacityDraft);
    if (Number.isNaN(parsed)) {
      setOpacityDraft(String(opacity));
      return;
    }
    const next = clamp(parsed, 0, 100);
    setOpacityDraft(String(next));
    onOpacityCommit(next);
  };

  const activeColor = normalizeHex(hexDraft) ?? color;

  return (
    <div className="grid grid-cols-[1fr_auto_auto] gap-2">
      <div className="flex h-11 items-center overflow-hidden rounded-[14px] border border-[#3b3f48] bg-[#31353d]">
        <div className="flex min-w-0 flex-1 items-center gap-2 px-3">
          <label className="relative h-7 w-7 shrink-0 overflow-hidden rounded-[8px] border border-white/20">
            <input
              type="color"
              value={activeColor}
              onChange={(e) => {
                const next = e.target.value.toUpperCase();
                setHexDraft(next);
                onColorCommit(next);
              }}
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            />
            <span
              className="block h-full w-full"
              style={{ backgroundColor: activeColor }}
            />
          </label>
          <input
            type="text"
            value={hexDraft}
            onChange={(e) => setHexDraft(e.target.value)}
            onBlur={commitHex}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                commitHex();
                (e.currentTarget as HTMLInputElement).blur();
              }
            }}
            className="min-w-0 flex-1 bg-transparent text-[14px] font-semibold uppercase text-[#f2f4f7] outline-none"
          />
        </div>
        <div className="h-full w-px bg-[#3b3f48]" />
        <div className="flex w-[110px] items-center gap-2 px-3">
          <input
            type="text"
            value={opacityDraft}
            onChange={(e) => setOpacityDraft(e.target.value)}
            onBlur={commitOpacity}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                commitOpacity();
                (e.currentTarget as HTMLInputElement).blur();
              }
            }}
            className="w-full bg-transparent text-[14px] font-semibold text-[#f2f4f7] outline-none"
          />
          <span className="text-[14px] font-medium text-[#9ea4ae]">%</span>
        </div>
      </div>
      <IconAction className="h-11 min-w-11">
        <FiEye className="h-4 w-4" />
      </IconAction>
      <IconAction className="h-11 min-w-11">
        <FiMinus className="h-4 w-4" />
      </IconAction>
    </div>
  );
}

function IconAction({
  onClick,
  children,
  active = false,
  title,
  className = "",
}: {
  onClick?: () => void;
  children: React.ReactNode;
  active?: boolean;
  title?: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`flex h-11 min-w-11 items-center justify-center rounded-[14px] border border-[#3b3f48] bg-[#31353d] text-[#d7dce4] transition-colors hover:bg-[#3a3f49] ${active ? "ring-1 ring-[#4f83d1]" : ""} ${className}`}
    >
      {children}
    </button>
  );
}

function SectionHeader({
  title,
  actions,
}: {
  title: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <h3 className="text-[15px] font-semibold text-[#f2f4f7]">{title}</h3>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </div>
  );
}

function PanelSection({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <section className={`border-b border-[#3a3d44] px-5 py-6 ${className}`}>{children}</section>;
}

function SegmentedIconGroup({
  icons,
  className = "",
}: {
  icons: React.ReactNode[];
  className?: string;
}) {
  return (
    <div
      className={`grid h-11 grid-cols-3 overflow-hidden rounded-[14px] border border-[#3b3f48] bg-[#31353d] ${className}`}
    >
      {icons.map((icon, index) => (
        <button
          key={index}
          className={`flex items-center justify-center text-[#d7dce4] hover:bg-[#3a3f49] ${index < icons.length - 1 ? "border-r border-[#3b3f48]" : ""}`}
        >
          {icon}
        </button>
      ))}
    </div>
  );
}

function layerTypeLabel(type: LayerType) {
  switch (type) {
    case LayerType.Rectangle:
      return "Rectangle";
    case LayerType.Ellipse:
      return "Ellipse";
    case LayerType.Path:
      return "Path";
    case LayerType.Text:
      return "Text";
    case LayerType.Frame:
      return "Frame";
    default:
      return "Layer";
  }
}

function layerTypeIcon(type: LayerType) {
  switch (type) {
    case LayerType.Rectangle:
      return <IoSquareOutline className="h-3.5 w-3.5" />;
    case LayerType.Ellipse:
      return <IoEllipseOutline className="h-3.5 w-3.5" />;
    case LayerType.Path:
      return <PiPathLight className="h-3.5 w-3.5" />;
    case LayerType.Text:
      return <AiOutlineFontSize className="h-3.5 w-3.5" />;
    case LayerType.Frame:
      return <PiFrameCornersBold className="h-3.5 w-3.5" />;
    default:
      return <IoSquareOutline className="h-3.5 w-3.5" />;
  }
}

export default function Sidebars({
  roomName,
  leftIsMinimized,
  setLeftIsMinimized,
  zoom,
}: {
  roomName: string;
  leftIsMinimized: boolean;
  setLeftIsMinimized: (value: boolean) => void;
  zoom: number;
}) {
  const [leftTab, setLeftTab] = useState<LeftTab>("file");
  const [rightTab, setRightTab] = useState<RightTab>("design");

  const me = useSelf();
  const selectedLayerId = useSelf((self) => {
    const { selection } = self.presence;
    return selection.length === 1 ? selection[0] : null;
  });

  const selection = useSelf((self) => self.presence.selection);

  const roomColor = useStorage((root) => root.roomColor);
  const layers = useStorage((root) => root.layers);
  const layerIds = useStorage((root) => root.layerIds);

  const layer = useStorage((root) => {
    if (!selectedLayerId) return null;
    return root.layers.get(selectedLayerId) ?? null;
  });

  const reversedLayerIds = useMemo(
    () => [...(layerIds ?? [])].reverse(),
    [layerIds],
  );

  const selectLayer = useMutation(({ setMyPresence }, layerId: string) => {
    setMyPresence({ selection: [layerId] }, { addToHistory: true });
  }, []);

  const setRoomColor = useMutation(({ storage }, newColor: Color) => {
    storage.set("roomColor", newColor);
  }, []);

  const updateLayer = useMutation(
    ({ storage }, updates: LayerUpdates) => {
      if (!selectedLayerId) return;

      const liveLayer = storage.get("layers").get(selectedLayerId);
      if (!liveLayer) return;

      const currentLayer = liveLayer.toObject();
      const patch: Record<string, unknown> = {};

      if (updates.x !== undefined) patch.x = updates.x;
      if (updates.y !== undefined) patch.y = updates.y;
      if (updates.width !== undefined) patch.width = Math.max(1, updates.width);
      if (updates.height !== undefined)
        patch.height = Math.max(1, updates.height);
      if (updates.rotation !== undefined) patch.rotation = updates.rotation;
      if (updates.opacity !== undefined)
        patch.opacity = clamp(updates.opacity, 0, 100);
      if (updates.cornerRadius !== undefined)
        patch.cornerRadius = Math.max(0, updates.cornerRadius);
      if (updates.clipContent !== undefined)
        patch.clipContent = updates.clipContent;

      if (updates.fill !== undefined) {
        const normalized = normalizeHex(updates.fill);
        if (normalized) patch.fill = hexToRgb(normalized);
      }
      if (updates.fillOpacity !== undefined) {
        patch.fillOpacity = clamp(updates.fillOpacity, 0, 100);
      }

      if (updates.stroke !== undefined) {
        const normalized = normalizeHex(updates.stroke);
        if (normalized) patch.stroke = hexToRgb(normalized);
      }
      if (updates.strokeOpacity !== undefined) {
        patch.strokeOpacity = clamp(updates.strokeOpacity, 0, 100);
      }
      if (updates.strokeWidth !== undefined) {
        patch.strokeWidth = Math.max(0, updates.strokeWidth);
      }
      if (updates.strokeAlign !== undefined) {
        patch.strokeAlign = updates.strokeAlign;
      }

      if (updates.fontSize !== undefined) {
        patch.fontSize = Math.max(1, updates.fontSize);
      }
      if (updates.fontWeight !== undefined) {
        patch.fontWeight = clamp(updates.fontWeight, 100, 900);
      }
      if (updates.fontFamily !== undefined) {
        patch.fontFamily = updates.fontFamily;
      }
      if (updates.text !== undefined) {
        patch.text = updates.text;
      }

      if (updates.shadow !== undefined) {
        patch.shadow = {
          ...(currentLayer.shadow ?? DEFAULT_SHADOW),
          ...updates.shadow,
        };
      }

      liveLayer.update(patch as Partial<Layer>);
    },
    [selectedLayerId],
  );

  const [textDraft, setTextDraft] = useState("");

  useEffect(() => {
    if (layer?.type === LayerType.Text) {
      setTextDraft(layer.text);
    }
  }, [layer]);

  const selectedShadow = layer?.shadow ?? DEFAULT_SHADOW;
  const isFrameLayer = layer?.type === LayerType.Frame;
  const hasRadiusControl =
    layer?.type === LayerType.Rectangle || layer?.type === LayerType.Frame;

  return (
    <>
      {!leftIsMinimized ? (
        <aside className="fixed left-0 top-0 z-20 flex h-screen w-[260px] flex-col border-r border-[#373737] bg-[#242424] text-[#f3f4f6]">
          <div className="border-b border-[#373737] px-3 py-3">
            <div className="flex items-center justify-between">
              <Link href="/dashboard" className="flex items-center gap-2">
                <img src="/figma-logo.svg" alt="Figma logo" className="h-4 w-4" />
              </Link>
              <PiSidebarSimpleThin
                onClick={() => setLeftIsMinimized(true)}
                className="h-5 w-5 cursor-pointer text-[#9fa2aa] hover:text-white"
              />
            </div>
            <p className="mt-2 text-[13px] font-medium">{roomName}</p>
            <p className="text-[11px] text-[#9fa2aa]">Drafts</p>
          </div>

          <div className="border-b border-[#373737] px-3 py-2">
            <div className="flex rounded-lg bg-[#2f3136] p-1 text-[12px]">
              <button
                onClick={() => setLeftTab("file")}
                className={`flex-1 rounded-md px-2 py-1 text-left ${leftTab === "file" ? "bg-[#3a3d42] text-white" : "text-[#a9adb5]"}`}
              >
                File
              </button>
              <button
                onClick={() => setLeftTab("assets")}
                className={`flex-1 rounded-md px-2 py-1 text-left ${leftTab === "assets" ? "bg-[#3a3d42] text-white" : "text-[#a9adb5]"}`}
              >
                Assets
              </button>
            </div>
          </div>

          {leftTab === "file" ? (
            <div className="flex-1 overflow-y-auto px-3 py-3">
              <div className="mb-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className={TITLE_TEXT}>Pages</span>
                  <button className="text-[16px] leading-none text-[#9fa2aa]">+</button>
                </div>
                <button className="w-full rounded-md bg-[#343842] px-2 py-1.5 text-left text-[12px] text-[#e6e6e6]">
                  screen
                </button>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <span className={TITLE_TEXT}>Layers</span>
                </div>
                <div className="space-y-1">
                  {reversedLayerIds.map((id) => {
                    const item = layers?.get(id);
                    if (!item) return null;

                    const isSelected = selection.includes(id);
                    const textLabel =
                      item.type === LayerType.Text && item.text.trim().length > 0
                        ? item.text
                        : layerTypeLabel(item.type);

                    return (
                      <button
                        key={id}
                        onClick={() => selectLayer(id)}
                        className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[12px] ${isSelected ? "bg-[#394b62] text-white" : "text-[#d2d4d8] hover:bg-[#2f3136]"}`}
                      >
                        <span className="text-[#a9adb5]">{layerTypeIcon(item.type)}</span>
                        <span className="truncate">{textLabel}</span>
                      </button>
                    );
                  })}

                  {reversedLayerIds.length === 0 && (
                    <p className="text-[12px] text-[#8c9098]">No layers yet</p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 px-3 py-3 text-[12px] text-[#8c9098]">
              Component assets appear here.
            </div>
          )}
        </aside>
      ) : (
        <button
          onClick={() => setLeftIsMinimized(false)}
          className="fixed left-3 top-3 z-20 flex h-9 w-9 items-center justify-center rounded-lg border border-[#3b3b3b] bg-[#242424] text-[#b7bcc5] hover:text-white"
        >
          <PiSidebarSimpleThin className="h-5 w-5" />
        </button>
      )}

      <aside className="fixed right-0 top-0 z-20 flex h-screen w-[304px] flex-col border-l border-[#3a3d44] bg-[#2b2d31] text-[#f2f4f7]">
        <div className="border-b border-[#3a3d44] px-5 py-4">
          <div className="mb-4 flex items-center">
            <div className="flex items-center gap-2">
              <UserAvatar
                color={connectionIdToColor(me.connectionId)}
                name={me.info.name}
                className="h-8 w-8 text-sm"
              />
              <button className="text-[#b1b6bf] hover:text-white">
                <BiChevronDown className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 rounded-[14px] p-0.5">
              <button
                onClick={() => setRightTab("design")}
                className={`rounded-[14px] px-4 py-2 text-[14px] font-semibold ${rightTab === "design" ? "bg-[#3b3f48] text-white" : "text-[#b1b6bf]"}`}
              >
                Design
              </button>
              <button
                onClick={() => setRightTab("prototype")}
                className={`rounded-[14px] px-4 py-2 text-[14px] font-semibold ${rightTab === "prototype" ? "bg-[#3b3f48] text-white" : "text-[#b1b6bf]"}`}
              >
                Prototype
              </button>
            </div>

            <button className="flex items-center gap-1 text-[14px] font-semibold text-[#f2f4f7]">
              {Math.round(zoom * 100)}%
              <BiChevronDown className="h-4 w-4 text-[#b1b6bf]" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {rightTab === "prototype" ? (
            <div className="px-4 py-5 text-[13px] text-[#9fa2aa]">
              Prototype properties will show here for the selected layer.
            </div>
          ) : (
            <>
              {layer ? (
                <>
                  <PanelSection className="py-4">
                    <div className="flex items-center justify-between">
                      <button className="flex items-center gap-1 text-[14px] font-semibold text-[#f3f4f6]">
                        {layerTypeLabel(layer.type)}
                        <BiChevronDown className="h-4 w-4 text-[#b8bcc4]" />
                      </button>
                      <div className="flex items-center gap-2">
                        <button className="text-[#d8dbe0]">
                          <FiCode className="h-4 w-4" />
                        </button>
                        <button className="text-[#d8dbe0]">
                          <FiGrid className="h-4 w-4" />
                        </button>
                        <button className="text-[#d8dbe0]">
                          <FiMoon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </PanelSection>

                  <PanelSection>
                    <SectionHeader title="Position" />
                    <div className="mb-2 grid grid-cols-2 gap-2">
                      <SegmentedIconGroup
                        icons={[
                          <FiAlignLeft key="left" className="h-4 w-4" />,
                          <FiAlignCenter key="center" className="h-4 w-4" />,
                          <FiAlignRight key="right" className="h-4 w-4" />,
                        ]}
                      />
                      <SegmentedIconGroup
                        icons={[
                          <FiAlignLeft
                            key="top"
                            className="h-4 w-4 rotate-90"
                          />,
                          <FiAlignCenter
                            key="middle"
                            className="h-4 w-4 rotate-90"
                          />,
                          <FiAlignRight
                            key="bottom"
                            className="h-4 w-4 rotate-90"
                          />,
                        ]}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <NumberField
                        label="X"
                        value={layer.x}
                        onCommit={(value) => updateLayer({ x: value })}
                      />
                      <NumberField
                        label="Y"
                        value={layer.y}
                        onCommit={(value) => updateLayer({ y: value })}
                      />
                    </div>
                    <div className="mt-2 grid grid-cols-[1fr_auto] gap-2">
                      <NumberField
                        label="R"
                        value={layer.rotation ?? 0}
                        onCommit={(value) => updateLayer({ rotation: value })}
                      />
                      <div className="grid grid-cols-3 gap-1">
                        <IconAction
                          className="h-11 min-w-11"
                          onClick={() =>
                            updateLayer({ rotation: (layer.rotation ?? 0) - 90 })
                          }
                          title="Rotate -90"
                        >
                          <FiRotateCw className="h-4 w-4 -scale-x-100" />
                        </IconAction>
                        <IconAction
                          className="h-11 min-w-11"
                          onClick={() =>
                            updateLayer({ rotation: (layer.rotation ?? 0) + 90 })
                          }
                          title="Rotate +90"
                        >
                          <FiRotateCw className="h-4 w-4" />
                        </IconAction>
                        <IconAction className="h-11 min-w-11">
                          <FiMaximize2 className="h-4 w-4" />
                        </IconAction>
                      </div>
                    </div>
                  </PanelSection>

                  {layer.type !== LayerType.Path && (
                    <PanelSection>
                      <SectionHeader
                        title="Layout"
                        actions={
                          <>
                            <FiMaximize2 className="h-4 w-4 text-[#d8dbe0]" />
                            <FiCopy className="h-4 w-4 text-[#d8dbe0]" />
                          </>
                        }
                      />
                      <div className="mb-2 rounded-[14px] border border-[#3b3f48] bg-[#31353d] p-1">
                        <div className="grid grid-cols-4 gap-1">
                          <button className="flex h-8 items-center justify-center rounded-[8px] border border-[#4a4e55] bg-[#33363c] text-[#d8dbe0]">
                            <FiGrid className="h-3.5 w-3.5" />
                          </button>
                          <button className="flex h-8 items-center justify-center rounded-[8px] text-[#b8bcc4] hover:bg-[#363940]">
                            <FiColumns className="h-3.5 w-3.5" />
                          </button>
                          <button className="flex h-8 items-center justify-center rounded-[8px] text-[#b8bcc4] hover:bg-[#363940]">
                            <FiMove className="h-3.5 w-3.5" />
                          </button>
                          <button className="flex h-8 items-center justify-center rounded-[8px] text-[#b8bcc4] hover:bg-[#363940]">
                            <FiLayout className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-[1fr_1fr_auto] gap-2">
                        <NumberField
                          label="W"
                          value={layer.width}
                          min={1}
                          onCommit={(value) => updateLayer({ width: value })}
                        />
                        <NumberField
                          label="H"
                          value={layer.height}
                          min={1}
                          onCommit={(value) => updateLayer({ height: value })}
                        />
                        <IconAction className="h-11 min-w-11">
                          <FiMaximize2 className="h-4 w-4" />
                        </IconAction>
                      </div>
                      {hasRadiusControl && (
                        <div className="mt-2">
                          <NumberField
                            label="R"
                            value={layer.cornerRadius ?? 0}
                            min={0}
                            onCommit={(value) =>
                              updateLayer({ cornerRadius: value })
                            }
                          />
                        </div>
                      )}
                      {isFrameLayer && (
                        <label className="mt-3 flex items-center gap-2 text-[14px] text-[#e5e7eb]">
                          <button
                            type="button"
                            onClick={() =>
                              updateLayer({ clipContent: !(layer.clipContent ?? true) })
                            }
                            className={`flex h-10 w-10 items-center justify-center rounded-[14px] border ${layer.clipContent ?? true ? "border-[#4f83d1] bg-[#3b4f72]" : "border-[#3b3f48] bg-[#31353d]"}`}
                          >
                            {layer.clipContent ?? true ? (
                              <FiCheck className="h-4 w-4 text-white" />
                            ) : null}
                          </button>
                          Clip content
                        </label>
                      )}
                    </PanelSection>
                  )}

                  <PanelSection>
                    <SectionHeader
                      title="Appearance"
                      actions={
                        <>
                          <FiEye className="h-4 w-4 text-[#d8dbe0]" />
                          <FiDroplet className="h-4 w-4 text-[#d8dbe0]" />
                        </>
                      }
                    />
                    <div className="grid grid-cols-[1fr_1fr_auto] gap-2">
                      <NumberField
                        label="%"
                        value={layer.opacity}
                        min={0}
                        max={100}
                        onCommit={(value) => updateLayer({ opacity: value })}
                      />
                      <div className={INPUT_SHELL}>
                        <span className="mr-2 text-[13px] text-[#9fa2aa]">0</span>
                        <span className="text-[13px] text-[#9fa2aa]">Normal</span>
                      </div>
                      <IconAction className="h-11 min-w-11">
                        <FiMaximize2 className="h-4 w-4" />
                      </IconAction>
                    </div>
                  </PanelSection>

                  <PanelSection>
                    <SectionHeader
                      title="Fill"
                      actions={
                        <>
                          <FiGrid className="h-4 w-4 text-[#d8dbe0]" />
                          <button className="text-[#d8dbe0]">
                            <FiPlus className="h-5 w-5" />
                          </button>
                        </>
                      }
                    />
                    <PaintRow
                      color={colorToCss(layer.fill)}
                      opacity={layer.fillOpacity ?? 100}
                      onColorCommit={(value) => updateLayer({ fill: value })}
                      onOpacityCommit={(value) =>
                        updateLayer({ fillOpacity: value })
                      }
                    />
                  </PanelSection>

                  <PanelSection>
                    <SectionHeader
                      title="Stroke"
                      actions={
                        <>
                          <FiGrid className="h-4 w-4 text-[#d8dbe0]" />
                          <button className="text-[#d8dbe0]">
                            <FiPlus className="h-5 w-5" />
                          </button>
                        </>
                      }
                    />
                    <PaintRow
                      color={colorToCss(layer.stroke)}
                      opacity={layer.strokeOpacity ?? 100}
                      onColorCommit={(value) => updateLayer({ stroke: value })}
                      onOpacityCommit={(value) =>
                        updateLayer({ strokeOpacity: value })
                      }
                    />
                    <div className="mt-2 grid grid-cols-[1fr_96px_auto_auto] gap-2">
                      <SelectField
                        value={layer.strokeAlign ?? "center"}
                        options={[
                          { label: "Inside", value: "inside" },
                          { label: "Center", value: "center" },
                          { label: "Outside", value: "outside" },
                        ]}
                        onChange={(value) =>
                          updateLayer({ strokeAlign: value as StrokeAlign })
                        }
                      />
                      <NumberField
                        label="W"
                        value={layer.strokeWidth ?? 1}
                        min={0}
                        onCommit={(value) => updateLayer({ strokeWidth: value })}
                      />
                      <IconAction className="h-11 min-w-11">
                        <FiSliders className="h-4 w-4" />
                      </IconAction>
                      <IconAction className="h-11 min-w-11">
                        <FiLayout className="h-4 w-4" />
                      </IconAction>
                    </div>
                  </PanelSection>

                  <PanelSection>
                    <SectionHeader
                      title="Effects"
                      actions={
                        <>
                          <FiGrid className="h-4 w-4 text-[#d8dbe0]" />
                          <button className="text-[#d8dbe0]">
                            <FiPlus className="h-5 w-5" />
                          </button>
                        </>
                      }
                    />

                    <div className="grid grid-cols-[auto_1fr_auto_auto] gap-2">
                      <IconAction
                        className={`h-11 min-w-11 ${selectedShadow.enabled ? "ring-1 ring-[#4f83d1]" : ""}`}
                        onClick={() =>
                          updateLayer({
                            shadow: {
                              ...(layer.shadow ?? DEFAULT_SHADOW),
                              enabled: !selectedShadow.enabled,
                            },
                          })
                        }
                      >
                        <FiCheck className="h-4 w-4" />
                      </IconAction>
                      <SelectField
                        value="drop-shadow"
                        options={[{ label: "Drop shadow", value: "drop-shadow" }]}
                        onChange={() => {
                          // reserved for future effect type support
                        }}
                      />
                      <IconAction className="h-11 min-w-11">
                        <FiEye className="h-4 w-4" />
                      </IconAction>
                      <IconAction className="h-11 min-w-11">
                        <FiMinus className="h-4 w-4" />
                      </IconAction>
                    </div>

                    {selectedShadow.enabled && (
                      <div className="mt-2 space-y-2">
                        <div className="grid grid-cols-[1fr_90px] gap-2">
                          <ColorField
                            value={colorToCss(selectedShadow.color)}
                            onCommit={(value) =>
                              updateLayer({
                                shadow: {
                                  ...(layer.shadow ?? DEFAULT_SHADOW),
                                  color: hexToRgb(value),
                                },
                              })
                            }
                          />
                          <NumberField
                            label="%"
                            value={selectedShadow.opacity}
                            min={0}
                            max={100}
                            onCommit={(value) =>
                              updateLayer({
                                shadow: {
                                  ...(layer.shadow ?? DEFAULT_SHADOW),
                                  opacity: value,
                                },
                              })
                            }
                          />
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <NumberField
                            label="X"
                            value={selectedShadow.x}
                            onCommit={(value) =>
                              updateLayer({
                                shadow: {
                                  ...(layer.shadow ?? DEFAULT_SHADOW),
                                  x: value,
                                },
                              })
                            }
                          />
                          <NumberField
                            label="Y"
                            value={selectedShadow.y}
                            onCommit={(value) =>
                              updateLayer({
                                shadow: {
                                  ...(layer.shadow ?? DEFAULT_SHADOW),
                                  y: value,
                                },
                              })
                            }
                          />
                          <NumberField
                            label="B"
                            value={selectedShadow.blur}
                            min={0}
                            onCommit={(value) =>
                              updateLayer({
                                shadow: {
                                  ...(layer.shadow ?? DEFAULT_SHADOW),
                                  blur: value,
                                },
                              })
                            }
                          />
                        </div>
                      </div>
                    )}
                  </PanelSection>

                  {layer.type === LayerType.Text && (
                    <PanelSection>
                      <SectionHeader title="Typography" />
                      <input
                        value={textDraft}
                        onChange={(e) => setTextDraft(e.target.value)}
                        onBlur={() => updateLayer({ text: textDraft })}
                        className="h-11 w-full rounded-[14px] border border-[#3b3f48] bg-[#31353d] px-3 text-[14px] font-medium text-[#f2f4f7] outline-none"
                      />
                      <div className="mt-2 grid grid-cols-2 gap-2">
                        <NumberField
                          label="S"
                          value={layer.fontSize}
                          min={1}
                          onCommit={(value) => updateLayer({ fontSize: value })}
                        />
                        <NumberField
                          label="W"
                          value={layer.fontWeight}
                          min={100}
                          max={900}
                          onCommit={(value) =>
                            updateLayer({ fontWeight: value })
                          }
                        />
                      </div>
                      <div className="mt-2">
                        <SelectField
                          value={layer.fontFamily}
                          options={[
                            { label: "Inter", value: "Inter" },
                            { label: "Arial", value: "Arial" },
                            { label: "Times New Roman", value: "Times New Roman" },
                          ]}
                          onChange={(value) =>
                            updateLayer({ fontFamily: value })
                          }
                        />
                      </div>
                    </PanelSection>
                  )}
                </>
              ) : (
                <PanelSection>
                  <SectionHeader title="Page" />
                  <ColorField
                    value={roomColor ? colorToCss(roomColor) : "#1E1E1E"}
                    onCommit={(value) => setRoomColor(hexToRgb(value))}
                  />
                </PanelSection>
              )}

              <PanelSection className="py-4 text-[14px] text-[#a9adb5]">
                <div className="flex items-center justify-between">
                  <span>Layout guide</span>
                  <FiPlus className="h-5 w-5" />
                </div>
              </PanelSection>

              <PanelSection className="py-4 text-[14px] text-[#a9adb5]">
                <div className="flex items-center justify-between">
                  <span>Export</span>
                  <FiPlus className="h-5 w-5" />
                </div>
              </PanelSection>
            </>
          )}
        </div>
      </aside>
    </>
  );
}
