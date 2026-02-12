import { CanvasMode, type CanvasState, LayerType } from "~/types";
import SelectionButton from "./SelectionButton";
import ShapesSelectionButton from "./ShapesSelectionButton";
import ZoomInButton from "./ZoomInButton";
import ZoomOutButton from "./ZoomOutButton";
import PencilButton from "./PencilButton";
import TextButton from "./TextButton";
import UndoButton from "./UndoButton";
import RedoButton from "./RedoButton";
import FrameButton from "./FrameButton";

export default function ToolsBar({
  canvasState,
  setCanvasState,
  zoomIn,
  zoomOut,
  canZoomIn,
  canZoomOut,
  canUndo,
  canRedo,
  undo,
  redo,
}: {
  canvasState: CanvasState;
  setCanvasState: (newState: CanvasState) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  canZoomIn: boolean;
  canZoomOut: boolean;
  canUndo: boolean;
  canRedo: boolean;
  undo: () => void;
  redo: () => void;
}) {
  return (
    <div className="fixed bottom-4 left-1/2 z-20 flex -translate-x-1/2 items-center justify-center rounded-xl border border-[#3b3b3b] bg-[#232427]/95 p-1.5 shadow-[0_8px_24px_rgba(0,0,0,0.35)] backdrop-blur">
      <div className="flex items-center justify-center gap-1">
        <SelectionButton
          isActive={
            canvasState.mode === CanvasMode.None ||
            canvasState.mode === CanvasMode.Translating ||
            canvasState.mode === CanvasMode.SelectionNet ||
            canvasState.mode === CanvasMode.Pressing ||
            canvasState.mode === CanvasMode.Resizing ||
            canvasState.mode === CanvasMode.Dragging
          }
          canvasMode={canvasState.mode}
          onClick={(canvasMode) =>
            setCanvasState(
              canvasMode === CanvasMode.Dragging
                ? { mode: canvasMode, origin: null }
                : { mode: canvasMode },
            )
          }
        />
        <FrameButton
          isActive={
            canvasState.mode === CanvasMode.Inserting &&
            canvasState.layerType === LayerType.Frame
          }
          onClick={() =>
            setCanvasState({
              mode: CanvasMode.Inserting,
              layerType: LayerType.Frame,
            })
          }
        />
        <ShapesSelectionButton
          isActive={
            canvasState.mode === CanvasMode.Inserting &&
            [LayerType.Rectangle, LayerType.Ellipse].includes(
              canvasState.layerType,
            )
          }
          canvasState={canvasState}
          onClick={(layerType) =>
            setCanvasState({ mode: CanvasMode.Inserting, layerType })
          }
        />
        <PencilButton
          isActive={canvasState.mode === CanvasMode.Pencil}
          onClick={() => setCanvasState({ mode: CanvasMode.Pencil })}
        />
        <TextButton
          isActive={
            canvasState.mode === CanvasMode.Inserting &&
            canvasState.layerType === LayerType.Text
          }
          onClick={() =>
            setCanvasState({
              mode: CanvasMode.Inserting,
              layerType: LayerType.Text,
            })
          }
        />
        <div className="mx-1 h-6 w-px self-stretch bg-[#3b3b3b]" />
        <div className="flex items-center justify-center">
          <UndoButton onClick={undo} disabled={!canUndo} />
          <RedoButton onClick={redo} disabled={!canRedo} />
        </div>
        <div className="mx-1 h-6 w-px self-stretch bg-[#3b3b3b]" />
        <div className="flex items-center justify-center">
          <ZoomInButton onClick={zoomIn} disabled={!canZoomIn} />
          <ZoomOutButton onClick={zoomOut} disabled={!canZoomOut} />
        </div>
      </div>
    </div>
  );
}
