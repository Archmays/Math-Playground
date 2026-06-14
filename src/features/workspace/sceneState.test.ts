import { describe, expect, it } from "vitest";
import { createObject, createScene } from "../../core/scene";
import {
  clearSelection,
  copySelectedObjects,
  deleteSelectedObjects,
  addDemoObject,
  addTenFrame,
  duplicateObject,
  pasteObjects,
  redo,
  moveObject,
  moveObjectsFromStart,
  selectObject,
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

  it("selectObject selects one object", () => {
    const state = selectObject(createState(), "rect-1");

    expect(state.selectedObjectIds).toEqual(["rect-1"]);
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
