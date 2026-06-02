"use client";

import { ChartScene } from "@/components/media/ChartScene";
import { PlatformCarryPanel } from "@/components/platform/PlatformCarryPanel";
import { strategyTypeLabels } from "@/lib/constants";
import { resolveChartSceneVariant } from "@/lib/demo-media";
import { assetClassLabel, timeframeLabel } from "@/lib/format";
import { seedStrategies } from "@/lib/seed-strategies";

export function LibraryClient() {
  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div>
        <h1 className="text-3xl font-black text-slate-950">자료실</h1>
        <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
          기존 카드 흐름은 유지하고, 우측 참고 영상과 하단 플랫폼별 초안을 함께 둡니다.
        </p>
      </div>

      <div className="space-y-4">
        {seedStrategies.map((strategy) => (
          <article key={strategy.id} className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="grid gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_240px] lg:items-start">
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

              <aside className="space-y-2 lg:pl-1">
                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                  <ChartScene variant={resolveChartSceneVariant(strategy)} motion />
                </div>
                <p className="text-xs font-semibold leading-5 text-slate-500">
                  이 카드가 언제 쓰이는지 바로 떠올릴 수 있게 우측에 참고 영상을 둡니다.
                </p>
              </aside>
            </div>

            <div className="border-t border-slate-200 bg-slate-50 p-4">
              <PlatformCarryPanel strategy={strategy} compact />
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
