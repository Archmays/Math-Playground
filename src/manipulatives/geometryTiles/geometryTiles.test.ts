import { describe, expect, it } from "vitest";
import { createScene } from "../../core/scene";
import { deserializeScene, serializeScene } from "../../core/sceneSerialization";
import {
  createGeometryTile,
  getGeometryTileAspectRatio,
  getGeometryTileMeasurements,
  snapRotationAngle,
  updateGeometryTileData
} from "./geometryTiles";

describe("geometry tiles", () => {
  it("createGeometryTile creates a serializable geometry tile", () => {
    const tile = createGeometryTile({
      id: "geometry-square-1",
      shape: "square",
      x: 32,
      y: 48,
      width: 64,
      height: 64,
      colorScheme: "warm",
      showLabel: false,
      showVertices: true
    });

    expect(tile).toMatchObject({
      id: "geometry-square-1",
      type: "geometry-tile",
      x: 32,
      y: 48,
      label: "正方形",
      data: {
        shape: "square",
        width: 64,
        height: 64,
        colorScheme: "warm",
        showLabel: false,
        showVertices: true
      }
    });
  });

  it("snapRotationAngle snaps to 15 degree steps unless disabled", () => {
    expect(snapRotationAngle(22)).toBe(15);
    expect(snapRotationAngle(23)).toBe(30);
    expect(snapRotationAngle(-8)).toBe(-15);
    expect(snapRotationAngle(23, true)).toBe(23);
  });

  it("keeps circle and square geometry tiles proportional when dimensions change", () => {
    const square = createGeometryTile({
      shape: "square",
      width: 80,
      height: 80
    });
    const circle = createGeometryTile({
      shape: "circle",
      width: 88,
      height: 88
    });

    expect(updateGeometryTileData(square, { width: 120 }).data).toMatchObject({
      width: 120,
      height: 120
    });
    expect(updateGeometryTileData(circle, { height: 144 }).data).toMatchObject({
      width: 144,
      height: 144
    });
  });

  it("uses an equilateral triangle aspect ratio when triangle dimensions change", () => {
    const triangle = createGeometryTile({
      shape: "triangle",
      width: 96,
      height: 83
    });
    const updated = updateGeometryTileData(triangle, { width: 120 });

    expect(getGeometryTileAspectRatio("triangle")).toBeCloseTo(2 / Math.sqrt(3));
    expect(updated.data.height).toBe(104);
  });

  it("calculates rectangle area and perimeter", () => {
    const tile = createGeometryTile({
      shape: "rectangle",
      width: 120,
      height: 80
    });

    expect(getGeometryTileMeasurements(tile.data)).toMatchObject({
      area: 9600,
      perimeter: 400,
      unsupportedMessage: ""
    });
  });

  it("calculates square area and perimeter", () => {
    const tile = createGeometryTile({
      shape: "square",
      width: 72,
      height: 72
    });

    expect(getGeometryTileMeasurements(tile.data)).toMatchObject({
      area: 5184,
      perimeter: 288,
      unsupportedMessage: ""
    });
  });

  it("calculates circle area and radius details", () => {
    const tile = createGeometryTile({
      shape: "circle",
      width: 100,
      height: 100
    });
    const measurements = getGeometryTileMeasurements(tile.data);

    expect(measurements.area).toBeCloseTo(Math.PI * 50 * 50);
    expect(measurements.radius).toBe(50);
    expect(measurements.diameter).toBe(100);
    expect(measurements.perimeter).toBeUndefined();
  });

  it("serializes and deserializes GeometryTile data through scene JSON", () => {
    const tile = createGeometryTile({
      id: "geometry-hexagon-1",
      shape: "hexagon",
      width: 96,
      height: 84,
      showLabel: true,
      showVertices: true
    });
    const scene = createScene({
      id: "scene-geometry-tiles",
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
