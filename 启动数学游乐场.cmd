@echo off
setlocal

cd /d "%~dp0"

set "APP_URL=http://127.0.0.1:5173/"
set "CODEX_NODE=C:\Users\mays-\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
set "VITE_ENTRY=node_modules\vite\bin\vite.js"

where node >nul 2>nul
if %errorlevel%==0 (
  set "NODE_CMD=node"
) else if exist "%CODEX_NODE%" (
  set "NODE_CMD=%CODEX_NODE%"
) else (
  echo Node.js was not found.
  echo Install Node.js, or run this from Codex where the bundled Node runtime is available.
  pause
  exit /b 1
)

if not exist "%VITE_ENTRY%" (
  echo Project dependencies were not found.
  echo Run npm install before starting Math Playground.
  pause
  exit /b 1
)

start "" "%APP_URL%"
"%NODE_CMD%" "%VITE_ENTRY%" --host 127.0.0.1

endlocal
