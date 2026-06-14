import { createObject, type JsonObject, type SceneObject } from "../../core/scene";

export const NUMBER_TILE_TYPE = "number-tile";

export type NumberTileSize = "small" | "medium" | "large";

export type NumberTileData = JsonObject & {
  value: number;
  colorScheme: string;
  showValue: boolean;
  size: NumberTileSize;
  groupId?: string;
  width: number;
  height: number;
};

export interface CreateNumberTileOptions {
  id?: string;
  value?: number;
  x?: number;
  y?: number;
  label?: string;
  colorScheme?: string;
  showValue?: boolean;
  size?: NumberTileSize;
  groupId?: string;
}

const TILE_DIMENSIONS: Record<NumberTileSize, number> = {
  small: 48,
  medium: 64,
  large: 84
};

export function createNumberTile(
  options: CreateNumberTileOptions = {}
): SceneObject<NumberTileData> {
  const value = normalizeNumberTileValue(options.value ?? 1);
  const size = options.size ?? "medium";
  const dimension = getNumberTileDimension(size);
  const data: NumberTileData = {
    value,
    colorScheme: options.colorScheme ?? "auto",
    showValue: options.showValue ?? true,
    size,
    width: dimension,
    height: dimension
  };

  if (options.groupId) {
    data.groupId = options.groupId;
  }

  return createObject<NumberTileData>({
    id: options.id,
    type: NUMBER_TILE_TYPE,
    x: options.x,
    y: options.y,
    label: options.label ?? String(value),
    data
  });
}

export function updateNumberTileValue<TData extends JsonObject>(
  object: SceneObject<TData>,
  value: number
): SceneObject<TData> {
  const nextValue = normalizeNumberTileValue(value);
  const previousValue = typeof object.data.value === "number" ? object.data.value : null;
  const shouldUpdateLabel =
    object.label === "" ||
    (previousValue !== null && object.label === String(previousValue));

  return {
    ...object,
    label: shouldUpdateLabel ? String(nextValue) : object.label,
    data: {
      ...object.data,
      value: nextValue
    }
  };
}

export function getNumberTileDataForSize(
  size: NumberTileSize
): Pick<NumberTileData, "size" | "width" | "height"> {
  const dimension = getNumberTileDimension(size);

  return {
    size,
    width: dimension,
    height: dimension
  };
}

export function sumSelectedNumberTiles(
  objects: SceneObject[],
  selectedObjectIds: string[]
): number {
  const selectedIds = new Set(selectedObjectIds);

  return objects.reduce((sum, object) => {
    if (
      !selectedIds.has(object.id) ||
      !object.visible ||
      !isNumberTileObject(object)
    ) {
      return sum;
    }

    return sum + object.data.value;
  }, 0);
}

export function isNumberTileObject(
  object: SceneObject
): object is SceneObject<NumberTileData> {
  return (
    object.type === NUMBER_TILE_TYPE &&
    typeof object.data.value === "number" &&
    typeof object.data.colorScheme === "string" &&
    typeof object.data.showValue === "boolean" &&
    isNumberTileSize(object.data.size)
  );
}

export function isNumberTileSize(value: unknown): value is NumberTileSize {
  return value === "small" || value === "medium" || value === "large";
}

function getNumberTileDimension(size: NumberTileSize): number {
  return TILE_DIMENSIONS[size];
}

function normalizeNumberTileValue(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.trunc(value);
}
