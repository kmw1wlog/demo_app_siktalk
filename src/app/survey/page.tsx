import { Suspense } from "react";
import { PreSurveyPage } from "@/components/feedback/PreSurveyPage";

export default function SurveyPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-slate-50" />}>
      <PreSurveyPage />
    </Suspense>
  );
}
