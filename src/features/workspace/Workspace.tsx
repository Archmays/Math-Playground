import { useEffect, useRef, useState } from "react";
import { MathCanvas } from "../../canvas/MathCanvas";
import { AppHeader } from "../../components/AppHeader";
import type { SceneObject } from "../../core/scene";
import { deserializeScene, serializeScene } from "../../core/sceneSerialization";
import {
  getNumberTileDataForSize,
  isNumberTileObject,
  isNumberTileSize,
  updateNumberTileValue,
  type NumberTileSize
} from "../../manipulatives/numberTiles/numberTiles";
import {
  countSelectedMathValue,
  getFilledCellPositions,
  isTenFrameFillMode,
  isTenFrameObject,
  isTenFrameTokenShape,
  setFilledCount,
  type TenFrameFillMode,
  type TenFrameTokenShape
} from "../../manipulatives/tenFrames/tenFrames";
import { useScene } from "./SceneProvider";
import type { EditableObjectPatch } from "./sceneState";
import {
  LOCAL_SCENE_STORAGE_KEY,
  exportScenePng,
  exportSceneSvg,
  saveSceneJson
} from "./sceneFileUtils";

const AUTO_SAVE_INTERVAL_MS = 5000;
const MIN_MANUAL_SCALE = 0.1;

