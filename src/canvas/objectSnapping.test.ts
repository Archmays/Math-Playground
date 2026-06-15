import { describe, expect, it } from "vitest";
import { createObject } from "../core/scene";
import { createGeometryTile } from "../manipulatives/geometryTiles/geometryTiles";
import {
  getGridSnapAdjustment,
  getObjectSnapAdjustment
} from "./objectSnapping";

describe("object snapping", () => {
  it("snaps geometry tile outline points to nearby grid coordinates", () => {
    const triangle = createGeometryTile({
      id: "triangle",
      shape: "triangle",
      x: 14,
      y: 40,
      width: 96,
      height: 83,
      showLabel: false
    });

    const result = getGridSnapAdjustment({
      movingObjects: [triangle],
      gridSize: 20
    });

    expect(result.delta.x).toBeCloseTo(-2);
    expect(result.delta.y).toBe(0);
    expect(result.guides).toContainEqual({
      orientation: "vertical",
      position: 60,
      from: 40,
      to: 123
    });
  });

  it("snaps a moving object edge to a nearby visible unlocked object edge", () => {
    const moving = createObject({
      id: "moving",
      type: "demo-rectangle",
      x: 97,
      y: 24,
      data: { width: 48, height: 48 }
    });
    const target = createObject({
      id: "target",
      type: "demo-rectangle",
      x: 150,
      y: 96,
      data: { width: 80, height: 48 }
    });

    const result = getObjectSnapAdjustment({
      movingObjects: [moving],
      sceneObjects: [moving, target],
      threshold: 8
    });

    expect(result.delta).toEqual({ x: 5, y: 0 });
    expect(result.guides).toContainEqual({
      orientation: "vertical",
      position: 150,
      from: 24,
      to: 144
    });
  });

  it("snaps moving object centers to nearby object centers", () => {
    const moving = createObject({
      id: "moving",
      type: "demo-circle",
      x: 100,
      y: 32,
      data: { width: 40, height: 40 }
    });
    const target = createObject({
      id: "target",
      type: "demo-circle",
      x: 123,
      y: 96,
      data: { width: 8, height: 8 }
    });

    const result = getObjectSnapAdjustment({
      movingObjects: [moving],
      sceneObjects: [moving, target],
      threshold: 8
    });

    expect(result.delta).toEqual({ x: 7, y: 0 });
    expect(result.guides).toContainEqual({
      orientation: "vertical",
      position: 127,
      from: 32,
      to: 104
    });
  });

  it("snaps a triangle vertex to a nearby object edge instead of its bounding box", () => {
    const moving = createGeometryTile({
      id: "moving-triangle",
      shape: "triangle",
      x: 80,
      y: 120,
      width: 80,
      height: 69,
      showLabel: false
    });
    const target = createObject({
      id: "target",
      type: "demo-rectangle",
      x: 124,
      y: 96,
      data: { width: 72, height: 160 }
    });

    const result = getObjectSnapAdjustment({
      movingObjects: [moving],
      sceneObjects: [moving, target],
      threshold: 8
    });

    expect(result.delta.x).toBeCloseTo(4);
    expect(result.delta.y).toBe(0);
  });

  it("uses rotated outline points when snapping a diamond-shaped square", () => {
    const moving = createGeometryTile({
      id: "moving-square",
      shape: "square",
      x: 0,
      y: 0,
      width: 80,
      height: 80,
      showLabel: false
    });
    const rotatedMoving = {
      ...moving,
      rotation: 45
    };
    const target = createObject({
      id: "target",
      type: "demo-rectangle",
      x: 100,
      y: 0,
      data: { width: 72, height: 96 }
    });

    const result = getObjectSnapAdjustment({
      movingObjects: [rotatedMoving],
      sceneObjects: [rotatedMoving, target],
      threshold: 8
    });

    expect(result.delta.x).toBeCloseTo(100 - (40 + Math.SQRT2 * 40));
    expect(result.delta.y).toBe(0);
  });

  it("snaps parallel sloped geometry edges to each other", () => {
    const moving = createGeometryTile({
      id: "moving-parallelogram",
      shape: "parallelogram",
      x: 0,
      y: 0,
      width: 100,
      height: 60,
      showLabel: false
    });
    const target = createGeometryTile({
      id: "target-parallelogram",
      shape: "parallelogram",
      x: 90,
      y: 0,
      width: 100,
      height: 60,
      showLabel: false
    });

    const result = getObjectSnapAdjustment({
      movingObjects: [moving],
      sceneObjects: [moving, target],
      threshold: 18
    });

    expect(Math.hypot(result.delta.x, result.delta.y)).toBeGreaterThan(0);
    expect(result.guides).toContainEqual({
      orientation: "segment",
      from: { x: 90, y: 60 },
      to: { x: 114, y: 0 }
    });
  });

  it("ignores hidden locked and moving objects as snap targets", () => {
    const moving = createObject({
      id: "moving",
      type: "demo-rectangle",
      x: 97,
      y: 24,
      data: { width: 48, height: 48 }
    });
    const hiddenTarget = createObject({
      id: "hidden",
      type: "demo-rectangle",
      x: 150,
      y: 24,
      visible: false,
      data: { width: 80, height: 48 }
    });
    const lockedTarget = createObject({
      id: "locked",
      type: "demo-rectangle",
      x: 150,
      y: 24,
      locked: true,
      data: { width: 80, height: 48 }
    });

    const result = getObjectSnapAdjustment({
      movingObjects: [moving],
      sceneObjects: [moving, hiddenTarget, lockedTarget],
      threshold: 8
    });

    expect(result.delta).toEqual({ x: 0, y: 0 });
    expect(result.guides).toEqual([]);
  });
});
