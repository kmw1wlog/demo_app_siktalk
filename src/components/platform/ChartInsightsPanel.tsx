import { SHOWCASE_CHART } from "@/lib/showcase-data";

export function ChartInsightsPanel() {
  return (
    <section className="grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_0.95fr]">
      <div className="rounded-[1.6rem] border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-2xl font-black tracking-[-0.04em] text-slate-950">월별 타점 분포</h2>
        <p className="mt-2 text-sm font-semibold text-slate-500">어느 달에 신호가 자주 나왔는지 차트 아래에서 바로 확인합니다.</p>
        <div className="mt-6 flex h-[220px] items-end justify-between gap-3">
          {SHOWCASE_CHART.monthlyDistribution.map((item) => (
            <div key={item.month} className="flex flex-1 flex-col items-center gap-2">
              <div className="text-sm font-black text-slate-500">{item.entry}개</div>
              <div className="flex w-full items-end justify-center gap-1">
                <div className="w-5 rounded-t-lg bg-emerald-400" style={{ height: `${item.entry * 9}px` }} />
                <div className="w-5 rounded-t-lg bg-rose-400" style={{ height: `${item.exit * 9}px` }} />
              </div>
              <div className="text-sm font-black text-slate-400">{item.month}</div>
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-center justify-center gap-6 text-sm font-black text-slate-500">
          <span className="text-emerald-600">● 진입 신호</span>
          <span className="text-rose-500">● 종료 신호</span>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {SHOWCASE_CHART.kpis.map((metric) => (
          <div key={metric.label} className="rounded-[1.6rem] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-slate-50 text-xl text-slate-400">
              {metric.tone === "emerald" ? "↗" : metric.tone === "sky" ? "◎" : metric.tone === "violet" ? "⌁" : "◔"}
            </div>
            <p className="text-base font-black text-slate-500">{metric.label}</p>
            <p className="mt-3 break-keep text-[2.4rem] font-black leading-tight tracking-[-0.05em] text-slate-950">{metric.value}</p>
            <p className="mt-2 text-sm font-semibold text-slate-400">{metric.sub}</p>
          </div>
        ))}
        <div className="rounded-[1.6rem] border border-slate-200 bg-white p-5 text-sm font-semibold leading-6 text-slate-500 shadow-sm md:col-span-2">
          ※ 위 요약은 차트에 적용한 전략을 빠르게 읽기 위한 보조 카드입니다. 실제 매매 판단을 대신하지 않습니다.
        </div>
      </div>
    </section>
  );
}
