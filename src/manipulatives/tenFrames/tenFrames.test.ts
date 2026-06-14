import { describe, expect, it } from "vitest";
import { createScene } from "../../core/scene";
import { deserializeScene, serializeScene } from "../../core/sceneSerialization";
import { createNumberTile } from "../numberTiles/numberTiles";
import {
  countSelectedMathValue,
  createTenFrame,
  setFilledCount,
  toggleCell
} from "./tenFrames";

describe("ten frames", () => {
  it("createTenFrame creates a serializable ten frame", () => {
    const frame = createTenFrame({
      id: "ten-frame-1",
      filledCount: 5,
      x: 32,
      y: 64
    });

    expect(frame).toMatchObject({
      id: "ten-frame-1",
      type: "ten-frame",
      x: 32,
      y: 64,
      label: "十格阵",
      data: {
        filledCount: 5,
        rows: 2,
        columns: 5,
        tokenShape: "circle",
        fillMode: "left-to-right"
      }
    });
    expect(frame.data.width).toBeGreaterThan(0);
    expect(frame.data.height).toBeGreaterThan(0);
  });

  it("toggleCell switches to manual mode and updates filledCount", () => {
    const frame = createTenFrame({
      id: "ten-frame-1",
      filledCount: 5
    });

    const removed = toggleCell(frame, 2);
    const added = toggleCell(removed, 8);

    expect(removed.data).toMatchObject({
      fillMode: "manual",
      filledCount: 4,
      tokenPositions: [0, 1, 3, 4]
    });
    expect(added.data).toMatchObject({
      fillMode: "manual",
      filledCount: 5,
      tokenPositions: [0, 1, 3, 4, 8]
    });
    expect(frame.data.fillMode).toBe("left-to-right");
  });

  it("setFilledCount clamps count and updates manual positions", () => {
    const frame = createTenFrame({
      id: "ten-frame-1",
      filledCount: 0,
      fillMode: "manual",
      tokenPositions: [1, 4, 8]
    });

    const increased = setFilledCount(frame, 5);
    const clamped = setFilledCount(increased, 12);

    expect(increased.data).toMatchObject({
      filledCount: 5,
      tokenPositions: [0, 1, 2, 4, 8]
    });
    expect(clamped.data).toMatchObject({
      filledCount: 10,
      tokenPositions: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
    });
  });

  it("countSelectedMathValue totals selected NumberTiles and TenFrames", () => {
    const tile = createNumberTile({ id: "tile-3", value: 3 });
    const frame = createTenFrame({ id: "frame-7", filledCount: 7 });
    const hiddenFrame = {
      ...createTenFrame({ id: "hidden-frame", filledCount: 10 }),
      visible: false
    };
    const scene = createScene({
      objects: [tile, frame, hiddenFrame]
    });

    expect(
      countSelectedMathValue(scene.objects, ["tile-3", "frame-7", "hidden-frame"])
    ).toBe(10);
  });

  it("serializes and deserializes TenFrame data through scene JSON", () => {
    const frame = createTenFrame({
      id: "ten-frame-save",
      filledCount: 4,
      tokenShape: "square",
      fillMode: "manual",
      tokenPositions: [0, 2, 5, 9]
    });
    const scene = createScene({
      id: "scene-ten-frame",
      now: "2026-06-14T00:00:00.000Z",
      objects: [frame]
    });

    const result = deserializeScene(serializeScene(scene));

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.scene.objects[0]).toEqual(frame);
  });
});
