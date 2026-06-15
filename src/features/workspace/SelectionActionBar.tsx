import type { CSSProperties } from "react";
import type { SceneObject } from "../../core/scene";
import type { EditableObjectPatch } from "./sceneState";

interface SelectionActionBarProps {
  selectedObjects: SceneObject[];
  style: CSSProperties;
  canDelete?: boolean;
  deleteDisabledReason?: string;
  onDuplicate: () => void;
  onDelete: () => void;
  onToggleLocked: () => void;
  onHide: () => void;
  onResetRotation: () => void;
  onToggleLabel: () => void;
  onBringForward: () => void;
  onSendBackward: () => void;
  onBringToFront: () => void;
  onSendToBack: () => void;
}

export function SelectionActionBar({
  selectedObjects,
  style,
  canDelete = true,
  deleteDisabledReason,
  onDuplicate,
  onDelete,
  onToggleLocked,
  onHide,
  onResetRotation,
  onToggleLabel,
  onBringForward,
  onSendBackward,
  onBringToFront,
  onSendToBack
}: SelectionActionBarProps) {
  if (selectedObjects.length === 0) {
    return null;
  }

  const allLocked = selectedObjects.every((object) => object.locked);
  const labelPatch =
    selectedObjects.length === 1 ? getLabelTogglePatch(selectedObjects[0]) : null;

  return (
    <div
      className="selection-action-bar"
      style={style}
      aria-label="选中对象快捷动作"
      onPointerDown={(event) => event.stopPropagation()}
    >
      <button type="button" onClick={onDuplicate}>
        复制
      </button>
      <button
        type="button"
        disabled={!canDelete}
        title={!canDelete ? deleteDisabledReason : undefined}
        onClick={onDelete}
      >
        删除
      </button>
      <button type="button" onClick={onToggleLocked}>
        {allLocked ? "解锁" : "锁定"}
      </button>
      <button type="button" onClick={onHide}>
        隐藏
      </button>
      <button type="button" onClick={onResetRotation}>
        旋转归零
      </button>
      {labelPatch ? (
        <button type="button" onClick={onToggleLabel}>
          {isObjectLabelVisible(selectedObjects[0]) ? "隐藏标签" : "显示标签"}
        </button>
      ) : null}
      <button type="button" onClick={onBringForward}>
        上移
      </button>
      <button type="button" onClick={onSendBackward}>
        下移
      </button>
      <button type="button" onClick={onBringToFront}>
        置顶
      </button>
      <button type="button" onClick={onSendToBack}>
        置底
      </button>
    </div>
  );
}

export function getLabelTogglePatch(
  object: SceneObject
): EditableObjectPatch | null {
  const data = object.data;

  if (typeof data.showLabel === "boolean") {
    return { data: { showLabel: !data.showLabel } };
  }

  if (typeof data.showLabels === "boolean") {
    return { data: { showLabels: !data.showLabels } };
  }

  if (typeof data.showValue === "boolean") {
    return { data: { showValue: !data.showValue } };
  }

  if (typeof data.showValues === "boolean") {
    return { data: { showValues: !data.showValues } };
  }

  return null;
}

function isObjectLabelVisible(object: SceneObject): boolean {
  const data = object.data;

  if (typeof data.showLabel === "boolean") {
    return data.showLabel;
  }

  if (typeof data.showLabels === "boolean") {
    return data.showLabels;
  }

  if (typeof data.showValue === "boolean") {
    return data.showValue;
  }

  if (typeof data.showValues === "boolean") {
    return data.showValues;
  }

  return false;
}
