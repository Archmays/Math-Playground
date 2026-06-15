import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { AppHeader } from "../../components/AppHeader";
import {
  HELP_STEPS,
  TOOL_CATEGORIES,
  getToolButtonCopy
} from "./workspaceUi";

describe("workspace UI copy", () => {
  it("renders the app header with Chinese title copy", () => {
    const html = renderToStaticMarkup(<AppHeader />);

    expect(html).toContain("数学游乐场 Math Playground");
    expect(html).toContain("家庭与课堂");
  });

  it("groups tools into child-friendly Chinese categories", () => {
    expect(TOOL_CATEGORIES.map((category) => category.label)).toEqual([
      "任务",
      "常用",
      "数字",
      "分数",
      "几何",
      "文件"
    ]);
  });

  it("keeps every workspace tool in exactly one category", () => {
    const categorizedButtonIds = TOOL_CATEGORIES.flatMap(
      (category) => category.buttonIds
    );

    expect(new Set(categorizedButtonIds).size).toBe(categorizedButtonIds.length);
    expect(categorizedButtonIds).toEqual(
      expect.arrayContaining([
        "measurement-ruler",
        "number-line",
        "measurement-protractor",
        "balance-empty",
        "algebra-x2-negative",
        "file-export-png"
      ])
    );
    expect(categorizedButtonIds).toContain("coordinate-grid");
  });

  it("defines key tool buttons with Chinese labels and aria labels", () => {
    const keyButtons = [
      "help",
      "number-1",
      "ten-frame-empty",
      "fraction-bar-half",
      "fraction-circle-half",
      "geometry-square",
      "geometry-tangram",
      "coordinate-grid",
      "number-line",
      "measurement-ruler",
      "balance-empty",
      "algebra-x2-positive",
      "file-save-json"
    ];

    for (const id of keyButtons) {
      const copy = getToolButtonCopy(id);

      expect(copy.label.length).toBeGreaterThan(0);
      expect(copy.englishLabel.length).toBeGreaterThan(0);
      expect(copy.icon.length).toBeGreaterThan(0);
      expect(copy.ariaLabel.length).toBeGreaterThan(0);
    }
  });

  it("uses the geometry tools instead of duplicate demo shape buttons", () => {
    const geometry = TOOL_CATEGORIES.find((category) => category.id === "geometry");

    expect(geometry?.buttonIds).toContain("geometry-tangram");
    expect(geometry?.buttonIds).not.toContain("demo-rectangle");
    expect(geometry?.buttonIds).not.toContain("demo-circle");
  });

  it("provides short help steps for the main classroom workflow", () => {
    expect(HELP_STEPS.map((step) => step.title)).toEqual([
      "添加教具",
      "拖动教具",
      "复制/删除",
      "保存/读取",
      "打开任务卡"
    ]);
  });
});
