import { snapToGrid } from "../../core/geometry";
import {
  cloneObject,
  createObject,
  createScene,
  generateId,
  type JsonObject,
  type Point,
  type Scene,
  type SceneObject,
  type Viewport
} from "../../core/scene";
import { panViewport, zoomAtPoint } from "../../canvas/canvasUtils";
import {
  createAlgebraTile,
  type AlgebraTileKind,
  type AlgebraTileSign
} from "../../manipulatives/algebraTiles/algebraTiles";
import {
  createBalanceScale,
  isBalanceScaleObject,
  setLeftFromSelectedNumberTiles,
  setRightFromSelectedNumberTiles
} from "../../manipulatives/balanceScale/balanceScale";
import { createFractionBar } from "../../manipulatives/fractionBars/fractionBars";
import { createFractionCircle } from "../../manipulatives/fractionCircles/fractionCircles";
import {
  createGeometryTile,
  isGeometryTileObject,
  type GeometryTileShape
} from "../../manipulatives/geometryTiles/geometryTiles";
import {
  createMeasurementTool,
  type MeasurementToolKind
} from "../../manipulatives/measurementTools/measurementTools";
import { createNumberTile } from "../../manipulatives/numberTiles/numberTiles";
import {
  createTenFrame,
  getFilledCellPositions,
  isTenFrameObject,
  TEN_FRAME_CELL_COUNT,
  toggleCell,
  type TenFrameData
} from "../../manipulatives/tenFrames/tenFrames";

export type DemoObjectType = "demo-rectangle" | "demo-circle" | "demo-text";

export interface AddDemoObjectOptions {
  id?: string;
  now?: string;
  text?: string;
}

interface TangramPieceTemplate {
  shape: GeometryTileShape;
  width: number;
  height: number;
  x: number;
  y: number;
  rotation: number;
  colorScheme: string;
  label: string;
}

export interface WorkspaceState {
  scene: Scene;
  selectedObjectIds: string[];
  clipboard: SceneObject[];
  past: Scene[];
  future: Scene[];
}

export type EditableObjectPatch = Partial<
  Pick<
    SceneObject,
    | "x"
    | "y"
    | "rotation"
    | "scaleX"
    | "scaleY"
    | "label"
    | "locked"
    | "visible"
  >
> & {
  data?: JsonObject;
};

export type WorkspaceAction =
  | { type: "addDemoObject"; objectType: DemoObjectType; text?: string }
  | { type: "addNumberTile"; value: number }
  | { type: "addTenFrame"; filledCount: number }
  | { type: "addFractionBar"; numerator: number; denominator: number }
  | { type: "addFractionCircle"; numerator: number; denominator: number }
  | { type: "addGeometryTile"; shape: GeometryTileShape }
  | { type: "addTangramSet" }
  | { type: "addMeasurementTool"; kind: MeasurementToolKind }
  | { type: "addBalanceScale"; leftValue: number; rightValue: number }
  | { type: "addAlgebraTile"; tileKind: AlgebraTileKind; sign: AlgebraTileSign }
  | { type: "addSelectedGeometryRotationMarker" }
  | { type: "setSelectedBalanceScaleSideFromNumberTiles"; side: "left" | "right" }
  | { type: "toggleTenFrameCell"; objectId: string; cellIndex: number }
  | {
      type: "moveTenFrameToken";
      sourceObjectId: string;
      sourceCellIndex: number;
      targetObjectId: string;
      targetCellIndex: number;
    }
  | { type: "selectObject"; objectId: string }
  | { type: "selectObjects"; objectIds: string[] }
  | { type: "toggleSelectObject"; objectId: string }
  | { type: "clearSelection" }
  | { type: "moveObjects"; objectIds: string[]; delta: Point }
  | {
      type: "moveObjectsFromStart";
      objectIds: string[];
      startPositions: Record<string, Point>;
      delta: Point;
    }
  | { type: "updateSelectedObjects"; patch: EditableObjectPatch }
  | {
      type: "transformObjects";
      objectIds: string[];
      objects: Record<string, SceneObject>;
    }
  | { type: "bringSelectedForward" }
  | { type: "sendSelectedBackward" }
  | { type: "bringSelectedToFront" }
  | { type: "sendSelectedToBack" }
  | { type: "deleteSelectedObjects" }
  | { type: "duplicateSelectedObjects" }
  | { type: "copySelectedObjects" }
  | { type: "pasteObjects" }
  | { type: "replaceScene"; scene: Scene }
  | { type: "undo" }
  | { type: "redo" }
  | { type: "pan"; delta: Point }
  | { type: "zoomAt"; screenPoint: Point; zoomFactor: number }
  | { type: "setViewport"; viewport: Viewport }
  | { type: "resetViewport" };

