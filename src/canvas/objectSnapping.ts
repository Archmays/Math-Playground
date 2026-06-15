import type { BoundingBox, Point, SceneObject } from "../core/scene";
import {
  getObjectOutline,
  type ObjectOutline,
  type Segment
} from "./objectGeometry";

export type SnapGuide =
  | {
      orientation: "vertical";
      position: number;
      from: number;
      to: number;
    }
  | {
      orientation: "horizontal";
      position: number;
      from: number;
      to: number;
    }
  | {
      orientation: "segment";
      from: Point;
      to: Point;
    };

interface ObjectSnapOptions {
  movingObjects: SceneObject[];
  sceneObjects: SceneObject[];
  threshold: number;
}

interface GridSnapOptions {
  movingObjects: SceneObject[];
  gridSize: number;
  threshold?: number;
}

interface AxisSnapCandidate {
  delta: number;
  guide: SnapGuide;
}

interface SnapCandidate {
  delta: Point;
  distance: number;
  guides: SnapGuide[];
  priority: number;
}

type Axis = "x" | "y";

export interface ObjectSnapResult {
  delta: Point;
  guides: SnapGuide[];
}

const EPSILON = 0.000001;
const PARALLEL_TOLERANCE = 0.015;

export function getGridSnapAdjustment({
  movingObjects,
  gridSize,
  threshold = gridSize / 2
}: GridSnapOptions): ObjectSnapResult {
  if (movingObjects.length === 0 || gridSize <= 0 || threshold < 0) {
    return { delta: { x: 0, y: 0 }, guides: [] };
  }

  const outline = mergeOutlines(movingObjects.map(getObjectOutline));
  let bestX: AxisSnapCandidate | null = null;
  let bestY: AxisSnapCandidate | null = null;

  for (const point of outline.points) {
    const gridX = Math.round(point.x / gridSize) * gridSize;
    const gridY = Math.round(point.y / gridSize) * gridSize;

    bestX = getBetterAxisCandidate(
      bestX,
      createGridAxisCandidate("x", gridX - point.x, gridX, outline.bounds, threshold)
    );
    bestY = getBetterAxisCandidate(
      bestY,
      createGridAxisCandidate("y", gridY - point.y, gridY, outline.bounds, threshold)
    );
  }

  return {
    delta: {
      x: bestX?.delta ?? 0,
      y: bestY?.delta ?? 0
    },
    guides: [bestX?.guide, bestY?.guide].filter(
      (guide): guide is SnapGuide => Boolean(guide)
    )
  };
}

export function getObjectSnapAdjustment({
  movingObjects,
  sceneObjects,
  threshold
}: ObjectSnapOptions): ObjectSnapResult {
  if (movingObjects.length === 0 || threshold <= 0) {
    return { delta: { x: 0, y: 0 }, guides: [] };
  }

  const movingIds = new Set(movingObjects.map((object) => object.id));
  const movingOutline = mergeOutlines(movingObjects.map(getObjectOutline));
  const targetOutlines = sceneObjects
    .filter((object) => object.visible && !object.locked && !movingIds.has(object.id))
    .map(getObjectOutline);
  let bestAxisX: AxisSnapCandidate | null = null;
  let bestAxisY: AxisSnapCandidate | null = null;
  let bestShapeCandidate: SnapCandidate | null = null;

  for (const targetOutline of targetOutlines) {
    bestAxisX = getBetterAxisCandidate(
      bestAxisX,
      getAxisSnapCandidate("x", movingOutline, targetOutline, threshold)
    );
    bestAxisY = getBetterAxisCandidate(
      bestAxisY,
      getAxisSnapCandidate("y", movingOutline, targetOutline, threshold)
    );
    bestShapeCandidate = getBetterShapeCandidate(
      bestShapeCandidate,
      getShapeSnapCandidate(movingOutline, targetOutline, threshold)
    );
  }

  const axisCandidate = getCombinedAxisCandidate(bestAxisX, bestAxisY);
  const selected = getBetterShapeCandidate(bestShapeCandidate, axisCandidate);

  return selected
    ? {
        delta: selected.delta,
        guides: selected.guides
      }
    : { delta: { x: 0, y: 0 }, guides: [] };
}

function getAxisSnapCandidate(
  axis: Axis,
  movingOutline: ObjectOutline,
  targetOutline: ObjectOutline,
  threshold: number
): AxisSnapCandidate | null {
  let best: AxisSnapCandidate | null = null;
  const movingPoints = getAxisSnapPoints(movingOutline);
  const targetPoints = getAxisSnapPoints(targetOutline);

  for (const movingPoint of movingPoints) {
    for (const targetPoint of targetPoints) {
      if (
        isCenterPoint(movingPoint, movingOutline) !==
        isCenterPoint(targetPoint, targetOutline)
      ) {
        continue;
      }

      const delta = targetPoint[axis] - movingPoint[axis];

      if (Math.abs(delta) < EPSILON || Math.abs(delta) > threshold) {
        continue;
      }

      best = getBetterAxisCandidate(best, {
        delta,
        guide:
          axis === "x"
            ? {
                orientation: "vertical",
                position: targetPoint.x,
                from: Math.min(movingOutline.bounds.y, targetOutline.bounds.y),
                to: Math.max(
                  movingOutline.bounds.y + movingOutline.bounds.height,
                  targetOutline.bounds.y + targetOutline.bounds.height
                )
              }
            : {
                orientation: "horizontal",
                position: targetPoint.y,
                from: Math.min(movingOutline.bounds.x, targetOutline.bounds.x),
                to: Math.max(
                  movingOutline.bounds.x + movingOutline.bounds.width,
                  targetOutline.bounds.x + targetOutline.bounds.width
                )
              }
      });
    }
  }

  return best;
}

