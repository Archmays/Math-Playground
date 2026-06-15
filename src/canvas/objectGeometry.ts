import { getBoundingBox, rotatePoint } from "../core/geometry";
import type { BoundingBox, Point, SceneObject } from "../core/scene";
import {
  isGeometryTileObject,
  type GeometryTileData
} from "../manipulatives/geometryTiles/geometryTiles";

export interface Segment {
  from: Point;
  to: Point;
}

export interface ObjectOutline {
  bounds: BoundingBox;
  center: Point;
  points: Point[];
  segments: Segment[];
}

const CIRCLE_SAMPLE_COUNT = 16;
const POINT_PRECISION = 6;

export function getObjectOutline(object: SceneObject): ObjectOutline {
  const box = getBoundingBox(object);
  const center = getBoxCenter(box);
  const rawOutlinePoints = getRawOutlinePoints(object, box);
  const outlinePoints =
    object.rotation === 0
      ? rawOutlinePoints
      : rawOutlinePoints.map((point) => rotatePoint(point, object.rotation, center));
  const segments = getClosedSegments(outlinePoints);
  const points = uniquePoints([
    ...outlinePoints,
    ...segments.map((segment) => getMidpoint(segment.from, segment.to)),
    center
  ]);

  return {
    bounds: getBoundsForPoints(outlinePoints),
    center,
    points,
    segments
  };
}

export function getGeometryTileVertices(
  shape: GeometryTileData["shape"],
  box: BoundingBox
): Point[] {
  const left = box.x;
  const top = box.y;
  const right = box.x + box.width;
  const bottom = box.y + box.height;
  const centerX = box.x + box.width / 2;
  const centerY = box.y + box.height / 2;

  switch (shape) {
    case "triangle":
      return [
        { x: centerX, y: top },
        { x: right, y: bottom },
        { x: left, y: bottom }
      ];
    case "hexagon":
      return Array.from({ length: 6 }, (_value, index) => {
        const angle = (Math.PI / 180) * (60 * index);

        return {
          x: centerX + (box.width / 2) * Math.cos(angle),
          y: centerY + (box.height / 2) * Math.sin(angle)
        };
      });
    case "trapezoid":
      return [
        { x: left + box.width * 0.25, y: top },
        { x: right - box.width * 0.25, y: top },
        { x: right, y: bottom },
        { x: left, y: bottom }
      ];
    case "parallelogram":
      return [
        { x: left + box.width * 0.24, y: top },
        { x: right, y: top },
        { x: right - box.width * 0.24, y: bottom },
        { x: left, y: bottom }
      ];
    case "circle":
    case "rectangle":
    case "square":
      return getBoxCorners(box);
  }
}

function getRawOutlinePoints(object: SceneObject, box: BoundingBox): Point[] {
  if (isGeometryTileObject(object)) {
    return object.data.shape === "circle"
      ? getEllipsePoints(box)
      : getGeometryTileVertices(object.data.shape, box);
  }

  return getBoxCorners(box);
}

function getBoxCorners(box: BoundingBox): Point[] {
  return [
    { x: box.x, y: box.y },
    { x: box.x + box.width, y: box.y },
    { x: box.x + box.width, y: box.y + box.height },
    { x: box.x, y: box.y + box.height }
  ];
}

function getEllipsePoints(box: BoundingBox): Point[] {
  const center = getBoxCenter(box);
  const radiusX = box.width / 2;
  const radiusY = box.height / 2;

  return Array.from({ length: CIRCLE_SAMPLE_COUNT }, (_value, index) => {
    const angle = (2 * Math.PI * index) / CIRCLE_SAMPLE_COUNT;

    return {
      x: center.x + radiusX * Math.cos(angle),
      y: center.y + radiusY * Math.sin(angle)
    };
  });
}

function getClosedSegments(points: Point[]): Segment[] {
  if (points.length < 2) {
    return [];
  }

  return points.map((point, index) => ({
    from: point,
    to: points[(index + 1) % points.length]
  }));
}

function getBoundsForPoints(points: Point[]): BoundingBox {
  const minX = Math.min(...points.map((point) => point.x));
  const minY = Math.min(...points.map((point) => point.y));
  const maxX = Math.max(...points.map((point) => point.x));
  const maxY = Math.max(...points.map((point) => point.y));

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY
  };
}

function getBoxCenter(box: BoundingBox): Point {
  return {
    x: box.x + box.width / 2,
    y: box.y + box.height / 2
  };
}

function getMidpoint(a: Point, b: Point): Point {
  return {
    x: (a.x + b.x) / 2,
    y: (a.y + b.y) / 2
  };
}

function uniquePoints(points: Point[]): Point[] {
  const seen = new Set<string>();
  const result: Point[] = [];

  for (const point of points) {
    const key = `${point.x.toFixed(POINT_PRECISION)},${point.y.toFixed(POINT_PRECISION)}`;

    if (!seen.has(key)) {
      seen.add(key);
      result.push(point);
    }
  }

  return result;
}
