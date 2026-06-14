import { useEffect, useRef, useState } from "react";
import { MathCanvas } from "../../canvas/MathCanvas";
import { AppHeader } from "../../components/AppHeader";
import type { SceneObject } from "../../core/scene";
import { deserializeScene, serializeScene } from "../../core/sceneSerialization";
import {
  getSelectedFractionSummary,
  isFractionBarObject,
  MAX_DENOMINATOR,
  MIN_DENOMINATOR,
  updateFractionBarData,
  updateFractionBarDenominator,
  updateFractionBarNumerator
} from "../../manipulatives/fractionBars/fractionBars";
import {
  getSelectedFractionValueSummary,
  isFractionCircleObject,
  updateFractionCircleData,
  updateFractionCircleDenominator,
  updateFractionCircleNumerator
} from "../../manipulatives/fractionCircles/fractionCircles";
import {
  getGeometryTileLabel,
  getGeometryTileMeasurements,
  isGeometryTileObject,
  isGeometryTileShape,
  updateGeometryTileData,
  type GeometryTileShape
} from "../../manipulatives/geometryTiles/geometryTiles";
import {
  getMeasurementToolLabel,
  isMeasurementToolKind,
  isMeasurementToolObject,
  isMeasurementUnit,
  updateMeasurementToolData,
  type MeasurementToolKind,
  type MeasurementUnit
} from "../../manipulatives/measurementTools/measurementTools";
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
  parseAutoSavedScene,
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
    addFractionBar,
    addFractionCircle,
    addGeometryTile,
    addMeasurementTool,
    addSelectedGeometryRotationMarker,
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
  const selectedFractionSummary = getSelectedFractionSummary(
    scene.objects,
    selectedObjectIds
  );
  const selectedFractionValueSummary = getSelectedFractionValueSummary(
    scene.objects,
    selectedObjectIds
  );
  const hasSelectedFractionCircle = selectedObjects.some(isFractionCircleObject);

  useEffect(() => {
    latestSceneRef.current = scene;
  }, [scene]);

  useEffect(() => {
    const autoSavedScene = parseAutoSavedScene(
      window.localStorage.getItem(LOCAL_SCENE_STORAGE_KEY)
    );

    if (autoSavedScene.status === "empty") {
      setAutoSaveReady(true);
      return;
    }

    if (autoSavedScene.status === "error") {
      setFileMessage(autoSavedScene.error);
      setAutoSaveReady(true);
      return;
    }

    loadScene(autoSavedScene.scene);
    setFileMessage("已恢复上次自动保存。");

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

  const addCustomFractionBar = () => {
    const input = window.prompt("请输入分数，例如 3/4", "3/4");

    if (input === null) {
      return;
    }

    const [rawNumerator, rawDenominator] = input.split("/");
    const numerator = Number(rawNumerator?.trim());
    const denominator = Number(rawDenominator?.trim());

    if (!Number.isFinite(numerator) || !Number.isFinite(denominator)) {
      setFileMessage("请输入有效分数。");
      return;
    }

    addFractionBar(numerator, denominator);
  };

  const addCustomFractionCircle = () => {
    const input = window.prompt("请输入分数圆，例如 3/4", "3/4");

    if (input === null) {
      return;
    }

    const [rawNumerator, rawDenominator] = input.split("/");
    const numerator = Number(rawNumerator?.trim());
    const denominator = Number(rawDenominator?.trim());

    if (!Number.isFinite(numerator) || !Number.isFinite(denominator)) {
      setFileMessage("请输入有效分数圆。");
      return;
    }

    addFractionCircle(numerator, denominator);
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
          onClick={() => addFractionBar(1, 2)}
        >
          1/2
        </button>
        <button
          type="button"
          className="tool-button"
          onClick={() => addFractionBar(1, 3)}
        >
          1/3
        </button>
        <button
          type="button"
          className="tool-button"
          onClick={() => addFractionBar(1, 4)}
        >
          1/4
        </button>
        <button
          type="button"
          className="tool-button"
          onClick={() => addFractionBar(1, 5)}
        >
          1/5
        </button>
        <button
          type="button"
          className="tool-button"
          onClick={() => addFractionBar(1, 8)}
        >
          1/8
        </button>
        <button
          type="button"
          className="tool-button"
          onClick={addCustomFractionBar}
        >
          自定义分数
        </button>
        <div className="tool-divider" />
        <button
          type="button"
          className="tool-button"
          onClick={() => addFractionCircle(1, 2)}
        >
          圆 1/2
        </button>
        <button
          type="button"
          className="tool-button"
          onClick={() => addFractionCircle(1, 3)}
        >
          圆 1/3
        </button>
        <button
          type="button"
          className="tool-button"
          onClick={() => addFractionCircle(1, 4)}
        >
          圆 1/4
        </button>
        <button
          type="button"
          className="tool-button"
          onClick={() => addFractionCircle(1, 6)}
        >
          圆 1/6
        </button>
        <button
          type="button"
          className="tool-button"
          onClick={() => addFractionCircle(1, 8)}
        >
          圆 1/8
        </button>
        <button
          type="button"
          className="tool-button"
          onClick={addCustomFractionCircle}
        >
          自定义分数圆
        </button>
        <div className="tool-divider" />
        <button
          type="button"
          className="tool-button"
          onClick={() => addGeometryTile("triangle")}
        >
          等边三角形
        </button>
        <button
          type="button"
          className="tool-button"
          onClick={() => addGeometryTile("square")}
        >
          正方形
        </button>
        <button
          type="button"
          className="tool-button"
          onClick={() => addGeometryTile("rectangle")}
        >
          长方形
        </button>
        <button
          type="button"
          className="tool-button"
          onClick={() => addGeometryTile("hexagon")}
        >
          正六边形
        </button>
        <button
          type="button"
          className="tool-button"
          onClick={() => addGeometryTile("circle")}
        >
          圆形
        </button>
        <button
          type="button"
          className="tool-button"
          onClick={() => addGeometryTile("trapezoid")}
        >
          梯形
        </button>
        <button
          type="button"
          className="tool-button"
          onClick={() => addGeometryTile("parallelogram")}
        >
          平行四边形
        </button>
        <div className="tool-divider" />
        <button
          type="button"
          className="tool-button"
          onClick={() => addMeasurementTool("ruler")}
        >
          直尺
        </button>
        <button
          type="button"
          className="tool-button"
          onClick={() => addMeasurementTool("protractor")}
        >
          量角器
        </button>
        <button
          type="button"
          className="tool-button"
          onClick={() => addMeasurementTool("angleMarker")}
        >
          角度弧
        </button>
        <button
          type="button"
          className="tool-button"
          onClick={() => addMeasurementTool("lineSegment")}
        >
          线段
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
        {selectedFractionSummary.fractions.length > 1 ? (
          <div className="fraction-selection-summary">
            {selectedFractionSummary.fractions.map((fraction) => (
              <p key={fraction.id}>
                {fraction.label} = {formatDecimal(fraction.decimalValue)}
              </p>
            ))}
            <p>
              {selectedFractionSummary.canAdd
                ? `同分母总和：${selectedFractionSummary.sumLabel}`
                : selectedFractionSummary.message}
            </p>
          </div>
        ) : null}
        {hasSelectedFractionCircle &&
        selectedFractionValueSummary.fractions.length > 1 ? (
          <div className="fraction-selection-summary">
            {selectedFractionValueSummary.fractions.map((fraction) => (
              <p key={fraction.id}>
                {fraction.label} = {formatDecimal(fraction.decimalValue)}
              </p>
            ))}
            {selectedFractionValueSummary.message ? (
              <p>{selectedFractionValueSummary.message}</p>
            ) : null}
          </div>
        ) : null}
        {fileMessage ? <p className="file-message">{fileMessage}</p> : null}
        {selectedObject ? (
          <ObjectInspector
            object={selectedObject}
            onAddRotationMarker={addSelectedGeometryRotationMarker}
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
  onAddRotationMarker,
  onChange
}: {
  object: SceneObject;
  onAddRotationMarker: () => void;
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
      {isFractionBarObject(object) ? (
        <FractionBarInspectorFields object={object} onChange={onChange} />
      ) : null}
      {isFractionCircleObject(object) ? (
        <FractionCircleInspectorFields object={object} onChange={onChange} />
      ) : null}
      {isGeometryTileObject(object) ? (
        <GeometryTileInspectorFields
          object={object}
          onAddRotationMarker={onAddRotationMarker}
          onChange={onChange}
        />
      ) : null}
      {isMeasurementToolObject(object) ? (
        <MeasurementToolInspectorFields object={object} onChange={onChange} />
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

function FractionBarInspectorFields({
  object,
  onChange
}: {
  object: SceneObject;
  onChange: (patch: EditableObjectPatch) => void;
}) {
  if (!isFractionBarObject(object)) {
    return null;
  }

  return (
    <>
      <label className="property-field">
        <span>numerator</span>
        <input
          type="number"
          min={0}
          max={object.data.denominator}
          step={1}
          value={object.data.numerator}
          onChange={(event) => {
            if (!Number.isFinite(event.target.valueAsNumber)) {
              return;
            }

            const updated = updateFractionBarNumerator(
              object,
              event.target.valueAsNumber
            );
            onChange({ label: updated.label, data: updated.data });
          }}
        />
      </label>
      <label className="property-field">
        <span>denominator</span>
        <input
          type="number"
          min={MIN_DENOMINATOR}
          max={MAX_DENOMINATOR}
          step={1}
          value={object.data.denominator}
          onChange={(event) => {
            if (!Number.isFinite(event.target.valueAsNumber)) {
              return;
            }

            const updated = updateFractionBarDenominator(
              object,
              event.target.valueAsNumber
            );
            onChange({ label: updated.label, data: updated.data });
          }}
        />
      </label>
      <label className="property-check">
        <input
          type="checkbox"
          checked={object.data.showLabels}
          onChange={(event) => {
            const updated = updateFractionBarData(object, {
              showLabels: event.target.checked
            });
            onChange({ data: updated.data });
          }}
        />
        显示分数标签
      </label>
      <label className="property-check">
        <input
          type="checkbox"
          checked={object.data.showTicks}
          onChange={(event) => {
            const updated = updateFractionBarData(object, {
              showTicks: event.target.checked
            });
            onChange({ data: updated.data });
          }}
        />
        显示分割线
      </label>
    </>
  );
}

function FractionCircleInspectorFields({
  object,
  onChange
}: {
  object: SceneObject;
  onChange: (patch: EditableObjectPatch) => void;
}) {
  if (!isFractionCircleObject(object)) {
    return null;
  }

  return (
    <>
      <label className="property-field">
        <span>numerator</span>
        <input
          type="number"
          min={0}
          max={object.data.denominator}
          step={1}
          value={object.data.numerator}
          onChange={(event) => {
            if (!Number.isFinite(event.target.valueAsNumber)) {
              return;
            }

            const updated = updateFractionCircleNumerator(
              object,
              event.target.valueAsNumber
            );
            onChange({ label: updated.label, data: updated.data });
          }}
        />
      </label>
      <label className="property-field">
        <span>denominator</span>
        <input
          type="number"
          min={MIN_DENOMINATOR}
          max={MAX_DENOMINATOR}
          step={1}
          value={object.data.denominator}
          onChange={(event) => {
            if (!Number.isFinite(event.target.valueAsNumber)) {
              return;
            }

            const updated = updateFractionCircleDenominator(
              object,
              event.target.valueAsNumber
            );
            onChange({ label: updated.label, data: updated.data });
          }}
        />
      </label>
      <label className="property-field">
        <span>startAngle</span>
        <input
          type="number"
          step={1}
          value={object.data.startAngle}
          onChange={(event) => {
            if (!Number.isFinite(event.target.valueAsNumber)) {
              return;
            }

            const updated = updateFractionCircleData(object, {
              startAngle: event.target.valueAsNumber
            });
            onChange({ data: updated.data });
          }}
        />
      </label>
      <label className="property-check">
        <input
          type="checkbox"
          checked={object.data.showLabels}
          onChange={(event) => {
            const updated = updateFractionCircleData(object, {
              showLabels: event.target.checked
            });
            onChange({ data: updated.data });
          }}
        />
        显示分数标签
      </label>
      <label className="property-check">
        <input
          type="checkbox"
          checked={object.data.showSectorLines}
          onChange={(event) => {
            const updated = updateFractionCircleData(object, {
              showSectorLines: event.target.checked
            });
            onChange({ data: updated.data });
          }}
        />
        显示扇区线
      </label>
    </>
  );
}

function GeometryTileInspectorFields({
  object,
  onAddRotationMarker,
  onChange
}: {
  object: SceneObject;
  onAddRotationMarker: () => void;
  onChange: (patch: EditableObjectPatch) => void;
}) {
  if (!isGeometryTileObject(object)) {
    return null;
  }

  const measurements = getGeometryTileMeasurements(
    object.data,
    object.scaleX,
    object.scaleY
  );

  const updateData = (data: Parameters<typeof updateGeometryTileData>[1]) => {
    const updated = updateGeometryTileData(object, data);
    onChange({ label: updated.label, data: updated.data });
  };

  return (
    <>
      <label className="property-field">
        <span>shape</span>
        <select
          value={object.data.shape}
          onChange={(event) => {
            const shape = event.target.value;

            if (isGeometryTileShape(shape)) {
              updateData({ shape: shape as GeometryTileShape });
            }
          }}
        >
          {GEOMETRY_TILE_SHAPES.map((shape) => (
            <option key={shape} value={shape}>
              {getGeometryTileLabel(shape)}
            </option>
          ))}
        </select>
      </label>
      <NumberPropertyField
        label="width"
        value={object.data.width}
        min={24}
        onChange={(value) => updateData({ width: value })}
      />
      <NumberPropertyField
        label="height"
        value={object.data.height}
        min={24}
        onChange={(value) => updateData({ height: value })}
      />
      <label className="property-check">
        <input
          type="checkbox"
          checked={object.data.showLabel}
          onChange={(event) => updateData({ showLabel: event.target.checked })}
        />
        显示图形标签
      </label>
      <label className="property-check">
        <input
          type="checkbox"
          checked={object.data.showVertices}
          onChange={(event) =>
            updateData({ showVertices: event.target.checked })
          }
        />
        显示顶点
      </label>
      <div className="geometry-measurements">
        <p>旋转：{formatMeasurement(object.rotation)}°</p>
        {measurements.area !== undefined ? (
          <p>估算面积：{formatMeasurement(measurements.area)}</p>
        ) : null}
        {measurements.perimeter !== undefined ? (
          <p>估算周长：{formatMeasurement(measurements.perimeter)}</p>
        ) : null}
        {measurements.radius !== undefined ? (
          <p>半径：{formatMeasurement(measurements.radius)}</p>
        ) : null}
        {measurements.diameter !== undefined ? (
          <p>直径：{formatMeasurement(measurements.diameter)}</p>
        ) : null}
        {measurements.unsupportedMessage ? (
          <p>{measurements.unsupportedMessage}</p>
        ) : null}
      </div>
      <button
        type="button"
        className="property-action-button"
        onClick={onAddRotationMarker}
      >
        添加当前旋转角度标注
      </button>
    </>
  );
}

function MeasurementToolInspectorFields({
  object,
  onChange
}: {
  object: SceneObject;
  onChange: (patch: EditableObjectPatch) => void;
}) {
  if (!isMeasurementToolObject(object)) {
    return null;
  }

  const updateData = (data: Parameters<typeof updateMeasurementToolData>[1]) => {
    const updated = updateMeasurementToolData(object, data);
    onChange({ label: updated.label, data: updated.data });
  };

  return (
    <>
      <label className="property-field">
        <span>kind</span>
        <select
          value={object.data.kind}
          onChange={(event) => {
            const kind = event.target.value;

            if (isMeasurementToolKind(kind)) {
              updateData({ kind: kind as MeasurementToolKind });
            }
          }}
        >
          {MEASUREMENT_TOOL_KINDS.map((kind) => (
            <option key={kind} value={kind}>
              {getMeasurementToolLabel(kind)}
            </option>
          ))}
        </select>
      </label>
      <NumberPropertyField
        label="length"
        value={object.data.length}
        min={16}
        onChange={(value) => updateData({ length: value })}
      />
      <NumberPropertyField
        label="angle"
        value={object.data.angle}
        min={0}
        onChange={(value) => updateData({ angle: value })}
      />
      <label className="property-field">
        <span>unit</span>
        <select
          value={object.data.unit}
          onChange={(event) => {
            const unit = event.target.value;

            if (isMeasurementUnit(unit)) {
              updateData({ unit: unit as MeasurementUnit });
            }
          }}
        >
          <option value="grid">grid</option>
          <option value="cm">cm</option>
          <option value="custom">custom</option>
        </select>
      </label>
      <label className="property-check">
        <input
          type="checkbox"
          checked={object.data.showTicks}
          onChange={(event) => updateData({ showTicks: event.target.checked })}
        />
        显示刻度
      </label>
      <label className="property-check">
        <input
          type="checkbox"
          checked={object.data.showLabel}
          onChange={(event) => updateData({ showLabel: event.target.checked })}
        />
        显示标签
      </label>
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

function formatDecimal(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

function formatMeasurement(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

const GEOMETRY_TILE_SHAPES: GeometryTileShape[] = [
  "triangle",
  "square",
  "rectangle",
  "hexagon",
  "circle",
  "trapezoid",
  "parallelogram"
];

const MEASUREMENT_TOOL_KINDS: MeasurementToolKind[] = [
  "ruler",
  "protractor",
  "angleMarker",
  "lineSegment"
];
