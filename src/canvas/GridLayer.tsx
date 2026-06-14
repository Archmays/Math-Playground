import type { CanvasSize, Viewport } from "./canvasTypes";

interface GridLayerProps {
  size: CanvasSize;
  viewport: Viewport;
  gridSize: number;
  visible: boolean;
}

export function GridLayer({
  size,
  viewport,
  gridSize,
  visible
}: GridLayerProps) {
  if (!visible || size.width <= 0 || size.height <= 0 || gridSize <= 0) {
    return null;
  }

  const scaledGrid = gridSize * viewport.zoom;
  const offsetX = -((viewport.x * viewport.zoom) % scaledGrid);
  const offsetY = -((viewport.y * viewport.zoom) % scaledGrid);
  const verticalLines = createLinePositions(offsetX, size.width, scaledGrid);
  const horizontalLines = createLinePositions(offsetY, size.height, scaledGrid);

  return (
    <g className="grid-layer" aria-hidden="true">
      {verticalLines.map((x) => (
        <line
          key={`v-${x}`}
          className="grid-line"
          x1={x}
          y1={0}
          x2={x}
          y2={size.height}
        />
      ))}
      {horizontalLines.map((y) => (
        <line
          key={`h-${y}`}
          className="grid-line"
          x1={0}
          y1={y}
          x2={size.width}
          y2={y}
        />
      ))}
    </g>
  );
}

function createLinePositions(start: number, end: number, step: number): number[] {
  const positions: number[] = [];

  for (let current = start; current <= end; current += step) {
    if (current >= 0) {
      positions.push(Number(current.toFixed(3)));
    }
  }

  return positions;
}
