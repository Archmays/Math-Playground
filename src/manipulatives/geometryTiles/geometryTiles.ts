import { createObject, type JsonObject, type SceneObject } from "../../core/scene";

export const GEOMETRY_TILE_TYPE = "geometry-tile";
export const ROTATION_SNAP_DEGREES = 15;

export type GeometryTileShape =
  | "triangle"
  | "square"
  | "rectangle"
  | "hexagon"
  | "circle"
  | "trapezoid"
  | "parallelogram";

export type GeometryTileData = JsonObject & {
  shape: GeometryTileShape;
  width: number;
  height: number;
  sides?: number;
  showLabel: boolean;
  showVertices: boolean;
  colorScheme: string;
};

export interface CreateGeometryTileOptions {
  id?: string;
  shape?: GeometryTileShape;
  width?: number;
  height?: number;
  sides?: number;
  showLabel?: boolean;
  showVertices?: boolean;
  colorScheme?: string;
  x?: number;
  y?: number;
  label?: string;
}

export interface GeometryTileMeasurements {
  area?: number;
  perimeter?: number;
  radius?: number;
  diameter?: number;
  unsupportedMessage: string;
}

const MIN_TILE_SIZE = 24;
const EQUILATERAL_TRIANGLE_ASPECT_RATIO = 2 / Math.sqrt(3);

const DEFAULT_DIMENSIONS: Record<
  GeometryTileShape,
  { width: number; height: number; sides?: number }
> = {
  triangle: { width: 96, height: 83, sides: 3 },
  square: { width: 80, height: 80, sides: 4 },
  rectangle: { width: 128, height: 80, sides: 4 },
  hexagon: { width: 104, height: 90, sides: 6 },
  circle: { width: 88, height: 88 },
  trapezoid: { width: 128, height: 80, sides: 4 },
  parallelogram: { width: 128, height: 80, sides: 4 }
};

const SHAPE_LABELS: Record<GeometryTileShape, string> = {
  triangle: "等边三角形",
  square: "正方形",
  rectangle: "长方形",
  hexagon: "正六边形",
  circle: "圆形",
  trapezoid: "梯形",
  parallelogram: "平行四边形"
};

const DEFAULT_COLOR_SCHEMES: Record<GeometryTileShape, string> = {
  triangle: "coral",
  square: "gold",
  rectangle: "sky",
  hexagon: "green",
  circle: "blue",
  trapezoid: "purple",
  parallelogram: "rose"
};

export function createGeometryTile(
  options: CreateGeometryTileOptions = {}
): SceneObject<GeometryTileData> {
  const shape = options.shape ?? "square";
  const defaults = DEFAULT_DIMENSIONS[shape];
  const { width, height } = normalizeDimensionsForShape(
    shape,
    options.width,
    options.height,
    defaults.width,
    defaults.height
  );
  const data: GeometryTileData = {
    shape,
    width,
    height,
    showLabel: options.showLabel ?? true,
    showVertices: options.showVertices ?? false,
    colorScheme: options.colorScheme ?? DEFAULT_COLOR_SCHEMES[shape]
  };
  const sides = options.sides ?? defaults.sides;

  if (sides !== undefined) {
    data.sides = sides;
  }

  return createObject<GeometryTileData>({
    id: options.id,
    type: GEOMETRY_TILE_TYPE,
    x: options.x,
    y: options.y,
    label: options.label ?? SHAPE_LABELS[shape],
    data
  });
}

