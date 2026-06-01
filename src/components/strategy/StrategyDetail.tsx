"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { DisclaimerBanner } from "@/components/app/DisclaimerBanner";
import { EmptyState } from "@/components/app/EmptyState";
import { MockBacktestReport } from "@/components/report/MockBacktestReport";
import { Button } from "@/components/ui/Button";
import { seedStrategies } from "@/lib/seed-strategies";
import { addEvent, getReports, getStrategies, saveReport, saveStrategy, updateStrategy } from "@/lib/storage";
import type { MockBacktestReport as Report, StrategyCard as StrategyCardType } from "@/lib/types";
import { StrategyCard } from "./StrategyCard";

export function StrategyDetail({ id }: { id: string }) {
  const [strategy, setStrategy] = useState<StrategyCardType | null>(null);
  const [report, setReport] = useState<Report | null>(null);

  useEffect(() => {
    const found = [...getStrategies(), ...seedStrategies].find((item) => item.id === id) ?? null;
    setStrategy(found);
    setReport(getReports().find((item) => item.strategyId === id) ?? null);
  }, [id]);

  async function runBacktest(target: StrategyCardType) {
    const response = await fetch("/api/strategy/backtest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ strategy: target }),
    });
    const data = (await response.json()) as { report: Report };
    saveReport(data.report);
    addEvent({ type: "mock_backtest_generated", strategyId: target.id, createdAt: new Date().toISOString() });
    const next = { ...target, hasReport: true, isSaved: true, updatedAt: new Date().toISOString() };
    saveStrategy(next);
    updateStrategy(next);
    setStrategy(next);
    setReport(data.report);
  }

  if (!strategy) {
    return (
      <EmptyState
        title="전략 카드를 찾지 못했습니다"
        description="식 서랍에 저장된 전략이거나 자료실 예시 전략인지 다시 확인해주세요."
        action={<Link className="font-bold text-emerald-700" href="/drawer">식 서랍으로 이동</Link>}
      />
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <DisclaimerBanner />
      <StrategyCard strategy={strategy} onBacktest={runBacktest} />
      {report ? (
        <MockBacktestReport strategy={strategy} report={report} />
      ) : (
        <Button onClick={() => runBacktest(strategy)}>전략 이해용 모의검증 리포트 만들기</Button>
      )}
    </div>
  );
}
