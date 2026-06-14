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

## Fraction Bars

Fraction Bars are draggable visual bars for unit fractions, equivalent
fractions, comparison, and same-denominator addition or subtraction. They are
plain SVG scene objects, so they share the existing canvas behavior for
selection, dragging, copying, deleting, and resizing.

Stable object type:

```ts
type: "fraction-bar"
```

`FractionBarData` is stored in `SceneObject.data` and remains JSON
serializable:

```ts
type FractionBarData = {
  numerator: number;
  denominator: number;
  totalWidth: number;
  showLabels: boolean;
  showTicks: boolean;
  colorScheme: string;
  width: number;
  height: number;
};
```

Field notes:

- `numerator` is the number of filled segments and is clamped from 0 to
  `denominator`.
- `denominator` is the number of equal segments, currently clamped from 1 to 24.
- `totalWidth` controls the unscaled bar width.
- `showLabels` controls whether the fraction text, such as `3/4`, is shown.
- `showTicks` controls whether segment dividers are shown.
- `colorScheme` controls the light visual palette.
- `width` and `height` are stored for shared canvas geometry.

## Fraction Circles

Fraction Circles are draggable circular area models for understanding part and
whole, angles, sectors, and proportional reasoning. They complement Fraction
Bars by showing the same fraction value in a round region.

Stable object type:

```ts
type: "fraction-circle"
```

`FractionCircleData` is stored in `SceneObject.data` and remains JSON
serializable:

```ts
type FractionCircleData = {
  numerator: number;
  denominator: number;
  radius: number;
  showLabels: boolean;
  showSectorLines: boolean;
  startAngle: number;
  colorScheme: string;
  width: number;
  height: number;
};
```

Field notes:

- `numerator` is the number of filled sectors and is clamped from 0 to
  `denominator`.
- `denominator` is the number of equal sectors, currently clamped from 1 to 24.
- `radius` controls the unscaled circle radius.
- `showLabels` controls whether the fraction text is shown.
- `showSectorLines` controls whether radial sector lines are shown.
- `startAngle` controls where the first sector begins, in degrees.
- `colorScheme` controls the light visual palette.
- `width` and `height` are stored for shared canvas geometry.
