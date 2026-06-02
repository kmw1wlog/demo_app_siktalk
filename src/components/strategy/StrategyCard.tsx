"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ConversionButtons } from "@/components/conversion/ConversionButtons";
import { ChartScene } from "@/components/media/ChartScene";
import { resolveChartSceneVariant } from "@/lib/demo-media";
import { assetClassLabel, timeframeLabel } from "@/lib/format";
import type { StrategyCard as StrategyCardType } from "@/lib/types";
import { SaveToDrawerButton } from "./SaveToDrawerButton";
import { ShareCardButton } from "./ShareCardButton";
import { StrategyConditionBlock } from "./StrategyConditionBlock";
import { StrategyTypeBadge } from "./StrategyTypeBadge";

export function StrategyCard({
  strategy,
  onBacktest,
  compact = false,
}: {
  strategy: StrategyCardType;
  onBacktest?: (strategy: StrategyCardType) => void;
  compact?: boolean;
}) {
  return (
    <Card className="space-y-5">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_250px] lg:items-start">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-black text-slate-950">{strategy.title}</h2>
            <StrategyTypeBadge type={strategy.strategyType} />
            <Badge>{assetClassLabel(strategy.assetClass)}</Badge>
            <Badge>{timeframeLabel(strategy.timeframe)}</Badge>
            <Badge tone={strategy.isSaved ? "emerald" : "amber"}>
              {strategy.isSaved ? "저장됨" : "임시 카드"}
            </Badge>
          </div>
          <p className="mt-2 text-sm leading-6 text-slate-600">{strategy.summary}</p>
          <div className="mt-4">
            <Link href={`/strategy/${strategy.id}`} className="text-sm font-bold text-emerald-700 hover:text-emerald-800">
              상세 보기
            </Link>
          </div>
        </div>
        <div className="space-y-2 lg:pl-2">
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <ChartScene variant={resolveChartSceneVariant(strategy)} motion />
          </div>
          <p className="text-xs font-semibold leading-5 text-slate-500">
            이 전략이 주로 쓰이는 장면을 빠르게 떠올리는 참고 영상 자리입니다.
          </p>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <StrategyConditionBlock title="진입 조건" items={strategy.conditions.entry} />
        <StrategyConditionBlock title="청산 조건" items={strategy.conditions.exit} />
        <StrategyConditionBlock title="종목 조건" items={strategy.conditions.universe} />
        <StrategyConditionBlock title="필터 조건" items={strategy.conditions.filters} />
      </div>

      {!compact ? (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-lg bg-slate-50 p-4">
              <h3 className="text-sm font-bold text-slate-950">리스크 요약</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{strategy.riskSummary}</p>
            </div>
            <div className="rounded-lg bg-slate-50 p-4">
              <h3 className="text-sm font-bold text-slate-950">적합한 상황</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{strategy.suitableRegime.join(", ")}</p>
            </div>
            <div className="rounded-lg bg-slate-50 p-4">
              <h3 className="text-sm font-bold text-slate-950">주의할 상황</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{strategy.weakRegime.join(", ")}</p>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-950">모의검증 아이디어</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">{strategy.validationIdea}</p>
          </div>
        </>
      ) : null}

      <div className="flex gap-2 overflow-x-auto pb-1">
        <div className="shrink-0">
          <SaveToDrawerButton strategy={strategy} />
        </div>
        <Button
          variant="secondary"
          className="shrink-0 whitespace-nowrap"
          onClick={() => onBacktest?.(strategy)}
          disabled={!onBacktest}
        >
          모의검증하기
        </Button>
        <Button
          variant="ghost"
          className="shrink-0 whitespace-nowrap"
          onClick={() => onBacktest?.(strategy)}
          disabled={!onBacktest}
        >
          20분 개선
        </Button>
        <div className="shrink-0">
          <ShareCardButton />
        </div>
      </div>
      <ConversionButtons strategy={strategy} />
    </Card>
  );
}
