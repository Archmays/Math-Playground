export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

export type JsonObject = Record<string, JsonValue>;

export interface Point {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface Transform {
  x: number;
  y: number;
  rotation: number;
  scaleX: number;
  scaleY: number;
}

export interface BoundingBox extends Point, Size {}

export type ToolType =
  | "select"
  | "pan"
  | "move"
  | "create"
  | (string & {});

export const BUILT_IN_OBJECT_TYPES = [
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
  "demo-text",
  "fraction-strip",
  "shape",
  "counter",
  "number-line",
  "coordinate-grid"
] as const;

export type ObjectType = (typeof BUILT_IN_OBJECT_TYPES)[number] | (string & {});

export interface SceneObject<TData extends JsonObject = JsonObject>
  extends Transform {
  id: string;
  type: ObjectType;
  locked: boolean;
  visible: boolean;
  label: string;
  data: TData;
}

export interface Viewport extends Point {
  zoom: number;
}

export interface GridSettings {
  enabled: boolean;
  visible: boolean;
  snap: boolean;
  size: number;
}

export interface Scene {
  schemaVersion: string;
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  objects: SceneObject[];
  viewport: Viewport;
  grid: GridSettings;
}

export interface CreateSceneOptions {
  id?: string;
  title?: string;
  createdAt?: string;
  updatedAt?: string;
  now?: string;
  objects?: SceneObject[];
  viewport?: Partial<Viewport>;
  grid?: Partial<GridSettings>;
}

export interface CreateObjectOptions<TData extends JsonObject = JsonObject>
  extends Partial<Transform> {
  id?: string;
  type: ObjectType;
  locked?: boolean;
  visible?: boolean;
  label?: string;
  data?: TData;
}

export interface CloneObjectOptions {
  id?: string;
  offset?: Point;
}

export type SceneObjectPatch = Partial<
  Omit<SceneObject, "id" | "type" | "data">
> & {
  type?: ObjectType;
  data?: JsonObject;
};

export function createScene(options: CreateSceneOptions = {}): Scene {
  const now = options.now ?? new Date().toISOString();
  const createdAt = options.createdAt ?? now;

  return {
    schemaVersion: "0.1.0",
    id: options.id ?? generateId("scene"),
    title: options.title ?? "未命名场景",
    createdAt,
    updatedAt: options.updatedAt ?? now,
    viewport: {
      x: options.viewport?.x ?? 0,
      y: options.viewport?.y ?? 0,
      zoom: options.viewport?.zoom ?? 1
    },
    grid: {
      enabled: options.grid?.enabled ?? true,
      visible: options.grid?.visible ?? true,
      snap: options.grid?.snap ?? true,
      size: options.grid?.size ?? 32
    },
    objects: options.objects ? options.objects.map(cloneSceneObjectData) : []
  };
}

export function createObject<TData extends JsonObject = JsonObject>(
  options: CreateObjectOptions<TData>
): SceneObject<TData> {
  return {
    id: options.id ?? generateId("object"),
    type: options.type,
    x: options.x ?? 0,
    y: options.y ?? 0,
    rotation: options.rotation ?? 0,
    scaleX: options.scaleX ?? 1,
    scaleY: options.scaleY ?? 1,
    locked: options.locked ?? false,
    visible: options.visible ?? true,
    label: options.label ?? "",
    data: cloneJsonObject(options.data ?? ({} as TData))
  };
}

export function cloneObject<TData extends JsonObject>(
  object: SceneObject<TData>,
  options: CloneObjectOptions = {}
): SceneObject<TData> {
  const offset = options.offset ?? { x: 24, y: 24 };

  return {
    ...object,
    id: options.id ?? generateId(object.type),
    x: object.x + offset.x,
    y: object.y + offset.y,
    data: cloneJsonObject(object.data)
  };
}

export function updateObject(
  scene: Scene,
  objectId: string,
  patch: SceneObjectPatch
): Scene {
  return {
    ...scene,
    updatedAt: new Date().toISOString(),
    objects: scene.objects.map((object) =>
      object.id === objectId
        ? {
            ...object,
            ...patch,
            data: patch.data ? cloneJsonObject(patch.data) : object.data
          }
        : object
    )
  };
}

export function deleteObject(scene: Scene, objectId: string): Scene {
  return {
    ...scene,
    updatedAt: new Date().toISOString(),
    objects: scene.objects.filter((object) => object.id !== objectId)
  };
}

export function generateId(prefix = "id"): string {
  const randomPart =
    globalThis.crypto?.randomUUID?.() ??
    `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;

  return `${prefix}-${randomPart}`;
}

function cloneSceneObjectData<TData extends JsonObject>(
  object: SceneObject<TData>
): SceneObject<TData> {
  return {
    ...object,
    data: cloneJsonObject(object.data)
  };
}

function cloneJsonObject<TData extends JsonObject>(data: TData): TData {
  return JSON.parse(JSON.stringify(data)) as TData;
}
