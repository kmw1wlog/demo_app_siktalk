import { Card } from "@/components/ui/Card";
import { pct } from "@/lib/analytics";

export function FunnelCard({ steps }: { steps: { label: string; value: number }[] }) {
  const max = Math.max(1, steps[0]?.value ?? 1);
  return (
    <Card>
      <h2 className="text-lg font-black text-slate-950">생성 → 저장 → 모의검증 → 변환 요청 퍼널</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-4">
        {steps.map((step) => (
          <div key={step.label} className="rounded-lg bg-slate-50 p-4">
            <div className="text-sm font-semibold text-slate-500">{step.label}</div>
            <div className="mt-2 text-2xl font-black text-slate-950">{step.value}</div>
            <div className="mt-1 text-xs font-semibold text-emerald-700">{pct(step.value, max)}%</div>
          </div>
        ))}
      </div>
    </Card>
  );
}
