import { createScene, type Scene } from "../../core/scene";
import {
  createAlgebraTile,
  simplifyAlgebraTiles
} from "../../manipulatives/algebraTiles/algebraTiles";
import {
  createBalanceScale,
  isBalanceScaleObject
} from "../../manipulatives/balanceScale/balanceScale";
import {
  createFractionBar,
  isFractionBarObject
} from "../../manipulatives/fractionBars/fractionBars";
import { createGeometryTile } from "../../manipulatives/geometryTiles/geometryTiles";
import { createMeasurementTool } from "../../manipulatives/measurementTools/measurementTools";
import { createNumberTile } from "../../manipulatives/numberTiles/numberTiles";
import {
  countSelectedMathValue,
  createTenFrame,
  isTenFrameObject
} from "../../manipulatives/tenFrames/tenFrames";

export type LessonCheckType =
  | "none"
  | "object-count"
  | "selected-sum"
  | "scene-predicate";

export type LessonPredicateId =
  | "make-ten"
  | "regrouping-13-full-ten"
  | "equivalent-1-2-2-4"
  | "balanced-scale"
  | "algebra-2x-plus-3";

export type LessonExpected =
  | null
  | { objectType: string; count: number }
  | { value: number }
  | { predicateId: LessonPredicateId };

export interface LessonFeedback {
  correct: string;
  incorrect: string;
}

export interface LessonCheckResult {
  isCorrect: boolean | null;
  message: string;
  hint?: string;
}

export interface LessonCard {
  id: string;
  title: string;
  gradeBand: string;
  topic: string;
  description: string;
  instructions: string[];
  starterScene: Scene;
  successCriteria: string[];
  hints: string[];
  checkType: LessonCheckType;
  expected: LessonExpected;
  feedback: LessonFeedback;
}

export interface LessonFilter {
  gradeBand?: string;
  topic?: string;
  query?: string;
}

export type LoadLessonResult =
  | { status: "loaded"; scene: Scene; lesson: LessonCard }
  | { status: "blocked"; scene: Scene; lesson: LessonCard; reason: string };

const NOW = "2026-06-14T00:00:00.000Z";

