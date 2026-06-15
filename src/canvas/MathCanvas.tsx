import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent
} from "react";
import type { BoundingBox, SceneObject } from "../core/scene";
import { getBoundingBox, snapToGrid } from "../core/geometry";
import { useScene } from "../features/workspace/SceneProvider";
import { GridLayer } from "./GridLayer";
import { ObjectLayer } from "./ObjectLayer";
import {
  SelectionLayer,
  getSelectionBox,
  type SelectionHandle
} from "./SelectionLayer";
import { ViewportControls } from "./ViewportControls";
import {
  ZOOM_STEP,
  getObjectIdsIntersectingBox,
  getSvgPointFromEvent,
  normalizeRectFromPoints,
  screenToWorld,
  worldToScreen
} from "./canvasUtils";
import type { CanvasSize, Point } from "./canvasTypes";
import { snapRotationAngle } from "../manipulatives/geometryTiles/geometryTiles";
import {
  getFilledCellPositions,
  isTenFrameObject,
  TEN_FRAME_COLUMNS,
  TEN_FRAME_ROWS
} from "../manipulatives/tenFrames/tenFrames";
import { shouldKeepAspectRatioForObjects } from "./objectAspectRatio";
import {
  getObjectSnapAdjustment,
  type SnapGuide
} from "./objectSnapping";
import {
  SelectionActionBar,
  getLabelTogglePatch
} from "../features/workspace/SelectionActionBar";

const defaultCanvasSize: CanvasSize = {
  width: 960,
  height: 540
};
const MIN_OBJECT_SIZE = 24;
const MARQUEE_DRAG_THRESHOLD = 4;
const OBJECT_SNAP_DISTANCE = 18;

type DragState =
  | {
      mode: "pan";
      lastPointer: Point;
    }
  | {
      mode: "marquee";
      startPointer: Point;
      startScreenPointer: Point;
      currentPointer: Point;
      hasDragged: boolean;
    }
  | {
      mode: "objects";
      objectIds: string[];
      startPointer: Point;
      startPositions: Record<string, Point>;
      lastPointer: Point;
    }
  | {
      mode: "ten-frame-token";
      sourceObjectId: string;
      sourceCellIndex: number;
      startScreenPointer: Point;
      currentPointer: Point;
      hasDragged: boolean;
    }
  | {
      mode: "resize";
      handle: Exclude<SelectionHandle, "rotate">;
      startPointer: Point;
      startBox: NonNullable<ReturnType<typeof getSelectionBox>>;
      startObjects: Record<string, SceneObject>;
      objectIds: string[];
    }
  | {
      mode: "rotate";
      startPointer: Point;
      startBox: NonNullable<ReturnType<typeof getSelectionBox>>;
      startObjects: Record<string, SceneObject>;
      objectIds: string[];
    }
  | null;

export type ResizeDragState = Extract<DragState, { mode: "resize" }>;

interface MathCanvasProps {
  canDeleteSelectedObjects?: boolean;
  deleteDisabledReason?: string;
  onDeleteBlocked?: () => void;
}

