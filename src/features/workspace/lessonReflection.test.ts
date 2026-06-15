import { describe, expect, it } from "vitest";
import {
  clearLessonReflectionNote,
  updateLessonReflectionNote
} from "./lessonReflection";

describe("lesson reflection notes", () => {
  it("updates and clears the reflection note for one active lesson", () => {
    const notes = updateLessonReflectionNote({}, "make-ten-7-3", "孩子能说出还差 3。");
    const nextNotes = updateLessonReflectionNote(
      notes,
      "fraction-equivalent-1-2-2-4",
      "孩子能对齐分数条。"
    );

    expect(nextNotes).toEqual({
      "make-ten-7-3": "孩子能说出还差 3。",
      "fraction-equivalent-1-2-2-4": "孩子能对齐分数条。"
    });
    expect(clearLessonReflectionNote(nextNotes, "make-ten-7-3")).toEqual({
      "fraction-equivalent-1-2-2-4": "孩子能对齐分数条。"
    });
  });
});