export const LESSON_CARDS: LessonCard[] = [
  {
    id: "make-ten-7-3",
    title: "凑十：7 + 3",
    gradeBand: "1-2",
    topic: "凑十",
    description: "用十格阵把 7 补到 10，理解 7 + 3 的凑十结构。",
    instructions: [
      "观察十格阵里已有的 7 个点。",
      "把数字方块 3 看作要补进去的数量。",
      "说出 7 还差 3 到 10。"
    ],
    starterScene: createScene({
      id: "lesson-make-ten-7-3",
      title: "凑十：7 + 3",
      now: NOW,
      objects: [
        createTenFrame({ id: "lesson-ten-frame-7", filledCount: 7, x: 96, y: 112 }),
        createNumberTile({ id: "lesson-number-3", value: 3, x: 360, y: 128 })
      ]
    }),
    successCriteria: ["能说出 7 + 3 = 10", "能说明 7 还差 3 到 10"],
    hints: ["先数十格阵里的空格。", "把 3 个点补到空格里。"],
    checkType: "scene-predicate",
    expected: { predicateId: "make-ten" },
    feedback: {
      correct: "很好，已经凑成 10 了。",
      incorrect: "再检查一下：你是否已经凑满一个十格阵，或选中了总值为 10 的教具？"
    }
  },
  {
    id: "regroup-8-5",
    title: "进位：8 + 5",
    gradeBand: "1-2",
    topic: "进位",
    description: "用十格阵表示先凑十，再加剩下的数。",
    instructions: [
      "观察 8 点十格阵。",
      "把 5 拆成 2 和 3。",
      "先用 2 补满十格阵，再把剩下的 3 加上。"
    ],
    starterScene: createScene({
      id: "lesson-regroup-8-5",
      title: "进位：8 + 5",
      now: NOW,
      objects: [
        createTenFrame({ id: "lesson-ten-frame-10", filledCount: 10, x: 96, y: 112 }),
        createNumberTile({ id: "lesson-number-3", value: 3, x: 360, y: 128 })
      ]
    }),
    successCriteria: ["能解释 8 + 5 = 10 + 3", "能得到结果 13"],
    hints: ["先看十格阵缺几个。", "把 5 拆成补十的一部分和剩下的一部分。"],
    checkType: "scene-predicate",
    expected: { predicateId: "regrouping-13-full-ten" },
    feedback: {
      correct: "很好，你已经表示出总数 13，并且有一个满十格阵。",
      incorrect: "再看一看：画布里是否有一个满十格阵，并且总值已经表示完整？"
    }
  },
  {
    id: "fraction-equivalent-1-2-2-4",
    title: "分数等值：1/2 = 2/4",
    gradeBand: "3-5",
    topic: "分数",
    description: "比较两条长度相同的分数条，观察 1/2 和 2/4 的覆盖长度。",
    instructions: [
      "把 1/2 和 2/4 分数条左端对齐。",
      "观察两条分数条填色部分的长度。",
      "用自己的话说明它们为什么相等。"
    ],
    starterScene: createScene({
      id: "lesson-fraction-equivalent",
      title: "分数等值：1/2 = 2/4",
      now: NOW,
      objects: [
        createFractionBar({ id: "lesson-bar-1-2", numerator: 1, denominator: 2, x: 96, y: 112 }),
        createFractionBar({ id: "lesson-bar-2-4", numerator: 2, denominator: 4, x: 96, y: 184 })
      ]
    }),
    successCriteria: ["能指出两条填色长度相同", "能说出 1/2 = 2/4"],
    hints: ["只比较填色长度。", "注意两条分数条的总长一样。"],
    checkType: "scene-predicate",
    expected: { predicateId: "equivalent-1-2-2-4" },
    feedback: {
      correct: "很好，画布里已经有 1/2 和 2/4。",
      incorrect: "再检查一下两条分数条：需要出现同样总长的 1/2 和 2/4。"
    }
  },
  {
    id: "fraction-compare-3-4-2-3",
    title: "分数比较：3/4 和 2/3",
    gradeBand: "3-5",
    topic: "分数",
    description: "用等长分数条比较 3/4 和 2/3 的大小。",
    instructions: [
      "把 3/4 和 2/3 分数条左端对齐。",
      "比较两条填色部分谁更长。",
      "写出比较结果。"
    ],
    starterScene: createScene({
      id: "lesson-fraction-compare",
      title: "分数比较：3/4 和 2/3",
      now: NOW,
      objects: [
        createFractionBar({ id: "lesson-bar-3-4", numerator: 3, denominator: 4, x: 96, y: 112 }),
        createFractionBar({ id: "lesson-bar-2-3", numerator: 2, denominator: 3, x: 96, y: 184 })
      ]
    }),
    successCriteria: ["能判断 3/4 大于 2/3", "能用可视化长度解释原因"],
    hints: ["左端对齐后看右端。", "填色部分更长的分数更大。"],
    checkType: "none",
    expected: null,
    feedback: {
      correct: "请和老师一起检查。",
      incorrect: "请和老师一起检查。"
    }
  },
  {
    id: "area-array-3-by-4",
    title: "面积拼图：3 × 4",
    gradeBand: "3-5",
    topic: "面积",
    description: "用 12 个小正方形拼出 3 行 4 列，理解乘法和面积。",
    instructions: [
      "观察画布上的 12 个小正方形。",
      "把它们整理成 3 行 4 列。",
      "数一数总共有几个面积单位。"
    ],
    starterScene: createScene({
      id: "lesson-area-3-by-4",
      title: "面积拼图：3 × 4",
      now: NOW,
      objects: Array.from({ length: 12 }, (_value, index) =>
        createGeometryTile({
          id: `lesson-area-square-${index + 1}`,
          shape: "square",
          width: 40,
          height: 40,
          showLabel: false,
          x: 96 + (index % 4) * 48,
          y: 112 + Math.floor(index / 4) * 48
        })
      )
    }),
    successCriteria: ["能拼出 3 × 4 阵列", "能说出面积是 12 个单位"],
    hints: ["先排一行 4 个。", "再复制成 3 行。"],
    checkType: "none",
    expected: null,
    feedback: {
      correct: "请和老师一起检查。",
      incorrect: "请和老师一起检查。"
    }
  },
  {
    id: "angle-recognition-45-90-120",
    title: "角度认识：90°、45°、120°",
    gradeBand: "3-5",
    topic: "角度",
    description: "观察三个角度标注，比较锐角、直角和钝角。",
    instructions: [
      "观察 45°、90°、120° 三个角。",
      "把它们按从小到大排序。",
      "说出哪个是直角，哪个是锐角，哪个是钝角。"
    ],
    starterScene: createScene({
      id: "lesson-angle-recognition",
      title: "角度认识：90°、45°、120°",
      now: NOW,
      objects: [
        createMeasurementTool({ id: "lesson-angle-90", kind: "angleMarker", angle: 90, x: 96, y: 112 }),
        createMeasurementTool({ id: "lesson-angle-45", kind: "angleMarker", angle: 45, x: 256, y: 112 }),
        createMeasurementTool({ id: "lesson-angle-120", kind: "angleMarker", angle: 120, x: 416, y: 112 })
      ]
    }),
    successCriteria: ["能识别 90° 是直角", "能区分 45° 和 120° 的大小"],
    hints: ["小于 90° 的是锐角。", "大于 90° 且小于 180° 的是钝角。"],
    checkType: "none",
    expected: null,
    feedback: {
      correct: "请和老师一起检查。",
      incorrect: "请和老师一起检查。"
    }
  },
  {
    id: "balance-equation-3-4-7",
    title: "天平等式：3 + 4 = 7",
    gradeBand: "3-5",
    topic: "等式",
    description: "用天平表示 3 + 4 和 7 两边平衡。",
    instructions: [
      "观察天平两边都是 7。",
      "用左边的 3 和 4 说明 3 + 4 的总和。",
      "说出为什么天平保持平衡。"
    ],
    starterScene: createScene({
      id: "lesson-balance-equation",
      title: "天平等式：3 + 4 = 7",
      now: NOW,
      objects: [
        createBalanceScale({ id: "lesson-balance-3-4-7", leftValue: 7, rightValue: 7, x: 96, y: 112 }),
        createNumberTile({ id: "lesson-number-3", value: 3, x: 104, y: 288 }),
        createNumberTile({ id: "lesson-number-4", value: 4, x: 184, y: 288 }),
        createNumberTile({ id: "lesson-number-7", value: 7, x: 392, y: 288 })
      ]
    }),
    successCriteria: ["能说出 3 + 4 = 7", "能解释天平平衡代表两边相等"],
    hints: ["先合并左边两个数字方块。", "平衡表示左右值相同。"],
    checkType: "scene-predicate",
    expected: { predicateId: "balanced-scale" },
    feedback: {
      correct: "很好，天平左右两边已经相等。",
      incorrect: "再观察天平：左右两边的数值是否已经一样？"
    }
  },
  {
    id: "algebra-tiles-2x-3",
    title: "代数砖：2x + 3",
    gradeBand: "6-8",
    topic: "代数",
    description: "用两个 x 砖和三个 1 砖表示表达式 2x + 3。",
    instructions: [
      "观察两个 +x 代数砖。",
      "观察三个 +1 代数砖。",
      "多选这些砖，读出合并表达式。"
    ],
    starterScene: createScene({
      id: "lesson-algebra-2x-3",
      title: "代数砖：2x + 3",
      now: NOW,
      objects: [
        createAlgebraTile({ id: "lesson-algebra-x-1", tileKind: "x", sign: "positive", x: 96, y: 112 }),
        createAlgebraTile({ id: "lesson-algebra-x-2", tileKind: "x", sign: "positive", x: 96, y: 160 }),
        createAlgebraTile({ id: "lesson-algebra-1-1", tileKind: "unit", sign: "positive", x: 216, y: 112 }),
        createAlgebraTile({ id: "lesson-algebra-1-2", tileKind: "unit", sign: "positive", x: 256, y: 112 }),
        createAlgebraTile({ id: "lesson-algebra-1-3", tileKind: "unit", sign: "positive", x: 296, y: 112 })
      ]
    }),
    successCriteria: ["能用代数砖表示 2x + 3", "能说出两个 x 项和三个常数项"],
    hints: ["同形状的代数砖表示同类项。", "两个 x 砖合起来是 2x。"],
    checkType: "scene-predicate",
    expected: { predicateId: "algebra-2x-plus-3" },
    feedback: {
      correct: "很好，代数砖已经合并成 2x + 3。",
      incorrect: "再数一数：x 砖和 1 砖的数量是否符合目标表达式？"
    }
  }
];

