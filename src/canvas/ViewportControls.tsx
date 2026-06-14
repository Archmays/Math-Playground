interface ViewportControlsProps {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetView: () => void;
}

export function ViewportControls({
  zoom,
  onZoomIn,
  onZoomOut,
  onResetView
}: ViewportControlsProps) {
  return (
    <div className="viewport-controls" aria-label="画布视图控制">
      <button type="button" onClick={onZoomOut} aria-label="缩小画布">
        −
      </button>
      <span>{Math.round(zoom * 100)}%</span>
      <button type="button" onClick={onZoomIn} aria-label="放大画布">
        +
      </button>
      <button type="button" onClick={onResetView} aria-label="重置画布视图">
        重置
      </button>
    </div>
  );
}
