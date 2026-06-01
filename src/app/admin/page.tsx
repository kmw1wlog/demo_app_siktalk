import { AppShell } from "@/components/app/AppShell";
import { AdminDashboard } from "@/components/dashboard/AdminDashboard";

export default function AdminPage() {
  return (
    <AppShell>
      <AdminDashboard />
    </AppShell>
  );
}
