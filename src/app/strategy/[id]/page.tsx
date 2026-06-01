import { AppShell } from "@/components/app/AppShell";
import { StrategyDetail } from "@/components/strategy/StrategyDetail";

export default async function StrategyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <AppShell>
      <StrategyDetail id={id} />
    </AppShell>
  );
}
