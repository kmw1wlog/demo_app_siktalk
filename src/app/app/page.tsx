import { AppShell } from "@/components/app/AppShell";
import { StrategyInput } from "@/components/strategy/StrategyInput";

export default async function AppPage({
  searchParams,
}: {
  searchParams: Promise<{ idea?: string }>;
}) {
  const params = await searchParams;
  return (
    <AppShell>
      <StrategyInput initialIdea={params.idea ?? ""} />
    </AppShell>
  );
}
