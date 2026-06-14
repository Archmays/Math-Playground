import { ErrorBoundary, ErrorBoundaryFallback } from "./components/ErrorBoundary";
import { SceneProvider } from "./features/workspace/SceneProvider";
import { Workspace } from "./features/workspace/Workspace";

export default function App() {
  return (
    <ErrorBoundary
      fallback={
        <ErrorBoundaryFallback
          title="数学游乐场暂时显示不了"
          message="请刷新页面。如果问题还在，可以清空本地保存后重新打开。"
        />
      }
    >
      <SceneProvider>
        <Workspace />
      </SceneProvider>
    </ErrorBoundary>
  );
}
