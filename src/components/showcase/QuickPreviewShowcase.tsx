import type { ReactNode } from "react";
import Link from "next/link";
import { SHOWCASE_DAYS, SHOWCASE_HEATMAP, SHOWCASE_HOURS, SHOWCASE_PREVIEW, SHOWCASE_STRATEGY } from "@/lib/showcase-data";

export function QuickPreviewShowcase() {
  return (
    <section className="mx-auto max-w-[1320px] space-y-6">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-[2.7rem] font-black tracking-[-0.05em] text-slate-950">최근 1주 빠른 성과 미리보기</h1>
          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-black text-emerald-700">페이지 이동 없이 바로 확인</span>
        </div>
        <p className="mt-3 text-base font-semibold text-slate-500">전략의 최근 1주 성과를 빠르게 확인하고, 더 자세한 백테스트로 이동해보세요.</p>
      </div>

      <div className="rounded-[1.8rem] border border-slate-200 bg-white px-6 py-5 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-black text-emerald-700">선택된 전략</span>
            <h2 className="mt-4 break-keep text-[2.5rem] font-black tracking-[-0.04em] text-slate-950">{SHOWCASE_STRATEGY.title}</h2>
            <div className="mt-4 flex flex-wrap gap-8 text-sm font-black text-slate-500">
              <span>전략 유형 <strong className="ml-2 text-slate-800">추세 추종</strong></span>
              <span>적용 시장 <strong className="ml-2 text-slate-800">{SHOWCASE_STRATEGY.market}</strong></span>
              <span>기준 시간 <strong className="ml-2 text-slate-800">{SHOWCASE_STRATEGY.previewTimeframe}</strong></span>
            </div>
          </div>
          <Link href="/app" className="inline-flex h-12 items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 text-sm font-black text-slate-700">
            ← 전략 카드로 돌아가기
          </Link>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-6">
        <MetricCard label="최근 1주 조건 발생" value={SHOWCASE_PREVIEW.signalCount} sub={SHOWCASE_PREVIEW.averagePerDay} />
        <MetricCard label="양수 비율" value={SHOWCASE_PREVIEW.positiveRatio} sub={SHOWCASE_PREVIEW.positiveDetail} />
        <MetricCard label="평균 이후 흐름" value={SHOWCASE_PREVIEW.averageAfterReturn} sub="발생 후 평균 수익률" />
        <MetricCard label="최대 연속 손실" value={SHOWCASE_PREVIEW.maxLossStreak} sub="최근 1주 기준" />
        <MetricCard label="가장 많이 발생한 시간대" value={SHOWCASE_PREVIEW.peakTime} sub={SHOWCASE_PREVIEW.peakTimeDetail} />
        <MetricCard label="평균 보유 시간" value={SHOWCASE_PREVIEW.holdHours} sub={SHOWCASE_PREVIEW.holdDetail} />
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_0.9fr]">
        <div className="rounded-[1.8rem] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-black tracking-[-0.04em] text-slate-950">최근 1주 타점 분포</h3>
            <span className="text-sm font-black text-slate-400">ⓘ</span>
          </div>
          <div className="mt-5">
            <svg viewBox="0 0 760 280" className="h-[280px] w-full">
              <path d="M70 140 C120 120 150 170 190 110 C230 70 280 130 330 120 C380 110 430 160 470 80 C520 20 560 90 620 52 C650 40 690 55 730 35" fill="none" stroke="#cbd5e1" strokeWidth="4" strokeLinecap="round" />
              {[70, 170, 260, 390, 430, 520, 630].map((x, index) => (
                <g key={x}>
                  <line x1={x} x2={x} y1={220} y2={index === 1 ? 170 : index === 5 ? 105 : 80} stroke={index === 2 ? "#ef4444" : "#10b981"} strokeWidth="2" opacity="0.7" />
                  <circle cx={x} cy={index === 1 ? 170 : index === 5 ? 105 : 80} r="7" fill={index === 2 ? "#ef4444" : "#10b981"} />
                </g>
              ))}
              <line x1="60" x2="740" y1="130" y2="130" stroke="#e2e8f0" />
              <line x1="60" x2="740" y1="70" y2="70" stroke="#e2e8f0" />
              <line x1="60" x2="740" y1="190" y2="190" stroke="#e2e8f0" />
              <text x="10" y="74" fontSize="18" fill="#64748b">+3%</text>
              <text x="18" y="136" fontSize="18" fill="#64748b">0%</text>
              <text x="12" y="196" fontSize="18" fill="#64748b">-3%</text>
              {["5/28 (수)", "5/29 (목)", "5/30 (금)", "6/2 (월)", "6/3 (화)", "6/4 (수)"].map((label, index) => (
                <text key={label} x={90 + index * 110} y="252" fontSize="16" fill="#64748b">{label}</text>
              ))}
            </svg>
            <div className="mt-3 flex flex-wrap items-center gap-5 text-sm font-black text-slate-500">
              <span>총 14회 발생</span>
              <span className="text-emerald-600">● 상승 9회</span>
              <span>● 보합 2회</span>
              <span className="text-rose-500">● 하락 3회</span>
            </div>
          </div>
        </div>

        <div className="rounded-[1.8rem] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-black tracking-[-0.04em] text-slate-950">요일/시간대별 신호 발생 히트맵</h3>
            <span className="text-sm font-black text-slate-400">발생 적음 → 발생 많음</span>
          </div>
          <div className="mt-6 space-y-3">
            {SHOWCASE_HEATMAP.map((row, rowIndex) => (
              <div key={SHOWCASE_DAYS[rowIndex]} className="grid grid-cols-[32px_repeat(12,minmax(0,1fr))] gap-2">
                <div className="flex items-center text-base font-black text-slate-600">{SHOWCASE_DAYS[rowIndex]}</div>
                {row.map((cell, cellIndex) => (
                  <div
                    key={`${rowIndex}-${cellIndex}`}
                    className={`h-10 rounded-lg ${
                      cell === 3 ? "bg-emerald-500" : cell === 2 ? "bg-emerald-300" : cell === 1 ? "bg-emerald-100" : "bg-slate-100"
                    }`}
                  />
                ))}
              </div>
            ))}
          </div>
          <div className="mt-4 grid grid-cols-7 gap-2 text-center text-base font-black text-slate-500">
            {SHOWCASE_HOURS.map((hour) => (
              <span key={hour}>{hour}</span>
            ))}
          </div>
          <div className="mt-5 rounded-2xl bg-slate-50 px-4 py-4 text-sm font-semibold text-slate-500">
            14:00 이후에 신호 발생이 집중되는 경향이 있습니다.
          </div>
        </div>
      </div>

      <div className="rounded-[1.8rem] border border-amber-200 bg-amber-50/50 px-5 py-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-lg font-black text-slate-950">빠르게 감만 확인하고 싶을 때 쓰는 미리보기입니다.</p>
            <p className="mt-1 text-sm font-semibold text-slate-500">{SHOWCASE_PREVIEW.note}</p>
          </div>
          <button type="button" className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700">
            이 미리보기 어떻게 계산되나요?
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <ActionLink href="/chart" className="border-emerald-200 bg-emerald-600 text-white">차트에 적용</ActionLink>
        <ActionLink href="/backtests" className="border-slate-200 bg-white text-slate-900">25~26년 생존력 백테스트</ActionLink>
        <ActionLink href="/alerts" className="border-slate-200 bg-white text-slate-900">24시간 알림 초안 만들기</ActionLink>
      </div>

      <p className="text-sm font-semibold text-slate-500">{SHOWCASE_PREVIEW.footer}</p>
    </section>
  );
}

function MetricCard({ label, value, sub }: { label: string; value: string; sub: string }) {
  const compact = value.length >= 6;
  return (
    <div className="rounded-[1.7rem] border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-base font-black text-slate-600">{label}</p>
      <p className={`mt-5 break-keep font-black tracking-[-0.05em] text-slate-950 ${compact ? "text-[2rem] leading-tight" : "text-[2.8rem] leading-none"}`}>{value}</p>
      <p className="mt-4 text-base font-semibold text-slate-400">{sub}</p>
    </div>
  );
}

function ActionLink({
  href,
  className,
  children,
}: {
  href: string;
  className: string;
  children: ReactNode;
}) {
  return (
    <Link href={href} className={`flex h-20 items-center justify-center rounded-[1.5rem] border px-4 text-xl font-black shadow-sm ${className}`}>
      {children}
    </Link>
  );
}
