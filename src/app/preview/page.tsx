import { AppShell } from "@/components/app/AppShell";
import { QuickPreviewShowcase } from "@/components/showcase/QuickPreviewShowcase";

export default function PreviewPage() {
  return (
    <AppShell showFeedbackWidget={false}>
      <QuickPreviewShowcase />
    </AppShell>
  );
}
