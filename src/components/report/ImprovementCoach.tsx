import { Card } from "@/components/ui/Card";

export function ImprovementCoach({ advices }: { advices: string[] }) {
  return (
    <Card>
      <h2 className="text-lg font-black text-slate-950">첫 결과가 나빠도 알게 된 것</h2>
      <div className="mt-4 space-y-3">
        {advices.map((advice) => (
          <p key={advice} className="text-sm leading-6 text-slate-700">
            {advice}
          </p>
        ))}
      </div>
    </Card>
  );
}
