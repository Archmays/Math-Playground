import { describe, expect, it } from "vitest";
import { createScene } from "../../core/scene";
import { deserializeScene, serializeScene } from "../../core/sceneSerialization";
import { createNumberTile } from "../../manipulatives/numberTiles/numberTiles";
import { isTenFrameObject } from "../../manipulatives/tenFrames/tenFrames";
import {
  LESSON_CARDS,
  checkLessonCard,
  filterLessonCards,
  loadLessonCard
} from "./lessons";

describe("lesson cards", () => {
  it("loadLessonCard loads a starter scene when the current scene is empty", () => {
    const currentScene = createScene({
      id: "current-empty",
      now: "2026-06-14T00:00:00.000Z"
    });
    const result = loadLessonCard(LESSON_CARDS[0], currentScene);

    expect(result.status).toBe("loaded");
    expect(result.scene.id).toBe(LESSON_CARDS[0].starterScene.id);
    expect(result.scene.objects.length).toBeGreaterThan(0);
  });

  it("all starter scenes are valid serializable scene JSON", () => {
    expect(LESSON_CARDS).toHaveLength(8);

    for (const lesson of LESSON_CARDS) {
      const result = deserializeScene(serializeScene(lesson.starterScene));

      expect(result.ok).toBe(true);
      if (!result.ok) {
        continue;
      }
      expect(result.scene.objects.length).toBeGreaterThan(0);
    }
  });

  it("filters lesson list by topic, grade band, and query", () => {
    expect(filterLessonCards(LESSON_CARDS, { topic: "分数" })).toHaveLength(2);
    expect(filterLessonCards(LESSON_CARDS, { gradeBand: "3-5" }).length).toBeGreaterThan(0);
    expect(filterLessonCards(LESSON_CARDS, { query: "天平" }).map((lesson) => lesson.id)).toEqual([
      "balance-equation-3-4-7"
    ]);
  });

  it("does not replace a non-empty scene without confirmation", () => {
    const currentScene = createScene({
      id: "current-work",
      now: "2026-06-14T00:00:00.000Z",
      objects: [createNumberTile({ id: "number-keep", value: 9 })]
    });
    const result = loadLessonCard(LESSON_CARDS[0], currentScene, {
      confirmOverwrite: false
    });

    expect(result.status).toBe("blocked");
    expect(result.scene).toBe(currentScene);
    expect(result.scene.objects[0].id).toBe("number-keep");
  });

  it("replaces a non-empty scene after confirmation", () => {
    const currentScene = createScene({
      id: "current-work",
      now: "2026-06-14T00:00:00.000Z",
      objects: [createNumberTile({ id: "number-replace", value: 9 })]
    });
    const result = loadLessonCard(LESSON_CARDS[0], currentScene, {
      confirmOverwrite: true
    });

    expect(result.status).toBe("loaded");
    expect(result.scene.id).toBe(LESSON_CARDS[0].starterScene.id);
    expect(result.scene.objects.some((object) => object.id === "number-replace")).toBe(false);
  });

  it("checks make ten with selected math total or a full ten frame", () => {
    const lesson = LESSON_CARDS.find((card) => card.id === "make-ten-7-3");
    expect(lesson).toBeDefined();
    if (!lesson) {
      return;
    }

    const selectedIds = lesson.starterScene.objects.map((object) => object.id);
    const selectedResult = checkLessonCard(
      lesson,
      lesson.starterScene,
      selectedIds
    );

    expect(selectedResult.isCorrect).toBe(true);
    expect(selectedResult.message).toBe(lesson.feedback.correct);
  });

  it("checks regrouping when total is 13 and a ten frame is full", () => {
    const lesson = LESSON_CARDS.find((card) => card.id === "regroup-8-5");
    expect(lesson).toBeDefined();
    if (!lesson) {
      return;
    }

    const tenFrames = lesson.starterScene.objects.filter(isTenFrameObject);
    expect(tenFrames.map((object) => object.data.filledCount)).toEqual([8, 5]);
    expect(lesson.starterScene.objects).toHaveLength(2);

    const initialResult = checkLessonCard(lesson, lesson.starterScene);
    expect(initialResult.isCorrect).toBe(false);

    const completedScene = {
      ...lesson.starterScene,
      objects: tenFrames.map((object) =>
        object.id === "lesson-ten-frame-8"
          ? {
              ...object,
              data: {
                ...object.data,
                fillMode: "manual" as const,
                filledCount: 10,
                tokenPositions: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
              }
            }
          : {
              ...object,
              data: {
                ...object.data,
                fillMode: "manual" as const,
                filledCount: 3,
                tokenPositions: [2, 3, 4]
              }
            }
      )
    };
    const result = checkLessonCard(lesson, completedScene);

    expect(result.isCorrect).toBe(true);
  });

  it("checks equivalent fractions when 1/2 and 2/4 are present", () => {
    const lesson = LESSON_CARDS.find(
      (card) => card.id === "fraction-equivalent-1-2-2-4"
    );
    expect(lesson).toBeDefined();
    if (!lesson) {
      return;
    }

    const result = checkLessonCard(lesson, lesson.starterScene);

    expect(result.isCorrect).toBe(true);
  });

  it("checks balanced scale when a balance scale has equal sides", () => {
    const lesson = LESSON_CARDS.find((card) => card.id === "balance-equation-3-4-7");
    expect(lesson).toBeDefined();
    if (!lesson) {
      return;
    }

    const result = checkLessonCard(lesson, lesson.starterScene);

    expect(result.isCorrect).toBe(true);
  });

  it("checks algebra expression when algebra tiles simplify to 2x + 3", () => {
    const lesson = LESSON_CARDS.find((card) => card.id === "algebra-tiles-2x-3");
    expect(lesson).toBeDefined();
    if (!lesson) {
      return;
    }

    const result = checkLessonCard(lesson, lesson.starterScene);

    expect(result.isCorrect).toBe(true);
  });

  it("returns friendly feedback and a limited hint when the answer is not correct", () => {
    const lesson = LESSON_CARDS.find((card) => card.id === "make-ten-7-3");
    expect(lesson).toBeDefined();
    if (!lesson) {
      return;
    }
    const result = checkLessonCard(lesson, lesson.starterScene, [], 0);

    expect(result.isCorrect).toBe(false);
    expect(result.message).toBe(lesson.feedback.incorrect);
    expect(result.hint).toBe(lesson.hints[0]);
    expect(result.message).not.toContain("7 + 3 = 10");
  });

  it("returns teacher-check feedback for lessons without automatic checks", () => {
    const lesson = LESSON_CARDS.find((card) => card.id === "area-array-3-by-4");
    expect(lesson).toBeDefined();
    if (!lesson) {
      return;
    }
    const result = checkLessonCard(lesson, lesson.starterScene);

    expect(result.isCorrect).toBeNull();
    expect(result.message).toBe("请和老师一起检查。");
  });
});
