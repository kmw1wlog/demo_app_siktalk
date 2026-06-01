import { Card } from "@/components/ui/Card";
import { SimpleBarChart } from "@/components/report/SimpleBarChart";

export function PlatformDemandChart({
  title,
  data,
}: {
  title: string;
  data: { label: string; value: number }[];
}) {
  return (
    <Card>
      <h2 className="text-lg font-black text-slate-950">{title}</h2>
      <div className="mt-4">
        <SimpleBarChart data={data.length ? data : [{ label: "아직 데이터 없음", value: 0 }]} />
      </div>
    </Card>
  );
}
