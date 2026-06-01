"use client";

import { useState } from "react";
import {
  DEMO_NATURAL_LANGUAGE,
  DEMO_KIS_JSON,
  DEMO_KIWOOM_TABLE,
  DEMO_PINE_SCRIPT,
  DEMO_TELEGRAM_JSON,
  DEMO_TELEGRAM_TEXT,
  DEMO_YES_INDICATOR,
  DEMO_YES_LANGUAGE,
} from "@/lib/demo-strategy";

type DemoTab = "natural" | "tradingview" | "yestrader" | "kiwoom" | "telegram" | "kis";

const tabs: { id: DemoTab; label: string }[] = [
  { id: "natural", label: "자연어 설명" },
  { id: "tradingview", label: "TradingView Pine" },
  { id: "yestrader", label: "예스랭귀지" },
  { id: "kiwoom", label: "키움 설정표" },
  { id: "telegram", label: "Telegram" },
  { id: "kis", label: "KIS API" },
];

const copyByTab: Record<DemoTab, string> = {
  natural: DEMO_NATURAL_LANGUAGE,
  tradingview: DEMO_PINE_SCRIPT,
  yestrader: `${DEMO_YES_LANGUAGE}\n\n\n${DEMO_YES_INDICATOR}`,
  kiwoom: DEMO_KIWOOM_TABLE,
  telegram: `${DEMO_TELEGRAM_TEXT}\n\n${DEMO_TELEGRAM_JSON}`,
  kis: DEMO_KIS_JSON,
};

export function DemoPlatformPanel() {
  const [activeTab, setActiveTab] = useState<DemoTab>("natural");
  const [status, setStatus] = useState("");
  const [sending, setSending] = useState(false);

  async function copyCurrent() {
    try {
      await navigator.clipboard.writeText(copyByTab[activeTab]);
      setStatus("복사했습니다.");
    } catch {
      setStatus("복사에 실패했습니다. 내용을 직접 선택해 복사해주세요.");
    }
  }

  async function sendTelegramTest() {
    setSending(true);
    setStatus("");
    try {
      const response = await fetch("/api/demo/telegram", { method: "POST" });
      const data = (await response.json()) as { ok?: boolean; error?: string };
      if (!response.ok || !data.ok) {
        setStatus(data.error ?? "텔레그램 테스트 알림을 보내지 못했습니다.");
        return;
      }
      setStatus("텔레그램 테스트 알림을 보냈습니다.");
    } catch {
      setStatus("텔레그램 테스트 알림 요청에 실패했습니다.");
    } finally {
      setSending(false);
    }
  }

  return (
    <section className="w-full max-w-full overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-lg font-black text-slate-950">플랫폼별 퍼가기</h2>
          <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">
            같은 전략을 플랫폼별로 옮겨 쓸 수 있는 형식으로 정리합니다.
          </p>
        </div>
        <button
          type="button"
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold text-slate-800 transition hover:bg-slate-50"
          onClick={() => void copyCurrent()}
        >
          현재 탭 복사
        </button>
      </div>

      <div className="mt-4 flex max-w-full flex-wrap gap-2 pb-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-black transition ${
              activeTab === tab.id ? "bg-slate-950 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
            onClick={() => {
              setActiveTab(tab.id);
              setStatus("");
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="mt-4">
        {activeTab === "natural" ? <CodeBlock title="자연어 설명" value={DEMO_NATURAL_LANGUAGE} /> : null}
        {activeTab === "tradingview" ? <CodeBlock title="TradingView Pine Script" value={DEMO_PINE_SCRIPT} /> : null}
        {activeTab === "yestrader" ? (
          <div className="space-y-3">
            <CodeBlock title="예스랭귀지 전략식" value={DEMO_YES_LANGUAGE} />
            <CodeBlock title="예스랭귀지 지표식" value={DEMO_YES_INDICATOR} />
          </div>
        ) : null}
        {activeTab === "kiwoom" ? <CodeBlock title="키움 조건검색 설정표" value={DEMO_KIWOOM_TABLE} /> : null}
        {activeTab === "telegram" ? (
          <div className="space-y-3">
            <CodeBlock title="Telegram 알림 템플릿" value={DEMO_TELEGRAM_TEXT} />
            <CodeBlock title="Telegram JSON" value={DEMO_TELEGRAM_JSON} />
            <button
              type="button"
              className="w-full rounded-lg bg-slate-950 px-4 py-3 text-sm font-black text-white transition disabled:bg-slate-300"
              onClick={() => void sendTelegramTest()}
              disabled={sending}
            >
              {sending ? "테스트 알림 전송 중" : "테스트 Telegram 알림 보내기"}
            </button>
          </div>
        ) : null}
        {activeTab === "kis" ? <CodeBlock title="KIS API 연동용 전략 JSON" value={DEMO_KIS_JSON} /> : null}
      </div>

      {status ? <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-sm font-bold text-slate-700">{status}</p> : null}
      <p className="mt-4 text-xs font-semibold leading-5 text-slate-500">
        식톡은 플랫폼을 자동 조작하지 않습니다. 사용자가 각 플랫폼에서 최종 확인 후 적용하는 변환 초안과 설정표를 제공합니다.
      </p>
    </section>
  );
}

function CodeBlock({ title, value }: { title: string; value: string }) {
  return (
    <div className="w-full max-w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-950">
      <div className="border-b border-white/10 px-4 py-3 text-sm font-black text-white">{title}</div>
      <pre className="max-h-[420px] max-w-full overflow-auto p-4 text-xs leading-5 text-slate-100">
        <code>{value}</code>
      </pre>
    </div>
  );
}
