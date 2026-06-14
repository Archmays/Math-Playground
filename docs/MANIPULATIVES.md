# Manipulatives

## Number Tiles

Number Tiles are draggable number blocks for early number sense and arithmetic
activities. They support counting, grouping, making ten, addition and
subtraction, and simple regrouping activities. The first version keeps them as
plain SVG scene objects, so they use the shared canvas behavior for selection,
dragging, copying, deleting, resizing, and rotation.

Stable object type:

```ts
type: "number-tile"
```

`NumberTileData` is stored in `SceneObject.data` and remains JSON serializable:

```ts
type NumberTileData = {
  value: number;
  colorScheme: string;
  showValue: boolean;
  size: "small" | "medium" | "large";
  groupId?: string;
  width: number;
  height: number;
};
```

Field notes:

- `value` is the number represented by the tile.
- `colorScheme` controls the visual palette. The default `"auto"` gives common
  values like 5 and 10 a lightly different style.
- `showValue` controls whether the number is displayed on the tile.
- `size` controls the tile's base square dimensions.
- `groupId` is optional and reserved for future grouping activities.
- `width` and `height` are stored so the shared canvas geometry helpers can
  compute bounds without knowing Number Tile internals.

Creation helpers live in `src/manipulatives/numberTiles/numberTiles.ts`:

- `createNumberTile`
- `updateNumberTileValue`
- `sumSelectedNumberTiles`

## Ten Frames

Ten Frames are 2 by 5 grids for representing numbers from 0 to 10. They help
students see making ten, decomposition, addition, subtraction, and regrouping.
The grid is a normal SVG scene object, so it uses the shared canvas behavior for
selection, dragging, copying, deleting, resizing, and rotation.

Stable object type:

```ts
type: "ten-frame"
```

`TenFrameData` is stored in `SceneObject.data` and remains JSON serializable:

```ts
type TenFrameData = {
  filledCount: number;
  rows: 2;
  columns: 5;
  tokenShape: "circle" | "square";
  fillMode: "left-to-right" | "manual";
  tokenPositions?: number[];
  width: number;
  height: number;
};
```

Field notes:

- `filledCount` is the number of filled cells, clamped to 0 through 10.
- `rows` and `columns` are fixed at 2 and 5 for the first version.
- `tokenShape` controls whether filled cells use circles or squares.
- `fillMode` controls whether tokens fill from left to right or use exact cell
  positions.
- `tokenPositions` stores cell indexes in manual mode.
- `width` and `height` are stored for shared canvas geometry.

