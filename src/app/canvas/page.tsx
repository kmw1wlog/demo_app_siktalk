import { AppShell } from "@/components/app/AppShell";
import { StrategyWorkbench } from "@/components/strategy/StrategyWorkbench";

export default function CanvasPage() {
  return (
    <AppShell sidebarMode="canvas" showFeedbackWidget={false}>
      <StrategyWorkbench />
    </AppShell>
  );
}
