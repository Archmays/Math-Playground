import { useEffect, useRef, useState } from "react";
import { MathCanvas } from "../../canvas/MathCanvas";
import { AppHeader } from "../../components/AppHeader";
import type { SceneObject } from "../../core/scene";
import { deserializeScene, serializeScene } from "../../core/sceneSerialization";
import {
  LESSON_CARDS,
  checkLessonCard,
  loadLessonCard,
  type LessonCard,
  type LessonCheckResult
} from "../lessons/lessons";
import {
  getAlgebraTileLabel,
  isAlgebraTileKind,
  isAlgebraTileObject,
  isAlgebraTileSign,
  simplifyAlgebraTiles,
  updateAlgebraTileData,
  type AlgebraTileKind,
  type AlgebraTileSign
} from "../../manipulatives/algebraTiles/algebraTiles";
import {
  formatBalanceRelation,
  isBalanceScaleObject,
  updateBalanceScaleData
} from "../../manipulatives/balanceScale/balanceScale";
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
import {
  HELP_STEPS,
  KEYBOARD_SHORTCUTS,
  PROPERTY_EMPTY_TEXT,
  TOOL_CATEGORIES,
  getToolButtonCopy
} from "./workspaceUi";
import { APP_VERSION } from "../../version";

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
    addBalanceScale,
    addAlgebraTile,
    addSelectedGeometryRotationMarker,
    setSelectedBalanceScaleLeftFromNumberTiles,
    setSelectedBalanceScaleRightFromNumberTiles,
    updateSelectedObjects,
    loadScene
  } = useScene();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const latestSceneRef = useRef(scene);
  const [fileMessage, setFileMessage] = useState("");
  const [autoSaveReady, setAutoSaveReady] = useState(false);
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [lessonCheckResult, setLessonCheckResult] =
    useState<LessonCheckResult | null>(null);
  const [lessonHintIndex, setLessonHintIndex] = useState(0);
  const [visibleLessonHint, setVisibleLessonHint] = useState<string | null>(null);
  const selectedLesson =
    LESSON_CARDS.find((lesson) => lesson.id === selectedLessonId) ?? null;
  const selectedObjects = scene.objects.filter((object) =>
    selectedObjectIds.includes(object.id)
  );
  const selectedObject = selectedObjects.length === 1 ? selectedObjects[0] : null;
  const selectedBalanceScale = selectedObjects.find(isBalanceScaleObject) ?? null;
  const selectedNumberTileCount = selectedObjects.filter(isNumberTileObject).length;
  const selectedAlgebraTileCount = selectedObjects.filter(isAlgebraTileObject).length;
  const selectedAlgebraSummary = simplifyAlgebraTiles(
    scene.objects,
    selectedObjectIds
  );
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
    setLessonCheckResult(null);
    setVisibleLessonHint(null);
    setLessonHintIndex(0);
  }, [selectedLessonId]);

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

  const startLesson = (lesson: LessonCard) => {
    const confirmed =
      scene.objects.length === 0 ||
      window.confirm("当前画布已有内容。开始任务会覆盖当前画布，是否继续？");
    const result = loadLessonCard(lesson, scene, {
      confirmOverwrite: confirmed
    });

    if (result.status === "blocked") {
      setFileMessage(result.reason);
      return;
    }

    loadScene(result.scene);
    setFileMessage(`已载入任务卡：${lesson.title}`);
    setLessonCheckResult(null);
    setVisibleLessonHint(null);
    setLessonHintIndex(0);
  };

  const checkCurrentLesson = (lesson: LessonCard) => {
    const result = checkLessonCard(
      lesson,
      scene,
      selectedObjectIds,
      lessonHintIndex
    );

    setLessonCheckResult(result);
    setVisibleLessonHint(result.hint ?? null);
  };

  const showLessonHint = (lesson: LessonCard) => {
    if (lesson.hints.length === 0) {
      return;
    }

    const hint = lesson.hints[Math.min(lessonHintIndex, lesson.hints.length - 1)];
    setVisibleLessonHint(hint);
    setLessonHintIndex((index) => Math.min(index + 1, lesson.hints.length - 1));
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

  const toolActions: Record<string, () => void> = {
    help: () => setIsHelpOpen((isOpen) => !isOpen),
    "number-1": () => addNumberTile(1),
    "number-5": () => addNumberTile(5),
    "number-10": () => addNumberTile(10),
    "number-custom": addCustomNumberTile,
    "ten-frame-empty": () => addTenFrame(0),
    "ten-frame-5": () => addTenFrame(5),
    "ten-frame-10": () => addTenFrame(10),
    "fraction-bar-half": () => addFractionBar(1, 2),
    "fraction-bar-third": () => addFractionBar(1, 3),
    "fraction-bar-quarter": () => addFractionBar(1, 4),
    "fraction-bar-fifth": () => addFractionBar(1, 5),
    "fraction-bar-eighth": () => addFractionBar(1, 8),
    "fraction-bar-custom": addCustomFractionBar,
    "fraction-circle-half": () => addFractionCircle(1, 2),
    "fraction-circle-third": () => addFractionCircle(1, 3),
    "fraction-circle-quarter": () => addFractionCircle(1, 4),
    "fraction-circle-sixth": () => addFractionCircle(1, 6),
    "fraction-circle-eighth": () => addFractionCircle(1, 8),
    "fraction-circle-custom": addCustomFractionCircle,
    "geometry-triangle": () => addGeometryTile("triangle"),
    "geometry-square": () => addGeometryTile("square"),
    "geometry-rectangle": () => addGeometryTile("rectangle"),
    "geometry-hexagon": () => addGeometryTile("hexagon"),
    "geometry-circle": () => addGeometryTile("circle"),
    "geometry-trapezoid": () => addGeometryTile("trapezoid"),
    "geometry-parallelogram": () => addGeometryTile("parallelogram"),
    "measurement-ruler": () => addMeasurementTool("ruler"),
    "measurement-protractor": () => addMeasurementTool("protractor"),
    "measurement-angle": () => addMeasurementTool("angleMarker"),
    "measurement-line": () => addMeasurementTool("lineSegment"),
    "balance-empty": () => addBalanceScale(0, 0),
    "balance-equal": () => addBalanceScale(5, 5),
    "balance-less": () => addBalanceScale(3, 7),
    "algebra-unit-positive": () => addAlgebraTile("unit", "positive"),
    "algebra-unit-negative": () => addAlgebraTile("unit", "negative"),
    "algebra-x-positive": () => addAlgebraTile("x", "positive"),
    "algebra-x-negative": () => addAlgebraTile("x", "negative"),
    "algebra-x2-positive": () => addAlgebraTile("x2", "positive"),
    "algebra-x2-negative": () => addAlgebraTile("x2", "negative"),
    "demo-rectangle": () => addDemoObject("demo-rectangle"),
    "demo-circle": () => addDemoObject("demo-circle"),
    "demo-text": () => addDemoObject("demo-text"),
    "file-save-json": () => {
      saveSceneJson(scene);
      setFileMessage("已保存 JSON 画布文件。");
    },
    "file-load-json": () => fileInputRef.current?.click(),
    "file-export-svg": () => {
      exportSceneSvg(scene);
      setFileMessage("已导出 SVG 图片。");
    },
    "file-export-png": () => {
      exportScenePng(scene)
        .then(() => setFileMessage("已导出 PNG 图片。"))
        .catch(() => setFileMessage("PNG 导出失败，请稍后重试。"));
    },
    "file-clear-local": clearLocalSave
  };

  return (
    <main className="workspace">
      <AppHeader />
      <aside className="tool-panel" aria-label="教具工具栏">
        {TOOL_CATEGORIES.map((category) => (
          <ToolSection
            key={category.id}
            title={category.label}
            description={category.description}
          >
            <div className="tool-grid">
              {category.buttonIds.map((buttonId) => (
                <ToolButton
                  key={buttonId}
                  buttonId={buttonId}
                  active={buttonId === "help" && isHelpOpen}
                  onClick={toolActions[buttonId]}
                />
              ))}
            </div>
            {category.id === "tasks" ? (
              <section className="lesson-picker" aria-label="任务卡列表">
                {LESSON_CARDS.map((lesson) => (
                  <button
                    key={lesson.id}
                    type="button"
                    aria-label={`预览任务卡：${lesson.title}`}
                    className={
                      selectedLesson?.id === lesson.id
                        ? "lesson-card-button lesson-card-button-active"
                        : "lesson-card-button"
                    }
                    onClick={() => setSelectedLessonId(lesson.id)}
                  >
                    <span>{lesson.title}</span>
                    <small>{lesson.topic}</small>
                  </button>
                ))}
              </section>
            ) : null}
          </ToolSection>
        ))}
        <input
          ref={fileInputRef}
          className="visually-hidden"
          type="file"
          accept="application/json,.json"
          aria-label="读取 JSON 画布文件"
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = "";

            if (file) {
              void handleLoadJson(file);
            }
          }}
        />
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
        {selectedBalanceScale && selectedNumberTileCount > 0 ? (
          <div className="balance-selection-summary">
            <p>选中数字方块总和：{selectedMathValue}</p>
            <button
              type="button"
              className="property-action-button"
              aria-label="把选中的数字方块总和设为天平左边"
              onClick={setSelectedBalanceScaleLeftFromNumberTiles}
            >
              把选中数字方块总和设为左边
            </button>
            <button
              type="button"
              className="property-action-button"
              aria-label="把选中的数字方块总和设为天平右边"
              onClick={setSelectedBalanceScaleRightFromNumberTiles}
            >
              把选中数字方块总和设为右边
            </button>
          </div>
        ) : null}
        {selectedAlgebraTileCount > 1 ? (
          <div className="algebra-selection-summary">
            <p>合并同类项：{selectedAlgebraSummary.expression}</p>
          </div>
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
        {isHelpOpen ? <HelpPanel onClose={() => setIsHelpOpen(false)} /> : null}
        {selectedLesson ? (
          <LessonPreview
            lesson={selectedLesson}
            checkResult={lessonCheckResult}
            visibleHint={visibleLessonHint}
            onCheck={checkCurrentLesson}
            onShowHint={showLessonHint}
            onStart={startLesson}
          />
        ) : null}
        {selectedObject ? (
          <ObjectInspector
            object={selectedObject}
            onAddRotationMarker={addSelectedGeometryRotationMarker}
            onChange={updateSelectedObjects}
          />
        ) : (
          <p>{PROPERTY_EMPTY_TEXT}</p>
        )}
      </aside>
      <footer className="status-bar">
        <span>缩放：{Math.round(scene.viewport.zoom * 100)}%</span>
        <span>对象：{scene.objects.length}</span>
        <span>选中：{selectedObjectIds.length}</span>
        <span>选中总数：{selectedMathValue}</span>
        <span>版本：v{APP_VERSION}</span>
      </footer>
    </main>
  );
}

