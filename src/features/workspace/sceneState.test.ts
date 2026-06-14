import { describe, expect, it } from "vitest";
import { createObject, createScene } from "../../core/scene";
import { createBalanceScale } from "../../manipulatives/balanceScale/balanceScale";
import { createNumberTile } from "../../manipulatives/numberTiles/numberTiles";
import {
  addAlgebraTile,
  addBalanceScale,
  clearSelection,
  copySelectedObjects,
  deleteSelectedObjects,
  addDemoObject,
  addFractionBar,
  addFractionCircle,
  addGeometryTile,
  addMeasurementTool,
  addSelectedGeometryRotationMarker,
  addTenFrame,
  duplicateObject,
  pasteObjects,
  redo,
  moveObject,
  moveObjectsFromStart,
  selectObject,
  selectObjects,
  setSelectedBalanceScaleSideFromNumberTiles,
  toggleSelectObject,
  toggleTenFrameCell,
  undo,
  updateSelectedObjects,
  type WorkspaceState
} from "./sceneState";

const now = "2026-06-14T00:00:00.000Z";
const later = "2026-06-14T00:01:00.000Z";

function createState(): WorkspaceState {
  return {
    scene: createScene({
      id: "scene-test",
      title: "demo",
      now,
      grid: { size: 16 },
      objects: [
        createObject({
          id: "rect-1",
          type: "demo-rectangle",
          x: 10,
          y: 10,
          data: { width: 80, height: 48 }
        }),
        createObject({
          id: "circle-1",
          type: "demo-circle",
          x: 100,
          y: 100,
          data: { width: 48, height: 48 }
        })
      ]
    }),
    selectedObjectIds: [],
    clipboard: [],
    past: [],
    future: []
  };
}

function createEmptyState(): WorkspaceState {
  return {
    scene: createScene({
      id: "scene-empty",
      title: "empty",
      now,
      grid: { size: 16 }
    }),
    selectedObjectIds: [],
    clipboard: [],
    past: [],
    future: []
  };
}

