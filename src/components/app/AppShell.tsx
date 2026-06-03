import type { ReactNode } from "react";
import { AnalyticsConsent } from "./AnalyticsConsent";
import { FeedbackWidget } from "@/components/feedback/FeedbackWidget";
import { Sidebar } from "./Sidebar";
import { TopNav } from "./TopNav";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen overflow-x-hidden bg-white text-slate-950 md:bg-slate-50">
      <TopNav />
      <div className="flex">
        <Sidebar />
        <main className="min-w-0 flex-1 overflow-x-hidden px-4 pb-28 pt-4 md:px-6 md:py-6 lg:px-8">{children}</main>
      </div>
      <AnalyticsConsent />
      <FeedbackWidget />
    </div>
  );
}
