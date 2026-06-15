import { describe, expect, it } from "vitest";
import { createScene } from "../../core/scene";
import { deserializeScene, serializeScene } from "../../core/sceneSerialization";
import {
  COORDINATE_GRID_TYPE,
  createCoordinateGrid,
  isCoordinateGridObject
} from "./coordinateGrid";

describe("coordinate grid manipulative", () => {
  it("creates a default coordinate grid object", () => {
    const object = createCoordinateGrid({ id: "grid-1", x: 40, y: 56 });

    expect(object).toMatchObject({
      id: "grid-1",
      type: COORDINATE_GRID_TYPE,
      x: 40,
      y: 56,
      label: "坐标网格",
      data: {
        xMin: -5,
        xMax: 5,
        yMin: -5,
        yMax: 5,
        step: 1,
        showAxes: true,
        showLabels: true,
        width: 320,
        height: 320
      }
    });
    expect(isCoordinateGridObject(object)).toBe(true);
  });

  it("round-trips through scene JSON", () => {
    const scene = createScene({
      id: "coordinate-scene",
      now: "2026-06-15T00:00:00.000Z",
      objects: [
        createCoordinateGrid({
          id: "grid-1",
          xMin: 0,
          xMax: 4,
          yMin: 0,
          yMax: 4,
          step: 0.5,
          showAxes: false,
          showLabels: false
        })
      ]
    });

    const parsed = deserializeScene(serializeScene(scene));

    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.scene.objects[0]).toMatchObject({
        type: COORDINATE_GRID_TYPE,
        data: {
          xMin: 0,
          xMax: 4,
          yMin: 0,
          yMax: 4,
          step: 0.5,
          showAxes: false,
          showLabels: false
        }
      });
    }
  });
});