const HISTORY_LIMIT = 100;
const defaultViewport: Viewport = {
  x: 0,
  y: 0,
  zoom: 1
};

const TANGRAM_PIECES: TangramPieceTemplate[] = [
  {
    shape: "triangle",
    width: 128,
    height: 111,
    x: 0,
    y: 0,
    rotation: 0,
    colorScheme: "tangram-red",
    label: "七巧板大三角 1"
  },
  {
    shape: "triangle",
    width: 128,
    height: 111,
    x: 118,
    y: 0,
    rotation: 90,
    colorScheme: "tangram-orange",
    label: "七巧板大三角 2"
  },
  {
    shape: "triangle",
    width: 96,
    height: 83,
    x: 78,
    y: 96,
    rotation: 180,
    colorScheme: "tangram-yellow",
    label: "七巧板中三角"
  },
  {
    shape: "triangle",
    width: 64,
    height: 55,
    x: 0,
    y: 136,
    rotation: 0,
    colorScheme: "tangram-green",
    label: "七巧板小三角 1"
  },
  {
    shape: "triangle",
    width: 64,
    height: 55,
    x: 178,
    y: 136,
    rotation: -90,
    colorScheme: "tangram-cyan",
    label: "七巧板小三角 2"
  },
  {
    shape: "square",
    width: 64,
    height: 64,
    x: 92,
    y: 128,
    rotation: 45,
    colorScheme: "tangram-blue",
    label: "七巧板正方形"
  },
  {
    shape: "parallelogram",
    width: 96,
    height: 64,
    x: 160,
    y: 82,
    rotation: 0,
    colorScheme: "tangram-purple",
    label: "七巧板平行四边形"
  }
];

export const initialWorkspaceState: WorkspaceState = {
  scene: createScene({
    title: "我的操作板",
    viewport: defaultViewport
  }),
  selectedObjectIds: [],
  clipboard: [],
  past: [],
  future: []
};

export function workspaceReducer(
  state: WorkspaceState,
  action: WorkspaceAction
): WorkspaceState {
  switch (action.type) {
    case "addDemoObject":
      return addDemoObject(state, action.objectType, { text: action.text });
    case "addNumberTile":
      return addNumberTile(state, action.value);
    case "addTenFrame":
      return addTenFrame(state, action.filledCount);
    case "addFractionBar":
      return addFractionBar(state, action.numerator, action.denominator);
    case "addFractionCircle":
      return addFractionCircle(state, action.numerator, action.denominator);
    case "addGeometryTile":
      return addGeometryTile(state, action.shape);
    case "addTangramSet":
      return addTangramSet(state);
    case "addMeasurementTool":
      return addMeasurementTool(state, action.kind);
    case "addBalanceScale":
      return addBalanceScale(state, action.leftValue, action.rightValue);
    case "addAlgebraTile":
      return addAlgebraTile(state, action.tileKind, action.sign);
    case "addSelectedGeometryRotationMarker":
      return addSelectedGeometryRotationMarker(state);
    case "setSelectedBalanceScaleSideFromNumberTiles":
      return setSelectedBalanceScaleSideFromNumberTiles(state, action.side);
    case "toggleTenFrameCell":
      return toggleTenFrameCell(state, action.objectId, action.cellIndex);
    case "moveTenFrameToken":
      return moveTenFrameToken(
        state,
        action.sourceObjectId,
        action.sourceCellIndex,
        action.targetObjectId,
        action.targetCellIndex
      );
    case "selectObject":
      return selectObject(state, action.objectId);
    case "selectObjects":
      return selectObjects(state, action.objectIds);
    case "toggleSelectObject":
      return toggleSelectObject(state, action.objectId);
    case "clearSelection":
      return clearSelection(state);
    case "moveObjects":
      return moveObjects(state, action.objectIds, action.delta);
    case "moveObjectsFromStart":
      return moveObjectsFromStart(
        state,
        action.objectIds,
        action.startPositions,
        action.delta
      );
    case "updateSelectedObjects":
      return updateSelectedObjects(state, action.patch);
    case "transformObjects":
      return transformObjects(state, action.objectIds, action.objects);
    case "bringSelectedForward":
      return bringSelectedForward(state);
    case "sendSelectedBackward":
      return sendSelectedBackward(state);
    case "bringSelectedToFront":
      return bringSelectedToFront(state);
    case "sendSelectedToBack":
      return sendSelectedToBack(state);
    case "deleteSelectedObjects":
      return deleteSelectedObjects(state);
    case "duplicateSelectedObjects":
      return duplicateSelectedObjects(state);
    case "copySelectedObjects":
      return copySelectedObjects(state);
    case "pasteObjects":
      return pasteObjects(state);
    case "replaceScene":
      return replaceScene(state, action.scene);
    case "undo":
      return undo(state);
    case "redo":
      return redo(state);
    case "pan":
      return withViewport(state, panViewport(state.scene.viewport, action.delta));
    case "zoomAt":
      return withViewport(
        state,
        zoomAtPoint(state.scene.viewport, action.screenPoint, action.zoomFactor)
      );
    case "setViewport":
      return withViewport(state, action.viewport);
    case "resetViewport":
      return withViewport(state, defaultViewport);
  }
}

