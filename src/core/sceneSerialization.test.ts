import { describe, expect, it } from "vitest";
import { createObject, createScene } from "./scene";
import {
  SCENE_SCHEMA_VERSION,
  deserializeScene,
  serializeScene
} from "./sceneSerialization";

describe("scene serialization", () => {
  it("serializes a scene with the current schema version", () => {
    const scene = createScene({
      id: "scene-save",
      title: "Fraction task",
      now: "2026-06-14T00:00:00.000Z",
      objects: [
        createObject({
          id: "rect-1",
          type: "demo-rectangle",
          x: 24,
          y: 48,
          label: "rectangle",
          data: { width: 80, height: 40 }
        })
      ]
    });

    const serialized = serializeScene(scene);
    const parsed = JSON.parse(serialized);

    expect(parsed.schemaVersion).toBe(SCENE_SCHEMA_VERSION);
    expect(parsed.objects).toHaveLength(1);
    expect(parsed.objects[0]).toMatchObject({
      id: "rect-1",
      type: "demo-rectangle",
      label: "rectangle"
    });
  });

  it("deserializes a valid scene without mutating the original payload", () => {
    const scene = createScene({
      id: "scene-load",
      title: "Load me",
      now: "2026-06-14T00:00:00.000Z",
      objects: [
        createObject({
          id: "circle-1",
          type: "demo-circle",
          data: { width: 64, height: 64 }
        })
      ]
    });
    const serialized = serializeScene(scene);

    const result = deserializeScene(serialized);

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.scene).toEqual(scene);
    expect(result.scene).not.toBe(scene);
    expect(result.scene.objects[0]).not.toBe(scene.objects[0]);
    expect(result.scene.objects[0].data).not.toBe(scene.objects[0].data);
  });

  it("returns an error for invalid JSON", () => {
    const result = deserializeScene("{not-json");

    expect(result).toEqual({
      ok: false,
      error: "JSON 文件格式无效。"
    });
  });

  it("rejects scenes with a mismatched schema version", () => {
    const scene = createScene({ id: "scene-old" });
    const payload = {
      ...scene,
      schemaVersion: "9.9.9"
    };

    const result = deserializeScene(JSON.stringify(payload));

    expect(result).toEqual({
      ok: false,
      error: "此文件版本为 9.9.9，当前支持版本为 0.1.0。"
    });
  });
});
