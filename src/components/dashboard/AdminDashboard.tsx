"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { pct, getLocalAnalytics } from "@/lib/analytics";
import { platformLabels, strategyTypeLabels } from "@/lib/constants";
import type { ConversionPlatform, StrategyType } from "@/lib/types";
import { FunnelCard } from "./FunnelCard";
import { PlatformDemandChart } from "./PlatformDemandChart";

type Analytics = ReturnType<typeof getLocalAnalytics>;

export function AdminDashboard() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);

  useEffect(() => {
    setAnalytics(getLocalAnalytics());
  }, []);

  if (!analytics) return null;

  const clicks = analytics.conversionClicks.length;
  const waitlists = analytics.waitlists.length;
  const platformData = Object.entries(analytics.platformCounts).map(([label, value]) => ({
    label: platformLabels[label as ConversionPlatform],
    value,
  }));
  const strategyDemand = Object.entries(analytics.typeCounts).map(([label, value]) => ({
    label: strategyTypeLabels[label as StrategyType],
    value,
  }));

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <h1 className="text-3xl font-black text-slate-950">MVP 내부 검증용 데모 화면</h1>
        <p className="mt-2 text-sm text-slate-600">실제 인증 없이 보는 운영자용 mock 지표입니다.</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="플랫폼별 변환 버튼 클릭률" value={`${pct(clicks, Math.max(1, analytics.totalStrategies))}%`} />
        <Metric label="클릭 대비 대기등록률" value={`${pct(waitlists, clicks)}%`} />
        <Metric label="카드 생성 대비 저장률" value={`${pct(analytics.savedStrategies, analytics.created.length || analytics.totalStrategies)}%`} />
        <Metric label="저장 대비 모의검증률" value={`${pct(analytics.reportCount, analytics.savedStrategies)}%`} />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <PlatformDemandChart title="플랫폼별 클릭 점유율" data={platformData} />
        <PlatformDemandChart title="전략 유형별 변환 수요" data={strategyDemand} />
      </div>
      <FunnelCard
        steps={[
          { label: "생성", value: analytics.created.length || analytics.totalStrategies },
          { label: "저장", value: analytics.savedStrategies },
          { label: "모의검증", value: analytics.reportCount },
          { label: "재개선 mock", value: Math.floor(analytics.reportCount / 2) },
        ]}
      />
      <div className="grid gap-3 sm:grid-cols-3">
        <Metric label="모의검증 대비 재개선률 mock" value={`${pct(Math.floor(analytics.reportCount / 2), analytics.reportCount)}%`} />
        <Metric label="재방문율 mock" value="38%" />
        <Metric label="무료 적용 요청 클릭률 mock" value="12%" />
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number | string }) {
  return (
    <Card>
      <div className="text-sm font-semibold text-slate-500">{label}</div>
      <div className="mt-2 text-2xl font-black text-slate-950">{value}</div>
    </Card>
  );
}
