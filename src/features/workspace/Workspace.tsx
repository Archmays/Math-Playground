import { useEffect, useRef, useState } from "react";
import { MathCanvas } from "../../canvas/MathCanvas";
import { shouldPreserveObjectAspectRatio } from "../../canvas/objectAspectRatio";
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
import {
  canDeleteSelectedObjectsInLesson,
  getLessonToolSummary,
  isToolButtonAllowedInLesson
} from "./lessonConstraints";
import { APP_VERSION } from "../../version";
import { toggleLessonStepIndex } from "./lessonProgress";
import {
  clearLessonReflectionNote,
  updateLessonReflectionNote
} from "./lessonReflection";

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
    addTangramSet,
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
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);
  const [activeLessonStarterObjectIds, setActiveLessonStarterObjectIds] =
    useState<string[]>([]);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [lessonCheckResult, setLessonCheckResult] =
    useState<LessonCheckResult | null>(null);
  const [lessonHintIndex, setLessonHintIndex] = useState(0);
  const [visibleLessonHint, setVisibleLessonHint] = useState<string | null>(null);
  const [completedLessonSteps, setCompletedLessonSteps] = useState<
    Record<string, number[]>
  >({});
  const [lessonReflectionNotes, setLessonReflectionNotes] = useState<
    Record<string, string>
  >({});
  const selectedLesson =
    LESSON_CARDS.find((lesson) => lesson.id === selectedLessonId) ?? null;
  const activeLesson =
    LESSON_CARDS.find((lesson) => lesson.id === activeLessonId) ?? null;
  const selectedObjects = scene.objects.filter((object) =>
    selectedObjectIds.includes(object.id)
  );
  const canDeleteSelection = canDeleteSelectedObjectsInLesson(
    selectedObjectIds,
    activeLessonStarterObjectIds,
    activeLesson
  );
  const deleteDisabledReason =
    activeLesson &&
    !canDeleteSelection &&
    selectedObjectIds.some((objectId) =>
      activeLessonStarterObjectIds.includes(objectId)
    )
      ? "起始教具需要保留"
      : undefined;
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
    setActiveLessonId(null);
    setActiveLessonStarterObjectIds([]);
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
    setActiveLessonId(lesson.id);
    setActiveLessonStarterObjectIds(
      result.scene.objects.map((object) => object.id)
    );
    setCompletedLessonSteps((steps) => ({ ...steps, [lesson.id]: [] }));
    setLessonReflectionNotes((notes) =>
      clearLessonReflectionNote(notes, lesson.id)
    );
    setLessonCheckResult(null);
    setVisibleLessonHint(null);
    setLessonHintIndex(0);
  };

  const resetLesson = (lesson: LessonCard) => {
    const confirmed = window.confirm("重置任务会恢复初始画布，是否继续？");

    if (!confirmed) {
      return;
    }

    loadScene(lesson.starterScene);
    setFileMessage(`已重置任务卡：${lesson.title}`);
    setActiveLessonId(lesson.id);
    setActiveLessonStarterObjectIds(
      lesson.starterScene.objects.map((object) => object.id)
    );
    setCompletedLessonSteps((steps) => ({ ...steps, [lesson.id]: [] }));
    setLessonReflectionNotes((notes) =>
      clearLessonReflectionNote(notes, lesson.id)
    );
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

  const toggleLessonStep = (lesson: LessonCard, stepIndex: number) => {
    setCompletedLessonSteps((steps) => {
      const currentSteps = steps[lesson.id] ?? [];

      return {
        ...steps,
        [lesson.id]: toggleLessonStepIndex(currentSteps, stepIndex)
      };
    });
  };

  const addExplanationLabel = (lesson: LessonCard) => {
    if (!lesson.starterLabelText) {
      return;
    }

    addDemoObject("demo-text", { text: lesson.starterLabelText });
    setFileMessage("已添加解释标签。");
  };

  const updateLessonReflection = (lesson: LessonCard, note: string) => {
    setLessonReflectionNotes((notes) =>
      updateLessonReflectionNote(notes, lesson.id, note)
    );
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
    "geometry-tangram": addTangramSet,
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
                  disabled={!isToolButtonAllowedInLesson(buttonId, activeLesson)}
                  disabledReason="当前任务暂不使用这个工具"
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
      <MathCanvas
        canDeleteSelectedObjects={canDeleteSelection}
        deleteDisabledReason={deleteDisabledReason}
        onDeleteBlocked={() => {
          if (deleteDisabledReason) {
            setFileMessage(deleteDisabledReason);
          }
        }}
      />
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
            isActive={activeLessonId === selectedLesson.id}
            completedStepIndexes={completedLessonSteps[selectedLesson.id] ?? []}
            checkResult={lessonCheckResult}
            reflectionNote={lessonReflectionNotes[selectedLesson.id] ?? ""}
            toolSummary={getLessonToolSummary(selectedLesson, TOOL_CATEGORIES)}
            visibleHint={visibleLessonHint}
            onCheck={checkCurrentLesson}
            onReset={resetLesson}
            onShowHint={showLessonHint}
            onStart={startLesson}
            onToggleStep={toggleLessonStep}
            onAddExplanationLabel={addExplanationLabel}
            onReflectionNoteChange={updateLessonReflection}
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
  disabled = false,
  disabledReason,
  onClick
}: {
  buttonId: string;
  active?: boolean;
  disabled?: boolean;
  disabledReason?: string;
  onClick: () => void;
}) {
  const copy = getToolButtonCopy(buttonId);
  const disabledTitle = disabled ? disabledReason : undefined;

  return (
    <button
      type="button"
      className={active ? "tool-button tool-button-active" : "tool-button"}
      aria-label={
        disabledReason && disabled
          ? `${copy.ariaLabel}（${disabledReason}）`
          : copy.ariaLabel
      }
      disabled={disabled}
      title={disabledTitle}
      onClick={onClick}
    >
      <ToolIcon name={copy.icon} />
      <span className="tool-button-copy">
        <span>{copy.label}</span>
        <small>{disabled ? "当前任务暂不使用" : copy.englishLabel}</small>
      </span>
    </button>
  );
}

