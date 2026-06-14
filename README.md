# 数学游乐场 Math Playground

数学游乐场是一个原创的网页端数学虚拟操作板项目，面向家庭教育、国际学校课堂和中文数学学习场景。当前版本为 `v0.1.0`，目标是提供一个清晰、可扩展、可测试的 MVP。

## 原创声明

本项目不是 Polypad 克隆，不使用 Polypad 的品牌、UI、图标、素材、源码或专有交互细节。项目只借鉴“虚拟数学教具 + 可拖拽画布 + 教师任务模板”这一通用教育产品理念，并发展自己的信息架构、视觉语言和交互方式。

## 当前 MVP 功能

- 中文儿童友好界面，按数字、分数、几何、测量、等式、代数、任务分类。
- SVG 画布，支持教具添加、拖拽、选择、缩放、旋转、复制和删除。
- 数字方块、十格阵、分数条、圆形分数。
- 几何拼板、测量工具、天平、代数砖。
- 任务卡、答案检查和提示系统。
- 画布 JSON 保存/读取，SVG/PNG 导出，本地自动保存和静默恢复。
- 基础错误边界，单个教具渲染失败时不让整个应用白屏。

## 技术栈

- Vite
- React
- TypeScript
- SVG 作为主要 2D 画布渲染方式
- 普通 CSS
- Vitest

## 本地运行

```bash
npm install
npm run dev
```

默认开发地址由 Vite 输出，通常是 `http://localhost:5173`。

## 构建

```bash
npm run build
```

构建产物输出到 `dist/`。

## 验证命令

```bash
npm run test
npm run typecheck
npm run build
```

## 部署

部署到 Vercel、Netlify 或 GitHub Pages 的说明见 [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)。

## 目录结构

```text
src/
  canvas/          SVG 画布和画布交互
  components/      通用界面组件
  core/            可测试的核心数据模型和序列化逻辑
  features/        面向用户流程的功能模块
  manipulatives/   数学教具类型和注册入口
  utils/           通用工具函数
```