export function MathCanvas({
  canDeleteSelectedObjects = true,
  deleteDisabledReason,
  onDeleteBlocked
}: MathCanvasProps = {}) {
  const {
    scene,
    selectedObjectIds,
    pan,
    zoomAt,
    resetViewport,
    selectObject,
    selectObjects,
    toggleSelectObject,
    clearSelection,
    moveObjects,
    transformObjects,
    toggleTenFrameCell,
    moveTenFrameToken,
    deleteSelectedObjects,
    duplicateSelectedObjects,
    copySelectedObjects,
    pasteObjects,
    updateSelectedObjects,
    undo,
    redo
  } = useScene();
  const shellRef = useRef<HTMLElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const dragStateRef = useRef<DragState>(null);
  const [canvasSize, setCanvasSize] = useState(defaultCanvasSize);
  const [marqueeBox, setMarqueeBox] = useState<BoundingBox | null>(null);
  const [snapGuides, setSnapGuides] = useState<SnapGuide[]>([]);
  const [tokenDragPreview, setTokenDragPreview] = useState<Point | null>(null);

  const selectedObjects = useMemo(
    () =>
      scene.objects.filter((object) => selectedObjectIds.includes(object.id)),
    [scene.objects, selectedObjectIds]
  );
  const selectionBox = useMemo(
    () => getSelectionBox(selectedObjects),
    [selectedObjects]
  );
  const selectionActionPosition = selectionBox
    ? worldToScreen(
        {
          x: selectionBox.x + selectionBox.width / 2,
          y: selectionBox.y
        },
        scene.viewport
      )
    : null;

  const deleteSelection = useCallback(() => {
    if (!canDeleteSelectedObjects) {
      onDeleteBlocked?.();
      return;
    }

    deleteSelectedObjects();
  }, [canDeleteSelectedObjects, deleteSelectedObjects, onDeleteBlocked]);

  useEffect(() => {
    const shell = shellRef.current;

    if (!shell) {
      return;
    }

    const updateSize = () => {
      const bounds = shell.getBoundingClientRect();
      setCanvasSize({
        width: Math.max(1, bounds.width),
        height: Math.max(1, bounds.height)
      });
    };

    updateSize();

    const observer = new ResizeObserver(updateSize);
    observer.observe(shell);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const svg = svgRef.current;

    if (!svg) {
      return;
    }

    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();
      zoomAt(
        getSvgPointFromEvent(event, svg),
        event.deltaY < 0 ? ZOOM_STEP : 1 / ZOOM_STEP
      );
    };

    svg.addEventListener("wheel", handleWheel, { passive: false });

    return () => svg.removeEventListener("wheel", handleWheel);
  }, [zoomAt]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Delete" || event.key === "Backspace") {
        if (isEditableTarget(event.target)) {
          return;
        }
        event.preventDefault();
        deleteSelection();
        return;
      }

      if (isEditableTarget(event.target)) {
        return;
      }

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "c") {
        event.preventDefault();
        copySelectedObjects();
        return;
      }

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "a") {
        event.preventDefault();
        selectObjects(
          scene.objects
            .filter((object) => object.visible)
            .map((object) => object.id)
        );
        return;
      }

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "v") {
        event.preventDefault();
        pasteObjects();
        return;
      }

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "d") {
        event.preventDefault();
        duplicateSelectedObjects();
        return;
      }

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z") {
        event.preventDefault();
        if (event.shiftKey) {
          redo();
        } else {
          undo();
        }
        return;
      }

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "y") {
        event.preventDefault();
        redo();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    copySelectedObjects,
    deleteSelection,
    duplicateSelectedObjects,
    pasteObjects,
    redo,
    scene.objects,
    selectObjects,
    undo
  ]);

  const zoomAtCanvasCenter = (zoomFactor: number) => {
    zoomAt(
      {
        x: canvasSize.width / 2,
        y: canvasSize.height / 2
      },
      zoomFactor
    );
  };

  const finishDrag = useCallback(() => {
    const dragState = dragStateRef.current;

    if (dragState?.mode === "marquee") {
      if (dragState.hasDragged) {
        selectObjects(
          getObjectIdsIntersectingBox(
            scene.objects,
            normalizeRectFromPoints(dragState.startPointer, dragState.currentPointer)
          )
        );
      } else {
        clearSelection();
      }
      setMarqueeBox(null);
    }

    setSnapGuides([]);

    if (dragState?.mode === "ten-frame-token") {
      if (dragState.hasDragged) {
        const target = getTenFrameCellAtPoint(
          scene.objects,
          dragState.currentPointer,
          dragState.sourceObjectId
        );

        if (target) {
          moveTenFrameToken(
            dragState.sourceObjectId,
            dragState.sourceCellIndex,
            target.objectId,
            target.cellIndex
          );
        }
      } else {
        toggleTenFrameCell(dragState.sourceObjectId, dragState.sourceCellIndex);
      }

      setTokenDragPreview(null);
    }

    dragStateRef.current = null;
  }, [
    clearSelection,
    moveTenFrameToken,
    scene.objects,
    selectObjects,
    toggleTenFrameCell
  ]);

  const cancelDrag = useCallback(() => {
    setMarqueeBox(null);
    setSnapGuides([]);
    setTokenDragPreview(null);
    dragStateRef.current = null;
  }, []);

  useEffect(() => {
    window.addEventListener("pointerup", finishDrag);
    window.addEventListener("mouseup", finishDrag);
    window.addEventListener("touchend", finishDrag);

    return () => {
      window.removeEventListener("pointerup", finishDrag);
      window.removeEventListener("mouseup", finishDrag);
      window.removeEventListener("touchend", finishDrag);
    };
  }, [finishDrag]);

  const handleObjectPointerDown = (
    event: PointerEvent<SVGGElement>,
    objectId: string
  ) => {
    if (event.button !== 0) {
      return;
    }

    event.stopPropagation();

    if (event.shiftKey) {
      toggleSelectObject(objectId);
      return;
    }

    const isAlreadySelected = selectedObjectIds.includes(objectId);
    const objectIds = isAlreadySelected ? selectedObjectIds : [objectId];
    const startPositions = Object.fromEntries(
      scene.objects
        .filter((object) => objectIds.includes(object.id))
        .map((object) => [object.id, { x: object.x, y: object.y }])
    );

    if (!isAlreadySelected) {
      selectObject(objectId);
    }

    dragStateRef.current = {
      mode: "objects",
      objectIds,
      startPointer: {
        x: event.clientX,
        y: event.clientY
      },
      startPositions,
      lastPointer: {
        x: event.clientX,
        y: event.clientY
      }
    };
    svgRef.current?.setPointerCapture(event.pointerId);
  };

  const handleTenFrameCellPointerDown = (
    event: PointerEvent<SVGElement>,
    objectId: string,
    cellIndex: number
  ) => {
    if (event.button !== 0) {
      return;
    }

    event.stopPropagation();
    selectObject(objectId);

    const object = scene.objects.find((item) => item.id === objectId);

    if (!object || !isTenFrameObject(object)) {
      return;
    }

    const isFilled = getFilledCellPositions(object.data).includes(cellIndex);

    if (!isFilled) {
      toggleTenFrameCell(objectId, cellIndex);
      return;
    }

    const svg = svgRef.current;

    if (!svg) {
      toggleTenFrameCell(objectId, cellIndex);
      return;
    }

    dragStateRef.current = {
      mode: "ten-frame-token",
      sourceObjectId: objectId,
      sourceCellIndex: cellIndex,
      startScreenPointer: {
        x: event.clientX,
        y: event.clientY
      },
      currentPointer: screenToWorld(
        getSvgPointFromEvent(event.nativeEvent, svg),
        scene.viewport
      ),
      hasDragged: false
    };
    svg.setPointerCapture(event.pointerId);
  };

  const handleSelectionHandlePointerDown = (
    event: PointerEvent<SVGElement>,
    handle: SelectionHandle
  ) => {
    const svg = svgRef.current;
    const box = getSelectionBox(selectedObjects);

    if (!svg || !box || selectedObjects.length === 0) {
      return;
    }

    event.stopPropagation();
    svg.setPointerCapture(event.pointerId);

    const startPointer = screenToWorld(getSvgPointFromEvent(event.nativeEvent, svg), scene.viewport);
    const startObjects = Object.fromEntries(
      selectedObjects.map((object) => [object.id, { ...object, data: { ...object.data } }])
    );

    dragStateRef.current =
      handle === "rotate"
        ? {
            mode: "rotate",
            startPointer,
            startBox: box,
            startObjects,
            objectIds: selectedObjects.map((object) => object.id)
          }
        : {
            mode: "resize",
            handle,
            startPointer,
            startBox: box,
            startObjects,
            objectIds: selectedObjects.map((object) => object.id)
          };
  };

  return (
    <section ref={shellRef} className="canvas-shell" aria-label={`${scene.title}画布`}>
      <svg
        ref={svgRef}
        className="math-canvas"
        role="application"
        aria-label="数学操作画布"
        tabIndex={0}
        viewBox={`0 0 ${canvasSize.width} ${canvasSize.height}`}
        onPointerDown={(event) => {
          if (event.button !== 0 || isObjectEvent(event.target)) {
            return;
          }

          const svg = svgRef.current;

          if (!svg) {
            return;
          }

          const startPointer = screenToWorld(
            getSvgPointFromEvent(event.nativeEvent, svg),
            scene.viewport
          );

          clearSelection();
          setMarqueeBox(null);
          dragStateRef.current = {
            mode: "marquee",
            startPointer,
            startScreenPointer: {
              x: event.clientX,
              y: event.clientY
            },
            currentPointer: startPointer,
            hasDragged: false
          };
          event.currentTarget.setPointerCapture(event.pointerId);
        }}
        onPointerMove={(event) => {
          const dragState = dragStateRef.current;

          if (!dragState) {
            return;
          }

          const nextPointer = {
            x: event.clientX,
            y: event.clientY
          };

          if (dragState.mode === "pan") {
            const screenDelta = {
              x: nextPointer.x - dragState.lastPointer.x,
              y: nextPointer.y - dragState.lastPointer.y
            };
            pan(screenDelta);
          } else if (dragState.mode === "marquee") {
            const svg = svgRef.current;

            if (!svg) {
              return;
            }

            const worldPointer = screenToWorld(
              getSvgPointFromEvent(event.nativeEvent, svg),
              scene.viewport
            );
            const screenDistance = Math.hypot(
              nextPointer.x - dragState.startScreenPointer.x,
              nextPointer.y - dragState.startScreenPointer.y
            );
            const hasDragged =
              dragState.hasDragged || screenDistance >= MARQUEE_DRAG_THRESHOLD;

            dragStateRef.current = {
              ...dragState,
              currentPointer: worldPointer,
              hasDragged
            };
            setMarqueeBox(
              hasDragged
                ? normalizeRectFromPoints(dragState.startPointer, worldPointer)
                : null
            );
          } else if (dragState.mode === "objects") {
            const rawDelta = {
              x: (nextPointer.x - dragState.startPointer.x) / scene.viewport.zoom,
              y: (nextPointer.y - dragState.startPointer.y) / scene.viewport.zoom
            };
            const movedObjects = getDraggedObjectsFromStart(
              scene.objects,
              dragState.objectIds,
              dragState.startPositions,
              rawDelta,
              scene.grid.snap,
              scene.grid.size
            );
            const snap = getObjectSnapAdjustment({
              movingObjects: movedObjects,
              sceneObjects: scene.objects,
              threshold: OBJECT_SNAP_DISTANCE
            });
            const snappedObjects = Object.fromEntries(
              movedObjects.map((object) => [
                object.id,
                {
                  ...object,
                  x: object.x + snap.delta.x,
                  y: object.y + snap.delta.y
                }
              ])
            );

            transformObjects(dragState.objectIds, snappedObjects);
            setSnapGuides(snap.guides);
          } else if (dragState.mode === "ten-frame-token") {
            const svg = svgRef.current;

            if (!svg) {
              return;
            }

            const worldPointer = screenToWorld(
              getSvgPointFromEvent(event.nativeEvent, svg),
              scene.viewport
            );
            const screenDistance = Math.hypot(
              nextPointer.x - dragState.startScreenPointer.x,
              nextPointer.y - dragState.startScreenPointer.y
            );
            const hasDragged =
              dragState.hasDragged || screenDistance >= MARQUEE_DRAG_THRESHOLD;

            dragStateRef.current = {
              ...dragState,
              currentPointer: worldPointer,
              hasDragged
            };
            setTokenDragPreview(hasDragged ? worldPointer : null);
          } else {
            const svg = svgRef.current;

            if (!svg) {
              return;
            }

            const worldPointer = screenToWorld(
              getSvgPointFromEvent(event.nativeEvent, svg),
              scene.viewport
            );

            if (dragState.mode === "resize") {
              transformObjects(
                dragState.objectIds,
                resizeObjectsFromDrag(dragState, worldPointer, event.shiftKey)
              );
            } else {
              transformObjects(
                dragState.objectIds,
                rotateObjectsFromDrag(dragState, worldPointer, event.altKey)
              );
            }
          }

          if (dragState.mode === "pan" || dragState.mode === "objects") {
            dragStateRef.current = {
              ...dragState,
              lastPointer: nextPointer
            };
          }
        }}
        onPointerUp={finishDrag}
        onLostPointerCapture={finishDrag}
        onPointerCancel={cancelDrag}
      >
        <rect
          className="canvas-background"
          width={canvasSize.width}
          height={canvasSize.height}
        />
        <GridLayer
          size={canvasSize}
          viewport={scene.viewport}
          gridSize={scene.grid.size}
          visible={scene.grid.visible}
        />
        <ObjectLayer
          objects={scene.objects}
          viewport={scene.viewport}
          selectedObjectIds={selectedObjectIds}
          onObjectPointerDown={handleObjectPointerDown}
          onTenFrameCellPointerDown={handleTenFrameCellPointerDown}
        />
        {snapGuides.length > 0 ? (
          <g
            className="snap-guide-layer"
            transform={`translate(${-scene.viewport.x * scene.viewport.zoom} ${-scene.viewport.y * scene.viewport.zoom}) scale(${scene.viewport.zoom})`}
            aria-hidden="true"
          >
            {snapGuides.map((guide, index) =>
              guide.orientation === "vertical" ? (
                <line
                  key={`${guide.orientation}-${guide.position}-${index}`}
                  className="snap-guide-line"
                  x1={guide.position}
                  x2={guide.position}
                  y1={guide.from}
                  y2={guide.to}
                />
              ) : (
                <line
                  key={`${guide.orientation}-${guide.position}-${index}`}
                  className="snap-guide-line"
                  x1={guide.from}
                  x2={guide.to}
                  y1={guide.position}
                  y2={guide.position}
                />
              )
            )}
          </g>
        ) : null}
        {tokenDragPreview ? (
          <g
            className="ten-frame-token-preview-layer"
            transform={`translate(${-scene.viewport.x * scene.viewport.zoom} ${-scene.viewport.y * scene.viewport.zoom}) scale(${scene.viewport.zoom})`}
            aria-hidden="true"
          >
            <circle
              className="ten-frame-token ten-frame-token-drag-preview"
              cx={tokenDragPreview.x}
              cy={tokenDragPreview.y}
              r={12}
            />
          </g>
        ) : null}
        {marqueeBox ? (
          <g
            className="marquee-layer"
            transform={`translate(${-scene.viewport.x * scene.viewport.zoom} ${-scene.viewport.y * scene.viewport.zoom}) scale(${scene.viewport.zoom})`}
            aria-hidden="true"
          >
            <rect
              className="marquee-selection"
              x={marqueeBox.x}
              y={marqueeBox.y}
              width={marqueeBox.width}
              height={marqueeBox.height}
            />
          </g>
        ) : null}
        <SelectionLayer
          selectedObjects={selectedObjects}
          viewport={scene.viewport}
          onHandlePointerDown={handleSelectionHandlePointerDown}
        />
      </svg>
      {selectionActionPosition ? (
        <SelectionActionBar
          selectedObjects={selectedObjects}
          style={{
            left: selectionActionPosition.x,
            top: selectionActionPosition.y
          }}
          onDuplicate={duplicateSelectedObjects}
          canDelete={canDeleteSelectedObjects}
          deleteDisabledReason={deleteDisabledReason}
          onDelete={deleteSelection}
          onToggleLocked={() =>
            updateSelectedObjects({
              locked: !selectedObjects.every((object) => object.locked)
            })
          }
          onHide={() => updateSelectedObjects({ visible: false })}
          onResetRotation={() => updateSelectedObjects({ rotation: 0 })}
          onToggleLabel={() => {
            if (selectedObjects.length !== 1) {
              return;
            }

            const patch = getLabelTogglePatch(selectedObjects[0]);

            if (patch) {
              updateSelectedObjects(patch);
            }
          }}
        />
      ) : null}
      <ViewportControls
        zoom={scene.viewport.zoom}
        onZoomIn={() => zoomAtCanvasCenter(ZOOM_STEP)}
        onZoomOut={() => zoomAtCanvasCenter(1 / ZOOM_STEP)}
        onResetView={resetViewport}
      />
    </section>
  );
}

