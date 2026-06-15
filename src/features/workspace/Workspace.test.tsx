import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { createObject } from "../../core/scene";
import { LESSON_CARDS } from "../lessons/lessons";
import { LayerOrderControls, LessonPreview } from "./Workspace";

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

describe("LayerOrderControls", () => {
  it("renders visibility controls for hidden objects", () => {
    const hidden = createObject({
      id: "hidden-rect",
      type: "demo-rectangle",
      label: "Hidden rectangle",
      visible: false,
      data: { width: 80, height: 48 }
    });
    const html = renderToStaticMarkup(
      <LayerOrderControls
        objects={[hidden]}
        selectedObjectIds={[]}
        onSelectObject={() => undefined}
        onToggleObjectVisible={() => undefined}
        onBringForward={() => undefined}
        onSendBackward={() => undefined}
        onBringToFront={() => undefined}
        onSendToBack={() => undefined}
      />
    );

    expect(html).toContain("Hidden rectangle");
    expect(html).toContain("type=\"checkbox\"");
    expect(html).toContain("aria-label=\"显示 Hidden rectangle\"");
  });
});