describe("workspace scene selection state", () => {
  it("addDemoObject places consecutive demo objects apart", () => {
    const first = addDemoObject(createEmptyState(), "demo-rectangle", {
      id: "demo-1",
      now: later
    });
    const second = addDemoObject(first, "demo-circle", {
      id: "demo-2",
      now: later
    });

    expect(second.scene.objects.at(-2)).toMatchObject({ id: "demo-1", x: 96 });
    expect(second.scene.objects.at(-1)).toMatchObject({ id: "demo-2", x: 256 });
  });

  it("adds and toggles a ten frame cell", () => {
    const added = addTenFrame(createEmptyState(), 5, {
      id: "frame-1",
      now: later
    });
    const toggled = toggleTenFrameCell(added, "frame-1", 7, { now: later });

    expect(added.scene.objects[0]).toMatchObject({
      id: "frame-1",
      type: "ten-frame",
      data: {
        filledCount: 5,
        fillMode: "left-to-right"
      }
    });
    expect(toggled.scene.objects[0]).toMatchObject({
      data: {
        filledCount: 6,
        fillMode: "manual",
        tokenPositions: [0, 1, 2, 3, 4, 7]
      }
    });
  });

  it("adds a fraction bar and selects it", () => {
    const state = addFractionBar(createEmptyState(), 1, 4, {
      id: "fraction-1-4",
      now: later
    });

    expect(state.scene.objects[0]).toMatchObject({
      id: "fraction-1-4",
      type: "fraction-bar",
      label: "1/4",
      data: {
        numerator: 1,
        denominator: 4
      }
    });
    expect(state.selectedObjectIds).toEqual(["fraction-1-4"]);
  });

  it("adds a fraction circle and selects it", () => {
    const state = addFractionCircle(createEmptyState(), 1, 3, {
      id: "circle-1-3",
      now: later
    });

    expect(state.scene.objects[0]).toMatchObject({
      id: "circle-1-3",
      type: "fraction-circle",
      label: "1/3",
      data: {
        numerator: 1,
        denominator: 3
      }
    });
    expect(state.selectedObjectIds).toEqual(["circle-1-3"]);
  });

  it("adds a geometry tile and selects it", () => {
    const state = addGeometryTile(createEmptyState(), "hexagon", {
      id: "geometry-hexagon",
      now: later
    });

    expect(state.scene.objects[0]).toMatchObject({
      id: "geometry-hexagon",
      type: "geometry-tile",
      label: "正六边形",
      data: {
        shape: "hexagon",
        sides: 6
      }
    });
    expect(state.selectedObjectIds).toEqual(["geometry-hexagon"]);
  });

  it("adds a measurement tool and selects it", () => {
    const state = addMeasurementTool(createEmptyState(), "ruler", {
      id: "ruler-1",
      now: later
    });

    expect(state.scene.objects[0]).toMatchObject({
      id: "ruler-1",
      type: "measurement-tool",
      label: "直尺",
      data: {
        kind: "ruler",
        unit: "grid",
        showTicks: true,
        showLabel: true
      }
    });
    expect(state.selectedObjectIds).toEqual(["ruler-1"]);
  });

  it("adds a balance scale and selects it", () => {
    const state = addBalanceScale(createEmptyState(), 3, 7, {
      id: "balance-3-7",
      now: later
    });

    expect(state.scene.objects[0]).toMatchObject({
      id: "balance-3-7",
      type: "balance-scale",
      label: "天平",
      data: {
        leftValue: 3,
        rightValue: 7
      }
    });
    expect(state.selectedObjectIds).toEqual(["balance-3-7"]);
  });

  it("adds an algebra tile and selects it", () => {
    const state = addAlgebraTile(createEmptyState(), "x2", "negative", {
      id: "algebra-x2",
      now: later
    });

    expect(state.scene.objects[0]).toMatchObject({
      id: "algebra-x2",
      type: "algebra-tile",
      label: "-x²",
      data: {
        tileKind: "x2",
        sign: "negative",
        showLabel: true
      }
    });
    expect(state.selectedObjectIds).toEqual(["algebra-x2"]);
  });

  it("sets selected balance side from selected number tiles", () => {
    const balance = createBalanceScale({
      id: "balance-1",
      leftValue: 0,
      rightValue: 0
    });
    const three = createNumberTile({ id: "number-3", value: 3 });
    const four = createNumberTile({ id: "number-4", value: 4 });
    const state: WorkspaceState = {
      ...createEmptyState(),
      scene: createScene({
        id: "scene-balance",
        title: "balance",
        now,
        grid: { size: 16 },
        objects: [balance, three, four]
      }),
      selectedObjectIds: ["balance-1", "number-3", "number-4"]
    };

    const leftSet = setSelectedBalanceScaleSideFromNumberTiles(state, "left", {
      now: later
    });
    const rightSet = setSelectedBalanceScaleSideFromNumberTiles(leftSet, "right", {
      now: later
    });

    expect(leftSet.scene.objects[0]).toMatchObject({
      data: { leftValue: 7, rightValue: 0 }
    });
    expect(rightSet.scene.objects[0]).toMatchObject({
      data: { leftValue: 7, rightValue: 7, tilt: 0 }
    });
  });

  it("adds an angle marker for the selected geometry tile rotation", () => {
    const added = addGeometryTile(createEmptyState(), "triangle", {
      id: "geometry-triangle",
      now: later
    });
    const rotated = updateSelectedObjects(added, { rotation: 45 }, { now: later });
    const marked = addSelectedGeometryRotationMarker(rotated, {
      id: "rotation-marker",
      now: later
    });

    expect(marked.scene.objects[1]).toMatchObject({
      id: "rotation-marker",
      type: "measurement-tool",
      label: "45°",
      data: {
        kind: "angleMarker",
        angle: 45
      }
    });
    expect(marked.selectedObjectIds).toEqual(["rotation-marker"]);
  });

  it("selectObject selects one object", () => {
    const state = selectObject(createState(), "rect-1");

    expect(state.selectedObjectIds).toEqual(["rect-1"]);
  });

  it("selectObjects selects multiple visible objects", () => {
    const state = selectObjects(createState(), ["rect-1", "circle-1"]);

    expect(state.selectedObjectIds).toEqual(["rect-1", "circle-1"]);
  });

  it("selectObjects filters missing and hidden objects", () => {
    const hidden = updateSelectedObjects(selectObject(createState(), "rect-1"), {
      visible: false
    });
    const state = selectObjects(hidden, ["rect-1", "circle-1", "missing"]);

    expect(state.selectedObjectIds).toEqual(["circle-1"]);
  });

  it("selectObjects clears selection for an empty list", () => {
    const selected = toggleSelectObject(selectObject(createState(), "rect-1"), "circle-1");

    expect(selectObjects(selected, []).selectedObjectIds).toEqual([]);
  });

  it("toggleSelectObject adds and removes objects from a multi-selection", () => {
    const selected = selectObject(createState(), "rect-1");
    const multiSelected = toggleSelectObject(selected, "circle-1");
    const removed = toggleSelectObject(multiSelected, "rect-1");

    expect(multiSelected.selectedObjectIds).toEqual(["rect-1", "circle-1"]);
    expect(removed.selectedObjectIds).toEqual(["circle-1"]);
  });

  it("clearSelection removes all selected objects", () => {
    const state = toggleSelectObject(selectObject(createState(), "rect-1"), "circle-1");

    expect(clearSelection(state).selectedObjectIds).toEqual([]);
  });

  it("moveObject moves and snaps an object to the grid", () => {
    const state = moveObject(createState(), "rect-1", { x: 13, y: 4 }, { now: later });
    const movedObject = state.scene.objects.find((object) => object.id === "rect-1");

    expect(movedObject).toMatchObject({ x: 16, y: 16 });
    expect(state.scene.updatedAt).toBe(later);
    expect(createState().scene.objects[0]).toMatchObject({ x: 10, y: 10 });
  });

  it("moveObjectsFromStart snaps from original drag positions", () => {
    const state = moveObjectsFromStart(
      createState(),
      ["rect-1"],
      { "rect-1": { x: 10, y: 10 } },
      { x: 42, y: 25 },
      { now: later }
    );
    const movedObject = state.scene.objects.find((object) => object.id === "rect-1");

    expect(movedObject).toMatchObject({ x: 48, y: 32 });
  });

  it("duplicateObject clones an object with a new id and selects it", () => {
    const state = duplicateObject(createState(), "rect-1", {
      id: "rect-copy",
      now: later
    });

    expect(state.scene.objects).toHaveLength(3);
    expect(state.scene.objects[2]).toMatchObject({
      id: "rect-copy",
      type: "demo-rectangle",
      x: 42,
      y: 42,
      data: { width: 80, height: 48 }
    });
    expect(state.selectedObjectIds).toEqual(["rect-copy"]);
    expect(state.scene.objects[2].data).not.toBe(state.scene.objects[0].data);
  });

  it("deleteSelectedObjects removes selected objects", () => {
    const selected = toggleSelectObject(selectObject(createState(), "rect-1"), "circle-1");
    const state = deleteSelectedObjects(selected, { now: later });

    expect(state.scene.objects).toEqual([]);
    expect(state.selectedObjectIds).toEqual([]);
    expect(state.scene.updatedAt).toBe(later);
  });

  it("undo restores the previous scene", () => {
    const moved = moveObject(createState(), "rect-1", { x: 30, y: 0 }, { now: later });
    const undone = undo(moved);

    expect(moved.scene.objects[0]).toMatchObject({ x: 48 });
    expect(undone.scene.objects[0]).toMatchObject({ x: 10 });
    expect(undone.future).toHaveLength(1);
  });

  it("redo reapplies an undone scene", () => {
    const moved = moveObject(createState(), "rect-1", { x: 30, y: 0 }, { now: later });
    const redone = redo(undo(moved));

    expect(redone.scene.objects[0]).toMatchObject({ x: 48 });
    expect(redone.past).toHaveLength(1);
  });

  it("limits history to 100 steps", () => {
    let state = createState();

    for (let index = 0; index < 105; index += 1) {
      state = moveObject(state, "rect-1", { x: 16, y: 0 }, { snap: false });
    }

    expect(state.past).toHaveLength(100);
  });

  it("locked object cannot be moved", () => {
    const locked = updateSelectedObjects(selectObject(createState(), "rect-1"), {
      locked: true
    });
    const moved = moveObject(locked, "rect-1", { x: 48, y: 48 }, { now: later });

    expect(moved.scene.objects[0]).toMatchObject({ x: 10, y: 10 });
  });

  it("updates selected object geometry without changing unselected objects", () => {
    const state = updateSelectedObjects(selectObject(createState(), "rect-1"), {
      x: 32,
      y: 48,
      rotation: 15,
      scaleX: 1.5,
      scaleY: 2
    });

    expect(state.scene.objects[0]).toMatchObject({
      id: "rect-1",
      x: 32,
      y: 48,
      rotation: 15,
      scaleX: 1.5,
      scaleY: 2
    });
    expect(state.scene.objects[1]).toMatchObject({
      id: "circle-1",
      x: 100,
      y: 100,
      rotation: 0,
      scaleX: 1,
      scaleY: 1
    });
  });

  it("hidden object cannot be selected", () => {
    const hidden = updateSelectedObjects(selectObject(createState(), "rect-1"), {
      visible: false
    });

    expect(selectObject(hidden, "rect-1").selectedObjectIds).toEqual([]);
    expect(toggleSelectObject(hidden, "rect-1").selectedObjectIds).toEqual([]);
  });

  it("copies and pastes selected objects with an offset", () => {
    const copied = copySelectedObjects(selectObject(createState(), "rect-1"));
    const pasted = pasteObjects(copied, { ids: ["rect-paste"], now: later });

    expect(pasted.scene.objects).toHaveLength(3);
    expect(pasted.scene.objects[2]).toMatchObject({
      id: "rect-paste",
      x: 42,
      y: 42
    });
    expect(pasted.selectedObjectIds).toEqual(["rect-paste"]);
  });
});
