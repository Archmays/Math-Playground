import type { PointerEvent } from "react";
import { getBoundingBox } from "../core/geometry";
import type { SceneObject, Viewport } from "./canvasTypes";

export type SelectionHandle = "nw" | "ne" | "se" | "sw" | "rotate";

interface SelectionLayerProps {
  selectedObjects: SceneObject[];
  viewport: Viewport;
  onHandlePointerDown: (
    event: PointerEvent<SVGElement>,
    handle: SelectionHandle
  ) => void;
}

export function SelectionLayer({
  selectedObjects,
  viewport,
  onHandlePointerDown
}: SelectionLayerProps) {
  const box = getSelectionBox(selectedObjects);

  if (!box) {
    return null;
  }

  const handlePoints: Array<{ handle: SelectionHandle; x: number; y: number }> = [
    { handle: "nw", x: box.x, y: box.y },
    { handle: "ne", x: box.x + box.width, y: box.y },
    { handle: "se", x: box.x + box.width, y: box.y + box.height },
    { handle: "sw", x: box.x, y: box.y + box.height }
  ];
  const rotatePoint = {
    x: box.x + box.width / 2,
    y: box.y - 36
  };

  return (
    <g
      className="selection-layer"
      transform={`translate(${-viewport.x * viewport.zoom} ${-viewport.y * viewport.zoom}) scale(${viewport.zoom})`}
      aria-hidden="true"
    >
      <line
        className="rotation-handle-line"
        x1={box.x + box.width / 2}
        y1={box.y}
        x2={rotatePoint.x}
        y2={rotatePoint.y}
      />
      <circle
        className="rotation-handle"
        cx={rotatePoint.x}
        cy={rotatePoint.y}
        r={7}
        onPointerDown={(event) => onHandlePointerDown(event, "rotate")}
      />
      <rect
        className={
          selectedObjects.length > 1
            ? "selection-box multi-selection-box"
            : "selection-box"
        }
        x={box.x}
        y={box.y}
        width={box.width}
        height={box.height}
        rx={8}
      />
      {handlePoints.map((point) => (
        <rect
          key={point.handle}
          className={`resize-handle resize-handle-${point.handle}`}
          x={point.x - 6}
          y={point.y - 6}
          width={12}
          height={12}
          rx={3}
          onPointerDown={(event) => onHandlePointerDown(event, point.handle)}
        />
      ))}
    </g>
  );
}

export function getSelectionBox(objects: SceneObject[]) {
  if (objects.length === 0) {
    return null;
  }

  const boxes = objects.map(getBoundingBox);
  const minX = Math.min(...boxes.map((box) => box.x));
  const minY = Math.min(...boxes.map((box) => box.y));
  const maxX = Math.max(...boxes.map((box) => box.x + box.width));
  const maxY = Math.max(...boxes.map((box) => box.y + box.height));

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY
  };
}