function getShapeSnapCandidate(
  movingOutline: ObjectOutline,
  targetOutline: ObjectOutline,
  threshold: number
): SnapCandidate | null {
  let best: SnapCandidate | null = null;

  for (const movingSegment of movingOutline.segments) {
    for (const targetSegment of targetOutline.segments) {
      best = getBetterShapeCandidate(
        best,
        getParallelEdgeCandidate(movingSegment, targetSegment, threshold)
      );
    }
  }

  for (const movingPoint of movingOutline.points) {
    for (const targetSegment of targetOutline.segments) {
      best = getBetterShapeCandidate(
        best,
        getPointToSegmentCandidate(movingPoint, targetSegment, threshold)
      );
    }
  }

  for (const movingPoint of movingOutline.points) {
    for (const targetPoint of targetOutline.points) {
      best = getBetterShapeCandidate(
        best,
        getPointToPointCandidate(movingPoint, targetPoint, targetOutline.bounds, threshold)
      );
    }
  }

  return best;
}

function getPointToPointCandidate(
  movingPoint: Point,
  targetPoint: Point,
  targetBounds: BoundingBox,
  threshold: number
): SnapCandidate | null {
  const delta = {
    x: targetPoint.x - movingPoint.x,
    y: targetPoint.y - movingPoint.y
  };
  const distance = Math.hypot(delta.x, delta.y);

  if (distance < EPSILON || distance > threshold) {
    return null;
  }

  return {
    delta,
    distance,
    guides: [
      {
        orientation: "vertical",
        position: targetPoint.x,
        from: targetBounds.y,
        to: targetBounds.y + targetBounds.height
      }
    ],
    priority: 1
  };
}

function getPointToSegmentCandidate(
  movingPoint: Point,
  targetSegment: Segment,
  threshold: number
): SnapCandidate | null {
  const closest = getClosestPointOnSegment(movingPoint, targetSegment);
  const delta = {
    x: closest.x - movingPoint.x,
    y: closest.y - movingPoint.y
  };
  const distance = Math.hypot(delta.x, delta.y);

  if (distance < EPSILON || distance > threshold) {
    return null;
  }

  return {
    delta,
    distance,
    guides: [getSegmentGuide(targetSegment)],
    priority: 1
  };
}

function getParallelEdgeCandidate(
  movingSegment: Segment,
  targetSegment: Segment,
  threshold: number
): SnapCandidate | null {
  const targetVector = subtract(targetSegment.to, targetSegment.from);
  const movingVector = subtract(movingSegment.to, movingSegment.from);
  const targetLength = length(targetVector);
  const movingLength = length(movingVector);

  if (targetLength < EPSILON || movingLength < EPSILON) {
    return null;
  }

  const targetUnit = {
    x: targetVector.x / targetLength,
    y: targetVector.y / targetLength
  };
  const movingUnit = {
    x: movingVector.x / movingLength,
    y: movingVector.y / movingLength
  };
  const parallelScore = Math.abs(cross(targetUnit, movingUnit));

  if (parallelScore > PARALLEL_TOLERANCE) {
    return null;
  }

  const normal = { x: -targetUnit.y, y: targetUnit.x };
  const signedDistance = dot(subtract(targetSegment.from, movingSegment.from), normal);
  const distance = Math.abs(signedDistance);

  if (distance < EPSILON || distance > threshold) {
    return null;
  }

  const delta = {
    x: normal.x * signedDistance,
    y: normal.y * signedDistance
  };
  const movedSegment = {
    from: add(movingSegment.from, delta),
    to: add(movingSegment.to, delta)
  };

  if (!segmentsOverlapOnAxis(movedSegment, targetSegment, targetUnit)) {
    return null;
  }

  return {
    delta,
    distance,
    guides: [getSegmentGuide(targetSegment)],
    priority: 2
  };
}

function getCombinedAxisCandidate(
  xCandidate: AxisSnapCandidate | null,
  yCandidate: AxisSnapCandidate | null
): SnapCandidate | null {
  if (!xCandidate && !yCandidate) {
    return null;
  }

  const delta = {
    x: xCandidate?.delta ?? 0,
    y: yCandidate?.delta ?? 0
  };

  return {
    delta,
    distance: Math.hypot(delta.x, delta.y),
    guides: [xCandidate?.guide, yCandidate?.guide].filter(
      (guide): guide is SnapGuide => Boolean(guide)
    ),
    priority: 0
  };
}

