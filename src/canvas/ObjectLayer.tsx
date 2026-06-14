import type { PointerEvent } from "react";
import { getBoundingBox } from "../core/geometry";
import {
  isNumberTileObject,
  type NumberTileData
} from "../manipulatives/numberTiles/numberTiles";
import {
  getFilledCellPositions,
  isTenFrameObject,
  TEN_FRAME_COLUMNS,
  TEN_FRAME_ROWS,
  type TenFrameData
} from "../manipulatives/tenFrames/tenFrames";
import type { SceneObject, Viewport } from "./canvasTypes";

interface ObjectLayerProps {
  objects: SceneObject[];
  viewport: Viewport;
  selectedObjectIds: string[];
  onObjectPointerDown: (
    event: PointerEvent<SVGGElement>,
    objectId: string
  ) => void;
  onTenFrameCellPointerDown: (
    event: PointerEvent<SVGElement>,
    objectId: string,
    cellIndex: number
  ) => void;
}

export function ObjectLayer({
  objects,
  viewport,
  selectedObjectIds,
  onObjectPointerDown,
  onTenFrameCellPointerDown
}: ObjectLayerProps) {
  const visibleObjects = objects.filter((object) => object.visible);

  if (visibleObjects.length === 0) {
    return null;
  }

  return (
    <g
      className="object-layer"
      transform={`translate(${-viewport.x * viewport.zoom} ${-viewport.y * viewport.zoom}) scale(${viewport.zoom})`}
    >
      {visibleObjects.map((object) => {
        const box = getBoundingBox(object);

        return (
          <g
            key={object.id}
            className={
              selectedObjectIds.includes(object.id)
                ? "scene-object scene-object-selected"
                : "scene-object"
            }
            data-object-id={object.id}
            transform={`rotate(${object.rotation} ${box.x + box.width / 2} ${box.y + box.height / 2})`}
            onPointerDown={(event) => onObjectPointerDown(event, object.id)}
          >
            <DemoObject
              object={object}
              onTenFrameCellPointerDown={onTenFrameCellPointerDown}
            />
          </g>
        );
      })}
    </g>
  );
}

function DemoObject({
  object,
  onTenFrameCellPointerDown
}: {
  object: SceneObject;
  onTenFrameCellPointerDown: (
    event: PointerEvent<SVGElement>,
    objectId: string,
    cellIndex: number
  ) => void;
}) {
  const box = getBoundingBox(object);
  const fill = typeof object.data.fill === "string" ? object.data.fill : "#fff3b5";

  if (isNumberTileObject(object)) {
    return <NumberTileObject object={object} />;
  }

  if (isTenFrameObject(object)) {
    return (
      <TenFrameObject
        object={object}
        onCellPointerDown={onTenFrameCellPointerDown}
      />
    );
  }

  if (object.type === "demo-circle") {
    return (
      <>
        <ellipse
          className="scene-object-shape"
          cx={box.x + box.width / 2}
          cy={box.y + box.height / 2}
          rx={box.width / 2}
          ry={box.height / 2}
          fill={fill}
        />
        <ObjectLabel object={object} box={box} />
      </>
    );
  }

  if (object.type === "demo-text") {
    const text = typeof object.data.text === "string" ? object.data.text : object.label;

    return (
      <>
        <rect
          className="scene-object-text-hit-area"
          x={box.x}
          y={box.y}
          width={box.width}
          height={box.height}
          rx={8}
        />
        <text
          className="demo-text-object"
          x={box.x + box.width / 2}
          y={box.y + box.height / 2}
          dominantBaseline="middle"
          textAnchor="middle"
        >
          {text}
        </text>
      </>
    );
  }

  return (
    <>
      <rect
        className="scene-object-shape"
        x={box.x}
        y={box.y}
        width={box.width}
        height={box.height}
        rx={8}
        fill={fill}
      />
      <ObjectLabel object={object} box={box} />
    </>
  );
}

