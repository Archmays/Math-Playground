export function updateLessonReflectionNote(
  notes: Record<string, string>,
  lessonId: string,
  note: string
): Record<string, string> {
  return {
    ...notes,
    [lessonId]: note
  };
}

export function clearLessonReflectionNote(
  notes: Record<string, string>,
  lessonId: string
): Record<string, string> {
  const { [lessonId]: _cleared, ...remainingNotes } = notes;

  return remainingNotes;
}
