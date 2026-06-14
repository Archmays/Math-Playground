# 数学游乐场 Math Playground

数学游乐场是一个原创的网页端数学虚拟操作板项目，面向小学到初中低年级的学生、教师和家庭学习场景。第一版目标是提供一个清晰、可扩展、可测试的 MVP：中文界面、SVG 画布、可序列化教具对象，以及后续任务模板能力的基础结构。

## 原创声明

本项目不是 Polypad 克隆，不使用 Polypad 的品牌、UI、图标、素材、源码或交互细节。项目只借鉴“虚拟数学教具 + 可拖拽画布 + 教师任务模板”这一通用教育产品理念，并会发展自己的信息架构、视觉语言和交互方式。

## 技术栈

- Vite
- React
- TypeScript
- SVG 作为主要 2D 画布渲染方式
- 普通 CSS
- Vitest
- React state/reducer 优先，暂不引入 Redux

## 当前 MVP

- 首页显示“数学游乐场 Math Playground”
- 提供一个空的 SVG 画布区域
- 建立 `core`、`canvas`、`manipulatives`、`features`、`components`、`utils` 的源码目录边界
- 核心操作板数据结构可序列化为 JSON

## 本地运行

```bash
npm install
npm run dev
```

## 验证命令

```bash
npm run build
npm run typecheck
npm run test
```

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
