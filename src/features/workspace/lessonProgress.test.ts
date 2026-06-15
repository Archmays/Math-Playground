import { describe, expect, it } from "vitest";
import { toggleLessonStepIndex } from "./lessonProgress";

describe("lesson progress helpers", () => {
  it("toggles step indexes while keeping them sorted", () => {
    expect(toggleLessonStepIndex([], 2)).toEqual([2]);
    expect(toggleLessonStepIndex([2], 0)).toEqual([0, 2]);
    expect(toggleLessonStepIndex([0, 2], 2)).toEqual([0]);
  });
});
