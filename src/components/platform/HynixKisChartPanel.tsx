"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  CandlestickSeries,
  ColorType,
  createChart,
  createSeriesMarkers,
  HistogramSeries,
  LineSeries,
  type IChartApi,
  type ISeriesApi,
  type LogicalRange,
  type SeriesMarker,
  type UTCTimestamp,
} from "lightweight-charts";
import { calculateRsi, calculateSma, calculateStochastic } from "@/lib/chart-indicators";
import type { ChartInterval, HynixChartCandle, HynixChartSnapshot } from "@/lib/kis-minute-chart";
import { markFeedbackSignal, setFeedbackLastScreen } from "@/lib/feedback-session";
import { trackEvent } from "@/lib/mixpanel";
import { showDemoNotice } from "@/lib/ui-signals";
import { KisInAppAlertPanel } from "./KisInAppAlertPanel";

type ApiResponse = {
  ok?: boolean;
  snapshot?: HynixChartSnapshot;
  error?: string;
};

type IndicatorConfig = {
  maPeriods: number[];
  maEnabled: boolean[];
  rsiEnabled: boolean;
  rsiPeriod: number;
  stochasticEnabled: boolean;
  stochasticK: number;
  stochasticD: number;
};

const MA_COLORS = ["#22c55e", "#60a5fa", "#f59e0b", "#f472b6"];

const DEFAULT_INDICATORS: IndicatorConfig = {
  maPeriods: [5, 20, 60, 120],
  maEnabled: [true, true, false, false],
  rsiEnabled: false,
  rsiPeriod: 14,
  stochasticEnabled: false,
  stochasticK: 14,
  stochasticD: 3,
};

const INITIAL_COUNTS: Record<ChartInterval, number> = {
  "1m": 240,
  "15m": 96,
  "1d": 120,
};

const HISTORY_COUNTS: Record<ChartInterval, number> = {
  "1m": 180,
  "15m": 64,
  "1d": 90,
};

const VISIBLE_WINDOWS: Record<ChartInterval, number> = {
  "1m": 90,
  "15m": 64,
  "1d": 70,
};