export function addDemoObject(
  state: WorkspaceState,
  objectType: DemoObjectType,
  options: AddDemoObjectOptions = {}
): WorkspaceState {
  const object = createDemoObject(
    objectType,
    options.id,
    state.scene.objects.length,
    options.text
  );

  return commitScene(
    state,
    {
      ...state.scene,
      updatedAt: options.now ?? new Date().toISOString(),
      objects: [...state.scene.objects, object]
    },
    [object.id]
  );
}

export function addNumberTile(
  state: WorkspaceState,
  value: number,
  options: { id?: string; now?: string } = {}
): WorkspaceState {
  const index = state.scene.objects.length;
  const object = createNumberTile({
    id: options.id,
    value,
    x: 96 + (index % 4) * 96,
    y: 96 + Math.floor(index / 4) * 96
  });

  return commitScene(
    state,
    {
      ...state.scene,
      updatedAt: options.now ?? new Date().toISOString(),
      objects: [...state.scene.objects, object]
    },
    [object.id]
  );
}

export function addTenFrame(
  state: WorkspaceState,
  filledCount: number,
  options: { id?: string; now?: string } = {}
): WorkspaceState {
  const index = state.scene.objects.length;
  const object = createTenFrame({
    id: options.id,
    filledCount,
    x: 96 + (index % 3) * 248,
    y: 96 + Math.floor(index / 3) * 128
  });

  return commitScene(
    state,
    {
      ...state.scene,
      updatedAt: options.now ?? new Date().toISOString(),
      objects: [...state.scene.objects, object]
    },
    [object.id]
  );
}

export function addFractionBar(
  state: WorkspaceState,
  numerator: number,
  denominator: number,
  options: { id?: string; now?: string } = {}
): WorkspaceState {
  const index = state.scene.objects.length;
  const object = createFractionBar({
    id: options.id,
    numerator,
    denominator,
    x: 96 + (index % 3) * 272,
    y: 96 + Math.floor(index / 3) * 96
  });

  return commitScene(
    state,
    {
      ...state.scene,
      updatedAt: options.now ?? new Date().toISOString(),
      objects: [...state.scene.objects, object]
    },
    [object.id]
  );
}

export function addFractionCircle(
  state: WorkspaceState,
  numerator: number,
  denominator: number,
  options: { id?: string; now?: string } = {}
): WorkspaceState {
  const index = state.scene.objects.length;
  const object = createFractionCircle({
    id: options.id,
    numerator,
    denominator,
    x: 112 + (index % 4) * 144,
    y: 112 + Math.floor(index / 4) * 144
  });

  return commitScene(
    state,
    {
      ...state.scene,
      updatedAt: options.now ?? new Date().toISOString(),
      objects: [...state.scene.objects, object]
    },
    [object.id]
  );
}