export function filterLessonCards(
  lessons: LessonCard[],
  filter: LessonFilter
): LessonCard[] {
  const query = filter.query?.trim().toLowerCase() ?? "";

  return lessons.filter((lesson) => {
    if (filter.gradeBand && lesson.gradeBand !== filter.gradeBand) {
      return false;
    }

    if (filter.topic && lesson.topic !== filter.topic) {
      return false;
    }

    if (!query) {
      return true;
    }

    return `${lesson.title} ${lesson.description} ${lesson.topic}`
      .toLowerCase()
      .includes(query);
  });
}

export function loadLessonCard(
  lesson: LessonCard,
  currentScene: Scene,
  options: { confirmOverwrite?: boolean } = {}
): LoadLessonResult {
  if (currentScene.objects.length > 0 && !options.confirmOverwrite) {
    return {
      status: "blocked",
      scene: currentScene,
      lesson,
      reason: "当前画布已有内容，需要确认后才能载入任务卡。"
    };
  }

  return {
    status: "loaded",
    scene: cloneScene(lesson.starterScene),
    lesson
  };
}

export function checkLessonCard(
  lesson: LessonCard,
  scene: Scene,
  selectedObjectIds: string[] = [],
  hintIndex = 0
): LessonCheckResult {
  if (lesson.checkType === "none") {
    return {
      isCorrect: null,
      message: "请和老师一起检查。",
      hint: getHint(lesson, hintIndex)
    };
  }

  const isCorrect = evaluateLessonCheck(lesson, scene, selectedObjectIds);

  return {
    isCorrect,
    message: isCorrect ? lesson.feedback.correct : lesson.feedback.incorrect,
    hint: isCorrect ? undefined : getHint(lesson, hintIndex)
  };
}

