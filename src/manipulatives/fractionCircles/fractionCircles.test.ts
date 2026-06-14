import { describe, expect, it } from "vitest";
import { createScene } from "../../core/scene";
import { deserializeScene, serializeScene } from "../../core/sceneSerialization";
import { createFractionBar } from "../fractionBars/fractionBars";
import {
  createFractionCircle,
  getFractionCircleSectorPath,
  getSelectedFractionValueSummary,
  updateFractionCircleDenominator,
  updateFractionCircleNumerator
} from "./fractionCircles";

describe("fraction circles", () => {
  it("createFractionCircle creates a serializable fraction circle", () => {
    const circle = createFractionCircle({
      id: "circle-1-4",
      numerator: 1,
      denominator: 4,
      radius: 48,
      x: 32,
      y: 64
    });

    expect(circle).toMatchObject({
      id: "circle-1-4",
      type: "fraction-circle",
      x: 32,
      y: 64,
      label: "1/4",
      data: {
        numerator: 1,
        denominator: 4,
        radius: 48,
        showLabels: true,
        showSectorLines: true,
        startAngle: -90,
        colorScheme: "auto",
        width: 96,
        height: 96
      }
    });
  });

  it("generates an SVG sector path", () => {
    const path = getFractionCircleSectorPath({
      centerX: 50,
      centerY: 50,
      radius: 40,
      startAngle: -90,
      endAngle: 0
    });

    expect(path).toBe("M 50 50 L 50 10 A 40 40 0 0 1 90 50 Z");
  });

  it("updates numerator and denominator while preserving a valid fraction", () => {
    const circle = createFractionCircle({
      id: "circle-1-6",
      numerator: 1,
      denominator: 6
    });

    const changedNumerator = updateFractionCircleNumerator(circle, 3);
    const changedDenominator = updateFractionCircleDenominator(
      changedNumerator,
      2
    );

    expect(changedNumerator).toMatchObject({
      label: "3/6",
      data: {
        numerator: 3,
        denominator: 6
      }
    });
    expect(changedDenominator).toMatchObject({
      label: "2/2",
      data: {
        numerator: 2,
        denominator: 2
      }
    });
    expect(circle.data.numerator).toBe(1);
  });

  it("detects equivalent selected fraction bars and circles", () => {
    const bar = createFractionBar({
      id: "bar-2-4",
      numerator: 2,
      denominator: 4
    });
    const circle = createFractionCircle({
      id: "circle-1-2",
      numerator: 1,
      denominator: 2
    });
    const scene = createScene({ objects: [bar, circle] });

    const summary = getSelectedFractionValueSummary(scene.objects, [
      "bar-2-4",
      "circle-1-2"
    ]);

    expect(summary).toEqual({
      fractions: [
        { id: "bar-2-4", label: "2/4", decimalValue: 0.5 },
        { id: "circle-1-2", label: "1/2", decimalValue: 0.5 }
      ],
      equivalent: true,
      message: "等值分数"
    });
  });

  it("serializes and deserializes FractionCircle data through scene JSON", () => {
    const circle = createFractionCircle({
      id: "circle-save",
      numerator: 3,
      denominator: 8,
      radius: 72,
      showLabels: false,
      showSectorLines: false,
      startAngle: 30,
      colorScheme: "cool"
    });
    const scene = createScene({
      id: "scene-fraction-circle",
      now: "2026-06-14T00:00:00.000Z",
      objects: [circle]
    });

    const result = deserializeScene(serializeScene(scene));

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.scene.objects[0]).toEqual(circle);
  });
});
