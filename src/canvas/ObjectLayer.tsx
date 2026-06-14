import type { PointerEvent } from "react";
import { ErrorBoundary } from "../components/ErrorBoundary";
import { getBoundingBox } from "../core/geometry";
import {
  getAlgebraTileLabel,
  isAlgebraTileObject,
  type AlgebraTileData
} from "../manipulatives/algebraTiles/algebraTiles";
import {
  formatBalanceRelation,
  isBalanceScaleObject,
  type BalanceScaleData
} from "../manipulatives/balanceScale/balanceScale";
import {
  formatFraction,
  isFractionBarObject,
  type FractionBarData
} from "../manipulatives/fractionBars/fractionBars";
import {
  getFractionCircleSectorPath,
  isFractionCircleObject,
  type FractionCircleData
} from "../manipulatives/fractionCircles/fractionCircles";
import {
  getGeometryTileLabel,
  isGeometryTileObject,
  type GeometryTileData
} from "../manipulatives/geometryTiles/geometryTiles";
import {
  formatDegreeLabel,
  generateRulerTicks,
  isMeasurementToolObject,
  type MeasurementToolData
} from "../manipulatives/measurementTools/measurementTools";
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
      {visibleObjects.map((object) => (
        <ErrorBoundary
          key={object.id}
          fallback={<ObjectRenderFallback objectId={object.id} />}
        >
          <ObjectNode
            object={object}
            isSelected={selectedObjectIds.includes(object.id)}
            onObjectPointerDown={onObjectPointerDown}
            onTenFrameCellPointerDown={onTenFrameCellPointerDown}
          />
        </ErrorBoundary>
      ))}
    </g>
  );
}

