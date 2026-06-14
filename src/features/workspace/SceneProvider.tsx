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
  type DemoObjectType,
  type EditableObjectPatch
} from "./sceneState";
import type { SceneObject } from "../../core/scene";

interface SceneContextValue {
  scene: Scene;
  selectedObjectIds: string[];
  addDemoObject: (objectType: DemoObjectType) => void;
  addNumberTile: (value: number) => void;
  addTenFrame: (filledCount: number) => void;
  selectObject: (objectId: string) => void;
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
  toggleTenFrameCell: (objectId: string, cellIndex: number) => void;
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

  const addDemoObject = useCallback((objectType: DemoObjectType) => {
    dispatch({ type: "addDemoObject", objectType });
  }, []);

  const addNumberTile = useCallback((value: number) => {
    dispatch({ type: "addNumberTile", value });
  }, []);

  const addTenFrame = useCallback((filledCount: number) => {
    dispatch({ type: "addTenFrame", filledCount });
  }, []);

  const selectObject = useCallback((objectId: string) => {
    dispatch({ type: "selectObject", objectId });
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

  const toggleTenFrameCell = useCallback(
    (objectId: string, cellIndex: number) => {
      dispatch({ type: "toggleTenFrameCell", objectId, cellIndex });
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
      selectObject,
      toggleSelectObject,
      clearSelection,
      moveObjects,
      moveObjectsFromStart,
      transformObjects,
      updateSelectedObjects,
      toggleTenFrameCell,
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
      addNumberTile,
      addTenFrame,
      clearSelection,
      copySelectedObjects,
      deleteSelectedObjects,
      duplicateSelectedObjects,
      loadScene,
      moveObjects,
      moveObjectsFromStart,
      pan,
      pasteObjects,
      redo,
      resetViewport,
      selectObject,
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