function isObjectEvent(target: EventTarget): boolean {
  return target instanceof Element && Boolean(target.closest("[data-object-id]"));
}

function getDraggedObjectsFromStart(
  objects: SceneObject[],
  objectIds: string[],
  startPositions: Record<string, Point>,
  delta: Point,
  shouldSnap: boolean,
  gridSize: number
): SceneObject[] {
  const ids = new Set(objectIds);

  return objects.flatMap((object) => {
    const startPosition = startPositions[object.id];

    if (!ids.has(object.id) || object.locked || !startPosition) {
      return [];
    }

    const nextPoint = {
      x: startPosition.x + delta.x,
      y: startPosition.y + delta.y
    };
    const position = shouldSnap ? snapToGrid(nextPoint, gridSize) : nextPoint;

    return [
      {
        ...object,
        x: position.x,
        y: position.y
      }
    ];
  });
}

function getTenFrameCellAtPoint(
  objects: SceneObject[],
  point: Point,
  excludedObjectId: string
): { objectId: string; cellIndex: number } | null {
  for (let index = objects.length - 1; index >= 0; index -= 1) {
    const object = objects[index];

    if (
      object.id === excludedObjectId ||
      !object.visible ||
      object.locked ||
      !isTenFrameObject(object)
    ) {
      continue;
    }

    const box = getBoundingBox(object);

    if (
      point.x < box.x ||
      point.x > box.x + box.width ||
      point.y < box.y ||
      point.y > box.y + box.height
    ) {
      continue;
    }

    const cellWidth = box.width / TEN_FRAME_COLUMNS;
    const cellHeight = box.height / TEN_FRAME_ROWS;
    const column = Math.min(
      TEN_FRAME_COLUMNS - 1,
      Math.max(0, Math.floor((point.x - box.x) / cellWidth))
    );
    const row = Math.min(
      TEN_FRAME_ROWS - 1,
      Math.max(0, Math.floor((point.y - box.y) / cellHeight))
    );

    return {
      objectId: object.id,
      cellIndex: row * TEN_FRAME_COLUMNS + column
    };
  }

  return null;
}

