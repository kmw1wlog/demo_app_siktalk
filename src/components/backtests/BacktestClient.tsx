"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { trackEvent } from "@/lib/mixpanel";
import type { BacktestRunResult } from "@/lib/backtest-engine";

type BacktestResponse = {
  ok?: boolean;
  cached?: boolean;
  error?: string;
  result?: BacktestRunResult;
};

const presetIdeas = [
  { title: "5·20선 재가속 관찰식", rawIdea: "5일선 20일선 골든크로스와 거래량 회복이 붙을 때 관찰하고 싶어." },
  { title: "거래량 급증 돌파", rawIdea: "거래량이 급증하고 전고점을 돌파하는 종목을 관찰하고 싶어." },
  { title: "RSI 과매도 반등", rawIdea: "RSI 과매도 반등이 나오는 구간을 관찰하고 싶어." },
];

export function BacktestClient() {
  const [title, setTitle] = useState(presetIdeas[0].title);
  const [rawIdea, setRawIdea] = useState(presetIdeas[0].rawIdea);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<BacktestRunResult | null>(null);
  const [cached, setCached] = useState(false);
  const bootedRef = useRef(false);

  const runBacktest = useCallback(async (nextTitle = title, nextIdea = rawIdea) => {
    if (!nextIdea.trim()) {
      setError("전략 설명을 먼저 적어주세요.");
      return;
    }

    setLoading(true);
    setError("");
    void trackEvent("Backtest Requested", {
      strategy_name: nextTitle,
      text_length: nextIdea.length,
    });

    try {
      const response = await fetch("/api/backtests/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: nextTitle, rawIdea: nextIdea }),
      });
      const data = (await response.json()) as BacktestResponse;
      if (!response.ok || !data.ok || !data.result) {
        throw new Error(data.error || "백테스트 결과를 가져오지 못했습니다.");
      }
      setResult(data.result);
      setCached(Boolean(data.cached));
      setTitle(nextTitle);
      setRawIdea(nextIdea);
      void trackEvent("Backtest Completed", {
        cached: Boolean(data.cached),
        strategy_hash: data.result.strategyHash,
        strategy_name: data.result.strategyTitle,
      });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "백테스트 계산에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }, [rawIdea, title]);

  useEffect(() => {
    if (bootedRef.current) return;
    bootedRef.current = true;
    void trackEvent("Backtest Screen Viewed", { source: "nav" });
    void runBacktest(presetIdeas[0].title, presetIdeas[0].rawIdea);
  }, [runBacktest]);

  const metricCards = useMemo(() => {
    if (!result) return [];
    return [
      { label: "월평균 수익률", value: `${formatSigned(result.metrics.monthlyAverageReturnPct)}%` },
      { label: "양수 월 비율", value: `${result.metrics.positiveMonthRatioPct}%` },
      { label: "최근 3개월 성과", value: `${formatSigned(result.metrics.recentThreeMonthReturnPct)}%` },
      { label: "최대 연속 손실", value: `${result.metrics.maxLossStreak}회` },
      { label: "평균 보유 시간", value: `${result.metrics.averageHoldHours}시간` },
      { label: "매매 1회당 평균/중앙 수익률", value: `${formatSigned(result.metrics.averageTradeReturnPct)}% / ${formatSigned(result.metrics.medianTradeReturnPct)}%` },
      { label: "월별 발생 횟수", value: `월 ${result.metrics.monthlySignalCount}회` },
    ];
  }, [result]);

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-black text-emerald-700">25,26년 동안 내 전략이 꾸준히 생존할까?</p>
          <h1 className="mt-2 text-3xl font-black tracking-[-0.04em] text-slate-950">백테스트</h1>
          <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
            stock_app의 KR 1분봉 백테스트 샘플을 바탕으로 현재 전략과 가장 가까운 formula 조합에 매핑해 보여줍니다.
          </p>
        </div>
        {result ? (
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700">
            {cached ? "캐시 결과" : "새 계산"}
          </div>
        ) : null}
      </div>

      <Card className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {presetIdeas.map((preset) => (
            <button
              key={preset.title}
              type="button"
              className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-black text-slate-700"
              onClick={() => void runBacktest(preset.title, preset.rawIdea)}
            >
              {preset.title}
            </button>
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-[240px_minmax(0,1fr)]">
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="h-12 rounded-2xl border border-slate-200 px-4 text-sm font-black text-slate-900"
            placeholder="전략 이름"
          />
          <Textarea
            rows={3}
            value={rawIdea}
            onChange={(event) => setRawIdea(event.target.value)}
            placeholder="전략을 한 문장으로 적으면 가장 가까운 stock_app formula로 매핑합니다."
          />
        </div>
        {error ? <p className="text-sm font-bold text-rose-600">{error}</p> : null}
        <div className="flex flex-wrap gap-3">
          <Button className="rounded-2xl" onClick={() => void runBacktest()} disabled={loading}>
            {loading ? "백테스트 계산 중" : "25·26년 백테스트 계산"}
          </Button>
        </div>
      </Card>

      {result ? (
        <>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {metricCards.map((metric) => (
              <Card key={metric.label} className="space-y-2">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">{metric.label}</p>
                <p className="text-2xl font-black tracking-[-0.03em] text-slate-950">{metric.value}</p>
              </Card>
            ))}
          </div>

          <Card className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-black text-slate-950">누적 성과 곡선</h2>
                <p className="mt-1 text-sm font-semibold text-slate-500">전략 vs 코스피 vs 코스닥 기준선</p>
              </div>
              <div className="text-xs font-bold text-slate-500">{result.source}</div>
            </div>
            <EquityCurveChart data={result.cumulativeCurve} />
          </Card>

          <div className="grid gap-5 xl:grid-cols-2">
            <Card className="space-y-3">
              <h2 className="text-lg font-black text-slate-950">월별 성과</h2>
              <BarChart
                data={result.monthlyPoints.map((item) => ({ label: item.month.slice(2), value: item.strategyReturnPct }))}
                positiveColor="#10b981"
                negativeColor="#fb7185"
              />
            </Card>
            <Card className="space-y-3">
              <h2 className="text-lg font-black text-slate-950">월별 발생 횟수</h2>
              <BarChart
                data={result.monthlyPoints.map((item) => ({ label: item.month.slice(2), value: item.signalCount }))}
                positiveColor="#0f172a"
                negativeColor="#0f172a"
              />
            </Card>
          </div>

          <Card className="space-y-4">
            <div>
              <h2 className="text-lg font-black text-slate-950">이번 전략이 어떻게 매핑됐는지</h2>
              <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">{result.note}</p>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              {result.mappedFormulas.map((formula) => (
                <div key={formula.formulaKey} className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">{formula.formulaKey}</p>
                  <p className="mt-2 text-base font-black text-slate-950">{formula.label}</p>
                  <p className="mt-1 text-sm font-semibold text-slate-600">가중치 {Math.round(formula.weight * 100)}%</p>
                </div>
              ))}
            </div>
          </Card>
        </>
      ) : null}
    </div>
  );
}

function formatSigned(value: number) {
  return value > 0 ? `+${value}` : `${value}`;
}

function EquityCurveChart({
  data,
}: {
  data: BacktestRunResult["cumulativeCurve"];
}) {
  const width = 880;
  const height = 280;
  const padding = 26;
  const values = data.flatMap((item) => [item.strategyEquity, item.kospiEquity, item.kosdaqEquity]);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const scaleX = (index: number) => padding + (index / Math.max(data.length - 1, 1)) * (width - padding * 2);
  const scaleY = (value: number) => height - padding - ((value - min) / Math.max(max - min, 1)) * (height - padding * 2);

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-[280px] min-w-[760px] w-full rounded-2xl bg-slate-50">
        {[0, 1, 2, 3].map((line) => (
          <line
            key={line}
            x1={padding}
            x2={width - padding}
            y1={padding + ((height - padding * 2) / 3) * line}
            y2={padding + ((height - padding * 2) / 3) * line}
            stroke="#e2e8f0"
          />
        ))}
        <polyline points={toLine(data.map((item, index) => [scaleX(index), scaleY(item.strategyEquity)]))} fill="none" stroke="#059669" strokeWidth="3" />
        <polyline points={toLine(data.map((item, index) => [scaleX(index), scaleY(item.kospiEquity)]))} fill="none" stroke="#0f172a" strokeWidth="2" />
        <polyline points={toLine(data.map((item, index) => [scaleX(index), scaleY(item.kosdaqEquity)]))} fill="none" stroke="#38bdf8" strokeWidth="2" />
      </svg>
      <div className="mt-3 flex flex-wrap gap-4 text-xs font-black text-slate-600">
        <span className="text-emerald-700">● 전략</span>
        <span className="text-slate-900">● 코스피</span>
        <span className="text-sky-600">● 코스닥</span>
      </div>
    </div>
  );
}

