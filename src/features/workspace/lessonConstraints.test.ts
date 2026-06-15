import { describe, expect, it } from "vitest";
import { LESSON_CARDS, type LessonCard } from "../lessons/lessons";
import {
  canDeleteSelectedObjectsInLesson,
  getEffectiveLessonConstraints,
  getLessonToolSummary,
  isToolButtonAllowedInLesson
} from "./lessonConstraints";
import { TOOL_CATEGORIES } from "./workspaceUi";

describe("lesson constraints", () => {
  it("keeps legacy lesson cards unrestricted when constraints are missing", () => {
    const legacyLesson: LessonCard = {
      ...LESSON_CARDS[0],
      constraints: undefined
    };

    const constraints = getEffectiveLessonConstraints(legacyLesson);

    expect(constraints.allowAddObjects).toBe(true);
    expect(constraints.allowDeleteStarterObjects).toBe(true);
    expect(isToolButtonAllowedInLesson("fraction-bar-half", legacyLesson)).toBe(
      true
    );
  });

  it("allows only matching object tool categories while keeping help and files available", () => {
    const lesson: LessonCard = {
      ...LESSON_CARDS[0],
      constraints: {
        allowedToolCategories: ["numbers"]
      }
    };

    expect(isToolButtonAllowedInLesson("number-1", lesson)).toBe(true);
    expect(isToolButtonAllowedInLesson("ten-frame-empty", lesson)).toBe(true);
    expect(isToolButtonAllowedInLesson("fraction-bar-half", lesson)).toBe(false);
    expect(isToolButtonAllowedInLesson("help", lesson)).toBe(true);
    expect(isToolButtonAllowedInLesson("file-save-json", lesson)).toBe(true);
  });

  it("blocks object tool buttons when a lesson disallows adding objects", () => {
    const lesson: LessonCard = {
      ...LESSON_CARDS[0],
      constraints: {
        allowAddObjects: false
      }
    };

    expect(isToolButtonAllowedInLesson("number-1", lesson)).toBe(false);
    expect(isToolButtonAllowedInLesson("help", lesson)).toBe(true);
    expect(isToolButtonAllowedInLesson("file-export-svg", lesson)).toBe(true);
  });

  it("protects starter objects from deletion while allowing new objects", () => {
    const lesson: LessonCard = {
      ...LESSON_CARDS[0],
      constraints: {
        allowDeleteStarterObjects: false
      }
    };

    expect(
      canDeleteSelectedObjectsInLesson(["starter-1"], ["starter-1"], lesson)
    ).toBe(false);
    expect(
      canDeleteSelectedObjectsInLesson(["new-1"], ["starter-1"], lesson)
    ).toBe(true);
    expect(
      canDeleteSelectedObjectsInLesson(["starter-1", "new-1"], ["starter-1"], lesson)
    ).toBe(false);
  });

  it("summarizes allowed task tools for family-facing lesson copy", () => {
    const lesson: LessonCard = {
      ...LESSON_CARDS[0],
      constraints: {
        allowedToolCategories: ["numbers", "common"]
      }
    };

    expect(getLessonToolSummary(lesson, TOOL_CATEGORIES)).toBe(
      "本任务可用工具：常用、数字"
    );
  });
});
