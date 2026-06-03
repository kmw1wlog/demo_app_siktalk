import { AppShell } from "@/components/app/AppShell";
import { BacktestClient } from "@/components/backtests/BacktestClient";

export default function BacktestsPage() {
  return (
    <AppShell>
      <BacktestClient />
    </AppShell>
  );
}
