import { describe, expect, it } from "vitest";
import {
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
});
