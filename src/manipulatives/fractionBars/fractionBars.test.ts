import { describe, expect, it } from "vitest";
import { createScene } from "../../core/scene";
import { deserializeScene, serializeScene } from "../../core/sceneSerialization";
import {
  createFractionBar,
  getSelectedFractionSummary,
  updateFractionBarDenominator,
  updateFractionBarNumerator
} from "./fractionBars";

describe("fraction bars", () => {
  it("createFractionBar creates a serializable fraction bar", () => {
    const bar = createFractionBar({
      id: "fraction-1-4",
      numerator: 1,
      denominator: 4,
      x: 32,
      y: 64
    });

    expect(bar).toMatchObject({
      id: "fraction-1-4",
      type: "fraction-bar",
      x: 32,
      y: 64,
      label: "1/4",
      data: {
        numerator: 1,
        denominator: 4,
        totalWidth: 240,
        showLabels: true,
        showTicks: true,
        colorScheme: "auto",
        width: 240,
        height: 48
      }
    });
  });

  it("updates numerator and denominator while preserving a valid fraction", () => {
    const bar = createFractionBar({
      id: "fraction-1-4",
      numerator: 1,
      denominator: 4
    });

    const changedNumerator = updateFractionBarNumerator(bar, 3);
    const changedDenominator = updateFractionBarDenominator(changedNumerator, 5);

    expect(changedNumerator).toMatchObject({
      label: "3/4",
      data: {
        numerator: 3,
        denominator: 4
      }
    });
    expect(changedDenominator).toMatchObject({
      label: "3/5",
      data: {
        numerator: 3,
        denominator: 5
      }
    });
    expect(bar.data.numerator).toBe(1);
  });

  it("validates numerator against denominator", () => {
    const bar = createFractionBar({
      id: "fraction-3-4",
      numerator: 3,
      denominator: 4
    });

    const tooLargeNumerator = updateFractionBarNumerator(bar, 8);
    const smallerDenominator = updateFractionBarDenominator(bar, 2);
    const zeroDenominator = updateFractionBarDenominator(bar, 0);
    const largeDenominator = updateFractionBarDenominator(bar, 99);

    expect(tooLargeNumerator.data.numerator).toBe(4);
    expect(smallerDenominator.data).toMatchObject({
      numerator: 2,
      denominator: 2
    });
    expect(zeroDenominator.data.denominator).toBe(1);
    expect(largeDenominator.data.denominator).toBe(24);
  });

  it("summarizes selected fraction bars and adds same denominators", () => {
    const first = createFractionBar({
      id: "fraction-1-4",
      numerator: 1,
      denominator: 4
    });
    const second = createFractionBar({
      id: "fraction-2-4",
      numerator: 2,
      denominator: 4
    });
    const scene = createScene({ objects: [first, second] });

    const summary = getSelectedFractionSummary(scene.objects, [
      "fraction-1-4",
      "fraction-2-4"
    ]);

    expect(summary).toEqual({
      fractions: [
        { id: "fraction-1-4", label: "1/4", decimalValue: 0.25 },
        { id: "fraction-2-4", label: "2/4", decimalValue: 0.5 }
      ],
      canAdd: true,
      sumLabel: "3/4",
      message: ""
    });
  });

  it("does not add different denominators", () => {
    const first = createFractionBar({
      id: "fraction-1-2",
      numerator: 1,
      denominator: 2
    });
    const second = createFractionBar({
      id: "fraction-1-3",
      numerator: 1,
      denominator: 3
    });

    const summary = getSelectedFractionSummary([first, second], [
      "fraction-1-2",
      "fraction-1-3"
    ]);

    expect(summary).toMatchObject({
      canAdd: false,
      sumLabel: "",
      message: "分母不同，暂不自动相加"
    });
  });

  it("serializes and deserializes FractionBar data through scene JSON", () => {
    const bar = createFractionBar({
      id: "fraction-save",
      numerator: 3,
      denominator: 8,
      totalWidth: 320,
      showLabels: false,
      showTicks: false,
      colorScheme: "warm"
    });
    const scene = createScene({
      id: "scene-fraction-bar",
      now: "2026-06-14T00:00:00.000Z",
      objects: [bar]
    });

    const result = deserializeScene(serializeScene(scene));

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.scene.objects[0]).toEqual(bar);
  });
});