function evaluateLessonCheck(
  lesson: LessonCard,
  scene: Scene,
  selectedObjectIds: string[]
): boolean {
  switch (lesson.checkType) {
    case "none":
      return false;
    case "object-count":
      if (!lesson.expected || !("objectType" in lesson.expected)) {
        return false;
      }
      {
        const expected = lesson.expected;

        return (
          scene.objects.filter(
            (object) => object.visible && object.type === expected.objectType
          ).length === expected.count
        );
      }
    case "selected-sum":
      if (!lesson.expected || !("value" in lesson.expected)) {
        return false;
      }

      return countSelectedMathValue(scene.objects, selectedObjectIds) === lesson.expected.value;
    case "scene-predicate":
      if (!lesson.expected || !("predicateId" in lesson.expected)) {
        return false;
      }

      return runLessonPredicate(
        lesson.expected.predicateId,
        scene,
        selectedObjectIds
      );
  }
}

function runLessonPredicate(
  predicateId: LessonPredicateId,
  scene: Scene,
  selectedObjectIds: string[]
): boolean {
  switch (predicateId) {
    case "make-ten":
      return (
        hasTenFrameWithFilledCount(scene, 10) ||
        countSelectedMathValue(scene.objects, selectedObjectIds) === 10
      );
    case "regrouping-13-full-ten":
      return hasTenFrameWithFilledCount(scene, 10) && getSceneMathTotal(scene) === 13;
    case "equivalent-1-2-2-4":
      return hasFractionBar(scene, 1, 2) && hasFractionBar(scene, 2, 4);
    case "balanced-scale":
      return scene.objects.some(
        (object) =>
          object.visible &&
          isBalanceScaleObject(object) &&
          object.data.leftValue === object.data.rightValue
      );
    case "algebra-2x-plus-3":
      return simplifyAlgebraTiles(scene.objects).expression === "2x + 3";
  }
}

function hasTenFrameWithFilledCount(scene: Scene, filledCount: number): boolean {
  return scene.objects.some(
    (object) =>
      object.visible &&
      isTenFrameObject(object) &&
      object.data.filledCount === filledCount
  );
}

function hasFractionBar(
  scene: Scene,
  numerator: number,
  denominator: number
): boolean {
  return scene.objects.some(
    (object) =>
      object.visible &&
      isFractionBarObject(object) &&
      object.data.numerator === numerator &&
      object.data.denominator === denominator
  );
}

function getSceneMathTotal(scene: Scene): number {
  return countSelectedMathValue(
    scene.objects,
    scene.objects.map((object) => object.id)
  );
}

function getHint(lesson: LessonCard, hintIndex: number): string | undefined {
  if (lesson.hints.length === 0) {
    return undefined;
  }

  return lesson.hints[Math.min(Math.max(0, hintIndex), lesson.hints.length - 1)];
}

function cloneScene(scene: Scene): Scene {
  return JSON.parse(JSON.stringify(scene)) as Scene;
}