export function Workspace() {
  const {
    scene,
    selectedObjectIds,
    addDemoObject,
    addNumberTile,
    addTenFrame,
    updateSelectedObjects,
    loadScene
  } = useScene();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const latestSceneRef = useRef(scene);
  const [fileMessage, setFileMessage] = useState("");
  const [autoSaveReady, setAutoSaveReady] = useState(false);
  const selectedObjects = scene.objects.filter((object) =>
    selectedObjectIds.includes(object.id)
  );
  const selectedObject = selectedObjects.length === 1 ? selectedObjects[0] : null;
  const selectedMathObjectCount = selectedObjects.filter(
    (object) => isNumberTileObject(object) || isTenFrameObject(object)
  ).length;
  const selectedMathValue = countSelectedMathValue(
    scene.objects,
    selectedObjectIds
  );

  useEffect(() => {
    latestSceneRef.current = scene;
  }, [scene]);

  useEffect(() => {
    const savedScene = window.localStorage.getItem(LOCAL_SCENE_STORAGE_KEY);

    if (!savedScene) {
      setAutoSaveReady(true);
      return;
    }

    const result = deserializeScene(savedScene);

    if (!result.ok) {
      setFileMessage(result.error);
      setAutoSaveReady(true);
      return;
    }

    if (window.confirm("检测到上次自动保存的画布，是否恢复？")) {
      loadScene(result.scene);
      setFileMessage("已恢复上次自动保存。");
    }

    setAutoSaveReady(true);
  }, [loadScene]);

  useEffect(() => {
    if (!autoSaveReady) {
      return;
    }

    const intervalId = window.setInterval(() => {
      window.localStorage.setItem(
        LOCAL_SCENE_STORAGE_KEY,
        serializeScene(latestSceneRef.current)
      );
    }, AUTO_SAVE_INTERVAL_MS);

    return () => window.clearInterval(intervalId);
  }, [autoSaveReady]);

  const handleLoadJson = async (file: File) => {
    const result = deserializeScene(await file.text());

    if (!result.ok) {
      setFileMessage(result.error);
      return;
    }

    loadScene(result.scene);
    setFileMessage("已读取 JSON 画布文件。");
  };

  const clearLocalSave = () => {
    window.localStorage.removeItem(LOCAL_SCENE_STORAGE_KEY);
    setFileMessage("已清空本地自动保存。");
  };

  const addCustomNumberTile = () => {
    const input = window.prompt("请输入数字方块的数值", "3");

    if (input === null) {
      return;
    }

    const value = Number(input.trim());

    if (!Number.isFinite(value)) {
      setFileMessage("请输入有效数字。");
      return;
    }

    addNumberTile(value);
  };

  return (
    <main className="workspace">
      <AppHeader />
      <aside className="tool-panel" aria-label="工具栏">
        <button
          type="button"
          className="tool-button"
          onClick={() => addNumberTile(1)}
        >
          数字 1
        </button>
        <button
          type="button"
          className="tool-button"
          onClick={() => addNumberTile(5)}
        >
          数字 5
        </button>
        <button
          type="button"
          className="tool-button"
          onClick={() => addNumberTile(10)}
        >
          数字 10
        </button>
        <button
          type="button"
          className="tool-button"
          onClick={addCustomNumberTile}
        >
          自定义数字
        </button>
        <div className="tool-divider" />
        <button
          type="button"
          className="tool-button"
          onClick={() => addTenFrame(0)}
        >
          空十格阵
        </button>
        <button
          type="button"
          className="tool-button"
          onClick={() => addTenFrame(5)}
        >
          5 点十格阵
        </button>
        <button
          type="button"
          className="tool-button"
          onClick={() => addTenFrame(10)}
        >
          10 点十格阵
        </button>
        <div className="tool-divider" />
        <button
          type="button"
          className="tool-button"
          onClick={() => addDemoObject("demo-rectangle")}
        >
          添加矩形
        </button>
        <button
          type="button"
          className="tool-button"
          onClick={() => addDemoObject("demo-circle")}
        >
          添加圆形
        </button>
        <button
          type="button"
          className="tool-button"
          onClick={() => addDemoObject("demo-text")}
        >
          添加文字
        </button>
        <div className="tool-divider" />
        <button
          type="button"
          className="tool-button"
          onClick={() => saveSceneJson(scene)}
        >
          保存 JSON
        </button>
        <button
          type="button"
          className="tool-button"
          onClick={() => fileInputRef.current?.click()}
        >
          读取 JSON
        </button>
        <input
          ref={fileInputRef}
          className="visually-hidden"
          type="file"
          accept="application/json,.json"
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = "";

            if (file) {
              void handleLoadJson(file);
            }
          }}
        />
        <button
          type="button"
          className="tool-button"
          onClick={() => exportSceneSvg(scene)}
        >
          导出 SVG
        </button>
        <button
          type="button"
          className="tool-button"
          onClick={() => {
            exportScenePng(scene)
              .then(() => setFileMessage("已导出 PNG 图片。"))
              .catch(() => setFileMessage("PNG 导出失败，请稍后重试。"));
          }}
        >
          导出 PNG
        </button>
        <button type="button" className="tool-button" onClick={clearLocalSave}>
          清空本地保存
        </button>
      </aside>
      <MathCanvas />
      <aside className="property-panel" aria-label="属性面板">
        <h2>属性</h2>
        <p className="property-count">已选择 {selectedObjects.length} 个对象</p>
        {selectedMathObjectCount > 1 ? (
          <p className="number-tile-sum">
            选中总数：{selectedMathValue}
          </p>
        ) : null}
        {fileMessage ? <p className="file-message">{fileMessage}</p> : null}
        {selectedObject ? (
          <ObjectInspector
            object={selectedObject}
            onChange={updateSelectedObjects}
          />
        ) : (
          <p>单选对象后，这里会显示可编辑属性。</p>
        )}
      </aside>
      <footer className="status-bar">
        <span>缩放：{Math.round(scene.viewport.zoom * 100)}%</span>
        <span>对象：{scene.objects.length}</span>
        <span>选中：{selectedObjectIds.length}</span>
        <span>选中总数：{selectedMathValue}</span>
      </footer>
    </main>
  );
}

function ObjectInspector({
  object,
  onChange
}: {
  object: SceneObject;
  onChange: (patch: EditableObjectPatch) => void;
}) {
  return (
    <div className="property-form">
      <NumberPropertyField
        label="x"
        value={object.x}
        onChange={(value) => onChange({ x: value })}
      />
      <NumberPropertyField
        label="y"
        value={object.y}
        onChange={(value) => onChange({ y: value })}
      />
      <NumberPropertyField
        label="rotation"
        value={object.rotation}
        onChange={(value) => onChange({ rotation: value })}
      />
      <NumberPropertyField
        label="scaleX"
        value={object.scaleX}
        min={MIN_MANUAL_SCALE}
        onChange={(value) => onChange({ scaleX: value })}
      />
      <NumberPropertyField
        label="scaleY"
        value={object.scaleY}
        min={MIN_MANUAL_SCALE}
        onChange={(value) => onChange({ scaleY: value })}
      />
      <label className="property-field">
        <span>label</span>
        <input
          value={object.label}
          onChange={(event) => onChange({ label: event.target.value })}
        />
      </label>
      {isNumberTileObject(object) ? (
        <NumberTileInspectorFields object={object} onChange={onChange} />
      ) : null}
      {isTenFrameObject(object) ? (
        <TenFrameInspectorFields object={object} onChange={onChange} />
      ) : null}
      <label className="property-check">
        <input
          type="checkbox"
          checked={object.locked}
          onChange={(event) => onChange({ locked: event.target.checked })}
        />
        锁定对象
      </label>
      <label className="property-check">
        <input
          type="checkbox"
          checked={object.visible}
          onChange={(event) => onChange({ visible: event.target.checked })}
        />
        显示对象
      </label>
    </div>
  );
}

