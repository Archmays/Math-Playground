import type { SceneObject } from "../core/scene";
import {
  isFixedAspectGeometryTileShape,
  isGeometryTileObject
} from "../manipulatives/geometryTiles/geometryTiles";

export function shouldPreserveObjectAspectRatio(object: SceneObject): boolean {
  if (object.type === "demo-circle") {
    return true;
  }

  return (
    isGeometryTileObject(object) &&
    isFixedAspectGeometryTileShape(object.data.shape)
  );
}

export function shouldKeepAspectRatioForObjects(
  objects: SceneObject[],
  requestedKeepRatio: boolean
): boolean {
  return (
    requestedKeepRatio ||
    (objects.length === 1 && shouldPreserveObjectAspectRatio(objects[0]))
  );
}
