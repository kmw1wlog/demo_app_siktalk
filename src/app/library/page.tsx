import { AppShell } from "@/components/app/AppShell";
import { LibraryClient } from "@/components/strategy/LibraryClient";

export default function LibraryPage() {
  return (
    <AppShell>
      <LibraryClient />
    </AppShell>
  );
}
