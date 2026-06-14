import { createObject, type JsonObject, type SceneObject } from "../../core/scene";

export const FRACTION_BAR_TYPE = "fraction-bar";
export const MIN_DENOMINATOR = 1;
export const MAX_DENOMINATOR = 24;

export type FractionBarData = JsonObject & {
  numerator: number;
  denominator: number;
  totalWidth: number;
  showLabels: boolean;
  showTicks: boolean;
  colorScheme: string;
  width: number;
  height: number;
};

export interface CreateFractionBarOptions {
  id?: string;
  numerator?: number;
  denominator?: number;
  totalWidth?: number;
  showLabels?: boolean;
  showTicks?: boolean;
  colorScheme?: string;
  x?: number;
  y?: number;
  label?: string;
}

export interface FractionSummaryItem {
  id: string;
  label: string;
  decimalValue: number;
}

export interface FractionSelectionSummary {
  fractions: FractionSummaryItem[];
  canAdd: boolean;
  sumLabel: string;
  message: string;
}

const DEFAULT_TOTAL_WIDTH = 240;
const FRACTION_BAR_HEIGHT = 48;

export function createFractionBar(
  options: CreateFractionBarOptions = {}
): SceneObject<FractionBarData> {
  const denominator = normalizeDenominator(options.denominator ?? 2);
  const numerator = normalizeNumerator(options.numerator ?? 1, denominator);
  const totalWidth = normalizeTotalWidth(options.totalWidth ?? DEFAULT_TOTAL_WIDTH);

  return createObject<FractionBarData>({
    id: options.id,
    type: FRACTION_BAR_TYPE,
    x: options.x,
    y: options.y,
    label: options.label ?? formatFraction(numerator, denominator),
    data: {
      numerator,
      denominator,
      totalWidth,
      showLabels: options.showLabels ?? true,
      showTicks: options.showTicks ?? true,
      colorScheme: options.colorScheme ?? "auto",
      width: totalWidth,
      height: FRACTION_BAR_HEIGHT
    }
  });
}

export function updateFractionBarNumerator(
  object: SceneObject<FractionBarData>,
  numerator: number
): SceneObject<FractionBarData> {
  const nextNumerator = normalizeNumerator(numerator, object.data.denominator);

  return updateFractionBarData(object, {
    numerator: nextNumerator
  });
}

export function updateFractionBarDenominator(
  object: SceneObject<FractionBarData>,
  denominator: number
): SceneObject<FractionBarData> {
  const nextDenominator = normalizeDenominator(denominator);
  const nextNumerator = normalizeNumerator(object.data.numerator, nextDenominator);

  return updateFractionBarData(object, {
    numerator: nextNumerator,
    denominator: nextDenominator
  });
}

export function updateFractionBarData(
  object: SceneObject<FractionBarData>,
  data: Partial<FractionBarData>
): SceneObject<FractionBarData> {
  const denominator = normalizeDenominator(
    data.denominator ?? object.data.denominator
  );
  const numerator = normalizeNumerator(
    data.numerator ?? object.data.numerator,
    denominator
  );
  const totalWidth = normalizeTotalWidth(data.totalWidth ?? object.data.totalWidth);
  const nextData: FractionBarData = {
    ...object.data,
    ...data,
    numerator,
    denominator,
    totalWidth,
    width: totalWidth,
    height: FRACTION_BAR_HEIGHT
  };

  return {
    ...object,
    label: formatFraction(numerator, denominator),
    data: nextData
  };
}

export function getSelectedFractionSummary(
  objects: SceneObject[],
  selectedObjectIds: string[]
): FractionSelectionSummary {
  const selectedIds = new Set(selectedObjectIds);
  const fractions = objects
    .filter((object) => selectedIds.has(object.id) && object.visible)
    .filter(isFractionBarObject)
    .map((object) => ({
      id: object.id,
      label: formatFraction(object.data.numerator, object.data.denominator),
      decimalValue: object.data.numerator / object.data.denominator
    }));

  if (fractions.length < 2) {
    return {
      fractions,
      canAdd: false,
      sumLabel: "",
      message: ""
    };
  }

  const selectedFractions = objects
    .filter((object) => selectedIds.has(object.id) && object.visible)
    .filter(isFractionBarObject);
  const denominator = selectedFractions[0]?.data.denominator ?? 1;
  const canAdd = selectedFractions.every(
    (object) => object.data.denominator === denominator
  );

  if (!canAdd) {
    return {
      fractions,
      canAdd: false,
      sumLabel: "",
      message: "分母不同，暂不自动相加"
    };
  }

  const numeratorSum = selectedFractions.reduce(
    (sum, object) => sum + object.data.numerator,
    0
  );

  return {
    fractions,
    canAdd: true,
    sumLabel: formatFraction(numeratorSum, denominator),
    message: ""
  };
}

export function isFractionBarObject(
  object: SceneObject
): object is SceneObject<FractionBarData> {
  return (
    object.type === FRACTION_BAR_TYPE &&
    typeof object.data.numerator === "number" &&
    typeof object.data.denominator === "number" &&
    typeof object.data.totalWidth === "number" &&
    typeof object.data.showLabels === "boolean" &&
    typeof object.data.showTicks === "boolean" &&
    typeof object.data.colorScheme === "string"
  );
}

export function formatFraction(numerator: number, denominator: number): string {
  return `${numerator}/${denominator}`;
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

function normalizeTotalWidth(totalWidth: number): number {
  if (!Number.isFinite(totalWidth)) {
    return DEFAULT_TOTAL_WIDTH;
  }

  return Math.max(80, Math.trunc(totalWidth));
}
