import { createObject, type JsonObject, type SceneObject } from "../../core/scene";

export const ALGEBRA_TILE_TYPE = "algebra-tile";

export type AlgebraTileKind = "unit" | "x" | "x2";
export type AlgebraTileSign = "positive" | "negative";

export type AlgebraTileData = JsonObject & {
  tileKind: AlgebraTileKind;
  sign: AlgebraTileSign;
  showLabel: boolean;
  xLength: number;
  width: number;
  height: number;
};

export interface AlgebraCoefficients {
  x2: number;
  x: number;
  unit: number;
}

export interface AlgebraTileSummary extends AlgebraCoefficients {
  expression: string;
}

export interface CreateAlgebraTileOptions {
  id?: string;
  tileKind?: AlgebraTileKind;
  sign?: AlgebraTileSign;
  showLabel?: boolean;
  xLength?: number;
  x?: number;
  y?: number;
  label?: string;
}

const UNIT_SIZE = 32;
const DEFAULT_X_LENGTH = 72;
const MIN_X_LENGTH = 40;

export function createAlgebraTile(
  options: CreateAlgebraTileOptions = {}
): SceneObject<AlgebraTileData> {
  const tileKind = options.tileKind ?? "unit";
  const sign = options.sign ?? "positive";
  const xLength = normalizeXLength(options.xLength ?? DEFAULT_X_LENGTH);
  const size = getAlgebraTileSize(tileKind, xLength);

  return createObject<AlgebraTileData>({
    id: options.id,
    type: ALGEBRA_TILE_TYPE,
    x: options.x,
    y: options.y,
    label: options.label ?? getAlgebraTileLabel(tileKind, sign),
    data: {
      tileKind,
      sign,
      showLabel: options.showLabel ?? true,
      xLength,
      width: size.width,
      height: size.height
    }
  });
}

export function updateAlgebraTileData(
  object: SceneObject<AlgebraTileData>,
  data: Partial<AlgebraTileData>
): SceneObject<AlgebraTileData> {
  const tileKind = data.tileKind ?? object.data.tileKind;
  const sign = data.sign ?? object.data.sign;
  const xLength = normalizeXLength(data.xLength ?? object.data.xLength);
  const size = getAlgebraTileSize(tileKind, xLength);
  const previousLabel = getAlgebraTileLabel(
    object.data.tileKind,
    object.data.sign
  );

  return {
    ...object,
    label:
      object.label === previousLabel
        ? getAlgebraTileLabel(tileKind, sign)
        : object.label,
    data: {
      ...object.data,
      ...data,
      tileKind,
      sign,
      showLabel: data.showLabel ?? object.data.showLabel,
      xLength,
      width: size.width,
      height: size.height
    }
  };
}

export function simplifyAlgebraTiles(
  objects: SceneObject[],
  selectedObjectIds?: string[]
): AlgebraTileSummary {
  const selectedIds = selectedObjectIds ? new Set(selectedObjectIds) : null;
  const coefficients: AlgebraCoefficients = { x2: 0, x: 0, unit: 0 };

  for (const object of objects) {
    if (selectedIds && !selectedIds.has(object.id)) {
      continue;
    }

    if (!object.visible || !isAlgebraTileObject(object)) {
      continue;
    }

    const value = object.data.sign === "positive" ? 1 : -1;
    coefficients[object.data.tileKind] += value;
  }

  return {
    ...coefficients,
    expression: formatAlgebraExpression(coefficients)
  };
}

export function formatAlgebraExpression(coefficients: AlgebraCoefficients): string {
  const terms = [
    formatTerm(coefficients.x2, "x²"),
    formatTerm(coefficients.x, "x"),
    formatTerm(coefficients.unit, "")
  ].filter((term): term is string => term !== null);

  if (terms.length === 0) {
    return "0";
  }

  return terms.reduce((expression, term, index) => {
    if (index === 0) {
      return term;
    }

    return term.startsWith("-")
      ? `${expression} - ${term.slice(1)}`
      : `${expression} + ${term}`;
  }, "");
}

export function isAlgebraTileObject(
  object: SceneObject
): object is SceneObject<AlgebraTileData> {
  return (
    object.type === ALGEBRA_TILE_TYPE &&
    isAlgebraTileKind(object.data.tileKind) &&
    isAlgebraTileSign(object.data.sign) &&
    typeof object.data.showLabel === "boolean" &&
    typeof object.data.xLength === "number" &&
    typeof object.data.width === "number" &&
    typeof object.data.height === "number"
  );
}

export function isAlgebraTileKind(value: unknown): value is AlgebraTileKind {
  return value === "unit" || value === "x" || value === "x2";
}

export function isAlgebraTileSign(value: unknown): value is AlgebraTileSign {
  return value === "positive" || value === "negative";
}

export function getAlgebraTileLabel(
  tileKind: AlgebraTileKind,
  sign: AlgebraTileSign
): string {
  const base = tileKind === "unit" ? "1" : tileKind === "x" ? "x" : "x²";

  return sign === "positive" ? base : `-${base}`;
}

function getAlgebraTileSize(tileKind: AlgebraTileKind, xLength: number) {
  switch (tileKind) {
    case "unit":
      return { width: UNIT_SIZE, height: UNIT_SIZE };
    case "x":
      return { width: xLength, height: UNIT_SIZE };
    case "x2":
      return { width: xLength, height: xLength };
  }
}

function formatTerm(coefficient: number, variable: string): string | null {
  if (coefficient === 0) {
    return null;
  }

  if (!variable) {
    return String(coefficient);
  }

  if (coefficient === 1) {
    return variable;
  }

  if (coefficient === -1) {
    return `-${variable}`;
  }

  return `${coefficient}${variable}`;
}

function normalizeXLength(value: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_X_LENGTH;
  }

  return Math.max(MIN_X_LENGTH, Math.trunc(value));
}
