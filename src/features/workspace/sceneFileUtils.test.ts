import { describe, expect, it } from "vitest";
import { createScene } from "../../core/scene";
import { serializeScene } from "../../core/sceneSerialization";
import { createCoordinateGrid } from "../../manipulatives/coordinateGrid/coordinateGrid";
import { createNumberLine } from "../../manipulatives/numberLine/numberLine";
import { parseAutoSavedScene, sceneToSvgString } from "./sceneFileUtils";

describe("workspace auto save restore", () => {
  it("returns empty when no auto-save text exists", () => {
    expect(parseAutoSavedScene(null)).toEqual({
      status: "empty"
    });
  });

  it("returns a scene for valid auto-save text without needing confirmation", () => {
    const scene = createScene({
      id: "saved-scene",
      title: "saved",
      now: "2026-06-14T00:00:00.000Z"
    });

    expect(parseAutoSavedScene(serializeScene(scene))).toEqual({
      status: "ready",
      scene
    });
  });

  it("returns an error for invalid auto-save text", () => {
    expect(parseAutoSavedScene("{")).toEqual({
      status: "error",
      error: "JSON 文件格式无效。"
    });
  });

  it("renders coordinate grids as coordinate-grid SVG content", () => {
    const scene = createScene({
      id: "export-coordinate-grid",
      title: "export",
      objects: [createCoordinateGrid({ id: "grid-1" })]
    });

    const svg = sceneToSvgString(scene);

    expect(svg).toContain('data-object-type="coordinate-grid"');
    expect(svg).toContain(">0<");
  });
});

describe("workspace scene export", () => {
  it("renders number lines as number-line SVG content", () => {
    const scene = createScene({
      id: "export-number-line",
      title: "export",
      objects: [createNumberLine({ id: "line-1", min: -1, max: 1, step: 1 })]
    });

    const svg = sceneToSvgString(scene);

    expect(svg).toContain('data-object-type="number-line"');
    expect(svg).toContain(">0<");
  });
});
