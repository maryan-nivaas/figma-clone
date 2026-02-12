export type Color = {
  r: number;
  g: number;
  b: number;
};

export type Camera = {
  x: number;
  y: number;
  zoom: number;
};

export enum LayerType {
  Rectangle,
  Ellipse,
  Path,
  Text,
  Frame,
}

export type LayerShadow = {
  enabled: boolean;
  x: number;
  y: number;
  blur: number;
  color: Color;
  opacity: number;
};

export type StrokeAlign = "inside" | "center" | "outside";

type BaseLayer = {
  x: number;
  y: number;
  height: number;
  width: number;
  fill: Color;
  fillOpacity?: number;
  stroke: Color;
  strokeOpacity?: number;
  strokeWidth?: number;
  strokeAlign?: StrokeAlign;
  opacity: number;
  rotation?: number;
  shadow?: LayerShadow;
};

export type RectangleLayer = {
  type: LayerType.Rectangle;
  cornerRadius?: number;
} & BaseLayer;

export type EllipseLayer = {
  type: LayerType.Ellipse;
} & BaseLayer;

export type FrameLayer = {
  type: LayerType.Frame;
  cornerRadius?: number;
  clipContent?: boolean;
} & BaseLayer;

export type PathLayer = {
  type: LayerType.Path;
  points: number[][];
} & BaseLayer;

export type TextLayer = {
  type: LayerType.Text;
  text: string;
  fontSize: number;
  fontWeight: number;
  fontFamily: string;
} & BaseLayer;

export type Layer =
  | RectangleLayer
  | EllipseLayer
  | PathLayer
  | TextLayer
  | FrameLayer;

export type Point = {
  x: number;
  y: number;
};

export type XYWH = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export enum Side {
  Top = 1,
  Bottom = 2,
  Left = 4,
  Right = 8,
}

export type CanvasState =
  | {
      mode: CanvasMode.None;
    }
  | {
      mode: CanvasMode.RightClick;
    }
  | {
      mode: CanvasMode.SelectionNet;
      origin: Point;
      current?: Point;
    }
  | {
      mode: CanvasMode.Dragging;
      origin: Point | null;
    }
  | {
      mode: CanvasMode.Inserting;
      layerType:
        | LayerType.Rectangle
        | LayerType.Ellipse
        | LayerType.Text
        | LayerType.Frame;
    }
  | {
      mode: CanvasMode.Pencil;
    }
  | {
      mode: CanvasMode.Resizing;
      initialBounds: XYWH;
      corner: Side;
    }
  | {
      mode: CanvasMode.Translating;
      current: Point;
    }
  | {
      mode: CanvasMode.Pressing;
      origin: Point;
    };

export enum CanvasMode {
  None,
  Dragging,
  Inserting,
  Pencil,
  Resizing,
  Translating,
  SelectionNet,
  Pressing,
  RightClick,
}
