import type { Point, Scene, SceneObject, Viewport } from "../core/scene";

export type { Point, Scene, SceneObject, Viewport };

export interface CanvasSize {
  width: number;
  height: number;
}

export interface CanvasInteractionState {
  isPanning: boolean;
  lastPointer: Point | null;
}

export interface ViewportChangeHandlers {
  onPan: (delta: Point) => void;
  onZoomAtPoint: (screenPoint: Point, zoomFactor: number) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetView: () => void;
}