function ObjectNode({
  object,
  isSelected,
  onObjectPointerDown,
  onTenFrameCellPointerDown
}: {
  object: SceneObject;
  isSelected: boolean;
  onObjectPointerDown: (
    event: PointerEvent<SVGGElement>,
    objectId: string
  ) => void;
  onTenFrameCellPointerDown: (
    event: PointerEvent<SVGElement>,
    objectId: string,
    cellIndex: number
  ) => void;
}) {
  const box = getBoundingBox(object);

  return (
    <g
      className={isSelected ? "scene-object scene-object-selected" : "scene-object"}
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
}

function ObjectRenderFallback({ objectId }: { objectId: string }) {
  return (
    <g className="object-render-fallback" role="img" aria-label="教具显示失败">
      <rect x={16} y={16} width={168} height={44} rx={8} />
      <text x={28} y={42}>
        教具显示失败：{objectId}
      </text>
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

  if (isFractionBarObject(object)) {
    return <FractionBarObject object={object} />;
  }

  if (isFractionCircleObject(object)) {
    return <FractionCircleObject object={object} />;
  }

  if (isAlgebraTileObject(object)) {
    return <AlgebraTileObject object={object} />;
  }

  if (isGeometryTileObject(object)) {
    return <GeometryTileObject object={object} />;
  }

  if (isBalanceScaleObject(object)) {
    return <BalanceScaleObject object={object} />;
  }

  if (isMeasurementToolObject(object)) {
    return <MeasurementToolObject object={object} />;
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

function AlgebraTileObject({
  object
}: {
  object: SceneObject<AlgebraTileData>;
}) {
  const box = getBoundingBox(object);
  const palette =
    object.data.sign === "positive"
      ? { fill: "#d9f2ff", stroke: "#3b82a0" }
      : { fill: "#ffe0e0", stroke: "#b45454" };
  const label = object.label || getAlgebraTileLabel(object.data.tileKind, object.data.sign);
  const fontSize = Math.max(14, Math.min(24, Math.min(box.width, box.height) * 0.42));

  return (
    <>
      <rect
        className="algebra-tile-shape"
        x={box.x}
        y={box.y}
        width={box.width}
        height={box.height}
        rx={object.data.tileKind === "unit" ? 4 : 6}
        fill={palette.fill}
        stroke={palette.stroke}
      />
      <line
        className="algebra-tile-highlight"
        x1={box.x + 6}
        y1={box.y + 6}
        x2={box.x + box.width - 6}
        y2={box.y + 6}
      />
      {object.data.showLabel ? (
        <text
          className="algebra-tile-label"
          x={box.x + box.width / 2}
          y={box.y + box.height / 2}
          dominantBaseline="middle"
          textAnchor="middle"
          fontSize={fontSize}
        >
          {label}
        </text>
      ) : null}
    </>
  );
}

function BalanceScaleObject({
  object
}: {
  object: SceneObject<BalanceScaleData>;
}) {
  const box = getBoundingBox(object);
  const centerX = box.x + box.width / 2;
  const beamY = box.y + box.height * 0.38;
  const baseY = box.y + box.height - 12;
  const halfBeam = box.width * 0.38;
  const angle = (object.data.tilt * Math.PI) / 180;
  const leftBeam = {
    x: centerX - halfBeam * Math.cos(angle),
    y: beamY - halfBeam * Math.sin(angle)
  };
  const rightBeam = {
    x: centerX + halfBeam * Math.cos(angle),
    y: beamY + halfBeam * Math.sin(angle)
  };
  const panWidth = Math.max(46, box.width * 0.24);
  const panHeight = Math.max(12, box.height * 0.08);
  const chainLength = box.height * 0.2;
  const leftPanY = leftBeam.y + chainLength;
  const rightPanY = rightBeam.y + chainLength;

  return (
    <>
      <line
        className="balance-scale-stand"
        x1={centerX}
        y1={beamY}
        x2={centerX}
        y2={baseY}
      />
      <path
        className="balance-scale-base"
        d={`M ${centerX - 38} ${baseY} L ${centerX} ${beamY + 24} L ${centerX + 38} ${baseY} Z`}
      />
      <line
        className="balance-scale-beam"
        x1={leftBeam.x}
        y1={leftBeam.y}
        x2={rightBeam.x}
        y2={rightBeam.y}
      />
      <circle className="balance-scale-pivot" cx={centerX} cy={beamY} r={6} />
      <BalancePan
        x={leftBeam.x}
        y={leftPanY}
        chainTopY={leftBeam.y}
        width={panWidth}
        height={panHeight}
        value={object.data.leftValue}
        showValue={object.data.showValues}
      />
      <BalancePan
        x={rightBeam.x}
        y={rightPanY}
        chainTopY={rightBeam.y}
        width={panWidth}
        height={panHeight}
        value={object.data.rightValue}
        showValue={object.data.showValues}
      />
      {object.data.showValues ? (
        <text
          className="balance-scale-relation"
          x={centerX}
          y={box.y + 18}
          dominantBaseline="middle"
          textAnchor="middle"
        >
          {formatBalanceRelation(object.data.leftValue, object.data.rightValue)}
        </text>
      ) : null}
    </>
  );
}

function BalancePan({
  x,
  y,
  chainTopY,
  width,
  height,
  value,
  showValue
}: {
  x: number;
  y: number;
  chainTopY: number;
  width: number;
  height: number;
  value: number;
  showValue: boolean;
}) {
  return (
    <g>
      <line className="balance-scale-chain" x1={x} y1={chainTopY} x2={x} y2={y} />
      <ellipse
        className="balance-scale-pan"
        cx={x}
        cy={y}
        rx={width / 2}
        ry={height}
      />
      {showValue ? (
        <text
          className="balance-scale-value"
          x={x}
          y={y - height - 8}
          dominantBaseline="middle"
          textAnchor="middle"
        >
          {value}
        </text>
      ) : null}
    </g>
  );
}

function MeasurementToolObject({
  object
}: {
  object: SceneObject<MeasurementToolData>;
}) {
  const box = getBoundingBox(object);

  switch (object.data.kind) {
    case "ruler":
      return <RulerObject object={object} box={box} />;
    case "protractor":
      return <ProtractorObject object={object} box={box} />;
    case "angleMarker":
      return <AngleMarkerObject object={object} box={box} />;
    case "lineSegment":
      return <LineSegmentObject object={object} box={box} />;
  }
}

function RulerObject({
  object,
  box
}: {
  object: SceneObject<MeasurementToolData>;
  box: { x: number; y: number; width: number; height: number };
}) {
  const ticks = object.data.showTicks
    ? generateRulerTicks(object.data.length)
    : [];

  return (
    <>
      <rect
        className="measurement-ruler-body"
        x={box.x}
        y={box.y}
        width={box.width}
        height={box.height}
        rx={4}
      />
      {ticks.map((tick) => {
        const x = box.x + tick.offset * object.scaleX;
        const tickHeight = tick.major ? box.height * 0.72 : box.height * 0.44;

        return (
          <g key={tick.offset}>
            <line
              className="measurement-ruler-tick"
              x1={x}
              y1={box.y}
              x2={x}
              y2={box.y + tickHeight}
            />
            {tick.label ? (
              <text
                className="measurement-ruler-number"
                x={x + 3}
                y={box.y + box.height - 7}
              >
                {tick.label}
              </text>
            ) : null}
          </g>
        );
      })}
      {object.data.showLabel ? (
        <text
          className="measurement-tool-label"
          x={box.x + box.width / 2}
          y={box.y + box.height + 16}
          dominantBaseline="middle"
          textAnchor="middle"
        >
          {formatLengthLabel(object.data.length, object.data.unit)}
        </text>
      ) : null}
    </>
  );
}

function ProtractorObject({
  object,
  box
}: {
  object: SceneObject<MeasurementToolData>;
  box: { x: number; y: number; width: number; height: number };
}) {
  const center = { x: box.x + box.width / 2, y: box.y + box.height - 8 };
  const radius = Math.min(box.width / 2 - 8, box.height - 16);
  const ticks = Array.from({ length: 19 }, (_value, index) => index * 10);

  return (
    <>
      <path
        className="measurement-protractor-body"
        d={`M ${center.x - radius} ${center.y} A ${radius} ${radius} 0 0 1 ${center.x + radius} ${center.y} L ${center.x - radius} ${center.y}`}
      />
      <line
        className="measurement-protractor-baseline"
        x1={center.x - radius}
        y1={center.y}
        x2={center.x + radius}
        y2={center.y}
      />
      {object.data.showTicks
        ? ticks.map((angle) => {
            const innerRadius = radius - (angle % 30 === 0 ? 16 : 10);
            const outer = pointOnCircle(center.x, center.y, radius, 180 - angle);
            const inner = pointOnCircle(
              center.x,
              center.y,
              innerRadius,
              180 - angle
            );
            const labelPoint = pointOnCircle(
              center.x,
              center.y,
              radius - 28,
              180 - angle
            );

            return (
              <g key={angle}>
                <line
                  className="measurement-protractor-tick"
                  x1={outer.x}
                  y1={outer.y}
                  x2={inner.x}
                  y2={inner.y}
                />
                {angle % 30 === 0 ? (
                  <text
                    className="measurement-protractor-number"
                    x={labelPoint.x}
                    y={labelPoint.y}
                    dominantBaseline="middle"
                    textAnchor="middle"
                  >
                    {angle}
                  </text>
                ) : null}
              </g>
            );
          })
        : null}
      {object.data.showLabel ? (
        <text
          className="measurement-tool-label"
          x={center.x}
          y={center.y - radius / 2}
          dominantBaseline="middle"
          textAnchor="middle"
        >
          量角器
        </text>
      ) : null}
    </>
  );
}

function AngleMarkerObject({
  object,
  box
}: {
  object: SceneObject<MeasurementToolData>;
  box: { x: number; y: number; width: number; height: number };
}) {
  const center = { x: box.x + 16, y: box.y + box.height - 16 };
  const radius = Math.min(box.width, box.height) - 32;
  const angle = Math.min(180, object.data.angle);
  const end = pointOnCircle(center.x, center.y, radius, -angle);
  const largeArc = angle > 180 ? 1 : 0;
  const labelPoint = pointOnCircle(center.x, center.y, radius + 16, -angle / 2);

  return (
    <>
      <line
        className="measurement-angle-ray"
        x1={center.x}
        y1={center.y}
        x2={center.x + radius}
        y2={center.y}
      />
      <line
        className="measurement-angle-ray"
        x1={center.x}
        y1={center.y}
        x2={end.x}
        y2={end.y}
      />
      <path
        className="measurement-angle-arc"
        d={`M ${center.x + radius} ${center.y} A ${radius} ${radius} 0 ${largeArc} 0 ${end.x} ${end.y}`}
      />
      {object.data.showLabel ? (
        <text
          className="measurement-tool-label"
          x={labelPoint.x}
          y={labelPoint.y}
          dominantBaseline="middle"
          textAnchor="middle"
        >
          {formatDegreeLabel(object.data.angle)}
        </text>
      ) : null}
    </>
  );
}

function LineSegmentObject({
  object,
  box
}: {
  object: SceneObject<MeasurementToolData>;
  box: { x: number; y: number; width: number; height: number };
}) {
  const y = box.y + box.height / 2;

  return (
    <>
      <line
        className="measurement-line-segment"
        x1={box.x}
        y1={y}
        x2={box.x + box.width}
        y2={y}
      />
      <circle className="measurement-line-endpoint" cx={box.x} cy={y} r={4} />
      <circle
        className="measurement-line-endpoint"
        cx={box.x + box.width}
        cy={y}
        r={4}
      />
      {object.data.showLabel ? (
        <text
          className="measurement-tool-label"
          x={box.x + box.width / 2}
          y={box.y + box.height}
          dominantBaseline="middle"
          textAnchor="middle"
        >
          {formatLengthLabel(object.data.length, object.data.unit)}
        </text>
      ) : null}
    </>
  );
}

function GeometryTileObject({
  object
}: {
  object: SceneObject<GeometryTileData>;
}) {
  const box = getBoundingBox(object);
  const palette = getGeometryTilePalette(object.data.colorScheme);
  const vertices = getGeometryTileVertices(object.data.shape, box);
  const label = object.label || getGeometryTileLabel(object.data.shape);
  const fontSize = Math.max(12, Math.min(20, Math.min(box.width, box.height) * 0.26));

  return (
    <>
      {object.data.shape === "circle" ? (
        <ellipse
          className="geometry-tile-shape"
          cx={box.x + box.width / 2}
          cy={box.y + box.height / 2}
          rx={box.width / 2}
          ry={box.height / 2}
          fill={palette.fill}
          stroke={palette.stroke}
        />
      ) : (
        <polygon
          className="geometry-tile-shape"
          points={vertices.map((point) => `${point.x},${point.y}`).join(" ")}
          fill={palette.fill}
          stroke={palette.stroke}
        />
      )}
      {object.data.showVertices && object.data.shape !== "circle"
        ? vertices.map((point, index) => (
            <circle
              key={index}
              className="geometry-tile-vertex"
              cx={point.x}
              cy={point.y}
              r={3.5}
            />
          ))
        : null}
      {object.data.showLabel ? (
        <text
          className="geometry-tile-label"
          x={box.x + box.width / 2}
          y={box.y + box.height / 2}
          dominantBaseline="middle"
          textAnchor="middle"
          fontSize={fontSize}
        >
          {label}
        </text>
      ) : null}
    </>
  );
}

function FractionCircleObject({
  object
}: {
  object: SceneObject<FractionCircleData>;
}) {
  const box = getBoundingBox(object);
  const radius = Math.min(box.width, box.height) / 2;
  const centerX = box.x + box.width / 2;
  const centerY = box.y + box.height / 2;
  const sectorAngle = 360 / Math.max(1, object.data.denominator);
  const palette = getFractionCirclePalette(object.data.colorScheme);
  const label = formatFraction(object.data.numerator, object.data.denominator);
  const fontSize = Math.max(14, Math.min(24, radius * 0.38));

  return (
    <>
      <circle
        className="fraction-circle-background"
        cx={centerX}
        cy={centerY}
        r={radius}
      />
      {object.data.denominator === 1 && object.data.numerator === 1 ? (
        <circle
          className="fraction-circle-fill"
          cx={centerX}
          cy={centerY}
          r={radius}
          fill={palette.fill}
        />
      ) : (
        Array.from({ length: object.data.numerator }, (_value, index) => {
          const startAngle = object.data.startAngle + index * sectorAngle;

          return (
            <path
              key={index}
              className="fraction-circle-fill"
              d={getFractionCircleSectorPath({
                centerX,
                centerY,
                radius,
                startAngle,
                endAngle: startAngle + sectorAngle
              })}
              fill={palette.fill}
            />
          );
        })
      )}
      {object.data.showSectorLines
        ? Array.from({ length: object.data.denominator }, (_value, index) => {
            const angle = object.data.startAngle + index * sectorAngle;
            const end = pointOnCircle(centerX, centerY, radius, angle);

            return (
              <line
                key={index}
                className="fraction-circle-sector-line"
                x1={centerX}
                y1={centerY}
                x2={end.x}
                y2={end.y}
              />
            );
          })
        : null}
      <circle
        className="fraction-circle-outline"
        cx={centerX}
        cy={centerY}
        r={radius}
      />
      {object.data.showLabels ? (
        <text
          className="fraction-circle-label"
          x={centerX}
          y={centerY}
          dominantBaseline="middle"
          textAnchor="middle"
          fontSize={fontSize}
        >
          {label}
        </text>
      ) : null}
    </>
  );
}

function FractionBarObject({
  object
}: {
  object: SceneObject<FractionBarData>;
}) {
  const box = getBoundingBox(object);
  const denominator = Math.max(1, object.data.denominator);
  const segmentWidth = box.width / denominator;
  const palette = getFractionBarPalette(object.data.colorScheme);
  const label = formatFraction(object.data.numerator, object.data.denominator);
  const fontSize = Math.max(14, Math.min(22, box.height * 0.46));

  return (
    <>
      <defs>
        <clipPath id={`${object.id}-fraction-clip`}>
          <rect
            x={box.x}
            y={box.y}
            width={box.width}
            height={box.height}
            rx={8}
          />
        </clipPath>
      </defs>
      <rect
        className="fraction-bar-background"
        x={box.x}
        y={box.y}
        width={box.width}
        height={box.height}
        rx={8}
      />
      <g clipPath={`url(#${object.id}-fraction-clip)`}>
        {Array.from({ length: object.data.numerator }, (_value, index) => (
          <rect
            key={index}
            className="fraction-bar-fill"
            x={box.x + index * segmentWidth}
            y={box.y}
            width={segmentWidth}
            height={box.height}
            fill={palette.fill}
          />
        ))}
      </g>
      {object.data.showTicks
        ? Array.from({ length: denominator - 1 }, (_value, index) => {
            const tickX = box.x + (index + 1) * segmentWidth;

            return (
              <line
                key={index}
                className="fraction-bar-tick"
                x1={tickX}
                y1={box.y}
                x2={tickX}
                y2={box.y + box.height}
              />
            );
          })
        : null}
      <rect
        className="fraction-bar-outline"
        x={box.x}
        y={box.y}
        width={box.width}
        height={box.height}
        rx={8}
      />
      {object.data.showLabels ? (
        <text
          className="fraction-bar-label"
          x={box.x + box.width / 2}
          y={box.y + box.height / 2}
          dominantBaseline="middle"
          textAnchor="middle"
          fontSize={fontSize}
        >
          {label}
        </text>
      ) : null}
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

function getFractionBarPalette(colorScheme: string) {
  if (colorScheme === "warm") {
    return { fill: "#f6c177" };
  }

  if (colorScheme === "cool") {
    return { fill: "#7db9d6" };
  }

  return { fill: "#8fcfae" };
}

function getFractionCirclePalette(colorScheme: string) {
  if (colorScheme === "warm") {
    return { fill: "#f5b971" };
  }

  if (colorScheme === "cool") {
    return { fill: "#83c5d9" };
  }

  return { fill: "#9ad6b2" };
}

function getGeometryTilePalette(colorScheme: string) {
  if (colorScheme === "warm") {
    return { fill: "#ffe2b8", stroke: "#b46a16" };
  }

  if (colorScheme === "cool") {
    return { fill: "#d9f0fb", stroke: "#28758f" };
  }

  return { fill: "#e9f7df", stroke: "#5d8f35" };
}

function getGeometryTileVertices(
  shape: GeometryTileData["shape"],
  box: { x: number; y: number; width: number; height: number }
) {
  const left = box.x;
  const top = box.y;
  const right = box.x + box.width;
  const bottom = box.y + box.height;
  const centerX = box.x + box.width / 2;
  const centerY = box.y + box.height / 2;

  switch (shape) {
    case "triangle":
      return [
        { x: centerX, y: top },
        { x: right, y: bottom },
        { x: left, y: bottom }
      ];
    case "hexagon":
      return Array.from({ length: 6 }, (_value, index) => {
        const angle = (Math.PI / 180) * (60 * index);

        return {
          x: centerX + (box.width / 2) * Math.cos(angle),
          y: centerY + (box.height / 2) * Math.sin(angle)
        };
      });
    case "trapezoid":
      return [
        { x: left + box.width * 0.25, y: top },
        { x: right - box.width * 0.25, y: top },
        { x: right, y: bottom },
        { x: left, y: bottom }
      ];
    case "parallelogram":
      return [
        { x: left + box.width * 0.24, y: top },
        { x: right, y: top },
        { x: right - box.width * 0.24, y: bottom },
        { x: left, y: bottom }
      ];
    case "circle":
    case "rectangle":
    case "square":
      return [
        { x: left, y: top },
        { x: right, y: top },
        { x: right, y: bottom },
        { x: left, y: bottom }
      ];
  }
}

function formatLengthLabel(length: number, unit: string): string {
  if (unit === "cm") {
    return `${length} cm`;
  }

  if (unit === "custom") {
    return `${length}`;
  }

  return `${length} grid`;
}

function pointOnCircle(
  centerX: number,
  centerY: number,
  radius: number,
  angle: number
) {
  const radians = (angle * Math.PI) / 180;

  return {
    x: centerX + radius * Math.cos(radians),
    y: centerY + radius * Math.sin(radians)
  };
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