export function resizeObjectsFromDrag(
  dragState: ResizeDragState,
  pointer: Point,
  keepRatio: boolean
): Record<string, SceneObject> {
  const shouldKeepRatio = shouldKeepAspectRatioForResize(
    Object.values(dragState.startObjects),
    keepRatio
  );
  const nextBox = getResizedBox(
    dragState.startBox,
    dragState.handle,
    pointer,
    shouldKeepRatio
  );
  const scaleX = nextBox.width / dragState.startBox.width;
  const scaleY = nextBox.height / dragState.startBox.height;

  return Object.fromEntries(
    dragState.objectIds.map((id) => {
      const object = dragState.startObjects[id];

      return [
        id,
        {
          ...object,
          x: nextBox.x + (object.x - dragState.startBox.x) * scaleX,
          y: nextBox.y + (object.y - dragState.startBox.y) * scaleY,
          scaleX: object.scaleX * scaleX,
          scaleY: object.scaleY * scaleY
        }
      ];
    })
  );
}

export function shouldKeepAspectRatioForResize(
  objects: SceneObject[],
  requestedKeepRatio: boolean
): boolean {
  return shouldKeepAspectRatioForObjects(objects, requestedKeepRatio);
}

function rotateObjectsFromDrag(
  dragState: Extract<DragState, { mode: "rotate" }>,
  pointer: Point,
  disableSnap: boolean
): Record<string, SceneObject> {
  const center = {
    x: dragState.startBox.x + dragState.startBox.width / 2,
    y: dragState.startBox.y + dragState.startBox.height / 2
  };
  const startAngle = getAngle(center, dragState.startPointer);
  const nextAngle = getAngle(center, pointer);
  const delta = nextAngle - startAngle;

  return Object.fromEntries(
    dragState.objectIds.map((id) => {
      const object = dragState.startObjects[id];
      return [
        id,
        {
          ...object,
          rotation: snapRotationAngle(object.rotation + delta, disableSnap)
        }
      ];
    })
  );
}

