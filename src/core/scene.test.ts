import { describe, expect, it } from "vitest";
import {
  BUILT_IN_OBJECT_TYPES,
  cloneObject,
  createObject,
  createScene,
  deleteObject,
  updateObject
} from "./scene";
import { getBoundingBox, snapToGrid } from "./geometry";

describe("scene model", () => {
  it("creates a scene with viewport and grid defaults", () => {
    const scene = createScene({
      id: "scene-test",
      title: "分数任务",
      now: "2026-06-14T00:00:00.000Z"
    });

    expect(scene).toEqual({
      schemaVersion: "0.1.0",
      id: "scene-test",
      title: "分数任务",
      createdAt: "2026-06-14T00:00:00.000Z",
      updatedAt: "2026-06-14T00:00:00.000Z",
      viewport: {
        x: 0,
        y: 0,
        zoom: 1
      },
      grid: {
        enabled: true,
        visible: true,
        snap: true,
        size: 32
      },
      objects: []
    });
  });

  it("creates an object with transform defaults and JSON data", () => {
    const object = createObject({
      id: "object-test",
      type: "number-tile",
      x: 24,
      y: 48,
      label: "7",
      data: { value: 7 }
    });

    expect(object).toEqual({
      id: "object-test",
      type: "number-tile",
      x: 24,
      y: 48,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      locked: false,
      visible: true,
      label: "7",
      data: { value: 7 }
    });
  });

  it("lists the implemented built-in scene object types", () => {
    expect(BUILT_IN_OBJECT_TYPES).toEqual(
      expect.arrayContaining([
        "number-tile",
        "ten-frame",
        "fraction-bar",
        "fraction-circle",
        "geometry-tile",
        "measurement-tool",
        "balance-scale",
        "algebra-tile",
        "demo-rectangle",
        "demo-circle",
        "demo-text"
      ])
    );
  });

  it("clones an object with a new id and offset position", () => {
    const object = createObject({
      id: "tile-1",
      type: "number-tile",
      x: 16,
      y: 16,
      data: { value: 3 }
    });

    const clone = cloneObject(object, { id: "tile-2", offset: { x: 32, y: 16 } });

    expect(clone).toEqual({
      ...object,
      id: "tile-2",
      x: 48,
      y: 32
    });
    expect(clone).not.toBe(object);
    expect(clone.data).not.toBe(object.data);
  });

  it("updates and deletes objects immutably", () => {
    const object = createObject({
      id: "tile-1",
      type: "number-tile",
      data: { value: 1 }
    });
    const scene = createScene({
      id: "scene-test",
      title: "数字任务",
      objects: [object],
      now: "2026-06-14T00:00:00.000Z"
    });

    const updatedScene = updateObject(scene, "tile-1", {
      x: 96,
      y: 64,
      label: "移动后"
    });
    const deletedScene = deleteObject(updatedScene, "tile-1");

    expect(updatedScene).not.toBe(scene);
    expect(updatedScene.objects[0]).toMatchObject({
      id: "tile-1",
      x: 96,
      y: 64,
      label: "移动后"
    });
    expect(scene.objects[0]).toMatchObject({ x: 0, y: 0, label: "" });
    expect(deletedScene.objects).toEqual([]);
  });
});

describe("geometry helpers", () => {
  it("snaps points to the nearest grid coordinate", () => {
    expect(snapToGrid({ x: 15, y: 49 }, 16)).toEqual({ x: 16, y: 48 });
  });

  it("gets a simple object bounding box", () => {
    const object = createObject({
      id: "shape-1",
      type: "shape",
      x: 10,
      y: 20,
      scaleX: 2,
      scaleY: 3,
      data: {
        width: 40,
        height: 30
      }
    });

    expect(getBoundingBox(object)).toEqual({
      x: 10,
      y: 20,
      width: 80,
      height: 90
    });
  });
});
