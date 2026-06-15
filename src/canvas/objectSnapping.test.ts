import { describe, expect, it } from "vitest";
import { createObject } from "../core/scene";
import { getObjectSnapAdjustment } from "./objectSnapping";

describe("object snapping", () => {
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
