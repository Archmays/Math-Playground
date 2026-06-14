# 部署说明

数学游乐场是 Vite + React 静态前端应用，生产构建产物位于 `dist/`，可以部署到 Vercel、Netlify 或 GitHub Pages。

## 本地运行

首次运行：

```bash
npm install
npm run dev
```

Vite 会输出本地访问地址，通常是 `http://localhost:5173`。

## 构建

生产构建：

```bash
npm run build
```

构建前会执行 TypeScript 检查，成功后输出 `dist/`。

本地预览生产产物：

```bash
npm run preview
```

## Vercel 部署

推荐设置：

- Framework Preset: `Vite`
- Install Command: `npm install`
- Build Command: `npm run build`
- Output Directory: `dist`

默认部署在域名根路径，不需要额外设置 `VITE_BASE_PATH`。

## Netlify 部署

推荐设置：

- Build command: `npm run build`
- Publish directory: `dist`
- Node/npm: 使用 Netlify 默认稳定版本即可

如果使用 `netlify.toml`，可以写成：

```toml
[build]
  command = "npm run build"
  publish = "dist"
```

默认部署在域名根路径，不需要额外设置 `VITE_BASE_PATH`。

## GitHub Pages 部署注意事项

GitHub Pages 常见部署路径是：

```text
https://<user>.github.io/<repo>/
```

如果部署在仓库子路径，需要设置 Vite 的 base。项目已支持通过环境变量设置：

```bash
VITE_BASE_PATH=/Math-Playground-Codex/ npm run build
```

Windows PowerShell 可使用：

```powershell
$env:VITE_BASE_PATH="/Math-Playground-Codex/"; npm run build
```

注意事项：

- `VITE_BASE_PATH` 必须以 `/` 开头，并建议以 `/` 结尾。
- 如果部署到用户主页根路径，例如 `https://<user>.github.io/`，保持默认 `/` 即可。
- GitHub Pages 需要发布 `dist/` 目录内容。
- 本项目是单页静态应用，没有后端服务、账号系统或云同步依赖。

## 发布前检查

每次部署前建议运行：

```bash
npm run test
npm run typecheck
npm run build
```
