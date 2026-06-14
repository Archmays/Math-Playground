import type {
  GridSettings,
  JsonObject,
  JsonValue,
  Scene,
  SceneObject,
  Viewport
} from "./scene";

export const SCENE_SCHEMA_VERSION = "0.1.0";

export type DeserializeSceneResult =
  | { ok: true; scene: Scene }
  | { ok: false; error: string };

export function serializeScene(scene: Scene): string {
  return JSON.stringify(cloneScene(scene), null, 2);
}

export function deserializeScene(text: string): DeserializeSceneResult {
  let value: unknown;

  try {
    value = JSON.parse(text);
  } catch {
    return {
      ok: false,
      error: "JSON 文件格式无效。"
    };
  }

  return parseScene(value);
}

export function parseScene(value: unknown): DeserializeSceneResult {
  if (!isRecord(value)) {
    return invalidScene();
  }

  if (value.schemaVersion !== SCENE_SCHEMA_VERSION) {
    return {
      ok: false,
      error:
        typeof value.schemaVersion === "string"
          ? `此文件版本为 ${value.schemaVersion}，当前支持版本为 ${SCENE_SCHEMA_VERSION}。`
          : `此文件缺少版本字段，当前支持版本为 ${SCENE_SCHEMA_VERSION}。`
    };
  }

  if (
    typeof value.id !== "string" ||
    typeof value.title !== "string" ||
    typeof value.createdAt !== "string" ||
    typeof value.updatedAt !== "string" ||
    !Array.isArray(value.objects) ||
    !isViewport(value.viewport) ||
    !isGridSettings(value.grid)
  ) {
    return invalidScene();
  }

  const objects: SceneObject[] = [];

  for (const object of value.objects) {
    if (!isSceneObject(object)) {
      return invalidScene();
    }
    objects.push(cloneSceneObject(object));
  }

  return {
    ok: true,
    scene: {
      schemaVersion: value.schemaVersion,
      id: value.id,
      title: value.title,
      createdAt: value.createdAt,
      updatedAt: value.updatedAt,
      objects,
      viewport: { ...value.viewport },
      grid: { ...value.grid }
    }
  };
}

function invalidScene(): DeserializeSceneResult {
  return {
    ok: false,
    error: "此 JSON 不是有效的数学游乐场画布文件。"
  };
}

function isViewport(value: unknown): value is Viewport {
  return (
    isRecord(value) &&
    isFiniteNumber(value.x) &&
    isFiniteNumber(value.y) &&
    isFiniteNumber(value.zoom)
  );
}

function isGridSettings(value: unknown): value is GridSettings {
  return (
    isRecord(value) &&
    typeof value.enabled === "boolean" &&
    typeof value.visible === "boolean" &&
    typeof value.snap === "boolean" &&
    isFiniteNumber(value.size)
  );
}

function isSceneObject(value: unknown): value is SceneObject {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.type === "string" &&
    isFiniteNumber(value.x) &&
    isFiniteNumber(value.y) &&
    isFiniteNumber(value.rotation) &&
    isFiniteNumber(value.scaleX) &&
    isFiniteNumber(value.scaleY) &&
    typeof value.locked === "boolean" &&
    typeof value.visible === "boolean" &&
    typeof value.label === "string" &&
    isJsonObject(value.data)
  );
}

function isJsonObject(value: unknown): value is JsonObject {
  if (!isRecord(value)) {
    return false;
  }

  return Object.values(value).every(isJsonValue);
}

function isJsonValue(value: unknown): value is JsonValue {
  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "boolean" ||
    isFiniteNumber(value)
  ) {
    return true;
  }

  if (Array.isArray(value)) {
    return value.every(isJsonValue);
  }

  return isJsonObject(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function cloneScene(scene: Scene): Scene {
  return {
    ...scene,
    viewport: { ...scene.viewport },
    grid: { ...scene.grid },
    objects: scene.objects.map(cloneSceneObject)
  };
}

function cloneSceneObject(object: SceneObject): SceneObject {
  return {
    ...object,
    data: JSON.parse(JSON.stringify(object.data)) as JsonObject
  };
}
