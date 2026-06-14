# 架构说明

## 目标

数学游乐场 Math Playground 的第一版是浏览器端数学虚拟操作板。架构目标是让核心数据模型稳定、JSON 友好、可测试，并让画布、教具和教师任务模板可以逐步扩展。

核心层不依赖 React、DOM 或浏览器渲染 API。它只负责描述场景、对象、基础几何和不可变更新，方便后续保存、读取、任务模板、学习记录和画布渲染复用。

## Scene 核心模型

核心场景模型位于 `src/core/scene.ts`。`Scene` 是保存和读取的主结构，包含：

- `schemaVersion`：Scene JSON 结构版本，当前为 `0.1.0`。
- `id`：场景稳定 ID。
- `title`：操作板标题。
- `createdAt`：创建时间，使用 ISO 字符串。
- `updatedAt`：更新时间，使用 ISO 字符串。
- `objects`：场景内所有 `SceneObject`。
- `viewport`：画布视口状态，包含 `x`、`y`、`zoom`。
- `grid`：网格设置，包含 `enabled`、`visible`、`snap`、`size`。

`Scene` 必须保持 JSON 友好。不要把 React 组件、函数、DOM 节点、类实例或循环引用放入场景对象。

## SceneObject 结构

`SceneObject` 是所有数学教具的统一对象模型。每个对象包含：

- `id`：对象稳定 ID。
- `type`：对象类型，例如 `number-tile`、`fraction-strip`、`shape`、`counter`，以及当前 MVP 的 `demo-rectangle`、`demo-circle`、`demo-text`。
- `x`、`y`：对象在场景坐标系中的位置。
- `rotation`：对象旋转角度，单位为度。
- `scaleX`、`scaleY`：对象横向和纵向缩放。
- `locked`：是否锁定。锁定对象不应被普通拖拽、缩放或旋转修改。
- `visible`：是否可见。隐藏对象不渲染，也不能被普通选择命中。
- `label`：面向用户显示的短标签。
- `data`：对象自己的 JSON 数据，例如数值、颜色、宽高、分数信息等。

通用几何和状态字段放在顶层，具体教具属性放入 `data`。这样画布系统可以统一选择、移动、锁定和隐藏对象，而教具渲染器只需要理解对应 `type` 的 `data`。

## 基础类型

`src/core/scene.ts` 提供以下基础类型：

- `Point`：二维坐标。
- `Size`：宽高。
- `Transform`：位置、旋转和缩放。
- `BoundingBox`：对象边界盒。
- `ToolType`：画布工具类型，例如选择、平移、移动、创建。
- `ObjectType`：教具对象类型。

## 工厂与场景更新

核心层提供纯逻辑入口：

- `createScene()`：创建带默认视口、网格和 `schemaVersion` 的场景。
- `createObject()`：创建带默认 transform、锁定状态、可见状态和 JSON 数据的对象。
- `cloneObject()`：深拷贝对象数据，并生成或接收新的 ID。
- `updateObject()`：返回更新后的新 `Scene`，不原地修改旧场景。
- `deleteObject()`：返回删除对象后的新 `Scene`。

这些函数优先服务 reducer/context。调用方可以把返回的新场景作为下一次 React 状态。

## 几何工具

基础几何函数位于 `src/core/geometry.ts`：

- `translatePoint()`：平移坐标点。
- `rotatePoint()`：围绕原点或指定中心旋转坐标点。
- `getBoundingBox()`：基于对象位置、缩放和 `data.width` / `data.height` 计算简单边界盒。
- `snapToGrid()`：把坐标吸附到最近的网格点。
- `generateId()`：生成带前缀的对象或场景 ID。

当前 `getBoundingBox()` 只处理简单轴对齐边界盒。导出图片时会额外计算旋转后的外接范围，避免旋转对象被裁切。

## 画布系统

画布系统位于 `src/canvas`。MVP 使用 SVG 作为主要 2D 渲染方式：

- React 组件负责渲染 SVG 根节点和画布背景。
- 交互能力包括对象选择、拖拽、缩放、旋转、平移和命中测试。
- 坐标转换、几何计算和命中逻辑应尽量放在纯函数中，便于 Vitest 覆盖。
- 画布组件不直接修改对象结构，而是通过 reducer/context 提交用户交互事件。

## 教具系统

教具系统位于 `src/manipulatives`。每类教具需要三类信息：

- 稳定的 `ObjectType`。
- 默认 JSON `data`。
- SVG 渲染入口。

早期可以用简单的类型分发实现，不急于引入复杂插件机制。只有当教具数量明显增加、重复逻辑真实出现时，再抽象注册表。

## 任务系统

任务系统后续位于 `src/features`，目标是支持教师用模板快速创建操作板。任务模板应是 JSON 友好的普通对象：

- 任务标题。
- 年级或年龄段。
- 学习目标。
- 给学生的中文提示。
- 初始 `Scene` 或对象列表。
- 可选的检查规则。

任务模板不应绑定账号、云端或支付能力。MVP 先以内置模板和本地数据为主。

## 状态管理

第一版使用 React reducer/context。边界如下：

- `core`：无状态纯模型和工具。
- `features/workspace`：管理当前场景状态、选择状态、剪贴板、撤销重做、保存读取入口。
- `canvas`：接收当前场景并提交用户交互事件。
- `components`：不持有核心业务状态。

除非状态复杂度明显上升，否则不引入 Redux。

## Schema 版本与持久化策略

当前 Scene schema 版本为 `0.1.0`，由 `src/core/sceneSerialization.ts` 中的 `SCENE_SCHEMA_VERSION` 统一定义。`Scene` 顶层必须包含 `schemaVersion` 字段，保存、读取、本地自动保存和未来教师任务模板都应使用同一份 Scene JSON 结构。

版本策略：

- `0.x` 阶段允许小步演进，但读取器只接受当前明确支持的 `schemaVersion`。
- 如果上传文件版本不匹配，读取逻辑返回友好错误，不覆盖当前画布。
- 未来需要兼容旧版本时，应在 `sceneSerialization.ts` 中增加迁移函数，而不是让 UI 直接修补 JSON。
- Scene JSON 必须保持纯数据结构，不允许包含 React 组件、函数、DOM 节点、循环引用或非 JSON 值。

持久化入口：

- JSON 保存：把当前 `Scene` 序列化为格式化 JSON，文件名使用 `math-playground-scene-YYYYMMDD-HHmm.json`。
- JSON 读取：上传文件后先反序列化和校验，通过后才替换当前 Scene。
- LocalStorage 自动保存：使用 `math-playground:auto-save:scene` 保存最近 Scene；页面重新打开时询问是否恢复。
- 图片导出：由当前 Scene 生成独立 SVG，再可转换为 PNG；导出内容只包含画布对象，不包含工具栏、属性面板、状态栏或选择框。
