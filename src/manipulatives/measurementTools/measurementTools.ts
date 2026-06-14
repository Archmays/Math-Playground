import {
  createObject,
  type JsonObject,
  type SceneObject
} from "../../core/scene";

export const MEASUREMENT_TOOL_TYPE = "measurement-tool";

export type MeasurementToolKind =
  | "ruler"
  | "protractor"
  | "angleMarker"
  | "lineSegment";

export type MeasurementUnit = "grid" | "cm" | "custom";

export type MeasurementPoint = JsonObject & {
  x: number;
  y: number;
};

export type MeasurementToolData = JsonObject & {
  kind: MeasurementToolKind;
  length: number;
  angle: number;
  startPoint: MeasurementPoint;
  endPoint: MeasurementPoint;
  showTicks: boolean;
  showLabel: boolean;
  unit: MeasurementUnit;
  width: number;
  height: number;
};

export interface CreateMeasurementToolOptions {
  id?: string;
  kind?: MeasurementToolKind;
  length?: number;
  angle?: number;
  startPoint?: MeasurementPoint;
  endPoint?: MeasurementPoint;
  showTicks?: boolean;
  showLabel?: boolean;
  unit?: MeasurementUnit;
  x?: number;
  y?: number;
  label?: string;
}

export interface RulerTick {
  offset: number;
  major: boolean;
  label: string;
}

const DEFAULT_LENGTH = 160;
const RULER_HEIGHT = 36;
const PROTRACTOR_WIDTH = 220;
const PROTRACTOR_HEIGHT = 120;
const ANGLE_MARKER_SIZE = 112;
const LINE_SEGMENT_HEIGHT = 24;

export function createMeasurementTool(
  options: CreateMeasurementToolOptions = {}
): SceneObject<MeasurementToolData> {
  const kind = options.kind ?? "ruler";
  const length = normalizeLength(options.length ?? getDefaultLength(kind));
  const angle = normalizeMeasurementAngle(kind, options.angle ?? 0);
  const startPoint = options.startPoint ?? { x: 0, y: 0 };
  const endPoint = options.endPoint ?? { x: length, y: 0 };
  const size = getDefaultSize(kind, length);

  return createObject<MeasurementToolData>({
    id: options.id,
    type: MEASUREMENT_TOOL_TYPE,
    x: options.x,
    y: options.y,
    label: options.label ?? getMeasurementToolLabel(kind, angle),
    data: {
      kind,
      length,
      angle,
      startPoint,
      endPoint,
      showTicks: options.showTicks ?? true,
      showLabel: options.showLabel ?? true,
      unit: options.unit ?? "grid",
      width: size.width,
      height: size.height
    }
  });
}

export function updateMeasurementToolData(
  object: SceneObject<MeasurementToolData>,
  data: Partial<MeasurementToolData>
): SceneObject<MeasurementToolData> {
  const kind = data.kind ?? object.data.kind;
  const length = normalizeLength(data.length ?? object.data.length);
  const angle = normalizeMeasurementAngle(kind, data.angle ?? object.data.angle);
  const size = getDefaultSize(kind, length);
  const nextData: MeasurementToolData = {
    ...object.data,
    ...data,
    kind,
    length,
    angle,
    width: size.width,
    height: size.height
  };

  return {
    ...object,
    label:
      object.label === getMeasurementToolLabel(object.data.kind, object.data.angle)
        ? getMeasurementToolLabel(kind, angle)
        : object.label,
    data: nextData
  };
}

export function normalizeAngle(angle: number): number {
  if (!Number.isFinite(angle)) {
    return 0;
  }

  return ((Math.round(angle) % 360) + 360) % 360;
}

export function normalizeProtractorAngle(angle: number): number {
  if (!Number.isFinite(angle)) {
    return 0;
  }

  return Math.min(180, Math.max(0, Math.round(angle)));
}

function normalizeMeasurementAngle(
  kind: MeasurementToolKind,
  angle: number
): number {
  return kind === "protractor" ? normalizeProtractorAngle(angle) : normalizeAngle(angle);
}

export function formatDegreeLabel(angle: number): string {
  return `${normalizeAngle(angle)}°`;
}

export function generateRulerTicks(
  length: number,
  minorStep = 8,
  majorStep = 16
): RulerTick[] {
  const safeLength = normalizeLength(length);
  const safeMinorStep = Math.max(1, Math.trunc(minorStep));
  const safeMajorStep = Math.max(safeMinorStep, Math.trunc(majorStep));
  const ticks: RulerTick[] = [];

  for (let offset = 0; offset <= safeLength; offset += safeMinorStep) {
    const major = offset % safeMajorStep === 0;

    ticks.push({
      offset,
      major,
      label: major ? String(offset / safeMajorStep) : ""
    });
  }

  if (ticks.at(-1)?.offset !== safeLength) {
    const major = safeLength % safeMajorStep === 0;
    ticks.push({
      offset: safeLength,
      major,
      label: major ? String(safeLength / safeMajorStep) : ""
    });
  }

  return ticks;
}

export function isMeasurementToolObject(
  object: SceneObject
): object is SceneObject<MeasurementToolData> {
  return (
    object.type === MEASUREMENT_TOOL_TYPE &&
    isMeasurementToolKind(object.data.kind) &&
    typeof object.data.length === "number" &&
    typeof object.data.angle === "number" &&
    isPoint(object.data.startPoint) &&
    isPoint(object.data.endPoint) &&
    typeof object.data.showTicks === "boolean" &&
    typeof object.data.showLabel === "boolean" &&
    isMeasurementUnit(object.data.unit)
  );
}

export function isMeasurementToolKind(
  value: unknown
): value is MeasurementToolKind {
  return (
    value === "ruler" ||
    value === "protractor" ||
    value === "angleMarker" ||
    value === "lineSegment"
  );
}

export function isMeasurementUnit(value: unknown): value is MeasurementUnit {
  return value === "grid" || value === "cm" || value === "custom";
}

export function getMeasurementToolLabel(
  kind: MeasurementToolKind,
  angle = 0
): string {
  switch (kind) {
    case "ruler":
      return "直尺";
    case "protractor":
      return "量角器";
    case "angleMarker":
      return formatDegreeLabel(angle);
    case "lineSegment":
      return "线段";
  }
}

function getDefaultLength(kind: MeasurementToolKind): number {
  if (kind === "lineSegment") {
    return 128;
  }

  if (kind === "angleMarker") {
    return 72;
  }

  return DEFAULT_LENGTH;
}

function getDefaultSize(kind: MeasurementToolKind, length: number) {
  switch (kind) {
    case "ruler":
      return { width: length, height: RULER_HEIGHT };
    case "protractor":
      return { width: PROTRACTOR_WIDTH, height: PROTRACTOR_HEIGHT };
    case "angleMarker":
      return { width: ANGLE_MARKER_SIZE, height: ANGLE_MARKER_SIZE };
    case "lineSegment":
      return { width: length, height: LINE_SEGMENT_HEIGHT };
  }
}

function normalizeLength(length: number): number {
  if (!Number.isFinite(length)) {
    return DEFAULT_LENGTH;
  }

  return Math.max(16, Math.trunc(length));
}

function isPoint(value: unknown): value is MeasurementPoint {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    typeof (value as MeasurementPoint).x === "number" &&
    typeof (value as MeasurementPoint).y === "number"
  );
}
