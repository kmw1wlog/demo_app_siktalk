import { AppShell } from "@/components/app/AppShell";
import { AlertBotClient } from "@/components/alerts/AlertBotClient";

export default async function AlertsPage({
  searchParams,
}: {
  searchParams: Promise<{ idea?: string }>;
}) {
  const params = await searchParams;

  return (
    <AppShell>
      <AlertBotClient initialMessage={params.idea ?? ""} />
    </AppShell>
  );
}
