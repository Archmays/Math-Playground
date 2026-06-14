import { describe, expect, it } from "vitest";
import { createEmptyBoard, parseBoard, serializeBoard } from "./board";

describe("board document serialization", () => {
  it("creates an empty Chinese board document", () => {
    const board = createEmptyBoard("分数练习");

    expect(board).toEqual({
      schemaVersion: 1,
      title: "分数练习",
      locale: "zh-CN",
      viewport: {
        x: 0,
        y: 0,
        zoom: 1
      },
      objects: []
    });
  });

  it("round trips board objects through JSON", () => {
    const board = createEmptyBoard("数字方块");
    board.objects.push({
      id: "tile-1",
      kind: "number-tile",
      position: { x: 120, y: 80 },
      rotation: 0,
      scale: 1,
      data: { value: 7, color: "yellow" }
    });

    const parsed = parseBoard(serializeBoard(board));

    expect(parsed).toEqual(board);
  });
});
