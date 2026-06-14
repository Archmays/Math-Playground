import type { BoundingBox, Point, SceneObject } from "./scene";

export function translatePoint(point: Point, delta: Point): Point {
  return {
    x: point.x + delta.x,
    y: point.y + delta.y
  };
}

export function rotatePoint(
  point: Point,
  angleDegrees: number,
  origin: Point = { x: 0, y: 0 }
): Point {
  const angleRadians = (angleDegrees * Math.PI) / 180;
  const cos = Math.cos(angleRadians);
  const sin = Math.sin(angleRadians);
  const translatedX = point.x - origin.x;
  const translatedY = point.y - origin.y;

  return {
    x: origin.x + translatedX * cos - translatedY * sin,
    y: origin.y + translatedX * sin + translatedY * cos
  };
}

export function getBoundingBox(object: SceneObject): BoundingBox {
  const rawWidth = object.data.width;
  const rawHeight = object.data.height;
  const width = typeof rawWidth === "number" ? rawWidth : 0;
  const height = typeof rawHeight === "number" ? rawHeight : 0;

  return {
    x: object.x,
    y: object.y,
    width: width * object.scaleX,
    height: height * object.scaleY
  };
}

export function snapToGrid(point: Point, gridSize: number): Point {
  if (gridSize <= 0) {
    return { ...point };
  }

  return {
    x: Math.round(point.x / gridSize) * gridSize,
    y: Math.round(point.y / gridSize) * gridSize
  };
}

export { generateId } from "./scene";
