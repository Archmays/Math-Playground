import { createObject, type JsonObject, type SceneObject } from "../../core/scene";

export const NUMBER_LINE_TYPE = "number-line";

export type NumberLineData = JsonObject & {
  min: number;
  max: number;
  step: number;
  showLabels: boolean;
  width: number;
  height: number;
};

export interface NumberLineTick {
  value: number;
  offset: number;
  label: string;
}

export interface CreateNumberLineOptions {
  id?: string;
  min?: number;
  max?: number;
  step?: number;
  showLabels?: boolean;
  width?: number;
  height?: number;
  x?: number;
  y?: number;
  label?: string;
}

const DEFAULT_MIN = 0;
const DEFAULT_MAX = 10;
const DEFAULT_STEP = 1;
const DEFAULT_WIDTH = 360;
const DEFAULT_HEIGHT = 72;
const MIN_WIDTH = 120;
const MIN_HEIGHT = 48;
const MAX_TICKS = 101;

export function createNumberLine(
  options: CreateNumberLineOptions = {}
): SceneObject<NumberLineData> {
  const min = normalizeNumber(options.min, DEFAULT_MIN);
  const max = normalizeMax(options.max, min);
  const step = normalizeStep(options.step);

  return createObject<NumberLineData>({
    id: options.id,
    type: NUMBER_LINE_TYPE,
    x: options.x,
    y: options.y,
    label: options.label ?? "数轴",
    data: {
      min,
      max,
      step,
      showLabels: options.showLabels ?? true,
      width: normalizeSize(options.width, DEFAULT_WIDTH, MIN_WIDTH),
      height: normalizeSize(options.height, DEFAULT_HEIGHT, MIN_HEIGHT)
    }
  });
}

export function getNumberLineTicks(data: NumberLineData): NumberLineTick[] {
  const min = normalizeNumber(data.min, DEFAULT_MIN);
  const max = normalizeMax(data.max, min);
  const step = normalizeStep(data.step);
  const ticks: NumberLineTick[] = [];

  for (
    let value = min, index = 0;
    value <= max + step / 1000 && index < MAX_TICKS;
    value += step, index += 1
  ) {
    const roundedValue = roundTickValue(value);
    const ratio = (roundedValue - min) / (max - min);

    ticks.push({
      value: roundedValue,
      offset: ratio * data.width,
      label: formatNumberLineValue(roundedValue)
    });
  }

  return ticks;
}

export function isNumberLineObject(
  object: SceneObject
): object is SceneObject<NumberLineData> {
  return (
    object.type === NUMBER_LINE_TYPE &&
    typeof object.data.min === "number" &&
    typeof object.data.max === "number" &&
    typeof object.data.step === "number" &&
    typeof object.data.showLabels === "boolean" &&
    typeof object.data.width === "number" &&
    typeof object.data.height === "number"
  );
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

function normalizeSize(
  value: number | undefined,
  fallback: number,
  minimum: number
): number {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.max(minimum, Math.trunc(value))
    : fallback;
}

function roundTickValue(value: number): number {
  return Number(value.toFixed(6));
}

function formatNumberLineValue(value: number): string {
  return Number.isInteger(value) ? String(value) : String(Number(value.toFixed(3)));
}
