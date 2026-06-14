import { createObject, type JsonObject, type SceneObject } from "../../core/scene";
import {
  formatFraction,
  isFractionBarObject,
  MAX_DENOMINATOR,
  MIN_DENOMINATOR
} from "../fractionBars/fractionBars";

export const FRACTION_CIRCLE_TYPE = "fraction-circle";

export type FractionCircleData = JsonObject & {
  numerator: number;
  denominator: number;
  radius: number;
  showLabels: boolean;
  showSectorLines: boolean;
  startAngle: number;
  colorScheme: string;
  width: number;
  height: number;
};

export interface CreateFractionCircleOptions {
  id?: string;
  numerator?: number;
  denominator?: number;
  radius?: number;
  showLabels?: boolean;
  showSectorLines?: boolean;
  startAngle?: number;
  colorScheme?: string;
  x?: number;
  y?: number;
  label?: string;
}

export interface SectorPathOptions {
  centerX: number;
  centerY: number;
  radius: number;
  startAngle: number;
  endAngle: number;
}

export interface FractionValueSummaryItem {
  id: string;
  label: string;
  decimalValue: number;
}

export interface FractionValueSummary {
  fractions: FractionValueSummaryItem[];
  equivalent: boolean;
  message: string;
}

const DEFAULT_RADIUS = 48;

export function createFractionCircle(
  options: CreateFractionCircleOptions = {}
): SceneObject<FractionCircleData> {
  const denominator = normalizeDenominator(options.denominator ?? 2);
  const numerator = normalizeNumerator(options.numerator ?? 1, denominator);
  const radius = normalizeRadius(options.radius ?? DEFAULT_RADIUS);

  return createObject<FractionCircleData>({
    id: options.id,
    type: FRACTION_CIRCLE_TYPE,
    x: options.x,
    y: options.y,
    label: options.label ?? formatFraction(numerator, denominator),
    data: {
      numerator,
      denominator,
      radius,
      showLabels: options.showLabels ?? true,
      showSectorLines: options.showSectorLines ?? true,
      startAngle: options.startAngle ?? -90,
      colorScheme: options.colorScheme ?? "auto",
      width: radius * 2,
      height: radius * 2
    }
  });
}

export function updateFractionCircleNumerator(
  object: SceneObject<FractionCircleData>,
  numerator: number
): SceneObject<FractionCircleData> {
  return updateFractionCircleData(object, {
    numerator: normalizeNumerator(numerator, object.data.denominator)
  });
}

export function updateFractionCircleDenominator(
  object: SceneObject<FractionCircleData>,
  denominator: number
): SceneObject<FractionCircleData> {
  const nextDenominator = normalizeDenominator(denominator);

  return updateFractionCircleData(object, {
    denominator: nextDenominator,
    numerator: normalizeNumerator(object.data.numerator, nextDenominator)
  });
}

export function updateFractionCircleData(
  object: SceneObject<FractionCircleData>,
  data: Partial<FractionCircleData>
): SceneObject<FractionCircleData> {
  const denominator = normalizeDenominator(
    data.denominator ?? object.data.denominator
  );
  const numerator = normalizeNumerator(
    data.numerator ?? object.data.numerator,
    denominator
  );
  const radius = normalizeRadius(data.radius ?? object.data.radius);
  const nextData: FractionCircleData = {
    ...object.data,
    ...data,
    numerator,
    denominator,
    radius,
    width: radius * 2,
    height: radius * 2
  };

  return {
    ...object,
    label: formatFraction(numerator, denominator),
    data: nextData
  };
}

export function getFractionCircleSectorPath({
  centerX,
  centerY,
  radius,
  startAngle,
  endAngle
}: SectorPathOptions): string {
  const start = pointOnCircle(centerX, centerY, radius, startAngle);
  const end = pointOnCircle(centerX, centerY, radius, endAngle);
  const angleDelta = Math.abs(endAngle - startAngle);
  const largeArcFlag = angleDelta % 360 > 180 ? 1 : 0;

  return [
    `M ${formatCoordinate(centerX)} ${formatCoordinate(centerY)}`,
    `L ${formatCoordinate(start.x)} ${formatCoordinate(start.y)}`,
    `A ${formatCoordinate(radius)} ${formatCoordinate(radius)} 0 ${largeArcFlag} 1 ${formatCoordinate(end.x)} ${formatCoordinate(end.y)}`,
    "Z"
  ].join(" ");
}

export function getSelectedFractionValueSummary(
  objects: SceneObject[],
  selectedObjectIds: string[]
): FractionValueSummary {
  const selectedIds = new Set(selectedObjectIds);
  const fractionObjects = objects
    .filter((object) => selectedIds.has(object.id) && object.visible)
    .map(getFractionValue)
    .filter((value): value is FractionValue => value !== null);
  const fractions = fractionObjects.map((value) => ({
    id: value.id,
    label: formatFraction(value.numerator, value.denominator),
    decimalValue: value.numerator / value.denominator
  }));

  if (fractionObjects.length < 2) {
    return {
      fractions,
      equivalent: false,
      message: ""
    };
  }

  const [first, ...rest] = fractionObjects;
  const equivalent = rest.every(
    (value) => first.numerator * value.denominator === value.numerator * first.denominator
  );

  return {
    fractions,
    equivalent,
    message: equivalent ? "等值分数" : ""
  };
}

export function isFractionCircleObject(
  object: SceneObject
): object is SceneObject<FractionCircleData> {
  return (
    object.type === FRACTION_CIRCLE_TYPE &&
    typeof object.data.numerator === "number" &&
    typeof object.data.denominator === "number" &&
    typeof object.data.radius === "number" &&
    typeof object.data.showLabels === "boolean" &&
    typeof object.data.showSectorLines === "boolean" &&
    typeof object.data.startAngle === "number" &&
    typeof object.data.colorScheme === "string"
  );
}

interface FractionValue {
  id: string;
  numerator: number;
  denominator: number;
}

function getFractionValue(object: SceneObject): FractionValue | null {
  if (isFractionCircleObject(object) || isFractionBarObject(object)) {
    return {
      id: object.id,
      numerator: object.data.numerator,
      denominator: object.data.denominator
    };
  }

  return null;
}

function pointOnCircle(
  centerX: number,
  centerY: number,
  radius: number,
  angle: number
) {
  const radians = (angle * Math.PI) / 180;

  return {
    x: centerX + radius * Math.cos(radians),
    y: centerY + radius * Math.sin(radians)
  };
}

function formatCoordinate(value: number): string {
  const rounded = Math.round(value * 1000) / 1000;

  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(3);
}

function normalizeNumerator(numerator: number, denominator: number): number {
  if (!Number.isFinite(numerator)) {
    return 0;
  }

  return Math.min(Math.max(0, Math.trunc(numerator)), denominator);
}

function normalizeDenominator(denominator: number): number {
  if (!Number.isFinite(denominator)) {
    return MIN_DENOMINATOR;
  }

  return Math.min(
    MAX_DENOMINATOR,
    Math.max(MIN_DENOMINATOR, Math.trunc(denominator))
  );
}

function normalizeRadius(radius: number): number {
  if (!Number.isFinite(radius)) {
    return DEFAULT_RADIUS;
  }

  return Math.max(24, Math.trunc(radius));
}
