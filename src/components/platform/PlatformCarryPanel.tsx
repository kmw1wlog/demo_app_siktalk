"use client";

import { useEffect, useState } from "react";
import { assetClassLabel, timeframeLabel } from "@/lib/format";
import { markFeedbackSignal } from "@/lib/feedback-session";
import { trackEvent } from "@/lib/mixpanel";
import { platformCopyTabs, getPlatformCopy, type PlatformCopyTab } from "@/lib/platform-copies";
import type { StrategyCard } from "@/lib/types";

export function PlatformCarryPanel({
  strategy,
  compact = false,
}: {
  strategy: StrategyCard;
  compact?: boolean;
}) {
  const [activeTab, setActiveTab] = useState<PlatformCopyTab>("natural");
  const [status, setStatus] = useState("");
  const [sending, setSending] = useState(false);
  const [exportInfo, setExportInfo] = useState<{
    webhookUrl: string;
    tradingViewJson: string;
  } | null>(null);

  const activeCopy = getPlatformCopy(strategy, activeTab);

  useEffect(() => {
    void trackEvent("Platform Tab Opened", {
      compact,
      platform: activeTab,
      strategy_id: strategy.id,
      strategy_name: strategy.title,
    });
  }, [activeTab, compact, strategy.id, strategy.title]);

  async function copyCurrent() {
    try {
      await navigator.clipboard.writeText(activeCopy);
      setStatus("현재 탭을 복사했습니다.");
      if (activeTab === "tradingview") {
        markFeedbackSignal("export_clicked", "/app:platform_carry");
      }
      void trackEvent(activeTab === "tradingview" ? "TradingView Export Clicked" : "Platform Copy Clicked", {
        copy_type: "tab_content",
        platform: activeTab,
        status: "success",
        strategy_id: strategy.id,
      });
    } catch {
      setStatus("복사에 실패했습니다. 내용을 직접 선택해 복사해주세요.");
      void trackEvent(activeTab === "tradingview" ? "TradingView Export Clicked" : "Platform Copy Clicked", {
        copy_type: "tab_content",
        platform: activeTab,
        status: "failed",
        strategy_id: strategy.id,
      });
    }
  }

  async function sendTelegramTest() {
    setSending(true);
    setStatus("");
    try {
      const response = await fetch("/api/telegram/send-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          strategyName: strategy.title,
          market: assetClassLabel(strategy.assetClass),
          timeframe: timeframeLabel(strategy.timeframe),
          observeCondition: strategy.conditions.entry[0] || strategy.summary,
          exitCondition: strategy.conditions.exit[0] || "",
          filterCondition: strategy.conditions.filters[0] || "",
          riskRule: strategy.riskSummary,
        }),
      });
      const data = (await response.json()) as { ok?: boolean; error?: string; demoMode?: boolean; message?: string };
      if (!response.ok || !data.ok) {
        setStatus(data.error || "Telegram 테스트 알림 전송에 실패했습니다.");
        void trackEvent("Telegram Test Sent", {
          demo_mode: Boolean(data.demoMode),
          status: "failed",
          strategy_id: strategy.id,
        });
        return;
      }
      setStatus(data.message || (data.demoMode ? "Telegram 데모 전송을 완료했습니다." : "Telegram 테스트 알림을 전송했습니다."));
      void trackEvent("Telegram Test Sent", {
        demo_mode: Boolean(data.demoMode),
        status: "success",
        strategy_id: strategy.id,
      });
    } catch {
      setStatus("Telegram 테스트 알림 요청에 실패했습니다.");
      void trackEvent("Telegram Test Sent", {
        status: "failed",
        strategy_id: strategy.id,
      });
    } finally {
      setSending(false);
    }
  }

  async function ensureExportInfo() {
    if (exportInfo) return exportInfo;

    const response = await fetch("/api/telegram/export", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ strategy }),
    });
    const data = (await response.json()) as {
      ok?: boolean;
      error?: string;
      webhookUrl?: string;
      tradingViewJson?: string;
      demoMode?: boolean;
    };

    if (!response.ok || !data.ok || !data.webhookUrl || !data.tradingViewJson) {
      throw new Error(data.error || "Telegram export 정보를 불러오지 못했습니다.");
    }

    const next = {
      webhookUrl: data.webhookUrl,
      tradingViewJson: data.tradingViewJson,
    };
    setExportInfo(next);
    return next;
  }

  async function copyWebhookUrl() {
    setStatus("");
    try {
      const info = await ensureExportInfo();
      await navigator.clipboard.writeText(info.webhookUrl);
      setStatus("TradingView webhook URL을 복사했습니다.");
      markFeedbackSignal("export_clicked", "/app:platform_carry");
      void trackEvent("TradingView Export Clicked", {
        copy_type: "webhook_url",
        platform: activeTab,
        status: "success",
        strategy_id: strategy.id,
      });
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Webhook URL 복사에 실패했습니다.");
      void trackEvent("TradingView Export Clicked", {
        copy_type: "webhook_url",
        platform: activeTab,
        status: "failed",
        strategy_id: strategy.id,
      });
    }
  }

  async function copyTradingViewJson() {
    setStatus("");
    try {
      const info = await ensureExportInfo();
      await navigator.clipboard.writeText(info.tradingViewJson);
      setStatus("TradingView 메시지 JSON을 복사했습니다.");
      markFeedbackSignal("export_clicked", "/app:platform_carry");
      void trackEvent("TradingView Export Clicked", {
        copy_type: "message_json",
        platform: activeTab,
        status: "success",
        strategy_id: strategy.id,
      });
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "TradingView 메시지 JSON 복사에 실패했습니다.");
      void trackEvent("TradingView Export Clicked", {
        copy_type: "message_json",
        platform: activeTab,
        status: "failed",
        strategy_id: strategy.id,
      });
    }
  }

  return (
    <section className={`overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-sm ${compact ? "p-4" : "p-5"}`}>
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-lg font-black text-slate-950">플랫폼별 퍼가기</h2>
          <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">
            같은 전략을 플랫폼별로 옮겨 쓸 수 있는 형식으로 정리합니다.
          </p>
        </div>
        <button
          type="button"
          className="inline-flex h-10 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white px-4 text-sm font-black text-slate-800 transition hover:bg-slate-50"
          onClick={() => void copyCurrent()}
        >
          현재 탭 복사
        </button>
      </div>

      <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
        {platformCopyTabs.map((tab) => (
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

      <div className="mt-4 grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
        <div className="rounded-2xl bg-slate-50 p-4">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">carry format</p>
          <h3 className="mt-2 text-base font-black text-slate-950">
            {platformCopyTabs.find((tab) => tab.id === activeTab)?.label}
          </h3>
          <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">
            {platformCopyTabs.find((tab) => tab.id === activeTab)?.hint}
          </p>
          <div className="mt-4 space-y-2">
            <MetaPill label="전략명" value={strategy.title} />
            <MetaPill label="시장" value={assetClassLabel(strategy.assetClass)} />
            <MetaPill label="시간봉" value={timeframeLabel(strategy.timeframe)} />
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl bg-[#07111f]">
          <div className="border-b border-white/10 px-4 py-3 text-sm font-black text-white">
            {platformCopyTabs.find((tab) => tab.id === activeTab)?.label}
          </div>
          <pre className="max-h-[420px] overflow-auto p-4 text-xs leading-5 text-slate-100">
            <code>{activeCopy}</code>
          </pre>
        </div>
      </div>

      {activeTab === "telegram" ? (
        <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <h3 className="text-base font-black text-slate-950">Telegram 알림</h3>
          <p className="mt-1 text-sm font-semibold leading-6 text-slate-600">
            식톡 전략 카드를 Telegram 알림으로 받아볼 수 있습니다. TradingView alert webhook 또는 식톡 테스트 알림을 Telegram으로 전송합니다.
          </p>
          <p className="mt-2 text-xs font-semibold leading-5 text-slate-500">
            본 기능은 투자 추천이 아니라 사용자가 설정한 조건의 감지 알림입니다.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <ActionButton onClick={() => void sendTelegramTest()} disabled={sending}>
              {sending ? "테스트 알림 전송 중" : "테스트 알림 보내기"}
            </ActionButton>
            <ActionButton onClick={() => void copyWebhookUrl()}>Webhook URL 복사</ActionButton>
            <ActionButton onClick={() => void copyTradingViewJson()}>TradingView 메시지 JSON 복사</ActionButton>
          </div>
        </div>
      ) : null}

      {activeTab === "tradingview" ? (
        <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <h3 className="text-base font-black text-slate-950">TradingView 연동 순서</h3>
          <ol className="mt-3 space-y-2 text-sm font-semibold leading-6 text-slate-600">
            <li>1. TradingView 차트에서 Pine Editor에 식톡 Pine 초안을 붙여넣습니다.</li>
            <li>2. Add to chart를 누릅니다.</li>
            <li>3. Create Alert를 엽니다.</li>
            <li>4. Condition에서 식톡 스크립트 또는 Any alert() function call을 선택합니다.</li>
            <li>5. Webhook URL에 식톡 webhook URL을 넣습니다.</li>
            <li>6. Message에는 식톡이 제공한 JSON 메시지를 붙여넣습니다.</li>
            <li>7. 조건이 감지되면 Telegram으로 알림이 전송됩니다.</li>
          </ol>
          <div className="mt-4 flex flex-wrap gap-2">
            <ActionButton onClick={() => void copyWebhookUrl()}>Webhook URL 복사</ActionButton>
            <ActionButton onClick={() => void copyTradingViewJson()}>TradingView 메시지 JSON 복사</ActionButton>
          </div>
          <p className="mt-3 text-xs font-semibold leading-5 text-slate-500">
            1차 MVP는 환경변수 기반 secret을 사용합니다. 프로덕션에서는 사용자별 webhook token 발급 구조로 바꾸는 편이 맞습니다.
          </p>
        </div>
      ) : null}

      {status ? <p className="mt-3 rounded-xl bg-slate-50 px-3 py-2 text-sm font-bold text-slate-700">{status}</p> : null}
      <p className="mt-4 text-xs font-semibold leading-5 text-slate-500">
        식톡은 플랫폼을 자동 조작하지 않습니다. 사용자가 각 플랫폼에서 최종 확인 후 적용하는 변환 초안과 설정표를 제공합니다.
      </p>
    </section>
  );
}

function MetaPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
      <p className="text-[11px] font-black text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-bold text-slate-900">{value}</p>
    </div>
  );
}

function ActionButton({
  children,
  disabled = false,
  onClick,
}: {
  children: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className="inline-flex min-h-10 items-center justify-center rounded-full border border-slate-200 bg-white px-4 text-sm font-black text-slate-800 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
