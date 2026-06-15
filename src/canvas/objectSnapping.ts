import { getBoundingBox } from "../core/geometry";
import type { BoundingBox, Point, SceneObject } from "../core/scene";

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
    };

interface ObjectSnapOptions {
  movingObjects: SceneObject[];
  sceneObjects: SceneObject[];
  threshold: number;
}

interface SnapCandidate {
  delta: number;
  guide: SnapGuide;
}

type SnapStopKind = "start" | "center" | "end";

interface SnapStop {
  kind: SnapStopKind;
  value: number;
}

export interface ObjectSnapResult {
  delta: Point;
  guides: SnapGuide[];
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
  const movingBox = mergeBoxes(movingObjects.map(getBoundingBox));
  const targets = sceneObjects.filter(
    (object) => object.visible && !object.locked && !movingIds.has(object.id)
  );

  let bestX: SnapCandidate | null = null;
  let bestY: SnapCandidate | null = null;

  for (const target of targets) {
    const targetBox = getBoundingBox(target);
    bestX = getBetterCandidate(
      bestX,
      getAxisSnapCandidate("x", movingBox, targetBox, threshold)
    );
    bestY = getBetterCandidate(
      bestY,
      getAxisSnapCandidate("y", movingBox, targetBox, threshold)
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

function getAxisSnapCandidate(
  axis: "x" | "y",
  movingBox: BoundingBox,
  targetBox: BoundingBox,
  threshold: number
): SnapCandidate | null {
  const movingStops = getStops(axis, movingBox);
  const targetStops = getStops(axis, targetBox);
  let best: SnapCandidate | null = null;

  for (const movingStop of movingStops) {
    for (const targetStop of targetStops) {
      if (!canStopsSnap(movingStop.kind, targetStop.kind)) {
        continue;
      }

      const delta = targetStop.value - movingStop.value;

      if (Math.abs(delta) > threshold) {
        continue;
      }

      best = getBetterCandidate(best, {
        delta,
        guide:
          axis === "x"
            ? {
                orientation: "vertical",
                position: targetStop.value,
                from: Math.min(movingBox.y, targetBox.y),
                to: Math.max(
                  movingBox.y + movingBox.height,
                  targetBox.y + targetBox.height
                )
              }
            : {
                orientation: "horizontal",
                position: targetStop.value,
                from: Math.min(movingBox.x, targetBox.x),
                to: Math.max(
                  movingBox.x + movingBox.width,
                  targetBox.x + targetBox.width
                )
              }
      });
    }
  }

  return best;
}

function getStops(axis: "x" | "y", box: BoundingBox): SnapStop[] {
  if (axis === "x") {
    return [
      { kind: "start", value: box.x },
      { kind: "center", value: box.x + box.width / 2 },
      { kind: "end", value: box.x + box.width }
    ];
  }

  return [
    { kind: "start", value: box.y },
    { kind: "center", value: box.y + box.height / 2 },
    { kind: "end", value: box.y + box.height }
  ];
}

function canStopsSnap(movingKind: SnapStopKind, targetKind: SnapStopKind): boolean {
  if (movingKind === "center" || targetKind === "center") {
    return movingKind === "center" && targetKind === "center";
  }

  return true;
}

function getBetterCandidate(
  current: SnapCandidate | null,
  next: SnapCandidate | null
): SnapCandidate | null {
  if (!next) {
    return current;
  }

  if (!current || Math.abs(next.delta) < Math.abs(current.delta)) {
    return next;
  }

  return current;
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
