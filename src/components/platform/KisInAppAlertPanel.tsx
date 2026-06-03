"use client";

import { useState } from "react";
import type { MaCrossAlert } from "@/lib/ma-cross-alert";
import { trackEvent } from "@/lib/mixpanel";

type ApiResponse = {
  ok?: boolean;
  mode?: string;
  alert?: MaCrossAlert;
  credential?: {
    configured: boolean;
    authenticated: boolean;
    message: string;
  };
  error?: string;
};

export function KisInAppAlertPanel() {
  const [alert, setAlert] = useState<MaCrossAlert | null>(null);
  const [mode, setMode] = useState("paper");
  const [credentialMessage, setCredentialMessage] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  async function runKisWatch() {
    setLoading(true);
    setStatus("");
    try {
      const response = await fetch("/api/kis/ma-cross-alert", { method: "POST" });
      const data = (await response.json()) as ApiResponse;
      if (!response.ok || !data.ok || !data.alert) {
        const message = data.error || "KIS 인앱 알림 확인에 실패했습니다.";
        setStatus(message);
        void trackEvent("KIS Alert Checked", {
          mode: data.mode || "paper",
          status: "failed",
          error_message: message.slice(0, 160),
        });
        return;
      }
      setAlert(data.alert);
      setMode(data.mode || "paper");
      setCredentialMessage(data.credential?.message || data.alert.credentialMessage || "");
      setStatus(data.alert.message);
      void trackEvent("KIS Alert Checked", {
        mode: data.mode || "paper",
        signal_type: data.alert.triggered ? "ma5_ma20_cross" : "standby",
        source: data.alert.source,
        status: "success",
        symbol: data.alert.symbol,
        timeframe: data.alert.timeframe,
        triggered: data.alert.triggered,
      });
    } catch {
      setStatus("KIS 인앱 알림 요청에 실패했습니다.");
      void trackEvent("KIS Alert Checked", {
        mode,
        status: "failed",
      });
    } finally {
      setLoading(false);
    }
  }

  const visibleAlert = alert;

  return (
    <section className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-black text-slate-950">관찰 알림 설정</h2>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">{mode === "kis-paper" ? "실데이터 확인" : "데모 모드"}</span>
            {alert?.source === "KIS_AUTHENTICATED_PAPER" ? (
              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-700">인증 확인</span>
            ) : null}
            {visibleAlert?.triggered ? (
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">알림 발생</span>
            ) : null}
          </div>
          <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
            5일선과 20일선 조건이 붙는지 확인하고, 관찰 알림 형태로 바로 점검합니다.
          </p>

          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <Metric label="종목" value={visibleAlert?.symbol || "005930"} />
            <Metric label="시간봉" value={visibleAlert?.timeframe || "15m"} />
            <Metric label="조건" value="MA5 > MA20" />
          </div>

          <button
            type="button"
            className="mt-4 inline-flex min-h-10 items-center justify-center rounded-full bg-slate-950 px-5 text-sm font-black text-white transition disabled:bg-slate-300"
            disabled={loading}
            onClick={() => void runKisWatch()}
          >
            {loading ? "알림 상태 확인 중" : "알림 상태 확인"}
          </button>

          {status ? (
            <p className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-bold leading-6 text-emerald-800">{status}</p>
          ) : null}
          {credentialMessage ? (
            <p className="mt-3 rounded-xl bg-blue-50 px-4 py-3 text-xs font-bold leading-5 text-blue-800">{credentialMessage}</p>
          ) : null}
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <MaCrossChart alert={visibleAlert} />
        </div>
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-slate-50 p-3">
      <p className="text-xs font-black text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-black text-slate-950">{value}</p>
    </div>
  );
}

function MaCrossChart({ alert }: { alert: MaCrossAlert | null }) {
  const candles = alert?.candles ?? [];
  const values = candles.flatMap((candle) => [candle.close, candle.ma5 ?? candle.close, candle.ma20 ?? candle.close]);
  const min = values.length ? Math.min(...values) - 2 : 90;
  const max = values.length ? Math.max(...values) + 2 : 120;

  const closePoints = toPoints(candles.map((candle) => candle.close), min, max);
  const ma5Points = toPoints(candles.map((candle) => candle.ma5), min, max);
  const ma20Points = toPoints(candles.map((candle) => candle.ma20), min, max);

  return (
    <div className="aspect-video w-full overflow-hidden rounded-lg bg-[#07111f] p-3 text-white">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs font-black text-emerald-300">MA5/MA20 CROSS</p>
        <p className="text-[11px] font-bold text-slate-300">{alert ? alert.latestClose.toFixed(2) : "대기"}</p>
      </div>
      <svg viewBox="0 0 320 150" className="h-[calc(100%-1.75rem)] w-full">
        <path d="M0 115 H320 M0 75 H320 M0 35 H320" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
        {closePoints ? <polyline points={closePoints} fill="none" stroke="#94a3b8" strokeWidth="2" /> : null}
        {ma20Points ? <polyline points={ma20Points} fill="none" stroke="#60a5fa" strokeWidth="3" /> : null}
        {ma5Points ? <polyline points={ma5Points} fill="none" stroke="#34d399" strokeWidth="3" /> : null}
        {alert && alert.signalIndex >= 0 ? (
          <circle cx={xForIndex(alert.signalIndex, candles.length)} cy="52" r="5" fill="#f8fafc" />
        ) : null}
      </svg>
    </div>
  );
}

function toPoints(values: (number | null)[], min: number, max: number): string {
  const points = values
    .map((value, index) => {
      if (value === null) return "";
      return `${xForIndex(index, values.length)},${150 - ((value - min) / (max - min)) * 130}`;
    })
    .filter(Boolean);
  return points.join(" ");
}

function xForIndex(index: number, length: number): number {
  return length <= 1 ? 0 : (index / (length - 1)) * 320;
}