function createGridAxisCandidate(
  axis: Axis,
  delta: number,
  position: number,
  bounds: BoundingBox,
  threshold: number
): AxisSnapCandidate | null {
  if (Math.abs(delta) > threshold) {
    return null;
  }

  return {
    delta,
    guide:
      axis === "x"
        ? {
            orientation: "vertical",
            position,
            from: bounds.y,
            to: bounds.y + bounds.height
          }
        : {
            orientation: "horizontal",
            position,
            from: bounds.x,
            to: bounds.x + bounds.width
          }
  };
}

function getBetterAxisCandidate(
  current: AxisSnapCandidate | null,
  next: AxisSnapCandidate | null
): AxisSnapCandidate | null {
  if (!next) {
    return current;
  }

  if (!current || Math.abs(next.delta) < Math.abs(current.delta)) {
    return next;
  }

  return current;
}

function getBetterShapeCandidate(
  current: SnapCandidate | null,
  next: SnapCandidate | null
): SnapCandidate | null {
  if (!next) {
    return current;
  }

  if (!current) {
    return next;
  }

  if (next.priority !== current.priority) {
    return next.priority > current.priority ? next : current;
  }

  return next.distance < current.distance ? next : current;
}

function mergeOutlines(outlines: ObjectOutline[]): ObjectOutline {
  const points = outlines.flatMap((outline) => outline.points);
  const segments = outlines.flatMap((outline) => outline.segments);
  const bounds = mergeBoxes(outlines.map((outline) => outline.bounds));

  return {
    points,
    segments,
    bounds,
    center: {
      x: bounds.x + bounds.width / 2,
      y: bounds.y + bounds.height / 2
    }
  };
}

function mergeBoxes(boxes: BoundingBox[]): BoundingBox {
  const minX = Math.min(...boxes.map((box) => box.x));
  const minY = Math.min(...boxes.map((box) => box.y));
  const maxX = Math.max(...boxes.map((box) => box.x + box.width));
  const maxY = Math.max(...boxes.map((box) => box.y + box.height));

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY
  };
}

function getSegmentGuide(segment: Segment): SnapGuide {
  if (Math.abs(segment.from.x - segment.to.x) < EPSILON) {
    return {
      orientation: "vertical",
      position: segment.from.x,
      from: Math.min(segment.from.y, segment.to.y),
      to: Math.max(segment.from.y, segment.to.y)
    };
  }

  if (Math.abs(segment.from.y - segment.to.y) < EPSILON) {
    return {
      orientation: "horizontal",
      position: segment.from.y,
      from: Math.min(segment.from.x, segment.to.x),
      to: Math.max(segment.from.x, segment.to.x)
    };
  }

  return {
    orientation: "segment",
    from: segment.from,
    to: segment.to
  };
}

function getClosestPointOnSegment(point: Point, segment: Segment): Point {
  const segmentVector = subtract(segment.to, segment.from);
  const segmentLengthSquared = dot(segmentVector, segmentVector);

  if (segmentLengthSquared < EPSILON) {
    return segment.from;
  }

  const rawT = dot(subtract(point, segment.from), segmentVector) / segmentLengthSquared;
  const t = Math.min(1, Math.max(0, rawT));

  return {
    x: segment.from.x + segmentVector.x * t,
    y: segment.from.y + segmentVector.y * t
  };
}

function segmentsOverlapOnAxis(a: Segment, b: Segment, axis: Point): boolean {
  const aRange = getProjectionRange(a, axis);
  const bRange = getProjectionRange(b, axis);

  return aRange.min <= bRange.max + EPSILON && bRange.min <= aRange.max + EPSILON;
}

function getProjectionRange(segment: Segment, axis: Point) {
  const from = dot(segment.from, axis);
  const to = dot(segment.to, axis);

  return {
    min: Math.min(from, to),
    max: Math.max(from, to)
  };
}

function add(a: Point, b: Point): Point {
  return {
    x: a.x + b.x,
    y: a.y + b.y
  };
}

function subtract(a: Point, b: Point): Point {
  return {
    x: a.x - b.x,
    y: a.y - b.y
  };
}

function dot(a: Point, b: Point): number {
  return a.x * b.x + a.y * b.y;
}

function cross(a: Point, b: Point): number {
  return a.x * b.y - a.y * b.x;
}

function length(point: Point): number {
  return Math.hypot(point.x, point.y);
}

function isCenterPoint(point: Point, outline: ObjectOutline): boolean {
  return (
    Math.abs(point.x - outline.center.x) < EPSILON &&
    Math.abs(point.y - outline.center.y) < EPSILON
  );
}

function getAxisSnapPoints(outline: ObjectOutline): Point[] {
  return outline.points.filter(
    (point) => isCenterPoint(point, outline) || isSegmentEndpoint(point, outline)
  );
}

function isSegmentEndpoint(point: Point, outline: ObjectOutline): boolean {
  return outline.segments.some(
    (segment) => samePoint(point, segment.from) || samePoint(point, segment.to)
  );
}

function samePoint(a: Point, b: Point): boolean {
  return Math.abs(a.x - b.x) < EPSILON && Math.abs(a.y - b.y) < EPSILON;
}
