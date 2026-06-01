"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { platformLabels, strategyTypeLabels } from "@/lib/constants";
import { getLocalAnalytics } from "@/lib/analytics";
import type { ConversionPlatform, StrategyType } from "@/lib/types";
import { FunnelCard } from "./FunnelCard";
import { PlatformDemandChart } from "./PlatformDemandChart";

type Analytics = ReturnType<typeof getLocalAnalytics>;

export function UserDashboard() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);

  useEffect(() => {
    setAnalytics(getLocalAnalytics());
  }, []);

  if (!analytics) return null;

  const strategyData = Object.entries(analytics.typeCounts).map(([label, value]) => ({
    label: strategyTypeLabels[label as StrategyType] ?? label,
    value,
  }));
  const platformData = Object.entries(analytics.platformCounts).map(([label, value]) => ({
    label: platformLabels[label as ConversionPlatform] ?? label,
    value,
  }));

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <h1 className="text-3xl font-black text-slate-950">대시보드</h1>
        <p className="mt-2 text-sm text-slate-600">localStorage에 저장된 식톡 MVP 활동 지표입니다.</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="전체 전략 카드 수" value={analytics.totalStrategies} />
        <Metric label="저장된 전략 카드 수" value={analytics.savedStrategies} />
        <Metric label="모의검증 완료 전략 수" value={analytics.reportCount} />
        <Metric label="변환 요청한 전략 수" value={analytics.conversionCount} />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Metric label="가장 많이 만든 전략 유형" value={analytics.topStrategyType ? strategyTypeLabels[analytics.topStrategyType] : "아직 없음"} />
        <Metric label="가장 많이 요청한 플랫폼" value={analytics.topPlatform ? platformLabels[analytics.topPlatform] : "아직 없음"} />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <PlatformDemandChart title="전략 유형별 count" data={strategyData} />
        <PlatformDemandChart title="플랫폼별 변환 요청 count" data={platformData} />
      </div>
      <FunnelCard
        steps={[
          { label: "생성", value: analytics.created.length || analytics.totalStrategies },
          { label: "저장", value: analytics.savedStrategies },
          { label: "모의검증", value: analytics.reportCount },
          { label: "변환 요청", value: analytics.conversionCount },
        ]}
      />
      <Metric label="개선 버전 수 mock" value={Math.floor(analytics.reportCount / 2)} />
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