export function addGeometryTile(
  state: WorkspaceState,
  shape: GeometryTileShape,
  options: { id?: string; now?: string } = {}
): WorkspaceState {
  const index = state.scene.objects.length;
  const object = createGeometryTile({
    id: options.id,
    shape,
    x: 112 + (index % 4) * 144,
    y: 112 + Math.floor(index / 4) * 128
  });

  return commitScene(
    state,
    {
      ...state.scene,
      updatedAt: options.now ?? new Date().toISOString(),
      objects: [...state.scene.objects, object]
    },
    [object.id]
  );
}

export function addTangramSet(
  state: WorkspaceState,
  options: { ids?: string[]; now?: string } = {}
): WorkspaceState {
  const index = state.scene.objects.length;
  const origin = {
    x: 96 + (index % 2) * 320,
    y: 96 + Math.floor(index / 2) * 224
  };
  const pieces = TANGRAM_PIECES.map((piece, pieceIndex) => ({
    ...createGeometryTile({
      id: options.ids?.[pieceIndex],
      shape: piece.shape,
      width: piece.width,
      height: piece.height,
      showLabel: false,
      showVertices: false,
      colorScheme: piece.colorScheme,
      x: origin.x + piece.x,
      y: origin.y + piece.y,
      label: piece.label
    }),
    rotation: piece.rotation
  }));

  return commitScene(
    state,
    {
      ...state.scene,
      updatedAt: options.now ?? new Date().toISOString(),
      objects: [...state.scene.objects, ...pieces]
    },
    pieces.map((object) => object.id)
  );
}

export function addMeasurementTool(
  state: WorkspaceState,
  kind: MeasurementToolKind,
  options: { id?: string; now?: string; angle?: number; x?: number; y?: number } = {}
): WorkspaceState {
  const index = state.scene.objects.length;
  const object = createMeasurementTool({
    id: options.id,
    kind,
    angle: options.angle,
    x: options.x ?? 112 + (index % 3) * 192,
    y: options.y ?? 112 + Math.floor(index / 3) * 128
  });

  return commitScene(
    state,
    {
      ...state.scene,
      updatedAt: options.now ?? new Date().toISOString(),
      objects: [...state.scene.objects, object]
    },
    [object.id]
  );
}

export function addBalanceScale(
  state: WorkspaceState,
  leftValue: number,
  rightValue: number,
  options: { id?: string; now?: string } = {}
): WorkspaceState {
  const index = state.scene.objects.length;
  const object = createBalanceScale({
    id: options.id,
    leftValue,
    rightValue,
    x: 112 + (index % 3) * 248,
    y: 112 + Math.floor(index / 3) * 176
  });

  return commitScene(
    state,
    {
      ...state.scene,
      updatedAt: options.now ?? new Date().toISOString(),
      objects: [...state.scene.objects, object]
    },
    [object.id]
  );
}

export function addAlgebraTile(
  state: WorkspaceState,
  tileKind: AlgebraTileKind,
  sign: AlgebraTileSign,
  options: { id?: string; now?: string } = {}
): WorkspaceState {
  const index = state.scene.objects.length;
  const object = createAlgebraTile({
    id: options.id,
    tileKind,
    sign,
    x: 112 + (index % 5) * 104,
    y: 112 + Math.floor(index / 5) * 112
  });

  return commitScene(
    state,
    {
      ...state.scene,
      updatedAt: options.now ?? new Date().toISOString(),
      objects: [...state.scene.objects, object]
    },
    [object.id]
  );
}

export function addSelectedGeometryRotationMarker(
  state: WorkspaceState,
  options: { id?: string; now?: string } = {}
): WorkspaceState {
  const selectedGeometry = state.scene.objects.find(
    (object) => state.selectedObjectIds.includes(object.id) && isGeometryTileObject(object)
  );

  if (!selectedGeometry) {
    return state;
  }

  return addMeasurementTool(state, "angleMarker", {
    id: options.id,
    now: options.now,
    angle: selectedGeometry.rotation,
    x: selectedGeometry.x + 24,
    y: selectedGeometry.y + 24
  });
}

