import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ErrorBoundary, ErrorBoundaryFallback } from "./ErrorBoundary";

describe("ErrorBoundary", () => {
  it("switches to fallback state when a child render fails", () => {
    expect(ErrorBoundary.getDerivedStateFromError(new Error("render failed"))).toEqual({
      hasError: true
    });
  });

  it("renders a Chinese fallback message", () => {
    const html = renderToStaticMarkup(
      <ErrorBoundaryFallback title="教具显示失败" message="请删除后重新添加。" />
    );

    expect(html).toContain("教具显示失败");
    expect(html).toContain("请删除后重新添加。");
  });
});
