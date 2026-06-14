import { createObject, type JsonObject, type SceneObject } from "../../core/scene";
import { isNumberTileObject } from "../numberTiles/numberTiles";

export const TEN_FRAME_TYPE = "ten-frame";
export const TEN_FRAME_ROWS = 2;
export const TEN_FRAME_COLUMNS = 5;
export const TEN_FRAME_CELL_COUNT = TEN_FRAME_ROWS * TEN_FRAME_COLUMNS;

export type TenFrameTokenShape = "circle" | "square";
export type TenFrameFillMode = "left-to-right" | "manual";

export type TenFrameData = JsonObject & {
  filledCount: number;
  rows: 2;
  columns: 5;
  tokenShape: TenFrameTokenShape;
  fillMode: TenFrameFillMode;
  tokenPositions?: number[];
  width: number;
  height: number;
};

export interface CreateTenFrameOptions {
  id?: string;
  filledCount?: number;
  x?: number;
  y?: number;
  label?: string;
  tokenShape?: TenFrameTokenShape;
  fillMode?: TenFrameFillMode;
  tokenPositions?: number[];
}

const TEN_FRAME_WIDTH = 220;
const TEN_FRAME_HEIGHT = 96;

export function createTenFrame(
  options: CreateTenFrameOptions = {}
): SceneObject<TenFrameData> {
  const fillMode = options.fillMode ?? "left-to-right";
  const tokenPositions =
    fillMode === "manual"
      ? normalizeTokenPositions(options.tokenPositions ?? [])
      : undefined;
  const filledCount =
    fillMode === "manual"
      ? tokenPositions?.length ?? 0
      : normalizeFilledCount(options.filledCount ?? 0);
  const data: TenFrameData = {
    filledCount,
    rows: TEN_FRAME_ROWS,
    columns: TEN_FRAME_COLUMNS,
    tokenShape: options.tokenShape ?? "circle",
    fillMode,
    width: TEN_FRAME_WIDTH,
    height: TEN_FRAME_HEIGHT
  };

  if (tokenPositions) {
    data.tokenPositions = tokenPositions;
  }

  return createObject<TenFrameData>({
    id: options.id,
    type: TEN_FRAME_TYPE,
    x: options.x,
    y: options.y,
    label: options.label ?? "十格阵",
    data
  });
}

export function toggleCell(
  object: SceneObject<TenFrameData>,
  cellIndex: number
): SceneObject<TenFrameData> {
  if (!isValidCellIndex(cellIndex)) {
    return object;
  }

  const positions = new Set(getFilledCellPositions(object.data));

  if (positions.has(cellIndex)) {
    positions.delete(cellIndex);
  } else {
    positions.add(cellIndex);
  }

  const tokenPositions = normalizeTokenPositions([...positions]);

  return {
    ...object,
    data: {
      ...object.data,
      fillMode: "manual",
      filledCount: tokenPositions.length,
      tokenPositions
    }
  };
}

export function setFilledCount(
  object: SceneObject<TenFrameData>,
  filledCount: number
): SceneObject<TenFrameData> {
  const nextCount = normalizeFilledCount(filledCount);

  if (object.data.fillMode === "manual") {
    return {
      ...object,
      data: {
        ...object.data,
        filledCount: nextCount,
        tokenPositions: normalizeTokenPositionsForCount(
          object.data.tokenPositions ?? [],
          nextCount
        )
      }
    };
  }

  const { tokenPositions: _tokenPositions, ...data } = object.data;

  return {
    ...object,
    data: {
      ...data,
      filledCount: nextCount
    }
  };
}

export function getFilledCellPositions(data: TenFrameData): number[] {
  if (data.fillMode === "manual") {
    return normalizeTokenPositions(data.tokenPositions ?? []);
  }

  return Array.from({ length: data.filledCount }, (_value, index) => index);
}

export function countSelectedMathValue(
  objects: SceneObject[],
  selectedObjectIds: string[]
): number {
  const selectedIds = new Set(selectedObjectIds);

  return objects.reduce((total, object) => {
    if (!selectedIds.has(object.id) || !object.visible) {
      return total;
    }

    if (isNumberTileObject(object)) {
      return total + object.data.value;
    }

    if (isTenFrameObject(object)) {
      return total + object.data.filledCount;
    }

    return total;
  }, 0);
}

export function isTenFrameObject(
  object: SceneObject
): object is SceneObject<TenFrameData> {
  return (
    object.type === TEN_FRAME_TYPE &&
    typeof object.data.filledCount === "number" &&
    object.data.rows === TEN_FRAME_ROWS &&
    object.data.columns === TEN_FRAME_COLUMNS &&
    isTenFrameTokenShape(object.data.tokenShape) &&
    isTenFrameFillMode(object.data.fillMode)
  );
}

export function isTenFrameTokenShape(
  value: unknown
): value is TenFrameTokenShape {
  return value === "circle" || value === "square";
}

export function isTenFrameFillMode(value: unknown): value is TenFrameFillMode {
  return value === "left-to-right" || value === "manual";
}

function normalizeFilledCount(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.min(TEN_FRAME_CELL_COUNT, Math.max(0, Math.trunc(value)));
}

function normalizeTokenPositions(positions: number[]): number[] {
  return [...new Set(positions.filter(isValidCellIndex))].sort((a, b) => a - b);
}

function normalizeTokenPositionsForCount(
  currentPositions: number[],
  count: number
): number[] {
  const positions = normalizeTokenPositions(currentPositions).slice(0, count);

  for (
    let index = 0;
    positions.length < count && index < TEN_FRAME_CELL_COUNT;
    index += 1
  ) {
    if (!positions.includes(index)) {
      positions.push(index);
    }
  }

  return normalizeTokenPositions(positions);
}

function isValidCellIndex(value: number): boolean {
  return (
    Number.isInteger(value) && value >= 0 && value < TEN_FRAME_CELL_COUNT
  );
}
