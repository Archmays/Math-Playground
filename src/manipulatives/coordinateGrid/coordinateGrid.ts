import { createObject, type JsonObject, type SceneObject } from "../../core/scene";

export const COORDINATE_GRID_TYPE = "coordinate-grid";

export type CoordinateGridData = JsonObject & {
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
  step: number;
  showAxes: boolean;
  showLabels: boolean;
  width: number;
  height: number;
};

export interface CoordinateGridTick {
  value: number;
  offset: number;
  label: string;
}

export interface CreateCoordinateGridOptions {
  id?: string;
  xMin?: number;
  xMax?: number;
  yMin?: number;
  yMax?: number;
  step?: number;
  showAxes?: boolean;
  showLabels?: boolean;
  width?: number;
  height?: number;
  x?: number;
  y?: number;
  label?: string;
}

const DEFAULT_MIN = -5;
const DEFAULT_MAX = 5;
const DEFAULT_STEP = 1;
const DEFAULT_SIZE = 320;
const MIN_SIZE = 160;
const MAX_TICKS = 101;

export function createCoordinateGrid(
  options: CreateCoordinateGridOptions = {}
): SceneObject<CoordinateGridData> {
  const xMin = normalizeNumber(options.xMin, DEFAULT_MIN);
  const xMax = normalizeMax(options.xMax, xMin);
  const yMin = normalizeNumber(options.yMin, DEFAULT_MIN);
  const yMax = normalizeMax(options.yMax, yMin);

  return createObject<CoordinateGridData>({
    id: options.id,
    type: COORDINATE_GRID_TYPE,
    x: options.x,
    y: options.y,
    label: options.label ?? "坐标网格",
    data: {
      xMin,
      xMax,
      yMin,
      yMax,
      step: normalizeStep(options.step),
      showAxes: options.showAxes ?? true,
      showLabels: options.showLabels ?? true,
      width: normalizeSize(options.width),
      height: normalizeSize(options.height)
    }
  });
}

export function getCoordinateGridXTicks(
  data: CoordinateGridData
): CoordinateGridTick[] {
  const range = normalizeGridRange(data.xMin, data.xMax, data.step);

  return range.values.map((value) => ({
    value,
    offset: ((value - range.min) / (range.max - range.min)) * data.width,
    label: formatCoordinateValue(value)
  }));
}

export function getCoordinateGridYTicks(
  data: CoordinateGridData
): CoordinateGridTick[] {
  const range = normalizeGridRange(data.yMin, data.yMax, data.step);

  return range.values.map((value) => ({
    value,
    offset: ((range.max - value) / (range.max - range.min)) * data.height,
    label: formatCoordinateValue(value)
  }));
}

export function getCoordinateGridAxisOffsets(data: CoordinateGridData): {
  xAxisOffset: number | null;
  yAxisOffset: number | null;
} {
  return {
    xAxisOffset:
      data.yMin <= 0 && data.yMax >= 0
        ? ((data.yMax - 0) / (data.yMax - data.yMin)) * data.height
        : null,
    yAxisOffset:
      data.xMin <= 0 && data.xMax >= 0
        ? ((0 - data.xMin) / (data.xMax - data.xMin)) * data.width
        : null
  };
}

export function isCoordinateGridObject(
  object: SceneObject
): object is SceneObject<CoordinateGridData> {
  return (
    object.type === COORDINATE_GRID_TYPE &&
    typeof object.data.xMin === "number" &&
    typeof object.data.xMax === "number" &&
    typeof object.data.yMin === "number" &&
    typeof object.data.yMax === "number" &&
    typeof object.data.step === "number" &&
    typeof object.data.showAxes === "boolean" &&
    typeof object.data.showLabels === "boolean" &&
    typeof object.data.width === "number" &&
    typeof object.data.height === "number"
  );
}

function normalizeGridRange(min: number, max: number, step: number) {
  const safeMin = normalizeNumber(min, DEFAULT_MIN);
  const safeMax = normalizeMax(max, safeMin);
  const safeStep = normalizeStep(step);
  const values: number[] = [];

  for (
    let value = safeMin, index = 0;
    value <= safeMax + safeStep / 1000 && index < MAX_TICKS;
    value += safeStep, index += 1
  ) {
    values.push(roundCoordinateValue(value));
  }

  return { min: safeMin, max: safeMax, values };
}

function normalizeNumber(value: number | undefined, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function normalizeMax(value: number | undefined, min: number): number {
  const max = normalizeNumber(value, DEFAULT_MAX);

  return max > min ? max : min + DEFAULT_MAX - DEFAULT_MIN;
}

function normalizeStep(value: number | undefined): number {
  return typeof value === "number" && Number.isFinite(value) && value > 0
    ? value
    : DEFAULT_STEP;
}

function normalizeSize(value: number | undefined): number {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.max(MIN_SIZE, Math.trunc(value))
    : DEFAULT_SIZE;
}

function roundCoordinateValue(value: number): number {
  return Number(value.toFixed(6));
}

function formatCoordinateValue(value: number): string {
  return Number.isInteger(value) ? String(value) : String(Number(value.toFixed(3)));
}
