"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { SeriesMarker, UTCTimestamp } from "lightweight-charts";
import type { HynixChartSnapshot } from "@/lib/kis-minute-chart";
import { markFeedbackSignal, setFeedbackLastScreen } from "@/lib/feedback-session";
import { trackEvent } from "@/lib/mixpanel";
import { KisInAppAlertPanel } from "./KisInAppAlertPanel";

type ApiResponse = {
  ok?: boolean;
  snapshot?: HynixChartSnapshot;
  error?: string;
};

export function HynixKisChartPanel() {
  const [snapshot, setSnapshot] = useState<HynixChartSnapshot | null>(null);
  const [strengthThreshold] = useState(99);
  const barLimit = 20;
  const drawdownLimit = 2;
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAlertPanel, setShowAlertPanel] = useState(false);
  const [copyStatus, setCopyStatus] = useState("");
  const [error, setError] = useState("");
  const containerRef = useRef<HTMLDivElement | null>(null);

  const loadChart = useCallback(async (source: "initial" | "refresh") => {
    if (source === "refresh") {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError("");
    const startedAt = typeof performance !== "undefined" ? performance.now() : Date.now();

    try {
      const response = await fetch(`/api/kis/hynix-chart?strengthThreshold=${encodeURIComponent(strengthThreshold)}`, {
        cache: "no-store",
      });
      const data = (await response.json()) as ApiResponse;
      if (!response.ok || !data.ok || !data.snapshot) {
        throw new Error(data.error || "KIS 하이닉스 차트 데이터를 불러오지 못했습니다.");
      }
      setSnapshot(data.snapshot);
      const elapsed = (typeof performance !== "undefined" ? performance.now() : Date.now()) - startedAt;
      void trackEvent("Chart Load Completed", {
        candle_count: data.snapshot.candles.length,
        execution_strength: data.snapshot.executionStrength.value,
        latest_close: data.snapshot.latestClose,
        load_ms: Math.round(elapsed),
        marker_count: data.snapshot.markers.length,
        source,
        strength_threshold: strengthThreshold,
        symbol: "000660",
      });
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "KIS 차트 요청에 실패했습니다.";
      setError(message);
      const elapsed = (typeof performance !== "undefined" ? performance.now() : Date.now()) - startedAt;
      void trackEvent("Chart Load Failed", {
        error_message: message.slice(0, 160),
        load_ms: Math.round(elapsed),
        source,
        strength_threshold: strengthThreshold,
        symbol: "000660",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [strengthThreshold]);

  async function copyPineScript() {
    try {
      await navigator.clipboard.writeText(buildPineScript(strengthThreshold, barLimit, drawdownLimit));
      setCopyStatus("TradingView Pine Script를 복사했습니다.");
      markFeedbackSignal("export_clicked", "/app:chart");
      void trackEvent("TradingView Export Clicked", {
        copy_type: "pine_script",
        platform: "tradingview",
        status: "success",
        strategy_name: "5·20선 골든크로스 + 거래량 회복",
        symbol: "000660",
      });
    } catch {
      setCopyStatus("복사에 실패했습니다. 브라우저 권한을 확인하세요.");
      void trackEvent("TradingView Export Clicked", {
        copy_type: "pine_script",
        platform: "tradingview",
        status: "failed",
        strategy_name: "5·20선 골든크로스 + 거래량 회복",
        symbol: "000660",
      });
    }
  }

  useEffect(() => {
    setFeedbackLastScreen("/app:chart");
    void loadChart("initial");
  }, [loadChart]);

  useEffect(() => {
    if (!snapshot || !containerRef.current) {
      return;
    }

    let disposed = false;
    let chartApi: { remove: () => void } | null = null;
    let resizeObserver: ResizeObserver | null = null;

    void (async () => {
      const { createChart, createSeriesMarkers, CandlestickSeries, LineSeries, ColorType } = await import("lightweight-charts");

      if (disposed || !containerRef.current) {
        return;
      }

      const container = containerRef.current;
      const chart = createChart(container, {
        width: container.clientWidth,
        height: 460,
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
          timeVisible: true,
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

      const candleSeries = chart.addSeries(CandlestickSeries, {
        upColor: "#14b8a6",
        downColor: "#f97316",
        wickUpColor: "#14b8a6",
        wickDownColor: "#f97316",
        borderVisible: false,
      });

      const ma5Series = chart.addSeries(LineSeries, {
        color: "#34d399",
        lineWidth: 2,
        priceLineVisible: false,
        lastValueVisible: true,
      });

      const ma20Series = chart.addSeries(LineSeries, {
        color: "#60a5fa",
        lineWidth: 2,
        priceLineVisible: false,
        lastValueVisible: true,
      });

      candleSeries.setData(
        snapshot.candles.map((candle) => ({
          time: candle.time as UTCTimestamp,
          open: candle.open,
          high: candle.high,
          low: candle.low,
          close: candle.close,
        })),
      );

      ma5Series.setData(
        snapshot.candles
          .filter((candle) => candle.ma5 !== null)
          .map((candle) => ({
            time: candle.time as UTCTimestamp,
            value: candle.ma5 as number,
          })),
      );

      ma20Series.setData(
        snapshot.candles
          .filter((candle) => candle.ma20 !== null)
          .map((candle) => ({
            time: candle.time as UTCTimestamp,
            value: candle.ma20 as number,
          })),
      );

      createSeriesMarkers(
        candleSeries,
        snapshot.markers.map((marker): SeriesMarker<UTCTimestamp> => ({
          time: marker.time as UTCTimestamp,
          position: marker.type === "start" ? "belowBar" : "aboveBar",
          color: marker.type === "start" ? "#22c55e" : "#f97316",
          shape: marker.type === "start" ? "circle" : "arrowDown",
          text: marker.label,
        })),
      );

      chart.timeScale().fitContent();

      resizeObserver = new ResizeObserver((entries) => {
        const width = entries[0]?.contentRect.width;
        if (!width) return;
        chart.applyOptions({ width });
      });
      resizeObserver.observe(container);

      chartApi = chart;
    })();

    return () => {
      disposed = true;
      resizeObserver?.disconnect();
      chartApi?.remove();
    };
  }, [snapshot]);

  const strength = snapshot?.executionStrength.value ?? null;
  const strengthOk = strength !== null && strength >= strengthThreshold;

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-4xl font-black tracking-[-0.04em] text-slate-950">차트 적용</h1>
          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-sm font-black text-emerald-700">
            ● 실시간 렌더링
          </span>
        </div>
        <button
          type="button"
          className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 shadow-sm disabled:opacity-50"
          disabled={loading || refreshing}
          onClick={() => {
            void trackEvent("Chart Refresh Clicked", {
              strength_threshold: strengthThreshold,
              symbol: "000660",
            });
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
            <p className="mt-2 text-sm font-semibold text-slate-500">5일선이 20일선을 상향 돌파하고, 거래량이 20일 평균 대비 증가, 양봉 마감 시 관찰</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <StatusPill label="실시간 적용 중" active />
            <StatusPill label={snapshot ? "백테스트 완료" : "백테스트 대기"} active={Boolean(snapshot)} />
            <StatusPill label="조건 3개" active />
          </div>
        </div>
      </div>

      <div className="rounded-[1.6rem] border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-1 text-sm font-black text-slate-700">활성 조건</span>
            <ActiveChip label="5일선 상향 돌파" />
            <ActiveChip label="거래량 회복" />
            <ActiveChip label="양봉 마감" />
          </div>
          <div className="flex gap-2">
            <select
              aria-label="차트 시간봉"
              className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700"
              defaultValue="1d"
            >
              <option value="1d">일봉</option>
              <option value="15m">15분봉</option>
            </select>
            <button type="button" className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700">
              지표
            </button>
          </div>
        </div>

        <div className="mt-4 overflow-hidden rounded-2xl border border-slate-900 bg-[#07111f] p-2 shadow-inner">
          <div className="flex flex-col gap-2 px-3 pb-3 pt-2 text-sm font-bold text-slate-300 md:flex-row md:items-center md:justify-between">
            <span>
              000660 SK하이닉스 · KRX · 현재가{" "}
              <strong className="text-emerald-300">
                {snapshot?.latestClose ? `${snapshot.latestClose.toLocaleString("ko-KR")}원` : loading ? "불러오는 중" : "-"}
              </strong>
            </span>
            <span className="text-emerald-300">● 전략이 차트에 적용되었습니다</span>
          </div>
          {loading ? <div className="flex h-[460px] items-center justify-center text-sm font-bold text-slate-300">차트 불러오는 중</div> : null}
          {!loading && error ? <div className="flex h-[460px] items-center justify-center px-6 text-center text-sm font-bold text-rose-300">{error}</div> : null}
          {!loading && !error ? <div ref={containerRef} className="w-full" /> : null}
          <div className="flex flex-col gap-2 border-t border-white/10 px-3 py-3 text-xs font-bold text-slate-400 md:flex-row md:items-center md:justify-between">
            <span>
              <span className="text-emerald-400">● 진입</span> 5일선 상향 돌파 + 거래량 회복 + 양봉 마감
            </span>
            <span>
              <span className="text-orange-400">● 종료</span> 5일선 20일선 하향 이탈 또는 종가 20일선 하회
            </span>
            <span>데이터: {snapshot?.basis || "차트"} {strength !== null ? `· 체결강도 ${strength.toFixed(2)}${strengthOk ? " 충족" : ""}` : ""}</span>
          </div>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
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
        <p>
          {snapshot
            ? `${snapshot.basis} · ${snapshot.executionStrength.message} · ${snapshot.updatedAt ? formatDate(snapshot.updatedAt) : "갱신 시각 없음"}`
            : "차트 데이터를 준비중입니다"}
        </p>
      </div>
    </section>
  );
}

function ActiveChip({ label }: { label: string }) {
  return (
    <span className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-black text-emerald-700">{label}</span>
  );
}

function StatusPill({ label, active }: { label: string; active: boolean }) {
  return (
    <span className={`rounded-full border px-4 py-2 text-sm font-black ${active ? "border-emerald-200 bg-white text-emerald-700" : "border-slate-200 bg-white text-slate-500"}`}>
      {active ? "● " : ""}
      {label}
    </span>
  );
}

function buildPineScript(strengthThreshold: number, barLimit: number, drawdownLimit: number) {
  return `//@version=5
indicator("SikTalk 5·20선 재가속 관찰식", overlay=true)

strengthThreshold = input.float(${strengthThreshold}, "체결강도 기준")
barLimit = input.int(${barLimit}, "N봉 경과")
drawdownPct = input.float(${drawdownLimit}, "사용자 설정 하락폭 %")

ma5 = ta.sma(close, 5)
ma20 = ta.sma(close, 20)
volMa20 = ta.sma(volume, 20)
compressed = ta.lowest(volume / volMa20, 10) < 0.8
volumeRecovered = compressed and volume >= volMa20

// TradingView에는 키움 체결강도가 기본 데이터로 없어서 사용자가 입력값으로 대체합니다.
manualStrength = input.float(${strengthThreshold}, "수동 체결강도")
startCondition = ta.crossover(ma5, ma20) and volumeRecovered and manualStrength >= strengthThreshold
endCondition = ta.crossunder(ma5, ma20) or ta.barssince(startCondition) >= barLimit or close <= ta.valuewhen(startCondition, close, 0) * (1 - drawdownPct / 100)

plot(ma5, "MA5", color=color.new(color.lime, 0), linewidth=2)
plot(ma20, "MA20", color=color.new(color.blue, 0), linewidth=2)
plotshape(startCondition, title="시작 조건", text="시작", style=shape.circle, location=location.belowbar, color=color.lime, textcolor=color.white, size=size.tiny)
plotshape(endCondition, title="종료 조건", text="종료", style=shape.triangledown, location=location.abovebar, color=color.orange, textcolor=color.white, size=size.tiny)
alertcondition(startCondition, title="SikTalk 시작 조건", message="5·20선 재가속 관찰식 시작 조건")
alertcondition(endCondition, title="SikTalk 종료 조건", message="5·20선 재가속 관찰식 종료 조건")`;
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
