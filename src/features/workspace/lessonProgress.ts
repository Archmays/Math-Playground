export function toggleLessonStepIndex(
  completedStepIndexes: number[],
  stepIndex: number
): number[] {
  if (completedStepIndexes.includes(stepIndex)) {
    return completedStepIndexes.filter((index) => index !== stepIndex);
  }

  return [...completedStepIndexes, stepIndex].sort((a, b) => a - b);
}