function NumberPropertyField({
  label,
  value,
  min,
  onChange
}: {
  label: string;
  value: number;
  min?: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="property-field">
      <span>{label}</span>
      <input
        type="number"
        min={min}
        step="0.01"
        value={formatNumber(value)}
        onChange={(event) => {
          const nextValue = event.target.valueAsNumber;

          if (!Number.isFinite(nextValue)) {
            return;
          }

          onChange(min === undefined ? nextValue : Math.max(min, nextValue));
        }}
      />
    </label>
  );
}

function TenFrameInspectorFields({
  object,
  onChange
}: {
  object: SceneObject;
  onChange: (patch: EditableObjectPatch) => void;
}) {
  if (!isTenFrameObject(object)) {
    return null;
  }

  return (
    <>
      <label className="property-field">
        <span>filledCount</span>
        <input
          type="number"
          min={0}
          max={10}
          step={1}
          value={object.data.filledCount}
          onChange={(event) => {
            if (!Number.isFinite(event.target.valueAsNumber)) {
              return;
            }

            const updated = setFilledCount(object, event.target.valueAsNumber);
            onChange({ data: updated.data });
          }}
        />
      </label>
      <label className="property-field">
        <span>tokenShape</span>
        <select
          value={object.data.tokenShape}
          onChange={(event) => {
            const tokenShape = event.target.value;

            if (isTenFrameTokenShape(tokenShape)) {
              onChange({
                data: { tokenShape: tokenShape as TenFrameTokenShape }
              });
            }
          }}
        >
          <option value="circle">circle</option>
          <option value="square">square</option>
        </select>
      </label>
      <label className="property-field">
        <span>fillMode</span>
        <select
          value={object.data.fillMode}
          onChange={(event) => {
            const fillMode = event.target.value;

            if (!isTenFrameFillMode(fillMode)) {
              return;
            }

            onChange({
              data:
                fillMode === "manual"
                  ? {
                      fillMode: fillMode as TenFrameFillMode,
                      tokenPositions: getFilledCellPositions(object.data)
                    }
                  : {
                      fillMode: fillMode as TenFrameFillMode,
                      tokenPositions: []
                    }
            });
          }}
        >
          <option value="left-to-right">left-to-right</option>
          <option value="manual">manual</option>
        </select>
      </label>
      <p className="number-tile-sum">
        还差 {Math.max(0, 10 - object.data.filledCount)} 个到 10
      </p>
    </>
  );
}

function NumberTileInspectorFields({
  object,
  onChange
}: {
  object: SceneObject;
  onChange: (patch: EditableObjectPatch) => void;
}) {
  if (!isNumberTileObject(object)) {
    return null;
  }

  const size = isNumberTileSize(object.data.size) ? object.data.size : "medium";

  return (
    <>
      <label className="property-field">
        <span>value</span>
        <input
          type="number"
          value={object.data.value}
          onChange={(event) => {
            if (!Number.isFinite(event.target.valueAsNumber)) {
              return;
            }

            const updated = updateNumberTileValue(
              object,
              event.target.valueAsNumber
            );
            onChange({
              label: updated.label,
              data: {
                value: updated.data.value
              }
            });
          }}
        />
      </label>
      <label className="property-check">
        <input
          type="checkbox"
          checked={object.data.showValue}
          onChange={(event) =>
            onChange({ data: { showValue: event.target.checked } })
          }
        />
        显示数字
      </label>
      <label className="property-field">
        <span>size</span>
        <select
          value={size}
          onChange={(event) => {
            const nextSize = event.target.value;

            if (isNumberTileSize(nextSize)) {
              onChange({
                data: getNumberTileDataForSize(nextSize as NumberTileSize)
              });
            }
          }}
        >
          <option value="small">small</option>
          <option value="medium">medium</option>
          <option value="large">large</option>
        </select>
      </label>
    </>
  );
}

function formatNumber(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}
