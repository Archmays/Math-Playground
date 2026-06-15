import type {
  LessonCard,
  LessonConstraints,
  LessonToolCategoryId
} from "../lessons/lessons";
import { TOOL_CATEGORIES, type ToolCategoryCopy } from "./workspaceUi";

interface EffectiveLessonConstraints {
  allowedToolCategories?: LessonConstraints["allowedToolCategories"];
  allowAddObjects: boolean;
  allowDeleteStarterObjects: boolean;
}

const ALWAYS_AVAILABLE_CATEGORY_IDS = new Set(["tasks", "files"]);
const LESSON_TOOL_CATEGORY_IDS = new Set<LessonToolCategoryId>([
  "common",
  "numbers",
  "fractions",
  "geometry"
]);

export function getEffectiveLessonConstraints(
  lesson: LessonCard | null | undefined
): EffectiveLessonConstraints {
  return {
    allowedToolCategories: lesson?.constraints?.allowedToolCategories,
    allowAddObjects: lesson?.constraints?.allowAddObjects ?? true,
    allowDeleteStarterObjects:
      lesson?.constraints?.allowDeleteStarterObjects ?? true
  };
}

export function isToolButtonAllowedInLesson(
  buttonId: string,
  lesson: LessonCard | null | undefined,
  categories: ToolCategoryCopy[] = TOOL_CATEGORIES
): boolean {
  if (!lesson) {
    return true;
  }

  const category = categories.find((item) => item.buttonIds.includes(buttonId));

  if (!category || ALWAYS_AVAILABLE_CATEGORY_IDS.has(category.id)) {
    return true;
  }

  const constraints = getEffectiveLessonConstraints(lesson);

  if (!constraints.allowAddObjects) {
    return false;
  }

  return (
    !constraints.allowedToolCategories ||
    (isLessonToolCategoryId(category.id) &&
      constraints.allowedToolCategories.includes(category.id))
  );
}

export function canDeleteSelectedObjectsInLesson(
  selectedObjectIds: string[],
  starterObjectIds: string[],
  lesson: LessonCard | null | undefined
): boolean {
  if (selectedObjectIds.length === 0) {
    return false;
  }

  const constraints = getEffectiveLessonConstraints(lesson);

  if (constraints.allowDeleteStarterObjects) {
    return true;
  }

  const starterIds = new Set(starterObjectIds);

  return selectedObjectIds.every((objectId) => !starterIds.has(objectId));
}

export function getLessonToolSummary(
  lesson: LessonCard,
  categories: ToolCategoryCopy[] = TOOL_CATEGORIES
): string {
  const constraints = getEffectiveLessonConstraints(lesson);

  if (!constraints.allowAddObjects) {
    return "本任务可用工具：不新增教具，只操作起始教具";
  }

  if (!constraints.allowedToolCategories) {
    return "本任务可用工具：全部工具";
  }

  const labels = categories
    .filter(
      (category) =>
        !ALWAYS_AVAILABLE_CATEGORY_IDS.has(category.id) &&
        isLessonToolCategoryId(category.id) &&
        constraints.allowedToolCategories?.includes(category.id)
    )
    .map((category) => category.label);

  return labels.length > 0
    ? `本任务可用工具：${labels.join("、")}`
    : "本任务可用工具：不新增教具，只操作起始教具";
}

function isLessonToolCategoryId(id: string): id is LessonToolCategoryId {
  return LESSON_TOOL_CATEGORY_IDS.has(id as LessonToolCategoryId);
}