function BarChart({
  data,
  positiveColor,
  negativeColor,
}: {
  data: Array<{ label: string; value: number }>;
  positiveColor: string;
  negativeColor: string;
}) {
  const width = 880;
  const height = 240;
  const padding = 26;
  const max = Math.max(...data.map((item) => item.value), 1);
  const min = Math.min(...data.map((item) => item.value), 0);
  const zeroY = height - padding - ((0 - min) / Math.max(max - min, 1)) * (height - padding * 2);
  const barWidth = (width - padding * 2) / Math.max(data.length, 1) - 8;

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-[240px] min-w-[760px] w-full rounded-2xl bg-slate-50">
        <line x1={padding} x2={width - padding} y1={zeroY} y2={zeroY} stroke="#cbd5e1" />
        {data.map((item, index) => {
          const x = padding + index * ((width - padding * 2) / data.length) + 4;
          const y = height - padding - ((item.value - min) / Math.max(max - min, 1)) * (height - padding * 2);
          const barHeight = Math.abs(zeroY - y);
          return (
            <g key={item.label}>
              <rect
                x={x}
                y={item.value >= 0 ? y : zeroY}
                width={barWidth}
                height={Math.max(barHeight, 2)}
                rx="6"
                fill={item.value >= 0 ? positiveColor : negativeColor}
                opacity="0.88"
              />
            </g>
          );
        })}
      </svg>
      <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-black text-slate-500">
        {data.slice(-6).map((item) => (
          <span key={item.label} className="rounded-full bg-slate-100 px-3 py-1">
            {item.label} {item.value}
          </span>
        ))}
      </div>
    </div>
  );
}

function toLine(points: Array<[number, number]>) {
  return points.map(([x, y]) => `${x},${y}`).join(" ");
}
