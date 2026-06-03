import { AppShell } from "@/components/app/AppShell";
import { BacktestClient } from "@/components/backtests/BacktestClient";

export default async function BacktestsPage({
  searchParams,
}: {
  searchParams: Promise<{ title?: string; idea?: string }>;
}) {
  const params = await searchParams;
  return (
    <AppShell>
      <BacktestClient initialTitle={params.title} initialIdea={params.idea} />
    </AppShell>
  );
}