function getResizedBox(
  box: NonNullable<ReturnType<typeof getSelectionBox>>,
  handle: Exclude<SelectionHandle, "rotate">,
  pointer: Point,
  keepRatio: boolean
) {
  const right = box.x + box.width;
  const bottom = box.y + box.height;
  let x = handle === "nw" || handle === "sw" ? pointer.x : box.x;
  let y = handle === "nw" || handle === "ne" ? pointer.y : box.y;
  let width = handle === "nw" || handle === "sw" ? right - pointer.x : pointer.x - box.x;
  let height = handle === "nw" || handle === "ne" ? bottom - pointer.y : pointer.y - box.y;

  width = Math.max(MIN_OBJECT_SIZE, width);
  height = Math.max(MIN_OBJECT_SIZE, height);

  if (keepRatio && box.height > 0) {
    const ratio = box.width / box.height;

    if (width / height > ratio) {
      height = width / ratio;
    } else {
      width = height * ratio;
    }
  }

  if (handle === "nw" || handle === "sw") {
    x = right - width;
  }

  if (handle === "nw" || handle === "ne") {
    y = bottom - height;
  }

  return { x, y, width, height };
}

function getAngle(center: Point, point: Point): number {
  return (Math.atan2(point.y - center.y, point.x - center.x) * 180) / Math.PI;
}

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  if (target.closest("textarea, select, [contenteditable='true']")) {
    return true;
  }

  const input = target.closest("input");

  if (!(input instanceof HTMLInputElement)) {
    return false;
  }

  return !["button", "checkbox", "color", "file", "radio", "range", "reset", "submit"].includes(
    input.type
  );
}