function ToolIcon({ name }: { name: string }) {
  const commonProps = {
    className: `tool-icon tool-icon-${name}`,
    viewBox: "0 0 32 32",
    "aria-hidden": true,
    focusable: false
  };

  if (name === "circle" || name === "fraction-circle") {
    return (
      <svg {...commonProps}>
        <circle cx="16" cy="16" r="11" />
        {name === "fraction-circle" ? <path d="M16 5 A11 11 0 0 1 27 16 L16 16 Z" /> : null}
      </svg>
    );
  }

  if (name === "triangle") {
    return (
      <svg {...commonProps}>
        <path d="M16 5 L28 26 H4 Z" />
      </svg>
    );
  }

  if (name === "square" || name === "algebra" || name === "algebra-x") {
    return (
      <svg {...commonProps}>
        <rect x="7" y="7" width="18" height="18" rx="3" />
        {name === "algebra-x" ? <text x="16" y="21">x</text> : null}
      </svg>
    );
  }

  if (name === "algebra-x2") {
    return (
      <svg {...commonProps}>
        <rect x="6" y="6" width="20" height="20" rx="3" />
        <text x="16" y="21">x²</text>
      </svg>
    );
  }

  if (name === "rectangle" || name === "fraction-bar") {
    return (
      <svg {...commonProps}>
        <rect x="4" y="10" width="24" height="12" rx="3" />
        {name === "fraction-bar" ? <line x1="16" y1="10" x2="16" y2="22" /> : null}
      </svg>
    );
  }

  if (name === "hexagon") {
    return (
      <svg {...commonProps}>
        <path d="M10 5 H22 L29 16 L22 27 H10 L3 16 Z" />
      </svg>
    );
  }

  if (name === "trapezoid") {
    return (
      <svg {...commonProps}>
        <path d="M10 8 H22 L28 24 H4 Z" />
      </svg>
    );
  }

  if (name === "parallelogram") {
    return (
      <svg {...commonProps}>
        <path d="M11 8 H28 L21 24 H4 Z" />
      </svg>
    );
  }

  if (name === "tangram") {
    return (
      <svg {...commonProps}>
        <path d="M4 4 L18 18 H4 Z" />
        <path d="M4 28 L18 18 H4 Z" />
        <path d="M28 4 V18 H14 Z" />
        <path d="M18 18 L28 18 L28 28 Z" />
        <path d="M18 18 L28 28 H18 Z" />
      </svg>
    );
  }

  if (name === "ruler") {
    return (
      <svg {...commonProps}>
        <rect x="4" y="11" width="24" height="10" rx="2" />
        <line x1="9" y1="11" x2="9" y2="17" />
        <line x1="14" y1="11" x2="14" y2="15" />
        <line x1="19" y1="11" x2="19" y2="17" />
        <line x1="24" y1="11" x2="24" y2="15" />
      </svg>
    );
  }

  if (name === "protractor") {
    return (
      <svg {...commonProps}>
        <path d="M5 24 A11 11 0 0 1 27 24 Z" />
        <line x1="16" y1="24" x2="23" y2="15" />
      </svg>
    );
  }

  if (name === "angle") {
    return (
      <svg {...commonProps}>
        <path d="M8 24 H25" />
        <path d="M8 24 L22 10" />
        <path d="M14 24 A6 6 0 0 1 12 19" />
      </svg>
    );
  }

  if (name === "line") {
    return (
      <svg {...commonProps}>
        <line x1="6" y1="16" x2="26" y2="16" />
        <circle cx="6" cy="16" r="3" />
        <circle cx="26" cy="16" r="3" />
      </svg>
    );
  }

  if (name === "balance") {
    return (
      <svg {...commonProps}>
        <line x1="16" y1="8" x2="16" y2="26" />
        <line x1="7" y1="12" x2="25" y2="12" />
        <path d="M8 12 L4 21 H12 Z" />
        <path d="M24 12 L20 21 H28 Z" />
      </svg>
    );
  }

  if (name === "save" || name === "open" || name === "export" || name === "trash") {
    return (
      <svg {...commonProps}>
        <rect x="7" y="6" width="18" height="20" rx="3" />
        {name === "open" ? <path d="M10 15 H22 M16 9 V21" /> : null}
        {name === "export" ? <path d="M16 20 V8 M11 13 L16 8 L21 13" /> : null}
        {name === "trash" ? <path d="M10 11 H22 M13 11 V24 M19 11 V24" /> : null}
        {name === "save" ? <path d="M11 8 H21 V14 H11 Z M11 21 H21" /> : null}
      </svg>
    );
  }

  if (name === "text") {
    return (
      <svg {...commonProps}>
        <path d="M8 9 H24 M16 9 V25" />
      </svg>
    );
  }

  return (
    <svg {...commonProps}>
      <rect x="7" y="7" width="18" height="18" rx="5" />
      <text x="16" y="21">{name === "five" ? "5" : name === "ten" ? "10" : "1"}</text>
    </svg>
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
  const shouldKeepAspectRatio = shouldPreserveObjectAspectRatio(object);

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
        onChange={(value) =>
          onChange(
            shouldKeepAspectRatio
              ? { scaleX: value, scaleY: value }
              : { scaleX: value }
          )
        }
      />
      <NumberPropertyField
        label="纵向缩放"
        value={object.scaleY}
        min={MIN_MANUAL_SCALE}
        onChange={(value) =>
          onChange(
            shouldKeepAspectRatio
              ? { scaleX: value, scaleY: value }
              : { scaleY: value }
          )
        }
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

export function LessonPreview({
  lesson,
  isActive,
  completedStepIndexes,
  checkResult,
  reflectionNote,
  toolSummary,
  visibleHint,
  onCheck,
  onReset,
  onShowHint,
  onStart,
  onToggleStep,
  onAddExplanationLabel,
  onReflectionNoteChange
}: {
  lesson: LessonCard;
  isActive: boolean;
  completedStepIndexes: number[];
  checkResult: LessonCheckResult | null;
  reflectionNote: string;
  toolSummary: string;
  visibleHint: string | null;
  onCheck: (lesson: LessonCard) => void;
  onReset: (lesson: LessonCard) => void;
  onShowHint: (lesson: LessonCard) => void;
  onStart: (lesson: LessonCard) => void;
  onToggleStep: (lesson: LessonCard, stepIndex: number) => void;
  onAddExplanationLabel: (lesson: LessonCard) => void;
  onReflectionNoteChange: (lesson: LessonCard, note: string) => void;
}) {
  const hasExplanationPrompts =
    lesson.explanationPrompts && lesson.explanationPrompts.length > 0;

  return (
    <section className="lesson-preview">
      <div className="lesson-preview-header">
        <p>{lesson.gradeBand}</p>
        <h3>{lesson.title}</h3>
      </div>
      <p>{lesson.description}</p>
      <p className="lesson-tool-summary">{toolSummary}</p>
      <h4>家长引导</h4>
      <p>{lesson.parentGuide}</p>
      <h4>任务步骤</h4>
      <ol className="lesson-step-list">
        {lesson.instructions.map((instruction, index) => (
          <li key={instruction}>
            <label className="lesson-step-check">
              <input
                type="checkbox"
                checked={completedStepIndexes.includes(index)}
                onChange={() => onToggleStep(lesson, index)}
              />
              <span>{instruction}</span>
            </label>
          </li>
        ))}
      </ol>
      <h4>完成标准</h4>
      <ul>
        {lesson.successCriteria.map((criterion) => (
          <li key={criterion}>{criterion}</li>
        ))}
      </ul>
      <h4>复盘问题</h4>
      <ul>
        {lesson.reflectionPrompts.map((prompt) => (
          <li key={prompt}>{prompt}</li>
        ))}
      </ul>
      <label className="lesson-reflection-note">
        <span>本次复盘</span>
        <textarea
          value={reflectionNote}
          placeholder="写下孩子今天说清楚的一句话。"
          rows={3}
          onChange={(event) =>
            onReflectionNoteChange(lesson, event.target.value)
          }
        />
      </label>
      {hasExplanationPrompts ? (
        <>
          <h4>说一说/写一写</h4>
          <ul>
            {lesson.explanationPrompts?.map((prompt) => (
              <li key={prompt}>{prompt}</li>
            ))}
          </ul>
        </>
      ) : null}
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
      <div className="lesson-actions">
        <button
          type="button"
          className="property-action-button"
          aria-label={`开始任务：${lesson.title}`}
          onClick={() => onStart(lesson)}
        >
          开始任务
        </button>
        {isActive ? (
          <button
            type="button"
            className="property-action-button"
            aria-label={`重置任务：${lesson.title}`}
            onClick={() => onReset(lesson)}
          >
            重置任务
          </button>
        ) : null}
        {isActive && lesson.starterLabelText ? (
          <button
            type="button"
            className="property-action-button"
            aria-label={`添加解释标签：${lesson.title}`}
            onClick={() => onAddExplanationLabel(lesson)}
          >
            添加解释标签
          </button>
        ) : null}
      </div>
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