export function HynixKisChartPanel() {
  const [interval, setInterval] = useState<ChartInterval>("15m");
  const [snapshot, setSnapshot] = useState<HynixChartSnapshot | null>(null);
  const [indicatorConfig, setIndicatorConfig] = useState<IndicatorConfig>(DEFAULT_INDICATORS);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [showIndicatorPanel, setShowIndicatorPanel] = useState(false);
  const [showAlertPanel, setShowAlertPanel] = useState(false);
  const [copyStatus, setCopyStatus] = useState("");
  const [error, setError] = useState("");
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const snapshotRef = useRef<HynixChartSnapshot | null>(null);
  const historyLoadingRef = useRef(false);
  const pendingRangeRef = useRef<LogicalRange | null>(null);
  const pendingShiftRef = useRef(0);
  const shouldFitContentRef = useRef(true);

  useEffect(() => {
    snapshotRef.current = snapshot;
  }, [snapshot]);

  useEffect(() => {
    historyLoadingRef.current = historyLoading;
  }, [historyLoading]);

  const latestClose = snapshot?.latestClose ?? null;
  const chartModeLabel = snapshot?.basis.includes("KIS 실데이터") ? "실데이터 차트" : "데모 차트";
  const activeIndicators = useMemo(
    () =>
      indicatorConfig.maEnabled.filter(Boolean).length +
      (indicatorConfig.rsiEnabled ? 1 : 0) +
      (indicatorConfig.stochasticEnabled ? 1 : 0),
    [indicatorConfig],
  );

  const loadChart = useCallback(
    async (source: "initial" | "refresh" | "interval-change") => {
      if (source === "refresh") {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      shouldFitContentRef.current = true;
      pendingRangeRef.current = null;
      pendingShiftRef.current = 0;
      setError("");
      const startedAt = typeof performance !== "undefined" ? performance.now() : Date.now();

      try {
        const url = buildChartUrl({
          interval,
          count: INITIAL_COUNTS[interval],
          includeExecutionStrength: true,
        });

        const response = await fetch(url, { cache: "no-store" });
        const data = (await response.json()) as ApiResponse;
        if (!response.ok || !data.ok || !data.snapshot) {
          throw new Error(data.error || "KIS 하이닉스 차트 데이터를 불러오지 못했습니다.");
        }

        setSnapshot(data.snapshot);
        const elapsed = (typeof performance !== "undefined" ? performance.now() : Date.now()) - startedAt;
        void trackEvent("Chart Load Completed", {
          candle_count: data.snapshot.candles.length,
          interval,
          latest_close: data.snapshot.latestClose,
          load_ms: Math.round(elapsed),
          marker_count: data.snapshot.markers.length,
          source,
          symbol: "000660",
        });
      } catch (caught) {
        const message = caught instanceof Error ? caught.message : "KIS 차트 요청에 실패했습니다.";
        setError(message);
        const elapsed = (typeof performance !== "undefined" ? performance.now() : Date.now()) - startedAt;
        void trackEvent("Chart Load Failed", {
          error_message: message.slice(0, 160),
          interval,
          load_ms: Math.round(elapsed),
          source,
          symbol: "000660",
        });
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [interval],
  );

  const loadMoreHistory = useCallback(async () => {
    const current = snapshotRef.current;
    if (!current || !current.hasMoreHistory || historyLoadingRef.current || !current.nextCursorDate) {
      return;
    }

    setHistoryLoading(true);
    historyLoadingRef.current = true;

    try {
      const currentRange = chartRef.current?.timeScale().getVisibleLogicalRange() ?? null;
      const url = buildChartUrl({
        interval,
        count: HISTORY_COUNTS[interval],
        beforeDate: current.nextCursorDate,
        beforeTime: current.nextCursorTime,
        includeExecutionStrength: false,
      });

      const response = await fetch(url, { cache: "no-store" });
      const data = (await response.json()) as ApiResponse;

      if (!response.ok || !data.ok || !data.snapshot) {
        throw new Error(data.error || "과거 차트 데이터를 더 불러오지 못했습니다.");
      }

      const merged = mergeSnapshots(current, data.snapshot);
      pendingRangeRef.current = currentRange;
      pendingShiftRef.current = Math.max(merged.candles.length - current.candles.length, 0);
      shouldFitContentRef.current = false;
      setSnapshot(merged);
    } catch {
      // 과거 구간 추가 실패는 화면 전체 오류로 승격하지 않는다.
    } finally {
      setHistoryLoading(false);
      historyLoadingRef.current = false;
    }
  }, [interval]);

  async function copyPineScript() {
    setCopyStatus("실제 TradingView용 복사식은 준비 중입니다. 꼭 필요하면 우측 하단 설문에 남겨주세요.");
    showDemoNotice(
      "TradingView 복사 데모",
      "지금은 복사 버튼의 위치와 흐름만 먼저 보여드립니다. 실제로 바로 붙여넣을 식이 매우 필요하면 우측 하단 설문에 남겨주세요.",
    );
    markFeedbackSignal("export_clicked", "/app:chart");
    void trackEvent("TradingView Export Clicked", {
      copy_type: "pine_script",
      interval,
      platform: "tradingview",
      status: "demo_notice",
      strategy_name: "5·20선 골든크로스 + 거래량 회복",
      symbol: "000660",
    });
  }

  useEffect(() => {
    setFeedbackLastScreen("/app:chart");
  }, []);

  useEffect(() => {
    void loadChart("initial");
  }, [loadChart]);

  useEffect(() => {
    if (!snapshot || !containerRef.current) {
      return;
    }

    const container = containerRef.current;
    const chart = createChart(container, {
      width: container.clientWidth,
      height: 640,
      layout: {
        background: { type: ColorType.Solid, color: "#07111f" },
        textColor: "#cbd5e1",
        attributionLogo: true,
      },
      grid: {
        vertLines: { color: "rgba(148, 163, 184, 0.08)" },
        horzLines: { color: "rgba(148, 163, 184, 0.08)" },
      },
      timeScale: {
        borderColor: "rgba(148, 163, 184, 0.18)",
        timeVisible: interval !== "1d",
        secondsVisible: false,
      },
      rightPriceScale: {
        borderColor: "rgba(148, 163, 184, 0.18)",
      },
      crosshair: {
        vertLine: { color: "rgba(226, 232, 240, 0.25)" },
        horzLine: { color: "rgba(226, 232, 240, 0.25)" },
      },
    });

    const volumePane = chart.addPane(true);
    volumePane.setHeight(130);
    const shouldShowOscillator = indicatorConfig.rsiEnabled || indicatorConfig.stochasticEnabled;
    const oscillatorPane = shouldShowOscillator ? chart.addPane(true) : null;
    oscillatorPane?.setHeight(150);

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: "#14b8a6",
      downColor: "#f97316",
      wickUpColor: "#14b8a6",
      wickDownColor: "#f97316",
      borderVisible: false,
    });

    candleSeriesRef.current = candleSeries;
    chartRef.current = chart;

    candleSeries.setData(
      snapshot.candles.map((candle) => ({
        time: candle.time as UTCTimestamp,
        open: candle.open,
        high: candle.high,
        low: candle.low,
        close: candle.close,
      })),
    );

    const maSeries = indicatorConfig.maPeriods
      .map((period, index) => ({
        period,
        enabled: indicatorConfig.maEnabled[index],
        color: MA_COLORS[index],
      }))
      .filter((item) => item.enabled)
      .map((item) => {
        const series = chart.addSeries(
          LineSeries,
          {
            color: item.color,
            lineWidth: item.period === 5 || item.period === 20 ? 2 : 1,
            priceLineVisible: false,
            lastValueVisible: true,
          },
          0,
        );

        series.setData(
          calculateSma(snapshot.candles, item.period).map((point) => ({
            time: point.time as UTCTimestamp,
            value: point.value,
          })),
        );

        return series;
      });

    const volumeSeries = chart.addSeries(
      HistogramSeries,
      {
        color: "#334155",
        priceFormat: { type: "volume" },
        priceLineVisible: false,
      },
      1,
    );

    volumeSeries.setData(
      snapshot.candles.map((candle, index) => ({
        time: candle.time as UTCTimestamp,
        value: candle.volume,
        color: index > 0 && candle.close >= snapshot.candles[index - 1].close ? "rgba(20,184,166,0.65)" : "rgba(249,115,22,0.65)",
      })),
    );

    if (shouldShowOscillator && oscillatorPane) {
      if (indicatorConfig.rsiEnabled) {
        const rsiSeries = chart.addSeries(
          LineSeries,
          {
            color: "#a855f7",
            lineWidth: 2,
            priceLineVisible: false,
            lastValueVisible: true,
          },
          2,
        );

        rsiSeries.setData(
          calculateRsi(snapshot.candles, indicatorConfig.rsiPeriod).map((point) => ({
            time: point.time as UTCTimestamp,
            value: point.value,
          })),
        );
      }

      if (indicatorConfig.stochasticEnabled) {
        const stochastic = calculateStochastic(snapshot.candles, indicatorConfig.stochasticK, indicatorConfig.stochasticD);
        const kSeries = chart.addSeries(
          LineSeries,
          {
            color: "#38bdf8",
            lineWidth: 2,
            priceLineVisible: false,
            lastValueVisible: true,
          },
          2,
        );
        const dSeries = chart.addSeries(
          LineSeries,
          {
            color: "#f59e0b",
            lineWidth: 2,
            priceLineVisible: false,
            lastValueVisible: true,
          },
          2,
        );

        kSeries.setData(stochastic.k.map((point) => ({ time: point.time as UTCTimestamp, value: point.value })));
        dSeries.setData(stochastic.d.map((point) => ({ time: point.time as UTCTimestamp, value: point.value })));
      }
    }

    createSeriesMarkers(
      candleSeries,
      snapshot.markers.map(
        (marker): SeriesMarker<UTCTimestamp> => ({
          time: marker.time as UTCTimestamp,
          position: marker.type === "start" ? "belowBar" : "aboveBar",
          color: marker.type === "start" ? "#22c55e" : "#f97316",
          shape: marker.type === "start" ? "circle" : "arrowDown",
          text: marker.label,
        }),
      ),
    );

    const visibleRange = pendingRangeRef.current;
    const shift = pendingShiftRef.current;

    if (visibleRange && shift > 0) {
      chart.timeScale().setVisibleLogicalRange({
        from: visibleRange.from + shift,
        to: visibleRange.to + shift,
      });
    } else if (shouldFitContentRef.current) {
      const to = snapshot.candles.length + 3;
      const from = Math.max(0, to - VISIBLE_WINDOWS[interval]);
      chart.timeScale().setVisibleLogicalRange({ from, to });
    }

    pendingRangeRef.current = null;
    pendingShiftRef.current = 0;
    shouldFitContentRef.current = false;

    const handleVisibleRangeChange = (newRange: LogicalRange | null) => {
      if (!newRange || historyLoadingRef.current || !snapshotRef.current?.hasMoreHistory) {
        return;
      }

      const barsInfo = candleSeries.barsInLogicalRange(newRange);
      if (barsInfo && barsInfo.barsBefore < 20) {
        void loadMoreHistory();
      }
    };

    chart.timeScale().subscribeVisibleLogicalRangeChange(handleVisibleRangeChange);

    const resizeObserver = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width;
      if (!width) {
        return;
      }
      chart.applyOptions({ width });
    });

    resizeObserver.observe(container);

    return () => {
      chart.timeScale().unsubscribeVisibleLogicalRangeChange(handleVisibleRangeChange);
      resizeObserver.disconnect();
      maSeries.forEach((series) => {
        chart.removeSeries(series);
      });
      chart.remove();
      chartRef.current = null;
      candleSeriesRef.current = null;
    };
  }, [indicatorConfig, interval, loadMoreHistory, snapshot]);

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-4xl font-black tracking-[-0.04em] text-slate-950">차트 적용</h1>
          {snapshot ? (
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-black text-slate-700">{chartModeLabel}</span>
          ) : null}
          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-sm font-black text-emerald-700">● 최근 구간 우선 렌더링</span>
        </div>
        <button
          type="button"
          className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 shadow-sm disabled:opacity-50"
          disabled={loading || refreshing}
          onClick={() => {
            void trackEvent("Chart Refresh Clicked", { interval, symbol: "000660" });
            void loadChart("refresh");
          }}
        >
          {refreshing ? "새로 적용 중" : "실데이터 새로고침"}
        </button>
      </div>

      <div className="rounded-[1.35rem] border border-emerald-100 bg-emerald-50/60 px-5 py-4 text-sm font-black text-emerald-800">
        ✓ 조건식을 찾고 → 카드로 정리하고 → 차트에 바로 적용했습니다
      </div>

      <div className="rounded-[1.6rem] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="text-sm font-black text-slate-400">적용 중 전략:</p>
            <h2 className="mt-2 text-3xl font-black tracking-[-0.04em] text-slate-950">5·20선 골든크로스 + 거래량 회복</h2>
            <p className="mt-2 text-sm font-semibold text-slate-500">미래 봉을 억지로 만들지 않고, 실제 과거 봉에서 5/20선 교차와 거래량 회복이 잡힌 구간만 표시합니다.</p>
            <p className="mt-2 text-sm font-semibold text-amber-600">현재 데모는 5·20선 대표 전략 중심으로 먼저 보여드립니다. 더 다양한 전략 렌더가 꼭 필요하면 우측 하단 설문에 남겨주세요.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <StatusPill label={`${intervalLabel(interval)} 적용`} active />
            <StatusPill label={historyLoading ? "과거 구간 추가 중" : "과거 스크롤 로딩"} active />
            <StatusPill label={`지표 ${activeIndicators}개`} active />
          </div>
        </div>
      </div>

      <div className="rounded-[1.6rem] border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <span className="mr-1 text-sm font-black text-slate-700">시간봉</span>
              {(["1m", "15m", "1d"] as ChartInterval[]).map((item) => (
                <button
                  key={item}
                  type="button"
                  className={`rounded-full px-4 py-2 text-sm font-black ${interval === item ? "bg-slate-950 text-white" : "border border-slate-200 bg-white text-slate-700"}`}
                  onClick={() => {
                    if (interval === item) {
                      return;
                    }
                    setInterval(item);
                    shouldFitContentRef.current = true;
                    setError("");
                    void trackEvent("Chart Interval Changed", { interval: item, symbol: "000660" });
                  }}
                >
                  {intervalLabel(item)}
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700"
                onClick={() => setShowIndicatorPanel((current) => !current)}
              >
                {showIndicatorPanel ? "지표 설정 닫기" : "지표 설정"}
              </button>
            </div>
          </div>

          {showIndicatorPanel ? (
            <div className="grid gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 lg:grid-cols-[1.3fr_1fr]">
              <div className="space-y-3">
                <p className="text-sm font-black text-slate-700">이평선 최대 4개</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {indicatorConfig.maPeriods.map((period, index) => (
                    <label key={`${period}-${index}`} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm font-bold text-slate-700">
                      <input
                        type="checkbox"
                        checked={indicatorConfig.maEnabled[index]}
                        onChange={(event) => {
                          const next = [...indicatorConfig.maEnabled];
                          next[index] = event.target.checked;
                          setIndicatorConfig((current) => ({ ...current, maEnabled: next }));
                        }}
                      />
                      <span className="h-3 w-3 rounded-full" style={{ backgroundColor: MA_COLORS[index] }} />
                      <span>MA</span>
                      <input
                        aria-label={`이평선 ${index + 1} 기간`}
                        type="number"
                        min={2}
                        max={240}
                        value={period}
                        className="w-20 rounded-xl border border-slate-200 px-3 py-2 text-sm font-black text-slate-800"
                        onChange={(event) => {
                          const next = [...indicatorConfig.maPeriods];
                          next[index] = Math.max(2, Number(event.target.value) || 2);
                          setIndicatorConfig((current) => ({ ...current, maPeriods: next }));
                        }}
                      />
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-sm font-black text-slate-700">오실레이터</p>
                <div className="space-y-3">
                  <label className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700">
                    <span className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={indicatorConfig.rsiEnabled}
                        onChange={(event) =>
                          setIndicatorConfig((current) => ({
                            ...current,
                            rsiEnabled: event.target.checked,
                          }))
                        }
                      />
                      RSI
                    </span>
                    <input
                      aria-label="RSI 기간"
                      type="number"
                      min={2}
                      max={50}
                      value={indicatorConfig.rsiPeriod}
                      className="w-20 rounded-xl border border-slate-200 px-3 py-2 text-sm font-black text-slate-800"
                      onChange={(event) =>
                        setIndicatorConfig((current) => ({
                          ...current,
                          rsiPeriod: Math.max(2, Number(event.target.value) || 14),
                        }))
                      }
                    />
                  </label>

                  <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700">
                    <label className="flex items-center justify-between">
                      <span className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={indicatorConfig.stochasticEnabled}
                          onChange={(event) =>
                            setIndicatorConfig((current) => ({
                              ...current,
                              stochasticEnabled: event.target.checked,
                            }))
                          }
                        />
                        스토캐스틱
                      </span>
                    </label>
                    <div className="mt-3 flex gap-2">
                      <input
                        aria-label="스토캐스틱 K 기간"
                        type="number"
                        min={2}
                        max={50}
                        value={indicatorConfig.stochasticK}
                        className="w-24 rounded-xl border border-slate-200 px-3 py-2 text-sm font-black text-slate-800"
                        onChange={(event) =>
                          setIndicatorConfig((current) => ({
                            ...current,
                            stochasticK: Math.max(2, Number(event.target.value) || 14),
                          }))
                        }
                      />
                      <input
                        aria-label="스토캐스틱 D 기간"
                        type="number"
                        min={2}
                        max={20}
                        value={indicatorConfig.stochasticD}
                        className="w-24 rounded-xl border border-slate-200 px-3 py-2 text-sm font-black text-slate-800"
                        onChange={(event) =>
                          setIndicatorConfig((current) => ({
                            ...current,
                            stochasticD: Math.max(2, Number(event.target.value) || 3),
                          }))
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          <div className="overflow-hidden rounded-2xl border border-slate-900 bg-[#07111f] p-2 shadow-inner">
            <div className="flex flex-col gap-2 px-3 pb-3 pt-2 text-sm font-bold text-slate-300 md:flex-row md:items-center md:justify-between">
              <span>
                000660 SK하이닉스 · KRX · 현재가{" "}
                <strong className="text-emerald-300">{latestClose ? `${latestClose.toLocaleString("ko-KR")}원` : loading ? "불러오는 중" : "-"}</strong>
              </span>
              <span className="text-emerald-300">{historyLoading ? "● 과거 봉 추가 로딩 중" : "● 전략이 차트에 적용되었습니다"}</span>
            </div>

            {loading ? <div className="flex h-[640px] items-center justify-center text-sm font-bold text-slate-300">차트 불러오는 중</div> : null}
            {!loading && error ? <div className="flex h-[640px] items-center justify-center px-6 text-center text-sm font-bold text-rose-300">{error}</div> : null}
            {!loading && !error ? <div ref={containerRef} className="w-full" /> : null}

            <div className="flex flex-col gap-2 border-t border-white/10 px-3 py-3 text-xs font-bold text-slate-400 md:flex-row md:items-center md:justify-between">
              <span>
                <span className="text-emerald-400">● 진입</span> 5일선 상향 돌파 + 거래량 회복 + 양봉 마감
              </span>
              <span>
                <span className="text-orange-400">● 종료</span> 5일선 20일선 하향 이탈 또는 종가 20일선 하회
              </span>
              <span>{snapshot ? `${snapshot.basis} · ${snapshot.executionStrength.message}` : "차트 준비중"}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <button
          type="button"
          className="flex h-16 items-center justify-center rounded-2xl bg-emerald-600 px-5 text-base font-black text-white shadow-lg shadow-emerald-100"
          onClick={() => void copyPineScript()}
        >
          &lt;/&gt; TradingView Pine 복사
        </button>
        <button
          type="button"
          className="flex h-16 items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 text-base font-black text-slate-800"
          onClick={() => setShowAlertPanel((current) => !current)}
        >
          {showAlertPanel ? "알림 설정 닫기" : "관찰 알림 설정"}
        </button>
        <Link
          href="/alerts?idea=5일선%2020일선%20골든크로스%20알림%20세팅%20도와줘"
          className="flex h-16 items-center justify-center rounded-2xl border border-sky-200 bg-sky-50 px-5 text-base font-black text-sky-900"
          data-demo-notice-title="식톡 알림봇 데모"
          data-demo-notice-message="현재는 알림 초안을 빠르게 보여드리는 데모입니다. 정교한 알림 설정이 꼭 필요하면 우측 하단 설문에 남겨주세요."
        >
          식톡앱알람봇
        </Link>
      </div>

      {showAlertPanel ? <KisInAppAlertPanel /> : null}

      {copyStatus ? (
        <div className="mx-auto flex w-fit items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-black text-emerald-800 shadow-sm">
          ✓ {copyStatus}
          <button type="button" className="text-emerald-500" onClick={() => setCopyStatus("")}>
            ×
          </button>
        </div>
      ) : null}

      <div className="flex flex-col gap-2 text-xs font-semibold text-slate-500 md:flex-row md:items-center md:justify-between">
        <p>{snapshot ? `${snapshot.updatedAt ? formatDate(snapshot.updatedAt) : "갱신 시각 없음"} · 왼쪽으로 당기면 과거 봉을 더 불러옵니다.` : "차트 데이터를 준비중입니다"}</p>
      </div>
    </section>
  );
}

function buildChartUrl(input: {
  interval: ChartInterval;
  count: number;
  beforeDate?: string | null;
  beforeTime?: string | null;
  includeExecutionStrength: boolean;
}) {
  const url = new URL("/api/kis/hynix-chart", window.location.origin);
  url.searchParams.set("interval", input.interval);
  url.searchParams.set("count", String(input.count));
  if (input.beforeDate) {
    url.searchParams.set("beforeDate", input.beforeDate);
  }
  if (input.beforeTime) {
    url.searchParams.set("beforeTime", input.beforeTime);
  }
  if (!input.includeExecutionStrength) {
    url.searchParams.set("includeExecutionStrength", "0");
  }
  return url.toString();
}

function mergeSnapshots(current: HynixChartSnapshot, older: HynixChartSnapshot): HynixChartSnapshot {
  const mergedCandles = dedupeCandles([...older.candles, ...current.candles]);
  const mergedMarkers = dedupeMarkers([...older.markers, ...current.markers]);

  return {
    ...current,
    candles: mergedCandles,
    markers: mergedMarkers,
    nextCursorDate: older.nextCursorDate,
    nextCursorTime: older.nextCursorTime,
    hasMoreHistory: older.hasMoreHistory,
  };
}

function dedupeCandles(candles: HynixChartCandle[]) {
  const map = new Map<number, HynixChartCandle>();
  candles.forEach((candle) => {
    map.set(candle.time, candle);
  });
  return Array.from(map.values()).sort((left, right) => left.time - right.time);
}

function dedupeMarkers(markers: HynixChartSnapshot["markers"]) {
  const map = new Map<string, HynixChartSnapshot["markers"][number]>();
  markers.forEach((marker) => {
    map.set(`${marker.time}:${marker.type}`, marker);
  });
  return Array.from(map.values()).sort((left, right) => left.time - right.time);
}

function intervalLabel(interval: ChartInterval) {
  if (interval === "1m") {
    return "1분봉";
  }
  if (interval === "15m") {
    return "15분봉";
  }
  return "일봉";
}

function StatusPill({ label, active }: { label: string; active: boolean }) {
  return (
    <span className={`rounded-full border px-4 py-2 text-sm font-black ${active ? "border-emerald-200 bg-white text-emerald-700" : "border-slate-200 bg-white text-slate-500"}`}>
      {active ? "● " : ""}
      {label}
    </span>
  );
}

function formatDate(value: string) {
  const date = new Date(value);
  return new Intl.DateTimeFormat("ko-KR", {
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}
