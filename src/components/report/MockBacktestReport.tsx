import { DisclaimerBanner } from "@/components/app/DisclaimerBanner";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { formatDateTime, formatPct } from "@/lib/format";
import { generateImprovementAdvice } from "@/lib/mock-improver";
import type { MockBacktestReport as Report, StrategyCard } from "@/lib/types";
import { ConversionButtons } from "@/components/conversion/ConversionButtons";
import { ImprovementCoach } from "./ImprovementCoach";
import { OraclePanel } from "./OraclePanel";
import { ReportMetricCard } from "./ReportMetricCard";
import { RiskSummary } from "./RiskSummary";

export function MockBacktestReport({
  strategy,
  report,
}: {
  strategy: StrategyCard;
  report: Report;
}) {
  const advices = generateImprovementAdvice(strategy, report);

  return (
    <div className="space-y-5">
      <DisclaimerBanner text={report.disclaimer} />
      <div>
        <h2 className="text-2xl font-black text-slate-950">전략 이해용 모의검증 리포트</h2>
        <p className="mt-1 text-sm text-slate-500">생성 시간 {formatDateTime(report.generatedAt)}</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <ReportMetricCard label="전체 수익률" value={formatPct(report.totalReturnPct)} tone={report.totalReturnPct >= 0 ? "good" : "bad"} />
        <ReportMetricCard label="승률" value={formatPct(report.winRatePct)} />
        <ReportMetricCard label="평균 손익" value={formatPct(report.averagePnlPct)} tone={report.averagePnlPct >= 0 ? "good" : "bad"} />
        <ReportMetricCard label="최대 손실 구간" value={formatPct(report.maxDrawdownPct)} tone="bad" />
        <ReportMetricCard label="거래 횟수" value={`${report.tradeCount}회`} />
      </div>
      <Card>
        <h3 className="text-lg font-black text-slate-950">쉬운 말 해석</h3>
        <p className="mt-2 text-sm leading-6 text-slate-700">{report.plainLanguageSummary}</p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <List title="장점" items={report.strengths} />
          <List title="약점" items={report.weaknesses} />
          <List title="잘 먹힌 시간대" items={report.bestTimeSlots} />
          <List title="안 먹힌 시간대" items={report.weakTimeSlots} />
          <List title="잘 맞는 자산군" items={report.bestAssetFit} />
          <List title="맞지 않는 자산군" items={report.weakAssetFit} />
        </div>
      </Card>
      <RiskSummary warnings={report.warnings} />
      <ImprovementCoach advices={advices} />
      <OraclePanel scenarios={report.oracleScenarios} />
      <div className="flex flex-wrap gap-2">
        <Button variant="secondary">전략 카드 수정하기</Button>
        <Button>개선 버전 만들기</Button>
      </div>
      <ConversionButtons strategy={strategy} />
    </div>
  );
}

function List({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h4 className="text-sm font-bold text-slate-950">{title}</h4>
      <ul className="mt-2 space-y-1 text-sm leading-6 text-slate-600">
        {items.map((item) => (
          <li key={item}>- {item}</li>
        ))}
      </ul>
    </div>
  );
}
