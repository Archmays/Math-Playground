import { describe, expect, it } from "vitest";
import { createGeometryTile } from "../manipulatives/geometryTiles/geometryTiles";
import {
  getSelectionActionBarStyle,
  resizeObjectsFromDrag,
  shouldKeepAspectRatioForResize,
  type ResizeDragState
} from "./MathCanvas";

describe("MathCanvas resize constraints", () => {
  it("keeps fixed-ratio geometry tiles proportional without requiring Shift", () => {
    const square = createGeometryTile({
      id: "square-1",
      shape: "square",
      width: 80,
      height: 80,
      x: 0,
      y: 0
    });
    const dragState: ResizeDragState = {
      mode: "resize",
      handle: "se",
      startPointer: { x: 80, y: 80 },
      startBox: { x: 0, y: 0, width: 80, height: 80 },
      startObjects: { "square-1": square },
      objectIds: ["square-1"]
    };

    const resized = resizeObjectsFromDrag(dragState, { x: 160, y: 96 }, false);

    expect(shouldKeepAspectRatioForResize([square], false)).toBe(true);
    expect(resized["square-1"].scaleX).toBeCloseTo(resized["square-1"].scaleY);
  });
});

describe("MathCanvas selection action bar placement", () => {
  it("places the action bar below the selected object and clamps it inside the canvas", () => {
    const style = getSelectionActionBarStyle(
      { x: 220, y: 80, width: 80, height: 80 },
      { x: 0, y: 0, zoom: 1 },
      { width: 300, height: 400 }
    );

    expect(style.top).toBeGreaterThan(160);
    expect(style.left).toBe(150);
  });
});