function TenFrameObject({
  object,
  onCellPointerDown
}: {
  object: SceneObject<TenFrameData>;
  onCellPointerDown: (
    event: PointerEvent<SVGElement>,
    objectId: string,
    cellIndex: number
  ) => void;
}) {
  const box = getBoundingBox(object);
  const cellWidth = box.width / TEN_FRAME_COLUMNS;
  const cellHeight = box.height / TEN_FRAME_ROWS;
  const filled = new Set(getFilledCellPositions(object.data));

  return (
    <>
      <rect
        className="ten-frame-background"
        x={box.x}
        y={box.y}
        width={box.width}
        height={box.height}
        rx={8}
      />
      {Array.from({ length: TEN_FRAME_ROWS * TEN_FRAME_COLUMNS }, (_value, index) => {
        const column = index % TEN_FRAME_COLUMNS;
        const row = Math.floor(index / TEN_FRAME_COLUMNS);
        const x = box.x + column * cellWidth;
        const y = box.y + row * cellHeight;
        const isFilled = filled.has(index);
        const tokenSize = Math.min(cellWidth, cellHeight) * 0.52;

        return (
          <g key={index}>
            <rect
              className="ten-frame-cell"
              x={x}
              y={y}
              width={cellWidth}
              height={cellHeight}
              onPointerDown={(event) =>
                onCellPointerDown(event, object.id, index)
              }
            />
            {isFilled && object.data.tokenShape === "square" ? (
              <rect
                className="ten-frame-token"
                x={x + cellWidth / 2 - tokenSize / 2}
                y={y + cellHeight / 2 - tokenSize / 2}
                width={tokenSize}
                height={tokenSize}
                rx={5}
              />
            ) : null}
            {isFilled && object.data.tokenShape === "circle" ? (
              <circle
                className="ten-frame-token"
                cx={x + cellWidth / 2}
                cy={y + cellHeight / 2}
                r={tokenSize / 2}
              />
            ) : null}
          </g>
        );
      })}
    </>
  );
}

function NumberTileObject({
  object
}: {
  object: SceneObject<NumberTileData>;
}) {
  const box = getBoundingBox(object);
  const palette = getNumberTilePalette(object.data.value, object.data.colorScheme);
  const valueText = String(object.data.value);
  const fontSize = Math.max(
    16,
    Math.min(34, (box.width - 14) / Math.max(valueText.length * 0.58, 1.4))
  );
  const hasCustomLabel =
    object.label.length > 0 && object.label !== String(object.data.value);

  return (
    <>
      <rect
        className="number-tile-shape"
        x={box.x}
        y={box.y}
        width={box.width}
        height={box.height}
        rx={10}
        fill={palette.fill}
        stroke={palette.stroke}
      />
      <rect
        className="number-tile-highlight"
        x={box.x + 5}
        y={box.y + 5}
        width={Math.max(0, box.width - 10)}
        height={Math.max(0, box.height * 0.32)}
        rx={7}
      />
      {object.data.showValue ? (
        <text
          className="number-tile-value"
          x={box.x + box.width / 2}
          y={box.y + box.height / 2 + (hasCustomLabel ? -4 : 0)}
          dominantBaseline="middle"
          textAnchor="middle"
          fontSize={fontSize}
        >
          {valueText}
        </text>
      ) : null}
      {hasCustomLabel ? (
        <text
          className="number-tile-label"
          x={box.x + box.width / 2}
          y={box.y + box.height - 10}
          dominantBaseline="middle"
          textAnchor="middle"
        >
          {object.label}
        </text>
      ) : null}
    </>
  );
}

function getNumberTilePalette(value: number, colorScheme: string) {
  if (colorScheme === "warm") {
    return { fill: "#ffe6b8", stroke: "#c47a1f" };
  }

  if (colorScheme === "cool") {
    return { fill: "#dff3ff", stroke: "#347f9c" };
  }

  if (value === 10) {
    return { fill: "#d8f4e4", stroke: "#3f8f62" };
  }

  if (value === 5) {
    return { fill: "#f3e4ff", stroke: "#7b5bb8" };
  }

  if (value < 0) {
    return { fill: "#ffe0df", stroke: "#bf5a53" };
  }

  return { fill: "#fff1bf", stroke: "#b78322" };
}

function ObjectLabel({
  object,
  box
}: {
  object: SceneObject;
  box: { x: number; y: number; width: number; height: number };
}) {
  if (!object.label) {
    return null;
  }

  return (
    <text
      className="scene-object-label"
      x={box.x + box.width / 2}
      y={box.y + box.height / 2}
      dominantBaseline="middle"
      textAnchor="middle"
    >
      {object.label}
    </text>
  );
}
