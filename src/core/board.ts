export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

export interface CanvasPoint {
  x: number;
  y: number;
}

export interface CanvasViewport extends CanvasPoint {
  zoom: number;
}

export interface BoardObject {
  id: string;
  kind: string;
  position: CanvasPoint;
  rotation: number;
  scale: number;
  data: Record<string, JsonValue>;
}

export interface BoardDocument {
  schemaVersion: 1;
  title: string;
  locale: "zh-CN";
  viewport: CanvasViewport;
  objects: BoardObject[];
}

export function createEmptyBoard(title = "未命名操作板"): BoardDocument {
  return {
    schemaVersion: 1,
    title,
    locale: "zh-CN",
    viewport: {
      x: 0,
      y: 0,
      zoom: 1
    },
    objects: []
  };
}

export function serializeBoard(board: BoardDocument): string {
  return JSON.stringify(board);
}

export function parseBoard(json: string): BoardDocument {
  const parsed: unknown = JSON.parse(json);

  if (!isBoardDocument(parsed)) {
    throw new Error("Invalid board document");
  }

  return parsed;
}

function isBoardDocument(value: unknown): value is BoardDocument {
  if (!isPlainObject(value)) {
    return false;
  }

  return (
    value.schemaVersion === 1 &&
    typeof value.title === "string" &&
    value.locale === "zh-CN" &&
    isViewport(value.viewport) &&
    Array.isArray(value.objects) &&
    value.objects.every(isBoardObject)
  );
}

function isViewport(value: unknown): value is CanvasViewport {
  return (
    isPlainObject(value) &&
    typeof value.x === "number" &&
    typeof value.y === "number" &&
    typeof value.zoom === "number"
  );
}

function isBoardObject(value: unknown): value is BoardObject {
  return (
    isPlainObject(value) &&
    typeof value.id === "string" &&
    typeof value.kind === "string" &&
    isPoint(value.position) &&
    typeof value.rotation === "number" &&
    typeof value.scale === "number" &&
    isPlainObject(value.data)
  );
}

function isPoint(value: unknown): value is CanvasPoint {
  return (
    isPlainObject(value) &&
    typeof value.x === "number" &&
    typeof value.y === "number"
  );
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
