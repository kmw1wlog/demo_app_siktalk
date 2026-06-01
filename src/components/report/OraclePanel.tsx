import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { formatPct } from "@/lib/format";
import type { OracleScenario } from "@/lib/types";

export function OraclePanel({ scenarios }: { scenarios: OracleScenario[] }) {
  return (
    <Card>
      <h2 className="text-lg font-black text-slate-950">간단 오라클 분석</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        과거/가상 데이터 안에서 관찰된 개선 가능성입니다. 미래 수익 예측이 아닙니다.
      </p>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {scenarios.map((scenario) => (
          <div key={scenario.label} className="rounded-lg border border-slate-200 p-4">
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-bold text-slate-950">{scenario.label}</h3>
              <Badge tone={scenario.overfitRisk === "high" ? "rose" : scenario.overfitRisk === "medium" ? "amber" : "emerald"}>
                과최적화 {scenario.overfitRisk}
              </Badge>
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-600">{scenario.change}</p>
            <div className="mt-3 text-xl font-black text-emerald-700">{formatPct(scenario.observedReturnPct)}</div>
            <p className="mt-2 text-xs leading-5 text-slate-500">{scenario.riskNote}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}
