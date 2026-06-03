"use client";

import { DEMO_STRATEGY } from "@/lib/demo-strategy";
import { PlatformCarryPanel } from "@/components/platform/PlatformCarryPanel";
import { HynixKisChartPanel } from "@/components/platform/HynixKisChartPanel";

export function DemoPlatformPanel() {
  return (
    <div className="space-y-5">
      <HynixKisChartPanel />
      <PlatformCarryPanel strategy={DEMO_STRATEGY} />
    </div>
  );
}
