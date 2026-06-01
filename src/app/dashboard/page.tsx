import { AppShell } from "@/components/app/AppShell";
import { UserDashboard } from "@/components/dashboard/UserDashboard";

export default function DashboardPage() {
  return (
    <AppShell>
      <UserDashboard />
    </AppShell>
  );
}
