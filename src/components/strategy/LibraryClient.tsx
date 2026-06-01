"use client";

import { useState } from "react";
import { ChartScene } from "@/components/media/ChartScene";
import { strategyTypeLabels } from "@/lib/constants";
import type { ChartSceneVariant } from "@/lib/demo-media";
import { assetClassLabel, timeframeLabel } from "@/lib/format";
import { seedStrategies } from "@/lib/seed-strategies";
import type { StrategyCard as StrategyCardType } from "@/lib/types";

const variants: ChartSceneVariant[] = [
  "volumeBreakout",
  "rsiBounce",
  "gapPullback",
  "openRetest",
  "closingHold",
  "moneyRank",
];

export function LibraryClient() {
  const [copiedId, setCopiedId] = useState("");

  async function copyStrategy(strategy: StrategyCardType) {
    try {
      await navigator.clipboard.writeText(buildCopyBlock(strategy));
      setCopiedId(strategy.id);
    } catch {
      setCopiedId("failed");
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div>
        <h1 className="text-3xl font-black text-slate-950">자료실</h1>
        <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
          영상으로 상황을 먼저 보고, 조건 절차와 복붙용 초안을 한 카드에서 확인합니다.
        </p>
      </div>

      <div className="space-y-4">
        {seedStrategies.map((strategy, index) => (
          <article key={strategy.id} className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="grid gap-4 p-4 md:grid-cols-[260px_minmax(0,1fr)]">
              <div className="space-y-2">
                <ChartScene variant={variants[index % variants.length]} compact />
                <p className="text-xs font-bold text-slate-500">영상 자리 · 16:9 · 권장 640x360</p>
              </div>

              <div className="min-w-0 space-y-4">
                <div>
                  <div className="flex flex-wrap gap-1.5 text-[11px] font-black">
                    <span className="rounded bg-emerald-50 px-2 py-1 text-emerald-700">
                      {strategyTypeLabels[strategy.strategyType]}
                    </span>
                    <span className="rounded bg-slate-100 px-2 py-1 text-slate-600">{assetClassLabel(strategy.assetClass)}</span>
                    <span className="rounded bg-slate-100 px-2 py-1 text-slate-600">{timeframeLabel(strategy.timeframe)}</span>
                  </div>
                  <h2 className="mt-2 text-xl font-black text-slate-950">{strategy.title}</h2>
                  <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">{strategy.summary}</p>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <ProcedureBlock title="진입" items={strategy.conditions.entry} />
                  <ProcedureBlock title="청산" items={strategy.conditions.exit} />
                  <ProcedureBlock title="종목" items={strategy.conditions.universe} />
                  <ProcedureBlock title="필터" items={strategy.conditions.filters} />
                </div>
              </div>
            </div>

            <div className="border-t border-slate-200 bg-slate-50 p-4">
              <div className="mb-2 flex items-center justify-between gap-3">
                <h3 className="text-sm font-black text-slate-950">복붙용 조건식 초안</h3>
                <button
                  type="button"
                  className="rounded border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700"
                  onClick={() => void copyStrategy(strategy)}
                >
                  복사
                </button>
              </div>
              <pre className="max-h-52 overflow-auto rounded bg-[#07111f] p-3 text-xs leading-5 text-slate-100">
                <code>{buildCopyBlock(strategy)}</code>
              </pre>
              {copiedId === strategy.id ? <p className="mt-2 text-xs font-bold text-emerald-700">복사했습니다.</p> : null}
              {copiedId === "failed" ? <p className="mt-2 text-xs font-bold text-rose-600">복사에 실패했습니다.</p> : null}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function ProcedureBlock({ title, items }: { title: string; items: string[] }) {
  return (
    <section className="rounded-lg bg-slate-50 p-3">
      <h3 className="text-sm font-black text-slate-950">{title}</h3>
      <ol className="mt-2 space-y-1.5">
        {items.slice(0, 3).map((item, index) => (
          <li key={`${title}-${item}`} className="grid grid-cols-[20px_minmax(0,1fr)] gap-2 text-sm font-semibold leading-5 text-slate-600">
            <span className="flex size-5 items-center justify-center rounded bg-white text-xs font-black text-slate-500 ring-1 ring-slate-200">
              {index + 1}
            </span>
            <span>{item}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}

function buildCopyBlock(strategy: StrategyCardType) {
  return `[식톡 조건식 초안]
전략명: ${strategy.title}
유형: ${strategyTypeLabels[strategy.strategyType]}
자산: ${assetClassLabel(strategy.assetClass)}
시간봉: ${timeframeLabel(strategy.timeframe)}

ENTRY:
${formatLines(strategy.conditions.entry)}

EXIT:
${formatLines(strategy.conditions.exit)}

UNIVERSE:
${formatLines(strategy.conditions.universe)}

FILTER:
${formatLines(strategy.conditions.filters)}

NOTICE:
실제 투자 추천이 아니며, 각 플랫폼 적용 전 사용자가 조건을 직접 확인해야 합니다.`;
}

function formatLines(items: string[]) {
  return items.map((item, index) => `${index + 1}. ${item}`).join("\n");
}