export function updateGeometryTileData(
  object: SceneObject<GeometryTileData>,
  data: Partial<GeometryTileData>
): SceneObject<GeometryTileData> {
  const shape = data.shape ?? object.data.shape;
  const defaults = DEFAULT_DIMENSIONS[shape];
  const { width, height } = normalizeDimensionsForShape(
    shape,
    data.width,
    data.height,
    object.data.width ?? defaults.width,
    object.data.height ?? defaults.height
  );
  const sides = data.sides ?? defaults.sides;
  const nextData: GeometryTileData = {
    ...object.data,
    ...data,
    shape,
    width,
    height
  };

  if (sides === undefined) {
    delete nextData.sides;
  } else {
    nextData.sides = sides;
  }

  return {
    ...object,
    label: object.label === SHAPE_LABELS[object.data.shape] ? SHAPE_LABELS[shape] : object.label,
    data: nextData
  };
}

export function isFixedAspectGeometryTileShape(
  shape: GeometryTileShape
): boolean {
  return (
    shape === "circle" ||
    shape === "square" ||
    shape === "triangle" ||
    shape === "hexagon"
  );
}

export function getGeometryTileAspectRatio(shape: GeometryTileShape): number {
  if (shape === "circle" || shape === "square") {
    return 1;
  }

  if (shape === "triangle") {
    return EQUILATERAL_TRIANGLE_ASPECT_RATIO;
  }

  const defaults = DEFAULT_DIMENSIONS[shape];

  return defaults.width / defaults.height;
}

export function getGeometryTileMeasurements(
  data: GeometryTileData,
  scaleX = 1,
  scaleY = 1
): GeometryTileMeasurements {
  const width = data.width * scaleX;
  const height = data.height * scaleY;

  if (data.shape === "rectangle" || data.shape === "square") {
    return {
      area: width * height,
      perimeter: 2 * (width + height),
      unsupportedMessage: ""
    };
  }

  if (data.shape === "circle") {
    const diameter = Math.min(width, height);
    const radius = diameter / 2;

    return {
      area: Math.PI * radius * radius,
      radius,
      diameter,
      unsupportedMessage: ""
    };
  }

  return {
    unsupportedMessage: "暂不支持精确计算"
  };
}

export function snapRotationAngle(
  angle: number,
  disableSnap = false,
  step = ROTATION_SNAP_DEGREES
): number {
  if (disableSnap || step <= 0) {
    return angle;
  }

  return Math.round(angle / step) * step;
}

export function isGeometryTileObject(
  object: SceneObject
): object is SceneObject<GeometryTileData> {
  return (
    object.type === GEOMETRY_TILE_TYPE &&
    isGeometryTileShape(object.data.shape) &&
    typeof object.data.width === "number" &&
    typeof object.data.height === "number" &&
    typeof object.data.showLabel === "boolean" &&
    typeof object.data.showVertices === "boolean" &&
    typeof object.data.colorScheme === "string"
  );
}

export function isGeometryTileShape(value: unknown): value is GeometryTileShape {
  return (
    value === "triangle" ||
    value === "square" ||
    value === "rectangle" ||
    value === "hexagon" ||
    value === "circle" ||
    value === "trapezoid" ||
    value === "parallelogram"
  );
}

export function getGeometryTileLabel(shape: GeometryTileShape): string {
  return SHAPE_LABELS[shape];
}

function normalizeDimension(value: number): number {
  if (!Number.isFinite(value)) {
    return MIN_TILE_SIZE;
  }

  return Math.max(MIN_TILE_SIZE, Math.trunc(value));
}

function normalizeDimensionsForShape(
  shape: GeometryTileShape,
  requestedWidth: number | undefined,
  requestedHeight: number | undefined,
  fallbackWidth: number,
  fallbackHeight: number
) {
  let width = normalizeDimension(requestedWidth ?? fallbackWidth);
  let height = normalizeDimension(requestedHeight ?? fallbackHeight);

  if (!isFixedAspectGeometryTileShape(shape)) {
    return { width, height };
  }

  const aspectRatio = getGeometryTileAspectRatio(shape);

  if (requestedWidth === undefined && requestedHeight !== undefined) {
    width = normalizeDimension(Math.round(height * aspectRatio));
  } else {
    height = normalizeDimension(Math.round(width / aspectRatio));
  }

  return { width, height };
}
