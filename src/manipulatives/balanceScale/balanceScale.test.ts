import { describe, expect, it } from "vitest";
import { createScene } from "../../core/scene";
import { deserializeScene, serializeScene } from "../../core/sceneSerialization";
import { createNumberTile } from "../numberTiles/numberTiles";
import {
  calculateTilt,
  compareValues,
  createBalanceScale,
  setLeftFromSelectedNumberTiles,
  setRightFromSelectedNumberTiles
} from "./balanceScale";

describe("balance scale", () => {
  it("createBalanceScale creates a serializable balance scale", () => {
    const scale = createBalanceScale({
      id: "balance-1",
      leftValue: 5,
      rightValue: 5,
      showValues: false,
      mode: "manual",
      x: 32,
      y: 48
    });

    expect(scale).toMatchObject({
      id: "balance-1",
      type: "balance-scale",
      x: 32,
      y: 48,
      label: "天平",
      data: {
        leftValue: 5,
        rightValue: 5,
        showValues: false,
        mode: "manual",
        tilt: 0,
        width: 220,
        height: 150
      }
    });
  });

  it("compareValues returns the balance relation", () => {
    expect(compareValues(5, 5)).toBe("equal");
    expect(compareValues(7, 3)).toBe("left-greater");
    expect(compareValues(3, 7)).toBe("right-greater");
  });

  it("calculateTilt tilts toward the heavier side", () => {
    expect(calculateTilt(5, 5)).toBe(0);
    expect(calculateTilt(7, 3)).toBeLessThan(0);
    expect(calculateTilt(3, 7)).toBeGreaterThan(0);
    expect(calculateTilt(0, 100)).toBe(14);
    expect(calculateTilt(100, 0)).toBe(-14);
  });

  it("setLeftFromSelectedNumberTiles uses selected number tile total", () => {
    const scale = createBalanceScale({
      id: "balance-1",
      leftValue: 0,
      rightValue: 9
    });
    const three = createNumberTile({ id: "number-3", value: 3 });
    const four = createNumberTile({ id: "number-4", value: 4 });
    const ignored = createNumberTile({ id: "number-99", value: 99 });
    const next = setLeftFromSelectedNumberTiles(
      scale,
      [scale, three, four, ignored],
      ["balance-1", "number-3", "number-4"]
    );

    expect(next.data.leftValue).toBe(7);
    expect(next.data.rightValue).toBe(9);
    expect(next.data.tilt).toBe(calculateTilt(7, 9));
    expect(scale.data.leftValue).toBe(0);
  });

  it("setRightFromSelectedNumberTiles uses selected number tile total", () => {
    const scale = createBalanceScale({
      id: "balance-1",
      leftValue: 8,
      rightValue: 0
    });
    const two = createNumberTile({ id: "number-2", value: 2 });
    const six = createNumberTile({ id: "number-6", value: 6 });
    const next = setRightFromSelectedNumberTiles(
      scale,
      [scale, two, six],
      ["balance-1", "number-2", "number-6"]
    );

    expect(next.data.leftValue).toBe(8);
    expect(next.data.rightValue).toBe(8);
    expect(next.data.tilt).toBe(0);
  });

  it("serializes and deserializes BalanceScale data through scene JSON", () => {
    const scale = createBalanceScale({
      id: "balance-1",
      leftValue: 3,
      rightValue: 7,
      showValues: true,
      mode: "calculated"
    });
    const scene = createScene({
      id: "scene-balance-scale",
      now: "2026-06-14T00:00:00.000Z",
      objects: [scale]
    });

    const result = deserializeScene(serializeScene(scene));

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.scene.objects[0]).toEqual(scale);
  });
});
