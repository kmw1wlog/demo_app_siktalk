import Link from "next/link";
import { SHOWCASE_CHART, SHOWCASE_STRATEGY } from "@/lib/showcase-data";

export function ChartShowcase() {
  return (
    <section className="mx-auto max-w-[1320px] space-y-6">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-5xl font-black tracking-[-0.05em] text-slate-950">차트 적용</h1>
          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-black text-emerald-700">실시간 렌더링</span>
        </div>
        <p className="mt-3 text-base font-semibold text-slate-500">조건식을 찾고 → 카드로 정리하고 → 차트에 바로 적용했습니다.</p>
      </div>

      <div className="rounded-[1.8rem] border border-slate-200 bg-white px-5 py-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-3 text-3xl font-black tracking-[-0.04em] text-slate-950">
              <span className="size-3 rounded-full bg-emerald-500" />
              적용 중 전략: {SHOWCASE_STRATEGY.title}
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              {["5일선 상향 돌파", "거래량 회복", "양봉 마감"].map((chip) => (
                <span key={chip} className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700">
                  <span className="mr-2 text-emerald-500">●</span>
                  {chip}
                </span>
              ))}
            </div>
          </div>
          <div className="text-base font-black text-slate-400">마지막 업데이트 {SHOWCASE_CHART.lastUpdated} ⟳</div>
        </div>
      </div>

      <div className="rounded-[1.8rem] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-3">
            <button type="button" className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-base font-black text-slate-700">{SHOWCASE_STRATEGY.chartMarket}</button>
            <button type="button" className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-base font-black text-slate-700">{SHOWCASE_STRATEGY.chartPreset}</button>
          </div>
          <div className="flex items-center gap-2">
            {["3M", "6M", "1Y", "YTD", "전체"].map((item, index) => (
              <button
                key={item}
                type="button"
                className={`rounded-2xl px-4 py-3 text-sm font-black ${index === 0 ? "border border-emerald-300 bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}
              >
                {item}
              </button>
            ))}
            {["↔", "⚙", "⤢"].map((icon) => (
              <button key={icon} type="button" className="flex size-12 items-center justify-center rounded-2xl border border-slate-200 bg-white text-lg text-slate-500">
                {icon}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5 overflow-hidden rounded-[1.5rem] border border-slate-100 bg-white">
          <div className="flex gap-6 px-4 py-4 text-base font-black text-slate-500">
            <span className="text-emerald-600">━ 5일선 (EMA)</span>
            <span className="text-blue-500">━ 20일선 (EMA)</span>
            <span className="text-slate-300">━ 거래량</span>
          </div>
          <svg viewBox="0 0 1200 440" className="h-[440px] w-full bg-white">
            {Array.from({ length: 8 }).map((_, index) => (
              <line key={`h-${index}`} x1="40" x2="1160" y1={40 + index * 45} y2={40 + index * 45} stroke="#eef2f7" />
            ))}
            {Array.from({ length: 9 }).map((_, index) => (
              <line key={`v-${index}`} x1={110 + index * 120} x2={110 + index * 120} y1="40" y2="380" stroke="#eef2f7" />
            ))}
            <polyline points="60,255 140,248 220,250 300,200 380,192 460,170 540,145 620,130 700,105 780,120 860,116 940,92 1020,78 1100,70" fill="none" stroke="#16a34a" strokeWidth="4" />
            <polyline points="60,280 140,270 220,265 300,242 380,228 460,210 540,196 620,182 700,166 780,154 860,148 940,140 1020,132 1100,124" fill="none" stroke="#2563eb" strokeWidth="4" />
            {([
              [90, 250, 24, 58, "#10b981"],
              [140, 256, 24, 48, "#ef4444"],
              [210, 240, 24, 64, "#10b981"],
              [270, 204, 24, 78, "#10b981"],
              [340, 190, 24, 62, "#10b981"],
              [410, 206, 24, 55, "#ef4444"],
              [480, 170, 24, 84, "#10b981"],
              [550, 160, 24, 56, "#10b981"],
              [620, 132, 24, 88, "#10b981"],
              [710, 118, 24, 82, "#ef4444"],
              [790, 126, 24, 50, "#10b981"],
              [870, 108, 24, 68, "#10b981"],
              [960, 86, 24, 84, "#10b981"],
              [1040, 76, 24, 58, "#ef4444"],
            ] as const).map(([x, y, w, h, color], index) => (
              <g key={index}>
                <line x1={x + w / 2} x2={x + w / 2} y1={Number(y) - 18} y2={Number(y) + Number(h) + 18} stroke={String(color)} />
                <rect x={Number(x)} y={Number(y)} width={Number(w)} height={Number(h)} rx="6" fill={String(color)} />
              </g>
            ))}
            {([
              [250, 130, "진입", "#10b981"],
              [410, 92, "종료", "#ef4444"],
              [650, 70, "진입", "#10b981"],
              [860, 55, "종료", "#ef4444"],
              [1020, 40, "진입", "#10b981"],
              [1110, 20, "종료", "#ef4444"],
            ] as const).map(([x, y, label, color], index) => (
              <g key={index}>
                <line x1={x} x2={x} y1={y + 24} y2={y + 60} stroke={color} strokeDasharray="5 4" />
                <rect x={x - 26} y={y} rx="10" ry="10" width="52" height="30" fill={color} />
                <text x={x} y={y + 20} textAnchor="middle" fontSize="14" fontWeight="800" fill="white">{label}</text>
              </g>
            ))}
            {Array.from({ length: 42 }).map((_, index) => {
              const x = 60 + index * 26;
              const h = 18 + (index % 7) * 8;
              const color = index % 3 === 0 ? "#fca5a5" : "#a7f3d0";
              return <rect key={index} x={x} y={360 - h} width="14" height={h} rx="4" fill={color} />;
            })}
            {["2,300", "2,400", "2,500", "2,600", "2,700", "2,800", "2,900"].map((label, index) => (
              <text key={label} x="1172" y={330 - index * 48} fontSize="18" fill="#64748b">{label}</text>
            ))}
          </svg>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_0.95fr]">
        <div className="rounded-[1.8rem] border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-2xl font-black tracking-[-0.04em] text-slate-950">월별 타점 분포</h3>
          <p className="mt-2 text-sm font-semibold text-slate-500">어느 달에 신호가 많이 나왔는지 한눈에 확인하세요.</p>
          <div className="mt-6 flex h-[220px] items-end justify-between gap-3">
            {SHOWCASE_CHART.monthlyDistribution.map((item) => (
              <div key={item.month} className="flex flex-1 flex-col items-center gap-2">
                <div className="text-sm font-black text-slate-500">{item.entry}개</div>
                <div className="flex w-full items-end justify-center gap-1">
                  <div className="w-6 rounded-t-lg bg-emerald-400" style={{ height: `${item.entry * 10}px` }} />
                  <div className="w-6 rounded-t-lg bg-rose-400" style={{ height: `${item.exit * 10}px` }} />
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

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {SHOWCASE_CHART.kpis.map((metric) => (
            <div key={metric.label} className="rounded-[1.8rem] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-5 flex size-14 items-center justify-center rounded-full bg-slate-50 text-2xl text-slate-400">
                {metric.tone === "emerald" ? "↗" : metric.tone === "sky" ? "◎" : metric.tone === "violet" ? "⌁" : "◔"}
              </div>
              <p className="text-base font-black text-slate-500">{metric.label}</p>
              <p className="mt-3 break-keep text-[3.25rem] font-black leading-tight tracking-[-0.05em] text-slate-950">{metric.value}</p>
              <p className="mt-3 text-sm font-semibold text-slate-400">{metric.sub}</p>
            </div>
          ))}
          <div className="rounded-[1.8rem] border border-slate-200 bg-white p-5 text-sm font-semibold leading-6 text-slate-500 shadow-sm md:col-span-2 xl:col-span-4">
            ※ 백테스트 기준이며, 실제 매매 결과와 다를 수 있습니다.
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Link href="/app" className="flex h-16 items-center justify-center rounded-2xl border border-emerald-200 bg-white px-4 text-xl font-black text-emerald-700">
          &lt;/&gt; TradingView Pine 복사
        </Link>
        <Link href="/app" className="flex h-16 items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 text-xl font-black text-slate-800">
          전략 카드 보기
        </Link>
        <Link href="/alerts" className="flex h-16 items-center justify-center rounded-2xl bg-emerald-600 px-4 text-xl font-black text-white">
          24시간 알림봇 만들기
        </Link>
        <Link href="/backtests" className="flex h-16 items-center justify-center rounded-2xl border border-violet-300 bg-white px-4 text-xl font-black text-violet-700">
          25~26년 백테스트
        </Link>
      </div>

      <div className="fixed bottom-6 right-6 rounded-2xl bg-slate-950 px-5 py-4 text-sm font-black text-white shadow-2xl">
        ✓ TradingView 복사 준비 완료
      </div>
    </section>
  );
}
