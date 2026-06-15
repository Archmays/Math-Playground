import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useReducer,
  type ReactNode
} from "react";
import type { Point, Scene, Viewport } from "../../core/scene";
import {
  initialWorkspaceState,
  workspaceReducer,
  type AddDemoObjectOptions,
  type DemoObjectType,
  type EditableObjectPatch
} from "./sceneState";
import type { SceneObject } from "../../core/scene";
import type {
  AlgebraTileKind,
  AlgebraTileSign
} from "../../manipulatives/algebraTiles/algebraTiles";
import type { GeometryTileShape } from "../../manipulatives/geometryTiles/geometryTiles";
import type { MeasurementToolKind } from "../../manipulatives/measurementTools/measurementTools";

interface SceneContextValue {
  scene: Scene;
  selectedObjectIds: string[];
  addDemoObject: (
    objectType: DemoObjectType,
    options?: Pick<AddDemoObjectOptions, "text">
  ) => void;
  addNumberTile: (value: number) => void;
  addTenFrame: (filledCount: number) => void;
  addFractionBar: (numerator: number, denominator: number) => void;
  addFractionCircle: (numerator: number, denominator: number) => void;
  addGeometryTile: (shape: GeometryTileShape) => void;
  addTangramSet: () => void;
  addMeasurementTool: (kind: MeasurementToolKind) => void;
  addNumberLine: () => void;
  addBalanceScale: (leftValue: number, rightValue: number) => void;
  addAlgebraTile: (tileKind: AlgebraTileKind, sign: AlgebraTileSign) => void;
  addSelectedGeometryRotationMarker: () => void;
  setSelectedBalanceScaleLeftFromNumberTiles: () => void;
  setSelectedBalanceScaleRightFromNumberTiles: () => void;
  selectObject: (objectId: string) => void;
  selectObjects: (objectIds: string[]) => void;
  toggleSelectObject: (objectId: string) => void;
  clearSelection: () => void;
  moveObjects: (objectIds: string[], delta: Point) => void;
  moveObjectsFromStart: (
    objectIds: string[],
    startPositions: Record<string, Point>,
    delta: Point
  ) => void;
  transformObjects: (
    objectIds: string[],
    objects: Record<string, SceneObject>
  ) => void;
  updateSelectedObjects: (patch: EditableObjectPatch) => void;
  bringSelectedForward: () => void;
  sendSelectedBackward: () => void;
  bringSelectedToFront: () => void;
  sendSelectedToBack: () => void;
  toggleTenFrameCell: (objectId: string, cellIndex: number) => void;
  moveTenFrameToken: (
    sourceObjectId: string,
    sourceCellIndex: number,
    targetObjectId: string,
    targetCellIndex: number
  ) => void;
  deleteSelectedObjects: () => void;
  duplicateSelectedObjects: () => void;
  copySelectedObjects: () => void;
  pasteObjects: () => void;
  loadScene: (scene: Scene) => void;
  undo: () => void;
  redo: () => void;
  pan: (delta: Point) => void;
  zoomAt: (screenPoint: Point, zoomFactor: number) => void;
  setViewport: (viewport: Viewport) => void;
  resetViewport: () => void;
}

const SceneContext = createContext<SceneContextValue | null>(null);

