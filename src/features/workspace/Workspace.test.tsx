import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { LESSON_CARDS } from "../lessons/lessons";
import { LessonPreview } from "./Workspace";

describe("LessonPreview", () => {
  it("renders explanation prompts and the explanation label action for active lessons", () => {
    const lesson = {
      ...LESSON_CARDS[0],
      explanationPrompts: ["说说你怎么知道还差多少。"],
      starterLabelText: "我发现还差 3 个。"
    };
    const html = renderToStaticMarkup(
      <LessonPreview
        lesson={lesson}
        isActive={true}
        completedStepIndexes={[]}
        checkResult={null}
        toolSummary="本任务可用工具：数字"
        reflectionNote="孩子能说出还差 3。"
        visibleHint={null}
        onCheck={() => undefined}
        onReset={() => undefined}
        onShowHint={() => undefined}
        onStart={() => undefined}
        onToggleStep={() => undefined}
        onAddExplanationLabel={() => undefined}
        onReflectionNoteChange={() => undefined}
      />
    );

    expect(html).toContain("说一说/写一写");
    expect(html).toContain("说说你怎么知道还差多少。");
    expect(html).toContain("添加解释标签");
    expect(html).toContain("本次复盘");
    expect(html).toContain("孩子能说出还差 3。");
  });
});
