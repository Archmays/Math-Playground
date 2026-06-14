import { getBoundingBox, rotatePoint } from "../../core/geometry";
import type { BoundingBox, Scene, SceneObject } from "../../core/scene";
import { serializeScene } from "../../core/sceneSerialization";

export const LOCAL_SCENE_STORAGE_KEY = "math-playground:auto-save:scene";

export function saveSceneJson(scene: Scene, date = new Date()): void {
  downloadTextFile(
    formatSceneJsonFileName(date),
    serializeScene(scene),
    "application/json"
  );
}

export function exportSceneSvg(scene: Scene): void {
  downloadTextFile(
    `${formatSceneExportBaseName(scene.title)}.svg`,
    sceneToSvgString(scene),
    "image/svg+xml"
  );
}

export async function exportScenePng(scene: Scene): Promise<void> {
  const svg = sceneToSvgString(scene);
  const bounds = getSceneBounds(scene);
  const svgBlob = new Blob([svg], { type: "image/svg+xml" });
  const imageUrl = URL.createObjectURL(svgBlob);

  try {
    const image = await loadImage(imageUrl);
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.ceil(bounds.width));
    canvas.height = Math.max(1, Math.ceil(bounds.height));

    const context = canvas.getContext("2d");

    if (!context) {
      throw new Error("Cannot create PNG canvas context.");
    }

    context.drawImage(image, 0, 0);

    const pngBlob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error("Cannot export PNG."));
        }
      }, "image/png");
    });

    downloadBlob(`${formatSceneExportBaseName(scene.title)}.png`, pngBlob);
  } finally {
    URL.revokeObjectURL(imageUrl);
  }
}

export function sceneToSvgString(scene: Scene): string {
  const bounds = getSceneBounds(scene);
  const visibleObjects = scene.objects.filter((object) => object.visible);
  const content = visibleObjects.map(renderObjectSvg).join("\n");

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${round(bounds.width)}" height="${round(
      bounds.height
    )}" viewBox="0 0 ${round(bounds.width)} ${round(bounds.height)}">`,
    `<rect width="100%" height="100%" fill="#ffffff"/>`,
    `<g transform="translate(${round(-bounds.x)} ${round(-bounds.y)})">`,
    content,
    `</g>`,
    `</svg>`
  ].join("\n");
}

export function formatSceneJsonFileName(date: Date): string {
  return `math-playground-scene-${date.getFullYear()}${pad(
    date.getMonth() + 1
  )}${pad(date.getDate())}-${pad(date.getHours())}${pad(date.getMinutes())}.json`;
}

function formatSceneExportBaseName(title: string): string {
  return `math-playground-${sanitizeFilePart(title)}-${formatTimestamp(new Date())}`;
}

function formatTimestamp(date: Date): string {
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(
    date.getDate()
  )}-${pad(date.getHours())}${pad(date.getMinutes())}`;
}

function sanitizeFilePart(value: string): string {
  const safe = value.trim().replace(/[\\/:*?"<>|]+/g, "-").replace(/\s+/g, "-");
  return safe || "scene";
}

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

function getSceneBounds(scene: Scene): BoundingBox {
  const visibleObjects = scene.objects.filter((object) => object.visible);

  if (visibleObjects.length === 0) {
    return {
      x: 0,
      y: 0,
      width: 960,
      height: 540
    };
  }

  const boxes = visibleObjects.map(getRotatedBoundingBox);
  const minX = Math.min(...boxes.map((box) => box.x));
  const minY = Math.min(...boxes.map((box) => box.y));
  const maxX = Math.max(...boxes.map((box) => box.x + box.width));
  const maxY = Math.max(...boxes.map((box) => box.y + box.height));
  const padding = 24;

  return {
    x: minX - padding,
    y: minY - padding,
    width: Math.max(1, maxX - minX + padding * 2),
    height: Math.max(1, maxY - minY + padding * 2)
  };
}

function getRotatedBoundingBox(object: SceneObject): BoundingBox {
  const box = getBoundingBox(object);

  if (object.rotation === 0) {
    return box;
  }

  const center = {
    x: box.x + box.width / 2,
    y: box.y + box.height / 2
  };
  const points = [
    { x: box.x, y: box.y },
    { x: box.x + box.width, y: box.y },
    { x: box.x + box.width, y: box.y + box.height },
    { x: box.x, y: box.y + box.height }
  ].map((point) => rotatePoint(point, object.rotation, center));
  const minX = Math.min(...points.map((point) => point.x));
  const minY = Math.min(...points.map((point) => point.y));
  const maxX = Math.max(...points.map((point) => point.x));
  const maxY = Math.max(...points.map((point) => point.y));

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY
  };
}

function renderObjectSvg(object: SceneObject): string {
  const box = getBoundingBox(object);
  const fill = typeof object.data.fill === "string" ? object.data.fill : "#fff3b5";
  const centerX = box.x + box.width / 2;
  const centerY = box.y + box.height / 2;
  const transform = `rotate(${round(object.rotation)} ${round(centerX)} ${round(centerY)})`;

  if (object.type === "demo-circle") {
    return [
      `<g transform="${transform}">`,
      `<ellipse cx="${round(centerX)}" cy="${round(centerY)}" rx="${round(
        box.width / 2
      )}" ry="${round(box.height / 2)}" fill="${escapeAttribute(
        fill
      )}" stroke="#177d9a" stroke-width="2"/>`,
      renderLabel(object.label, centerX, centerY),
      `</g>`
    ].join("");
  }

  if (object.type === "demo-text") {
    const text = typeof object.data.text === "string" ? object.data.text : object.label;

    return [
      `<g transform="${transform}">`,
      `<rect x="${round(box.x)}" y="${round(box.y)}" width="${round(
        box.width
      )}" height="${round(box.height)}" rx="8" fill="#ffffff" stroke="#c6d5de" stroke-width="2"/>`,
      renderLabel(text, centerX, centerY),
      `</g>`
    ].join("");
  }

  return [
    `<g transform="${transform}">`,
    `<rect x="${round(box.x)}" y="${round(box.y)}" width="${round(
      box.width
    )}" height="${round(box.height)}" rx="8" fill="${escapeAttribute(
      fill
    )}" stroke="#177d9a" stroke-width="2"/>`,
    renderLabel(object.label, centerX, centerY),
    `</g>`
  ].join("");
}

function renderLabel(label: string, x: number, y: number): string {
  if (!label) {
    return "";
  }

  return `<text x="${round(x)}" y="${round(
    y
  )}" dominant-baseline="middle" text-anchor="middle" fill="#0f2544" font-family="Arial, sans-serif" font-size="18" font-weight="700">${escapeText(
    label
  )}</text>`;
}

function downloadTextFile(fileName: string, content: string, type: string): void {
  downloadBlob(fileName, new Blob([content], { type }));
}

function downloadBlob(fileName: string, blob: Blob): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Cannot load exported SVG."));
    image.src = url;
  });
}

function escapeText(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function escapeAttribute(value: string): string {
  return escapeText(value).replaceAll('"', "&quot;");
}

function round(value: number): number {
  return Number(value.toFixed(2));
}
