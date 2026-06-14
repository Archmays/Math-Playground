import { createObject, type JsonObject, type SceneObject } from "../../core/scene";
import { sumSelectedNumberTiles } from "../numberTiles/numberTiles";

export const BALANCE_SCALE_TYPE = "balance-scale";

export type BalanceScaleMode = "manual" | "calculated";
export type BalanceScaleRelation = "equal" | "left-greater" | "right-greater";

export type BalanceScaleData = JsonObject & {
  leftValue: number;
  rightValue: number;
  showValues: boolean;
  mode: BalanceScaleMode;
  tilt: number;
  width: number;
  height: number;
};

export interface CreateBalanceScaleOptions {
  id?: string;
  leftValue?: number;
  rightValue?: number;
  showValues?: boolean;
  mode?: BalanceScaleMode;
  tilt?: number;
  width?: number;
  height?: number;
  x?: number;
  y?: number;
  label?: string;
}

const DEFAULT_WIDTH = 220;
const DEFAULT_HEIGHT = 150;
const MAX_TILT = 14;
const TILT_PER_UNIT = 2;

export function createBalanceScale(
  options: CreateBalanceScaleOptions = {}
): SceneObject<BalanceScaleData> {
  const leftValue = normalizeValue(options.leftValue ?? 0);
  const rightValue = normalizeValue(options.rightValue ?? 0);
  const tilt = normalizeTilt(options.tilt ?? calculateTilt(leftValue, rightValue));

  return createObject<BalanceScaleData>({
    id: options.id,
    type: BALANCE_SCALE_TYPE,
    x: options.x,
    y: options.y,
    label: options.label ?? "天平",
    data: {
      leftValue,
      rightValue,
      showValues: options.showValues ?? true,
      mode: options.mode ?? "manual",
      tilt,
      width: normalizeDimension(options.width ?? DEFAULT_WIDTH, DEFAULT_WIDTH),
      height: normalizeDimension(options.height ?? DEFAULT_HEIGHT, DEFAULT_HEIGHT)
    }
  });
}

export function updateBalanceScaleData(
  object: SceneObject<BalanceScaleData>,
  data: Partial<BalanceScaleData>
): SceneObject<BalanceScaleData> {
  const leftValue = normalizeValue(data.leftValue ?? object.data.leftValue);
  const rightValue = normalizeValue(data.rightValue ?? object.data.rightValue);
  const nextData: BalanceScaleData = {
    ...object.data,
    ...data,
    leftValue,
    rightValue,
    mode: data.mode ?? object.data.mode,
    showValues: data.showValues ?? object.data.showValues,
    tilt: normalizeTilt(data.tilt ?? calculateTilt(leftValue, rightValue)),
    width: normalizeDimension(data.width ?? object.data.width, DEFAULT_WIDTH),
    height: normalizeDimension(data.height ?? object.data.height, DEFAULT_HEIGHT)
  };

  return {
    ...object,
    data: nextData
  };
}

export function compareValues(
  leftValue: number,
  rightValue: number
): BalanceScaleRelation {
  if (leftValue === rightValue) {
    return "equal";
  }

  return leftValue > rightValue ? "left-greater" : "right-greater";
}

export function calculateTilt(leftValue: number, rightValue: number): number {
  const diff = normalizeValue(rightValue) - normalizeValue(leftValue);

  return normalizeTilt(diff * TILT_PER_UNIT);
}

export function formatBalanceRelation(
  leftValue: number,
  rightValue: number
): string {
  const relation = compareValues(leftValue, rightValue);
  const symbol = relation === "equal" ? "=" : relation === "left-greater" ? ">" : "<";

  return `${leftValue} ${symbol} ${rightValue}`;
}

export function setLeftFromSelectedNumberTiles(
  object: SceneObject<BalanceScaleData>,
  objects: SceneObject[],
  selectedObjectIds: string[]
): SceneObject<BalanceScaleData> {
  return updateBalanceScaleData(object, {
    leftValue: sumSelectedNumberTiles(objects, selectedObjectIds)
  });
}

export function setRightFromSelectedNumberTiles(
  object: SceneObject<BalanceScaleData>,
  objects: SceneObject[],
  selectedObjectIds: string[]
): SceneObject<BalanceScaleData> {
  return updateBalanceScaleData(object, {
    rightValue: sumSelectedNumberTiles(objects, selectedObjectIds)
  });
}

export function isBalanceScaleObject(
  object: SceneObject
): object is SceneObject<BalanceScaleData> {
  return (
    object.type === BALANCE_SCALE_TYPE &&
    typeof object.data.leftValue === "number" &&
    typeof object.data.rightValue === "number" &&
    typeof object.data.showValues === "boolean" &&
    isBalanceScaleMode(object.data.mode) &&
    typeof object.data.tilt === "number" &&
    typeof object.data.width === "number" &&
    typeof object.data.height === "number"
  );
}

export function isBalanceScaleMode(value: unknown): value is BalanceScaleMode {
  return value === "manual" || value === "calculated";
}

function normalizeValue(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.trunc(value);
}

function normalizeDimension(value: number, fallback: number): number {
  if (!Number.isFinite(value)) {
    return fallback;
  }

  return Math.max(48, Math.trunc(value));
}

function normalizeTilt(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(-MAX_TILT, Math.min(MAX_TILT, Math.round(value)));
}
