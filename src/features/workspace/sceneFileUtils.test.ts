import { describe, expect, it } from "vitest";
import { createScene } from "../../core/scene";
import { serializeScene } from "../../core/sceneSerialization";
import { parseAutoSavedScene } from "./sceneFileUtils";

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
});
