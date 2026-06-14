import { describe, expect, it } from "vitest";
import { createScene } from "../../core/scene";
import { deserializeScene, serializeScene } from "../../core/sceneSerialization";
import {
  createAlgebraTile,
  formatAlgebraExpression,
  simplifyAlgebraTiles
} from "./algebraTiles";

describe("algebra tiles", () => {
  it("createAlgebraTile creates a serializable algebra tile", () => {
    const tile = createAlgebraTile({
      id: "algebra-x-1",
      tileKind: "x",
      sign: "negative",
      showLabel: false,
      xLength: 80,
      x: 32,
      y: 48
    });

    expect(tile).toMatchObject({
      id: "algebra-x-1",
      type: "algebra-tile",
      x: 32,
      y: 48,
      label: "-x",
      data: {
        tileKind: "x",
        sign: "negative",
        showLabel: false,
        xLength: 80,
        width: 80,
        height: 32
      }
    });
  });

  it("simplifies positive tiles", () => {
    const tiles = [
      createAlgebraTile({ tileKind: "x2" }),
      createAlgebraTile({ tileKind: "x" }),
      createAlgebraTile({ tileKind: "x" }),
      createAlgebraTile({ tileKind: "unit" })
    ];

    expect(simplifyAlgebraTiles(tiles)).toEqual({
      x2: 1,
      x: 2,
      unit: 1,
      expression: "x² + 2x + 1"
    });
  });

  it("simplifies negative tiles", () => {
    const tiles = [
      createAlgebraTile({ tileKind: "x2", sign: "positive" }),
      createAlgebraTile({ tileKind: "x2", sign: "positive" }),
      createAlgebraTile({ tileKind: "x", sign: "negative" }),
      createAlgebraTile({ tileKind: "unit", sign: "negative" }),
      createAlgebraTile({ tileKind: "unit", sign: "negative" }),
      createAlgebraTile({ tileKind: "unit", sign: "negative" })
    ];

    expect(simplifyAlgebraTiles(tiles).expression).toBe("2x² - x - 3");
  });

  it("formats algebra expressions", () => {
    expect(formatAlgebraExpression({ x2: 0, x: 3, unit: 2 })).toBe("3x + 2");
    expect(formatAlgebraExpression({ x2: -1, x: 1, unit: -1 })).toBe(
      "-x² + x - 1"
    );
    expect(formatAlgebraExpression({ x2: 0, x: 0, unit: 0 })).toBe("0");
  });

  it("serializes and deserializes AlgebraTile data through scene JSON", () => {
    const tile = createAlgebraTile({
      id: "algebra-x2-1",
      tileKind: "x2",
      sign: "negative",
      showLabel: true,
      xLength: 96
    });
    const scene = createScene({
      id: "scene-algebra-tiles",
      now: "2026-06-14T00:00:00.000Z",
      objects: [tile]
    });

    const result = deserializeScene(serializeScene(scene));

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.scene.objects[0]).toEqual(tile);
  });
});
