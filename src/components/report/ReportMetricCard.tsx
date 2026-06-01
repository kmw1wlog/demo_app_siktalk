import { Card } from "@/components/ui/Card";

export function ReportMetricCard({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: "neutral" | "good" | "bad";
}) {
  const color = tone === "good" ? "text-emerald-700" : tone === "bad" ? "text-rose-700" : "text-slate-950";
  return (
    <Card className="p-4">
      <div className="text-sm font-semibold text-slate-500">{label}</div>
      <div className={`mt-2 text-2xl font-black ${color}`}>{value}</div>
    </Card>
  );
}
