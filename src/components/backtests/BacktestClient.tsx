"use client";

import Link from "next/link";
import { SHOWCASE_BACKTEST, SHOWCASE_STRATEGY } from "@/lib/showcase-data";
import { showDemoNotice } from "@/lib/ui-signals";

export function BacktestClient({
  initialTitle,
}: {
  initialTitle?: string;
  initialIdea?: string;
}) {
  const title = initialTitle || SHOWCASE_STRATEGY.title;

  function handleBacktestClick() {
    showDemoNotice(
      "백테스트 계산 데모",
      "백테스트 기능은 구현 중이며, 현재 화면은 결과 레이아웃을 먼저 보여드리는 데모입니다. 정교한 계산이 꼭 필요하면 우측 하단 설문에 남겨주세요.",
    );
  }

  return (
    <section className="mx-auto max-w-[1380px] space-y-6">
      <div>
        <span className="rounded-full bg-violet-50 px-3 py-1 text-sm font-black text-violet-700">생존력 검증</span>
        <h1 className="mt-4 text-[2.9rem] font-black tracking-[-0.05em] text-slate-950">{SHOWCASE_BACKTEST.title}</h1>
        <p className="mt-3 text-base font-semibold text-slate-500">{SHOWCASE_BACKTEST.description}</p>
      </div>

      <div className="rounded-[1.8rem] border border-slate-200 bg-white px-5 py-5 shadow-sm">
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.25fr)_88px_180px_230px_110px_200px]">
          <div>
            <p className="text-sm font-black text-emerald-700">현재 전략</p>
            <h2 className="mt-3 break-keep text-[2.05rem] font-black leading-tight tracking-[-0.04em] text-slate-950">{title}</h2>
          </div>
          <div className="flex items-center justify-center">
            <span className="flex size-14 items-center justify-center rounded-full bg-emerald-50 text-2xl text-emerald-600">★</span>
          </div>
          <SelectBox label="시장" value="전체" />
          <SelectBox label="기간" value="2025.01 ~ 2026.현재" />
          <div className="grid gap-3 md:grid-cols-[1fr_160px] xl:grid-cols-[1fr_160px]">
            <SelectBox label="봉" value="일봉" />
            <button
              type="button"
              className="mt-7 flex h-14 items-center justify-center rounded-2xl bg-emerald-600 px-5 text-xl font-black text-white shadow-lg shadow-emerald-100"
              onClick={handleBacktestClick}
              data-demo-notice-title="백테스트 계산 데모"
              data-demo-notice-message="백테스트 기능은 구현 중이며, 현재는 결과 화면과 흐름을 먼저 보여드리는 데모입니다. 정교한 계산이 꼭 필요하면 우측 하단 설문에 남겨주세요."
            >
              백테스트 계산 ⚡
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-4">
        {SHOWCASE_BACKTEST.metrics.slice(0, 4).map((metric) => (
          <MetricPanel key={metric.label} {...metric} />
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        {SHOWCASE_BACKTEST.metrics.slice(4).map((metric) => (
          <MetricPanel key={metric.label} {...metric} />
        ))}
      </div>

      <div className="rounded-[1.6rem] border border-slate-200 bg-white px-5 py-4 text-sm font-semibold text-slate-400">
        ⓘ 원천 데이터는 내부 연산으로만 사용되며 결과만 제공합니다.
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        <div className="rounded-[1.8rem] border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-[1.9rem] font-black tracking-[-0.04em] text-slate-950">누적 성과 곡선</h3>
          <div className="mt-4 flex gap-5 text-base font-black">
            <span className="text-emerald-600">━ 전략</span>
            <span className="text-slate-700">━ 코스피</span>
            <span className="text-sky-500">━ 코스닥</span>
          </div>
          <svg viewBox="0 0 480 320" className="mt-5 h-[320px] w-full">
            {[0, 1, 2, 3, 4].map((line) => <line key={line} x1="40" x2="450" y1={40 + line * 55} y2={40 + line * 55} stroke="#eef2f7" />)}
            <polyline points="40,238 100,220 160,170 220,130 280,110 340,108 390,75 450,48" fill="none" stroke="#10b981" strokeWidth="4" />
            <polyline points="40,238 100,232 160,208 220,190 280,178 340,172 390,168 450,162" fill="none" stroke="#1e3a8a" strokeWidth="3" />
            <polyline points="40,238 100,236 160,222 220,210 280,198 340,190 390,184 450,176" fill="none" stroke="#38bdf8" strokeWidth="3" />
            {SHOWCASE_BACKTEST.months.map((month, index) => (
              <text key={month} x={40 + index * 58} y="298" fontSize="16" fill="#64748b">{month}</text>
            ))}
            {["200%", "160%", "120%", "80%", "40%", "0%"].map((label, index) => (
              <text key={label} x="0" y={48 + index * 44} fontSize="16" fill="#64748b">{label}</text>
            ))}
          </svg>
          <div className="rounded-2xl bg-slate-50 px-4 py-3 text-base font-semibold text-slate-400">2025.01~2026.현재 누적 수익률 (수수료/세금 제외)</div>
        </div>

        <div className="rounded-[1.8rem] border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-[1.9rem] font-black tracking-[-0.04em] text-slate-950">월별 성과 <span className="text-base text-slate-400">(월간 수익률)</span></h3>
          <div className="mt-5 flex h-[320px] items-end justify-between gap-3">
            {SHOWCASE_BACKTEST.monthlyBars.map((bar, index) => (
              <div key={index} className="flex flex-1 flex-col items-center gap-2">
                <div
                  className={`w-full rounded-t-lg ${bar >= 0 ? "bg-emerald-500" : "bg-violet-500"}`}
                  style={{ height: `${Math.max(Math.abs(bar) * 16, 10)}px` }}
                />
              </div>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-4 text-sm font-black text-slate-500">
            <span>양수(초록) / 음수(보라) 월 수익률</span>
          </div>
        </div>

        <div className="rounded-[1.8rem] border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-[1.9rem] font-black tracking-[-0.04em] text-slate-950">월별 발생 횟수 <span className="text-base text-slate-400">(시그널 수)</span></h3>
          <div className="mt-5 flex h-[320px] items-end justify-between gap-3">
            {SHOWCASE_BACKTEST.monthlySignals.map((bar, index) => (
              <div key={index} className="flex flex-1 flex-col items-center gap-2">
                <div className="w-full rounded-t-lg bg-sky-500" style={{ height: `${Math.max(bar * 4, 10)}px` }} />
              </div>
            ))}
          </div>
          <div className="mt-4 text-sm font-black text-slate-500">매수/매도 시그널 발생 횟수 (월 기준)</div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Link href="/chart" className="flex h-20 items-center justify-center rounded-[1.5rem] border border-emerald-200 bg-white px-4 text-lg font-black text-emerald-700 shadow-sm">
          차트에 적용
        </Link>
        <Link href="/alerts" className="flex h-20 items-center justify-center rounded-[1.5rem] border border-sky-200 bg-white px-4 text-lg font-black text-sky-700 shadow-sm">
          24시간 알림봇 만들기
        </Link>
        <button
          type="button"
          data-feedback-open="card"
          data-feedback-only="true"
          data-feedback-trigger="backtests_beta_cta"
          className="flex h-20 items-center justify-center rounded-[1.5rem] bg-[#060820] px-4 text-lg font-black text-white shadow-sm"
        >
          베타 신청하고 먼저 써보기 ✦
        </button>
      </div>
    </section>
  );
}

function SelectBox({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-sm font-black text-slate-400">{label}</p>
      <div className="mt-2 flex h-14 items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 text-base font-black text-slate-700">
        {value}
        <span>▾</span>
      </div>
    </div>
  );
}

function MetricPanel({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "emerald" | "violet" | "slate" | "mixed";
}) {
  const color =
    tone === "emerald" ? "text-emerald-600" : tone === "violet" ? "text-violet-600" : tone === "mixed" ? "text-slate-950" : "text-slate-950";

  return (
    <div className="rounded-[1.7rem] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <p className="text-base font-black text-slate-500">{label}</p>
        <span className="text-3xl text-slate-300">{tone === "emerald" ? "↗" : tone === "violet" ? "⌁" : tone === "mixed" ? "⚖" : "◔"}</span>
      </div>
      <p className={`mt-6 break-keep text-[3.2rem] font-black leading-tight tracking-[-0.05em] ${color}`}>{value}</p>
    </div>
  );
}
