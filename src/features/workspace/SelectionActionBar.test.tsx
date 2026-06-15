import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { createObject } from "../../core/scene";
import { createFractionBar } from "../../manipulatives/fractionBars/fractionBars";
import { createGeometryTile } from "../../manipulatives/geometryTiles/geometryTiles";
import { SelectionActionBar, getLabelTogglePatch } from "./SelectionActionBar";

describe("SelectionActionBar", () => {
  it("renders nearby actions for selected objects", () => {
    const html = renderToStaticMarkup(
      <SelectionActionBar
        selectedObjects={[
          createObject({
            id: "rect-1",
            type: "demo-rectangle",
            data: { width: 80, height: 48 }
          })
        ]}
        style={{ left: 10, top: 20 }}
        onDuplicate={() => undefined}
        onDelete={() => undefined}
        onToggleLocked={() => undefined}
        onHide={() => undefined}
        onResetRotation={() => undefined}
        onToggleLabel={() => undefined}
      />
    );

    expect(html).toContain("复制");
    expect(html).toContain("删除");
    expect(html).toContain("锁定");
    expect(html).toContain("旋转归零");
  });

  it("disables delete when the active lesson protects selected objects", () => {
    const html = renderToStaticMarkup(
      <SelectionActionBar
        selectedObjects={[
          createObject({
            id: "rect-1",
            type: "demo-rectangle",
            data: { width: 80, height: 48 }
          })
        ]}
        style={{ left: 10, top: 20 }}
        canDelete={false}
        deleteDisabledReason="起始教具需要保留"
        onDuplicate={() => undefined}
        onDelete={() => undefined}
        onToggleLocked={() => undefined}
        onHide={() => undefined}
        onResetRotation={() => undefined}
        onToggleLabel={() => undefined}
      />
    );

    expect(html).toContain("disabled");
    expect(html).toContain("起始教具需要保留");
  });

  it("creates the correct label toggle patch for supported object types", () => {
    const geometry = createGeometryTile({
      id: "geometry-1",
      shape: "square",
      showLabel: true
    });
    const fraction = createFractionBar({
      id: "fraction-1",
      numerator: 1,
      denominator: 2
    });

    expect(getLabelTogglePatch(geometry)).toEqual({
      data: { showLabel: false }
    });
    expect(getLabelTogglePatch(fraction)).toEqual({
      data: { showLabels: false }
    });
  });
});
