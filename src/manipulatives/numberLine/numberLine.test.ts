import { describe, expect, it } from "vitest";
import { createScene } from "../../core/scene";
import { deserializeScene, serializeScene } from "../../core/sceneSerialization";
import {
  createNumberLine,
  isNumberLineObject,
  NUMBER_LINE_TYPE
} from "./numberLine";

describe("number line manipulative", () => {
  it("creates a default number line object", () => {
    const object = createNumberLine({ id: "line-1", x: 24, y: 48 });

    expect(object).toMatchObject({
      id: "line-1",
      type: NUMBER_LINE_TYPE,
      x: 24,
      y: 48,
      label: "数轴",
      data: {
        min: 0,
        max: 10,
        step: 1,
        showLabels: true,
        width: 360,
        height: 72
      }
    });
    expect(isNumberLineObject(object)).toBe(true);
  });

  it("round-trips through scene JSON", () => {
    const scene = createScene({
      id: "number-line-scene",
      now: "2026-06-15T00:00:00.000Z",
      objects: [
        createNumberLine({
          id: "line-1",
          min: -2,
          max: 2,
          step: 0.5,
          showLabels: false
        })
      ]
    });

    const parsed = deserializeScene(serializeScene(scene));

    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.scene.objects[0]).toMatchObject({
        type: NUMBER_LINE_TYPE,
        data: {
          min: -2,
          max: 2,
          step: 0.5,
          showLabels: false
        }
      });
    }
  });
});
