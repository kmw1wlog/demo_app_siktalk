import { AppShell } from "@/components/app/AppShell";
import { StrategyInput } from "@/components/strategy/StrategyInput";

export default async function AppPage({
  searchParams,
}: {
  searchParams: Promise<{ idea?: string; view?: string; from?: string }>;
}) {
  const params = await searchParams;
  return (
    <AppShell>
      <StrategyInput
        initialIdea={params.idea ?? ""}
        initialView={params.view === "card" ? "card" : "home"}
        initialSource={params.from === "conditions" ? "conditions" : "chat"}
      />
    </AppShell>
  );
}
