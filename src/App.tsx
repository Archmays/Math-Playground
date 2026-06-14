import { SceneProvider } from "./features/workspace/SceneProvider";
import { Workspace } from "./features/workspace/Workspace";

export default function App() {
  return (
    <SceneProvider>
      <Workspace />
    </SceneProvider>
  );
}
