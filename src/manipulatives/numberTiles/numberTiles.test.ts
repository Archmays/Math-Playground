import { describe, expect, it } from "vitest";
import { createScene } from "../../core/scene";
import { deserializeScene, serializeScene } from "../../core/sceneSerialization";
import {
  createNumberTile,
  sumSelectedNumberTiles,
  updateNumberTileValue
} from "./numberTiles";

describe("number tiles", () => {
  it("createNumberTile creates a serializable number tile", () => {
    const tile = createNumberTile({
      id: "tile-1",
      value: 5,
      x: 32,
      y: 64,
      label: "five"
    });

    expect(tile).toMatchObject({
      id: "tile-1",
      type: "number-tile",
      x: 32,
      y: 64,
      label: "five",
      data: {
        value: 5,
        colorScheme: "auto",
        showValue: true,
        size: "medium"
      }
    });
    expect(tile.data.width).toBeGreaterThan(0);
    expect(tile.data.height).toBe(tile.data.width);
  });

  it("updateNumberTileValue changes value and default label immutably", () => {
    const tile = createNumberTile({
      id: "tile-1",
      value: 1
    });

    const updated = updateNumberTileValue(tile, 10);

    expect(updated).toMatchObject({
      id: "tile-1",
      label: "10",
      data: {
        value: 10
      }
    });
    expect(tile.data.value).toBe(1);
    expect(updated).not.toBe(tile);
    expect(updated.data).not.toBe(tile.data);
  });

  it("sumSelectedNumberTiles totals selected number tile values only", () => {
    const one = createNumberTile({ id: "tile-1", value: 1 });
    const five = createNumberTile({ id: "tile-5", value: 5 });
    const scene = createScene({
      objects: [
        one,
        five,
        {
          ...createNumberTile({ id: "hidden-10", value: 10 }),
          visible: false
        },
        {
          id: "shape-1",
          type: "shape",
          x: 0,
          y: 0,
          rotation: 0,
          scaleX: 1,
          scaleY: 1,
          locked: false,
          visible: true,
          label: "",
          data: { value: 99, width: 20, height: 20 }
        }
      ]
    });

    expect(
      sumSelectedNumberTiles(scene.objects, [
        "tile-1",
        "tile-5",
        "hidden-10",
        "shape-1"
      ])
    ).toBe(6);
  });

  it("serializes and deserializes NumberTile data through scene JSON", () => {
    const tile = createNumberTile({
      id: "tile-10",
      value: 10,
      colorScheme: "warm",
      showValue: false,
      size: "large",
      groupId: "group-a"
    });
    const scene = createScene({
      id: "scene-number-tiles",
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
