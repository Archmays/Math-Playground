import { describe, expect, it } from "vitest";
import { createObject } from "../core/scene";
import {
  boxesIntersect,
  getObjectIdsIntersectingBox,
  normalizeRectFromPoints,
  panViewport,
  screenToWorld,
  worldToScreen,
  zoomAtPoint
} from "./canvasUtils";

describe("canvas coordinate conversion", () => {
  it("converts screen coordinates to world coordinates", () => {
    const viewport = { x: 100, y: 50, zoom: 2 };

    expect(screenToWorld({ x: 20, y: 40 }, viewport)).toEqual({
      x: 110,
      y: 70
    });
  });

  it("converts world coordinates to screen coordinates", () => {
    const viewport = { x: 100, y: 50, zoom: 2 };

    expect(worldToScreen({ x: 110, y: 70 }, viewport)).toEqual({
      x: 20,
      y: 40
    });
  });

  it("zooms around a fixed screen point", () => {
    const viewport = { x: 0, y: 0, zoom: 1 };
    const nextViewport = zoomAtPoint(viewport, { x: 100, y: 100 }, 2);

    expect(nextViewport).toEqual({
      x: 50,
      y: 50,
      zoom: 2
    });
    expect(screenToWorld({ x: 100, y: 100 }, nextViewport)).toEqual({
      x: 100,
      y: 100
    });
  });

  it("pans viewport from a screen-space drag delta", () => {
    const viewport = { x: 100, y: 50, zoom: 2 };

    expect(panViewport(viewport, { x: 20, y: -10 })).toEqual({
      x: 90,
      y: 55,
      zoom: 2
    });
  });

  it("normalizes a drag rectangle from any direction", () => {
    expect(
      normalizeRectFromPoints({ x: 120, y: 90 }, { x: 40, y: 150 })
    ).toEqual({
      x: 40,
      y: 90,
      width: 80,
      height: 60
    });
  });

  it("treats touching bounding boxes as intersecting", () => {
    expect(
      boxesIntersect(
        { x: 10, y: 10, width: 40, height: 40 },
        { x: 50, y: 30, width: 20, height: 20 }
      )
    ).toBe(true);
  });

  it("does not intersect separated bounding boxes", () => {
    expect(
      boxesIntersect(
        { x: 10, y: 10, width: 20, height: 20 },
        { x: 40, y: 40, width: 20, height: 20 }
      )
    ).toBe(false);
  });

  it("finds visible object ids whose bounds intersect a selection box", () => {
    const objects = [
      createObject({
        id: "rect-1",
        type: "demo-rectangle",
        x: 10,
        y: 10,
        data: { width: 40, height: 40 }
      }),
      createObject({
        id: "circle-1",
        type: "demo-circle",
        x: 80,
        y: 80,
        data: { width: 30, height: 30 }
      }),
      createObject({
        id: "hidden-1",
        type: "demo-rectangle",
        x: 20,
        y: 20,
        visible: false,
        data: { width: 30, height: 30 }
      })
    ];

    expect(
      getObjectIdsIntersectingBox(objects, {
        x: 35,
        y: 35,
        width: 50,
        height: 50
      })
    ).toEqual(["rect-1", "circle-1"]);
  });
});