function ToolSection({
  title,
  description,
  children
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="tool-section" aria-label={`${title}工具`}>
      <div className="tool-section-header">
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
      {children}
    </section>
  );
}

function ToolButton({
  buttonId,
  active = false,
  onClick
}: {
  buttonId: string;
  active?: boolean;
  onClick: () => void;
}) {
  const copy = getToolButtonCopy(buttonId);

  return (
    <button
      type="button"
      className={active ? "tool-button tool-button-active" : "tool-button"}
      aria-label={copy.ariaLabel}
      onClick={onClick}
    >
      {copy.label}
    </button>
  );
}

function HelpPanel({ onClose }: { onClose: () => void }) {
  return (
    <section className="help-panel" aria-label="使用帮助">
      <div className="help-panel-header">
        <h3>怎么使用？</h3>
        <button
          type="button"
          className="help-close-button"
          aria-label="关闭使用帮助"
          onClick={onClose}
        >
          关闭
        </button>
      </div>
      <ol>
        {HELP_STEPS.map((step) => (
          <li key={step.title}>
            <strong>{step.title}</strong>
            <span>{step.body}</span>
          </li>
        ))}
      </ol>
      <h4>键盘快捷键</h4>
      <dl className="shortcut-list">
        {KEYBOARD_SHORTCUTS.map((shortcut) => (
          <div key={shortcut.keys}>
            <dt>{shortcut.keys}</dt>
            <dd>{shortcut.label}</dd>
          </div>
        ))}
      </dl>
    </section>
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
        label="横向位置 x"
        value={object.x}
        onChange={(value) => onChange({ x: value })}
      />
      <NumberPropertyField
        label="纵向位置 y"
        value={object.y}
        onChange={(value) => onChange({ y: value })}
      />
      <NumberPropertyField
        label="旋转角度"
        value={object.rotation}
        onChange={(value) => onChange({ rotation: value })}
      />
      <NumberPropertyField
        label="横向缩放"
        value={object.scaleX}
        min={MIN_MANUAL_SCALE}
        onChange={(value) => onChange({ scaleX: value })}
      />
      <NumberPropertyField
        label="纵向缩放"
        value={object.scaleY}
        min={MIN_MANUAL_SCALE}
        onChange={(value) => onChange({ scaleY: value })}
      />
      <label className="property-field">
        <span>名称</span>
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
      {isBalanceScaleObject(object) ? (
        <BalanceScaleInspectorFields object={object} onChange={onChange} />
      ) : null}
      {isAlgebraTileObject(object) ? (
        <AlgebraTileInspectorFields object={object} onChange={onChange} />
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

function LessonPreview({
  lesson,
  checkResult,
  visibleHint,
  onCheck,
  onShowHint,
  onStart
}: {
  lesson: LessonCard;
  checkResult: LessonCheckResult | null;
  visibleHint: string | null;
  onCheck: (lesson: LessonCard) => void;
  onShowHint: (lesson: LessonCard) => void;
  onStart: (lesson: LessonCard) => void;
}) {
  return (
    <section className="lesson-preview">
      <div className="lesson-preview-header">
        <p>{lesson.gradeBand}</p>
        <h3>{lesson.title}</h3>
      </div>
      <p>{lesson.description}</p>
      <h4>任务步骤</h4>
      <ol>
        {lesson.instructions.map((instruction) => (
          <li key={instruction}>{instruction}</li>
        ))}
      </ol>
      <h4>完成标准</h4>
      <ul>
        {lesson.successCriteria.map((criterion) => (
          <li key={criterion}>{criterion}</li>
        ))}
      </ul>
      {checkResult ? (
        <p
          className={
            checkResult.isCorrect
              ? "lesson-feedback lesson-feedback-correct"
              : "lesson-feedback"
          }
        >
          {checkResult.message}
        </p>
      ) : null}
      {visibleHint ? <p className="lesson-hint">提示：{visibleHint}</p> : null}
      <div className="lesson-actions">
        <button
          type="button"
          className="property-action-button"
          aria-label={`检查任务答案：${lesson.title}`}
          onClick={() => onCheck(lesson)}
        >
          检查答案
        </button>
        <button
          type="button"
          className="property-action-button"
          aria-label={`显示任务提示：${lesson.title}`}
          onClick={() => onShowHint(lesson)}
        >
          显示一个提示
        </button>
      </div>
      <button
        type="button"
        className="property-action-button"
        aria-label={`开始任务：${lesson.title}`}
        onClick={() => onStart(lesson)}
      >
        开始任务
      </button>
    </section>
  );
}

function NumberPropertyField({
  label,
  value,
  min,
  max,
  onChange
}: {
  label: string;
  value: number;
  min?: number;
  max?: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="property-field">
      <span>{label}</span>
      <input
        type="number"
        min={min}
        max={max}
        step="0.01"
        value={formatNumber(value)}
        onChange={(event) => {
          const nextValue = event.target.valueAsNumber;

          if (!Number.isFinite(nextValue)) {
            return;
          }

          const minValue =
            min === undefined ? nextValue : Math.max(min, nextValue);
          onChange(max === undefined ? minValue : Math.min(max, minValue));
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
        <span>已填数量</span>
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
        <span>点子形状</span>
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
          <option value="circle">圆点</option>
          <option value="square">方块</option>
        </select>
      </label>
      <label className="property-field">
        <span>填充方式</span>
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
          <option value="left-to-right">自动从左到右</option>
          <option value="manual">手动点选</option>
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
        <span>分子</span>
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
        <span>分母</span>
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
        <span>分子</span>
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
        <span>分母</span>
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
        <span>起始角度</span>
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
        <span>图形</span>
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
        label="宽度"
        value={object.data.width}
        min={24}
        onChange={(value) => updateData({ width: value })}
      />
      <NumberPropertyField
        label="高度"
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
        aria-label="为选中的几何图形添加当前旋转角度标注"
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
        <span>工具类型</span>
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
        label="长度"
        value={object.data.length}
        min={16}
        onChange={(value) => updateData({ length: value })}
      />
      <NumberPropertyField
        label="角度"
        value={object.data.angle}
        min={0}
        max={object.data.kind === "protractor" ? 180 : undefined}
        onChange={(value) => updateData({ angle: value })}
      />
      <label className="property-field">
        <span>单位</span>
        <select
          value={object.data.unit}
          onChange={(event) => {
            const unit = event.target.value;

            if (isMeasurementUnit(unit)) {
              updateData({ unit: unit as MeasurementUnit });
            }
          }}
        >
          <option value="grid">网格</option>
          <option value="cm">cm</option>
          <option value="custom">自定义</option>
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

function BalanceScaleInspectorFields({
  object,
  onChange
}: {
  object: SceneObject;
  onChange: (patch: EditableObjectPatch) => void;
}) {
  if (!isBalanceScaleObject(object)) {
    return null;
  }

  const updateData = (data: Parameters<typeof updateBalanceScaleData>[1]) => {
    const updated = updateBalanceScaleData(object, data);
    onChange({ data: updated.data });
  };

  return (
    <>
      <NumberPropertyField
        label="左边数值"
        value={object.data.leftValue}
        onChange={(value) => updateData({ leftValue: value })}
      />
      <NumberPropertyField
        label="右边数值"
        value={object.data.rightValue}
        onChange={(value) => updateData({ rightValue: value })}
      />
      <label className="property-check">
        <input
          type="checkbox"
          checked={object.data.showValues}
          onChange={(event) => updateData({ showValues: event.target.checked })}
        />
        显示左右数值
      </label>
      <div className="balance-measurements">
        <p>
          关系：
          {formatBalanceRelation(object.data.leftValue, object.data.rightValue)}
        </p>
      </div>
    </>
  );
}

function AlgebraTileInspectorFields({
  object,
  onChange
}: {
  object: SceneObject;
  onChange: (patch: EditableObjectPatch) => void;
}) {
  if (!isAlgebraTileObject(object)) {
    return null;
  }

  const updateData = (data: Parameters<typeof updateAlgebraTileData>[1]) => {
    const updated = updateAlgebraTileData(object, data);
    onChange({ label: updated.label, data: updated.data });
  };

  return (
    <>
      <label className="property-field">
        <span>砖块类型</span>
        <select
          value={object.data.tileKind}
          onChange={(event) => {
            const tileKind = event.target.value;

            if (isAlgebraTileKind(tileKind)) {
              updateData({ tileKind: tileKind as AlgebraTileKind });
            }
          }}
        >
          {ALGEBRA_TILE_KINDS.map((tileKind) => (
            <option key={tileKind} value={tileKind}>
              {getAlgebraTileLabel(tileKind, "positive")}
            </option>
          ))}
        </select>
      </label>
      <label className="property-field">
        <span>正负</span>
        <select
          value={object.data.sign}
          onChange={(event) => {
            const sign = event.target.value;

            if (isAlgebraTileSign(sign)) {
              updateData({ sign: sign as AlgebraTileSign });
            }
          }}
        >
          <option value="positive">正数</option>
          <option value="negative">负数</option>
        </select>
      </label>
      <label className="property-check">
        <input
          type="checkbox"
          checked={object.data.showLabel}
          onChange={(event) => updateData({ showLabel: event.target.checked })}
        />
        显示标签
      </label>
      <NumberPropertyField
        label="x 的长度"
        value={object.data.xLength}
        min={40}
        onChange={(value) => updateData({ xLength: value })}
      />
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
        <span>数字</span>
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
        <span>大小</span>
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
          <option value="small">小</option>
          <option value="medium">中</option>
          <option value="large">大</option>
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

const ALGEBRA_TILE_KINDS: AlgebraTileKind[] = ["unit", "x", "x2"];
