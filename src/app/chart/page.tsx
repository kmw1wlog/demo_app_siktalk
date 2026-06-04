import { AppShell } from "@/components/app/AppShell";
import { HynixKisChartPanel } from "@/components/platform/HynixKisChartPanel";
import { ChartInsightsPanel } from "@/components/platform/ChartInsightsPanel";

export default function ChartPage() {
  return (
    <AppShell>
      <div className="space-y-6">
        <HynixKisChartPanel />
        <ChartInsightsPanel />
      </div>
    </AppShell>
  );
}
