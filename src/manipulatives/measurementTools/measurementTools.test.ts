import { describe, expect, it } from "vitest";
import { createScene } from "../../core/scene";
import { deserializeScene, serializeScene } from "../../core/sceneSerialization";
import {
  createMeasurementTool,
  formatDegreeLabel,
  generateRulerTicks,
  normalizeAngle
} from "./measurementTools";

describe("measurement tools", () => {
  it("normalizes angles to 0 through 359 degrees", () => {
    expect(normalizeAngle(0)).toBe(0);
    expect(normalizeAngle(360)).toBe(0);
    expect(normalizeAngle(405)).toBe(45);
    expect(normalizeAngle(-30)).toBe(330);
  });

  it("formats degree labels", () => {
    expect(formatDegreeLabel(45)).toBe("45°");
    expect(formatDegreeLabel(90.4)).toBe("90°");
    expect(formatDegreeLabel(-30)).toBe("330°");
  });

  it("generates ruler ticks with major ticks on whole units", () => {
    const ticks = generateRulerTicks(32, 8);

    expect(ticks).toEqual([
      { offset: 0, major: true, label: "0" },
      { offset: 8, major: false, label: "" },
      { offset: 16, major: true, label: "1" },
      { offset: 24, major: false, label: "" },
      { offset: 32, major: true, label: "2" }
    ]);
  });

  it("serializes and deserializes MeasurementTool data through scene JSON", () => {
    const tool = createMeasurementTool({
      id: "angle-marker-1",
      kind: "angleMarker",
      angle: 45,
      x: 80,
      y: 96,
      unit: "grid",
      showLabel: true,
      showTicks: false
    });
    const scene = createScene({
      id: "scene-measurement-tools",
      now: "2026-06-14T00:00:00.000Z",
      objects: [tool]
    });

    const result = deserializeScene(serializeScene(scene));

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.scene.objects[0]).toEqual(tool);
  });
});