export function setSelectedBalanceScaleSideFromNumberTiles(
  state: WorkspaceState,
  side: "left" | "right",
  options: { now?: string } = {}
): WorkspaceState {
  const selectedBalanceScale = state.scene.objects.find(
    (object) => state.selectedObjectIds.includes(object.id) && isBalanceScaleObject(object)
  );

  if (!selectedBalanceScale) {
    return state;
  }

  const nextObjects = state.scene.objects.map((object) => {
    if (object.id !== selectedBalanceScale.id || !isBalanceScaleObject(object)) {
      return object;
    }

    return side === "left"
      ? setLeftFromSelectedNumberTiles(
          object,
          state.scene.objects,
          state.selectedObjectIds
        )
      : setRightFromSelectedNumberTiles(
          object,
          state.scene.objects,
          state.selectedObjectIds
        );
  });

  return commitIfChanged(state, nextObjects, options.now);
}

export function toggleTenFrameCell(
  state: WorkspaceState,
  objectId: string,
  cellIndex: number,
  options: { now?: string } = {}
): WorkspaceState {
  const nextObjects = state.scene.objects.map((object) =>
    object.id === objectId && isTenFrameObject(object) && !object.locked
      ? toggleCell(object, cellIndex)
      : object
  );

  return commitIfChanged(state, nextObjects, options.now);
}

export function moveTenFrameToken(
  state: WorkspaceState,
  sourceObjectId: string,
  sourceCellIndex: number,
  targetObjectId: string,
  targetCellIndex: number,
  options: { now?: string } = {}
): WorkspaceState {
  if (sourceObjectId === targetObjectId) {
    return state;
  }

  const source = state.scene.objects.find(
    (object) => object.id === sourceObjectId
  );
  const target = state.scene.objects.find(
    (object) => object.id === targetObjectId
  );

  if (
    !source ||
    !target ||
    !source.visible ||
    !target.visible ||
    source.locked ||
    target.locked ||
    !isTenFrameObject(source) ||
    !isTenFrameObject(target)
  ) {
    return state;
  }

  const sourcePositions = getFilledCellPositions(source.data);
  const targetPositions = getFilledCellPositions(target.data);

  if (
    !sourcePositions.includes(sourceCellIndex) ||
    targetPositions.includes(targetCellIndex) ||
    targetPositions.length >= TEN_FRAME_CELL_COUNT ||
    !isValidTenFrameCellIndex(targetCellIndex)
  ) {
    return state;
  }

  const nextSourcePositions = sourcePositions.filter(
    (cellIndex) => cellIndex !== sourceCellIndex
  );
  const nextTargetPositions = [...targetPositions, targetCellIndex].sort(
    (a, b) => a - b
  );
  const nextObjects = state.scene.objects.map((object) => {
    if (object.id === source.id && isTenFrameObject(object)) {
      return setManualTenFramePositions(object, nextSourcePositions);
    }

    if (object.id === target.id && isTenFrameObject(object)) {
      return setManualTenFramePositions(object, nextTargetPositions);
    }

    return object;
  });

  return commitIfChanged(state, nextObjects, options.now);
}