export function SceneProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(workspaceReducer, initialWorkspaceState);

  const addDemoObject = useCallback(
    (
      objectType: DemoObjectType,
      options: Pick<AddDemoObjectOptions, "text"> = {}
    ) => {
      dispatch({ type: "addDemoObject", objectType, text: options.text });
    },
    []
  );

  const addNumberTile = useCallback((value: number) => {
    dispatch({ type: "addNumberTile", value });
  }, []);

  const addTenFrame = useCallback((filledCount: number) => {
    dispatch({ type: "addTenFrame", filledCount });
  }, []);

  const addFractionBar = useCallback(
    (numerator: number, denominator: number) => {
      dispatch({ type: "addFractionBar", numerator, denominator });
    },
    []
  );

  const addFractionCircle = useCallback(
    (numerator: number, denominator: number) => {
      dispatch({ type: "addFractionCircle", numerator, denominator });
    },
    []
  );

  const addGeometryTile = useCallback((shape: GeometryTileShape) => {
    dispatch({ type: "addGeometryTile", shape });
  }, []);

  const addTangramSet = useCallback(() => {
    dispatch({ type: "addTangramSet" });
  }, []);

  const addMeasurementTool = useCallback((kind: MeasurementToolKind) => {
    dispatch({ type: "addMeasurementTool", kind });
  }, []);

  const addNumberLine = useCallback(() => {
    dispatch({ type: "addNumberLine" });
  }, []);

  const addBalanceScale = useCallback((leftValue: number, rightValue: number) => {
    dispatch({ type: "addBalanceScale", leftValue, rightValue });
  }, []);

  const addAlgebraTile = useCallback(
    (tileKind: AlgebraTileKind, sign: AlgebraTileSign) => {
      dispatch({ type: "addAlgebraTile", tileKind, sign });
    },
    []
  );

  const addSelectedGeometryRotationMarker = useCallback(() => {
    dispatch({ type: "addSelectedGeometryRotationMarker" });
  }, []);

  const setSelectedBalanceScaleLeftFromNumberTiles = useCallback(() => {
    dispatch({ type: "setSelectedBalanceScaleSideFromNumberTiles", side: "left" });
  }, []);

  const setSelectedBalanceScaleRightFromNumberTiles = useCallback(() => {
    dispatch({ type: "setSelectedBalanceScaleSideFromNumberTiles", side: "right" });
  }, []);

  const selectObject = useCallback((objectId: string) => {
    dispatch({ type: "selectObject", objectId });
  }, []);

  const selectObjects = useCallback((objectIds: string[]) => {
    dispatch({ type: "selectObjects", objectIds });
  }, []);

  const toggleSelectObject = useCallback((objectId: string) => {
    dispatch({ type: "toggleSelectObject", objectId });
  }, []);

  const clearSelection = useCallback(() => {
    dispatch({ type: "clearSelection" });
  }, []);

  const moveObjects = useCallback((objectIds: string[], delta: Point) => {
    dispatch({ type: "moveObjects", objectIds, delta });
  }, []);

  const moveObjectsFromStart = useCallback(
    (objectIds: string[], startPositions: Record<string, Point>, delta: Point) => {
      dispatch({ type: "moveObjectsFromStart", objectIds, startPositions, delta });
    },
    []
  );

  const transformObjects = useCallback(
    (objectIds: string[], objects: Record<string, SceneObject>) => {
      dispatch({ type: "transformObjects", objectIds, objects });
    },
    []
  );

  const updateSelectedObjects = useCallback((patch: EditableObjectPatch) => {
    dispatch({ type: "updateSelectedObjects", patch });
  }, []);

  const bringSelectedForward = useCallback(() => {
    dispatch({ type: "bringSelectedForward" });
  }, []);

  const sendSelectedBackward = useCallback(() => {
    dispatch({ type: "sendSelectedBackward" });
  }, []);

  const bringSelectedToFront = useCallback(() => {
    dispatch({ type: "bringSelectedToFront" });
  }, []);

  const sendSelectedToBack = useCallback(() => {
    dispatch({ type: "sendSelectedToBack" });
  }, []);

  const toggleTenFrameCell = useCallback(
    (objectId: string, cellIndex: number) => {
      dispatch({ type: "toggleTenFrameCell", objectId, cellIndex });
    },
    []
  );

  const moveTenFrameToken = useCallback(
    (
      sourceObjectId: string,
      sourceCellIndex: number,
      targetObjectId: string,
      targetCellIndex: number
    ) => {
      dispatch({
        type: "moveTenFrameToken",
        sourceObjectId,
        sourceCellIndex,
        targetObjectId,
        targetCellIndex
      });
    },
    []
  );

  const deleteSelectedObjects = useCallback(() => {
    dispatch({ type: "deleteSelectedObjects" });
  }, []);

  const duplicateSelectedObjects = useCallback(() => {
    dispatch({ type: "duplicateSelectedObjects" });
  }, []);

  const copySelectedObjects = useCallback(() => {
    dispatch({ type: "copySelectedObjects" });
  }, []);

  const pasteObjects = useCallback(() => {
    dispatch({ type: "pasteObjects" });
  }, []);

  const loadScene = useCallback((scene: Scene) => {
    dispatch({ type: "replaceScene", scene });
  }, []);

  const undo = useCallback(() => {
    dispatch({ type: "undo" });
  }, []);

  const redo = useCallback(() => {
    dispatch({ type: "redo" });
  }, []);

  const pan = useCallback((delta: Point) => {
    dispatch({ type: "pan", delta });
  }, []);

  const zoomAt = useCallback((screenPoint: Point, zoomFactor: number) => {
    dispatch({ type: "zoomAt", screenPoint, zoomFactor });
  }, []);

  const setViewport = useCallback((viewport: Viewport) => {
    dispatch({ type: "setViewport", viewport });
  }, []);

  const resetViewport = useCallback(() => {
    dispatch({ type: "resetViewport" });
  }, []);

  const value = useMemo(
    () => ({
      scene: state.scene,
      selectedObjectIds: state.selectedObjectIds,
      addDemoObject,
      addNumberTile,
      addTenFrame,
      addFractionBar,
      addFractionCircle,
      addGeometryTile,
      addTangramSet,
      addMeasurementTool,
      addNumberLine,
      addBalanceScale,
      addAlgebraTile,
      addSelectedGeometryRotationMarker,
      setSelectedBalanceScaleLeftFromNumberTiles,
      setSelectedBalanceScaleRightFromNumberTiles,
      selectObject,
      selectObjects,
      toggleSelectObject,
      clearSelection,
      moveObjects,
      moveObjectsFromStart,
      transformObjects,
      updateSelectedObjects,
      bringSelectedForward,
      sendSelectedBackward,
      bringSelectedToFront,
      sendSelectedToBack,
      toggleTenFrameCell,
      moveTenFrameToken,
      deleteSelectedObjects,
      duplicateSelectedObjects,
      copySelectedObjects,
      pasteObjects,
      loadScene,
      undo,
      redo,
      pan,
      zoomAt,
      setViewport,
      resetViewport
    }),
    [
      addDemoObject,
      addFractionBar,
      addFractionCircle,
      addGeometryTile,
      addTangramSet,
      addMeasurementTool,
      addNumberLine,
      addBalanceScale,
      addAlgebraTile,
      addSelectedGeometryRotationMarker,
      setSelectedBalanceScaleLeftFromNumberTiles,
      setSelectedBalanceScaleRightFromNumberTiles,
      addNumberTile,
      addTenFrame,
      clearSelection,
      copySelectedObjects,
      deleteSelectedObjects,
      duplicateSelectedObjects,
      loadScene,
      moveObjects,
      moveObjectsFromStart,
      moveTenFrameToken,
      pan,
      pasteObjects,
      redo,
      resetViewport,
      selectObject,
      selectObjects,
      bringSelectedForward,
      sendSelectedBackward,
      bringSelectedToFront,
      sendSelectedToBack,
      setViewport,
      state.scene,
      state.selectedObjectIds,
      transformObjects,
      toggleSelectObject,
      toggleTenFrameCell,
      undo,
      updateSelectedObjects,
      zoomAt
    ]
  );

  return <SceneContext.Provider value={value}>{children}</SceneContext.Provider>;
}

export function useScene() {
  const context = useContext(SceneContext);

  if (!context) {
    throw new Error("useScene must be used inside SceneProvider");
  }

  return context;
}
