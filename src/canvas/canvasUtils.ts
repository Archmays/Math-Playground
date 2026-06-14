import { getBoundingBox } from "../core/geometry";
import type { BoundingBox, SceneObject } from "../core/scene";
import type { Point, Viewport } from "./canvasTypes";

export const MIN_ZOOM = 0.25;
export const MAX_ZOOM = 4;
export const ZOOM_STEP = 1.2;

export function screenToWorld(point: Point, viewport: Viewport): Point {
  return {
    x: viewport.x + point.x / viewport.zoom,
    y: viewport.y + point.y / viewport.zoom
  };
}

export function worldToScreen(point: Point, viewport: Viewport): Point {
  return {
    x: (point.x - viewport.x) * viewport.zoom,
    y: (point.y - viewport.y) * viewport.zoom
  };
}

export function zoomAtPoint(
  viewport: Viewport,
  screenPoint: Point,
  zoomFactor: number
): Viewport {
  const nextZoom = clampZoom(viewport.zoom * zoomFactor);
  const worldPoint = screenToWorld(screenPoint, viewport);

  return {
    x: worldPoint.x - screenPoint.x / nextZoom,
    y: worldPoint.y - screenPoint.y / nextZoom,
    zoom: nextZoom
  };
}

export function panViewport(viewport: Viewport, screenDelta: Point): Viewport {
  return {
    x: viewport.x - screenDelta.x / viewport.zoom,
    y: viewport.y - screenDelta.y / viewport.zoom,
    zoom: viewport.zoom
  };
}

export function normalizeRectFromPoints(start: Point, end: Point): BoundingBox {
  const x = Math.min(start.x, end.x);
  const y = Math.min(start.y, end.y);

  return {
    x,
    y,
    width: Math.abs(end.x - start.x),
    height: Math.abs(end.y - start.y)
  };
}

export function boxesIntersect(a: BoundingBox, b: BoundingBox): boolean {
  return (
    a.x <= b.x + b.width &&
    a.x + a.width >= b.x &&
    a.y <= b.y + b.height &&
    a.y + a.height >= b.y
  );
}

export function getObjectIdsIntersectingBox(
  objects: SceneObject[],
  box: BoundingBox
): string[] {
  return objects
    .filter((object) => object.visible && boxesIntersect(getBoundingBox(object), box))
    .map((object) => object.id);
}

export function clampZoom(zoom: number): number {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom));
}

export function getSvgPointFromEvent(
  event: Pick<MouseEvent, "clientX" | "clientY">,
  svg: SVGSVGElement
): Point {
  const bounds = svg.getBoundingClientRect();

  return {
    x: event.clientX - bounds.left,
    y: event.clientY - bounds.top
  };
}