function setManualTenFramePositions(
  object: SceneObject<TenFrameData>,
  tokenPositions: number[]
): SceneObject<TenFrameData> {
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

function isValidTenFrameCellIndex(value: number): boolean {
  return (
    Number.isInteger(value) &&
    value >= 0 &&
    value < TEN_FRAME_CELL_COUNT
  );
}

export function selectObject(
  state: WorkspaceState,
  objectId: string
): WorkspaceState {
  return {
    ...state,
    selectedObjectIds: hasSelectableObject(state.scene, objectId) ? [objectId] : []
  };
}

export function selectObjects(
  state: WorkspaceState,
  objectIds: string[]
): WorkspaceState {
  const selectedObjectIds = objectIds.filter(
    (objectId, index) =>
      objectIds.indexOf(objectId) === index &&
      hasSelectableObject(state.scene, objectId)
  );

  return {
    ...state,
    selectedObjectIds
  };
}

export function toggleSelectObject(
  state: WorkspaceState,
  objectId: string
): WorkspaceState {
  if (!hasSelectableObject(state.scene, objectId)) {
    return state;
  }

  if (state.selectedObjectIds.includes(objectId)) {
    return {
      ...state,
      selectedObjectIds: state.selectedObjectIds.filter((id) => id !== objectId)
    };
  }

  return {
    ...state,
    selectedObjectIds: [...state.selectedObjectIds, objectId]
  };
}

export function clearSelection(state: WorkspaceState): WorkspaceState {
  return {
    ...state,
    selectedObjectIds: []
  };
}

export function moveObject(
  state: WorkspaceState,
  objectId: string,
  delta: Point,
  options: { now?: string; snap?: boolean } = {}
): WorkspaceState {
  return moveObjects(state, [objectId], delta, options);
}

export function moveObjects(
  state: WorkspaceState,
  objectIds: string[],
  delta: Point,
  options: { now?: string; snap?: boolean } = {}
): WorkspaceState {
  const ids = new Set(objectIds);
  const shouldSnap = options.snap ?? state.scene.grid.snap;
  const nextObjects = state.scene.objects.map((object) => {
    if (!ids.has(object.id) || object.locked) {
      return object;
    }

    const nextPoint = {
      x: object.x + delta.x,
      y: object.y + delta.y
    };
    const position = shouldSnap
      ? snapToGrid(nextPoint, state.scene.grid.size)
      : nextPoint;

    return {
      ...object,
      x: position.x,
      y: position.y
    };
  });

  return commitIfChanged(state, nextObjects, options.now);
}

export function moveObjectsFromStart(
  state: WorkspaceState,
  objectIds: string[],
  startPositions: Record<string, Point>,
  delta: Point,
  options: { now?: string; snap?: boolean } = {}
): WorkspaceState {
  const ids = new Set(objectIds);
  const shouldSnap = options.snap ?? state.scene.grid.snap;
  const nextObjects = state.scene.objects.map((object) => {
    const startPosition = startPositions[object.id];

    if (!ids.has(object.id) || object.locked || !startPosition) {
      return object;
    }

    const nextPoint = {
      x: startPosition.x + delta.x,
      y: startPosition.y + delta.y
    };
    const position = shouldSnap
      ? snapToGrid(nextPoint, state.scene.grid.size)
      : nextPoint;

    return {
      ...object,
      x: position.x,
      y: position.y
    };
  });

  return commitIfChanged(state, nextObjects, options.now);
}

export function updateSelectedObjects(
  state: WorkspaceState,
  patch: EditableObjectPatch,
  options: { now?: string } = {}
): WorkspaceState {
  if (state.selectedObjectIds.length === 0) {
    return state;
  }

  const selected = new Set(state.selectedObjectIds);
  const nextObjects = state.scene.objects.map((object) => {
    if (!selected.has(object.id)) {
      return object;
    }

    return {
      ...object,
      ...patch,
      data: patch.data ? { ...object.data, ...patch.data } : object.data
    };
  });
  const nextSelectedIds =
    patch.visible === false
      ? state.selectedObjectIds.filter((id) =>
          nextObjects.some((object) => object.id === id && object.visible)
        )
      : state.selectedObjectIds;

  return commitScene(
    state,
    {
      ...state.scene,
      updatedAt: options.now ?? new Date().toISOString(),
      objects: nextObjects
    },
    nextSelectedIds
  );
}

export function transformObjects(
  state: WorkspaceState,
  objectIds: string[],
  objects: Record<string, SceneObject>,
  options: { now?: string } = {}
): WorkspaceState {
  const ids = new Set(objectIds);
  const nextObjects = state.scene.objects.map((object) =>
    ids.has(object.id) && objects[object.id] && !object.locked
      ? objects[object.id]
      : object
  );

  return commitIfChanged(state, nextObjects, options.now);
}

export function bringSelectedForward(
  state: WorkspaceState,
  options: { now?: string } = {}
): WorkspaceState {
  return reorderSelectedLayerGroup(state, "forward", options.now);
}

export function sendSelectedBackward(
  state: WorkspaceState,
  options: { now?: string } = {}
): WorkspaceState {
  return reorderSelectedLayerGroup(state, "backward", options.now);
}

export function bringSelectedToFront(
  state: WorkspaceState,
  options: { now?: string } = {}
): WorkspaceState {
  return reorderSelectedLayerGroup(state, "front", options.now);
}

export function sendSelectedToBack(
  state: WorkspaceState,
  options: { now?: string } = {}
): WorkspaceState {
  return reorderSelectedLayerGroup(state, "back", options.now);
}

export function duplicateObject(
  state: WorkspaceState,
  objectId: string,
  options: { id?: string; now?: string } = {}
): WorkspaceState {
  const object = state.scene.objects.find((item) => item.id === objectId);

  if (!object) {
    return state;
  }

  const duplicate = cloneObject(object, {
    id: options.id,
    offset: { x: 32, y: 32 }
  });

  return commitScene(
    state,
    {
      ...state.scene,
      updatedAt: options.now ?? new Date().toISOString(),
      objects: [...state.scene.objects, duplicate]
    },
    [duplicate.id]
  );
}

export function duplicateSelectedObjects(
  state: WorkspaceState,
  options: { now?: string } = {}
): WorkspaceState {
  const selected = state.scene.objects.filter((object) =>
    state.selectedObjectIds.includes(object.id)
  );

  if (selected.length === 0) {
    return state;
  }

  const duplicates = selected.map((object) =>
    cloneObject(object, {
      id: generateId(object.type),
      offset: { x: 32, y: 32 }
    })
  );

  return commitScene(
    state,
    {
      ...state.scene,
      updatedAt: options.now ?? new Date().toISOString(),
      objects: [...state.scene.objects, ...duplicates]
    },
    duplicates.map((object) => object.id)
  );
}

export function copySelectedObjects(state: WorkspaceState): WorkspaceState {
  const selected = state.scene.objects.filter((object) =>
    state.selectedObjectIds.includes(object.id)
  );

  return {
    ...state,
    clipboard: selected.map(cloneSceneObject)
  };
}

export function pasteObjects(
  state: WorkspaceState,
  options: { ids?: string[]; now?: string } = {}
): WorkspaceState {
  if (state.clipboard.length === 0) {
    return state;
  }

  const pasted = state.clipboard.map((object, index) =>
    cloneObject(object, {
      id: options.ids?.[index] ?? generateId(object.type),
      offset: { x: 32, y: 32 }
    })
  );

  return commitScene(
    state,
    {
      ...state.scene,
      updatedAt: options.now ?? new Date().toISOString(),
      objects: [...state.scene.objects, ...pasted]
    },
    pasted.map((object) => object.id)
  );
}

export function replaceScene(state: WorkspaceState, scene: Scene): WorkspaceState {
  return {
    ...state,
    scene: cloneScene(scene),
    selectedObjectIds: [],
    past: [],
    future: []
  };
}

export function deleteSelectedObjects(
  state: WorkspaceState,
  options: { now?: string } = {}
): WorkspaceState {
  const selected = new Set(state.selectedObjectIds);

  if (selected.size === 0) {
    return state;
  }

  return commitScene(
    state,
    {
      ...state.scene,
      updatedAt: options.now ?? new Date().toISOString(),
      objects: state.scene.objects.filter((object) => !selected.has(object.id))
    },
    []
  );
}

export function undo(state: WorkspaceState): WorkspaceState {
  const previous = state.past.at(-1);

  if (!previous) {
    return state;
  }

  return {
    ...state,
    scene: cloneScene(previous),
    selectedObjectIds: [],
    past: state.past.slice(0, -1),
    future: [cloneScene(state.scene), ...state.future]
  };
}

export function redo(state: WorkspaceState): WorkspaceState {
  const next = state.future[0];

  if (!next) {
    return state;
  }

  return {
    ...state,
    scene: cloneScene(next),
    selectedObjectIds: [],
    past: trimHistory([...state.past, cloneScene(state.scene)]),
    future: state.future.slice(1)
  };
}

function createDemoObject(
  objectType: DemoObjectType,
  id = generateId(objectType),
  index = 0,
  text = "数学"
): SceneObject {
  const x = 96 + (index % 4) * 160;
  const y = 96 + Math.floor(index / 4) * 128;

  switch (objectType) {
    case "demo-rectangle":
      return createObject({
        id,
        type: objectType,
        x,
        y,
        label: "矩形",
        data: {
          width: 112,
          height: 72,
          fill: "#ffe28a"
        }
      });
    case "demo-circle":
      return createObject({
        id,
        type: objectType,
        x,
        y,
        label: "圆形",
        data: {
          width: 80,
          height: 80,
          fill: "#b8e8ff"
        }
      });
    case "demo-text":
      return createObject({
        id,
        type: objectType,
        x,
        y,
        label: "文字",
        data: {
          width: 96,
          height: 40,
          text
        }
      });
  }
}

function commitIfChanged(
  state: WorkspaceState,
  nextObjects: SceneObject[],
  now?: string
): WorkspaceState {
  if (nextObjects.every((object, index) => object === state.scene.objects[index])) {
    return state;
  }

  return commitScene(state, {
    ...state.scene,
    updatedAt: now ?? new Date().toISOString(),
    objects: nextObjects
  });
}

function commitScene(
  state: WorkspaceState,
  scene: Scene,
  selectedObjectIds = state.selectedObjectIds
): WorkspaceState {
  return {
    ...state,
    scene,
    selectedObjectIds,
    past: trimHistory([...state.past, cloneScene(state.scene)]),
    future: []
  };
}

type LayerMove = "forward" | "backward" | "front" | "back";

type LayerItem =
  | { kind: "group"; objects: SceneObject[] }
  | { kind: "object"; object: SceneObject };

function reorderSelectedLayerGroup(
  state: WorkspaceState,
  move: LayerMove,
  now?: string
): WorkspaceState {
  if (state.selectedObjectIds.length === 0) {
    return state;
  }

  const selected = new Set(state.selectedObjectIds);
  const group = state.scene.objects.filter((object) => selected.has(object.id));

  if (group.length === 0 || group.length === state.scene.objects.length) {
    return state;
  }

  const items = buildLayerItems(state.scene.objects, selected, group);
  const groupIndex = items.findIndex((item) => item.kind === "group");

  if (groupIndex < 0) {
    return state;
  }

  const nextItems = [...items];
  const [groupItem] = nextItems.splice(groupIndex, 1);
  const insertIndex = getLayerInsertIndex(move, groupIndex, items.length);

  if (insertIndex === groupIndex) {
    return state;
  }

  nextItems.splice(insertIndex, 0, groupItem);

  return commitIfChanged(state, flattenLayerItems(nextItems), now);
}

function buildLayerItems(
  objects: SceneObject[],
  selected: Set<string>,
  group: SceneObject[]
): LayerItem[] {
  const items: LayerItem[] = [];
  let hasInsertedGroup = false;

  for (const object of objects) {
    if (selected.has(object.id)) {
      if (!hasInsertedGroup) {
        items.push({ kind: "group", objects: group });
        hasInsertedGroup = true;
      }
      continue;
    }

    items.push({ kind: "object", object });
  }

  return items;
}

function getLayerInsertIndex(
  move: LayerMove,
  groupIndex: number,
  itemCount: number
): number {
  switch (move) {
    case "forward":
      return Math.min(itemCount - 1, groupIndex + 1);
    case "backward":
      return Math.max(0, groupIndex - 1);
    case "front":
      return itemCount - 1;
    case "back":
      return 0;
  }
}

function flattenLayerItems(items: LayerItem[]): SceneObject[] {
  return items.flatMap((item) =>
    item.kind === "group" ? item.objects : [item.object]
  );
}

function withViewport(state: WorkspaceState, viewport: Viewport): WorkspaceState {
  return {
    ...state,
    scene: {
      ...state.scene,
      updatedAt: new Date().toISOString(),
      viewport
    }
  };
}

function hasSelectableObject(scene: Scene, objectId: string): boolean {
  return scene.objects.some(
    (object) => object.id === objectId && object.visible
  );
}

function trimHistory(history: Scene[]): Scene[] {
  return history.slice(Math.max(0, history.length - HISTORY_LIMIT));
}

function cloneScene(scene: Scene): Scene {
  return {
    ...scene,
    viewport: { ...scene.viewport },
    grid: { ...scene.grid },
    objects: scene.objects.map(cloneSceneObject)
  };
}

function cloneSceneObject(object: SceneObject): SceneObject {
  return {
    ...object,
    data: JSON.parse(JSON.stringify(object.data)) as JsonObject
  };
}
