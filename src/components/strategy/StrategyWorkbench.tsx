"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { buildAlertBotDraft, type AlertBotDraft } from "@/lib/alert-bot";
import { conditionTemplates } from "@/lib/condition-templates";
import { trackEvent } from "@/lib/mixpanel";
import type { AssetClass, ConditionCategory, ConditionTemplate, StrategyCard } from "@/lib/types";

type ComposerResponse = {
  ok?: boolean;
  answer?: string;
  provider?: "qwen" | "fallback";
  turn?: number;
  suggestedIds?: string[];
  error?: string;
};

type BacktestResponse = {
  ok?: boolean;
  result?: {
    strategyHash: string;
    strategyTitle: string;
    oneWeekPreview: {
      returnPct: number;
      positiveDays: number;
      signalCount: number;
      averageTradeReturnPct: number;
    };
  };
  error?: string;
};

type ConversationItem = {
  role: "user" | "assistant";
  text: string;
  provider?: "qwen" | "fallback";
};

const categoryLabels: Record<ConditionCategory | "all", string> = {
  all: "전체",
  entry: "진입",
  exit: "청산",
  universe: "종목",
  filters: "필터",
  risk: "리스크",
};

const marketLabels: Record<AssetClass | "all", string> = {
  all: "전체",
  koreanStock: "국장",
  usStock: "미장",
  crypto: "코인",
  etf: "ETF",
  futures: "선물",
  unknown: "공통",
};

export function StrategyWorkbench({
  selectedMarket,
  currentStrategy,
}: {
  selectedMarket: AssetClass;
  currentStrategy: StrategyCard | null;
}) {
  const [category, setCategory] = useState<ConditionCategory | "all">("all");
  const [market, setMarket] = useState<AssetClass | "all">("all");
  const [query, setQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [composerMessage, setComposerMessage] = useState("");
  const [composerTurn, setComposerTurn] = useState(0);
  const [composerLoading, setComposerLoading] = useState(false);
  const [composerError, setComposerError] = useState("");
  const [conversation, setConversation] = useState<ConversationItem[]>([]);
  const [miniBacktest, setMiniBacktest] = useState<BacktestResponse["result"] | null>(null);
  const [miniBacktestLoading, setMiniBacktestLoading] = useState(false);
  const [alertDraft, setAlertDraft] = useState<AlertBotDraft | null>(null);

  useEffect(() => {
    void trackEvent("Strategy Workbench Viewed", { selected_market: selectedMarket });
  }, [selectedMarket]);

  const visibleTemplates = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return conditionTemplates.filter((template) => {
      const categoryOk = category === "all" || template.category === category;
      const marketOk = market === "all" || template.market === market || template.market === "unknown";
      const queryOk =
        !keyword ||
        [template.title, template.plainKorean, template.whyUse, ...template.tags]
          .join(" ")
          .toLowerCase()
          .includes(keyword);
      return categoryOk && marketOk && queryOk;
    });
  }, [category, market, query]);

  const selectedTemplates = useMemo(
    () =>
      selectedIds
        .map((id) => conditionTemplates.find((template) => template.id === id))
        .filter((template): template is ConditionTemplate => Boolean(template)),
    [selectedIds],
  );

  const combinedIdea = useMemo(() => {
    if (selectedTemplates.length === 0) return currentStrategy?.rawIdea ?? "";
    return selectedTemplates
      .map((template) => `${template.title}: ${template.plainKorean}`)
      .join(" / ");
  }, [currentStrategy?.rawIdea, selectedTemplates]);

  const combinedTitle = useMemo(() => {
    if (selectedTemplates.length === 0) return currentStrategy?.title ?? "합성 전략";
    return selectedTemplates.map((template) => template.title).slice(0, 3).join(" + ");
  }, [currentStrategy?.title, selectedTemplates]);

  function addCard(templateId: string) {
    setSelectedIds((current) => (current.includes(templateId) ? current : [...current, templateId]));
    void trackEvent("Workbench Card Added", { condition_id: templateId });
  }

  function removeCard(templateId: string) {
    setSelectedIds((current) => current.filter((id) => id !== templateId));
  }

  function importCurrentStrategy() {
    if (!currentStrategy) return;
    const text = `${currentStrategy.title} ${currentStrategy.rawIdea} ${currentStrategy.conditions.entry.join(" ")} ${currentStrategy.conditions.filters.join(" ")}`.toLowerCase();
    const next = conditionTemplates
      .map((template) => ({
        id: template.id,
        score: scoreTemplate(text, template),
      }))
      .sort((left, right) => right.score - left.score)
      .slice(0, 4)
      .filter((item) => item.score > 0)
      .map((item) => item.id);
    if (next.length > 0) {
      setSelectedIds(Array.from(new Set([...selectedIds, ...next])));
    }
  }

  async function askComposer(nextMessage?: string) {
    const message = (nextMessage ?? composerMessage).trim();
    if (!message || composerLoading || composerTurn >= 3) return;

    setComposerLoading(true);
    setComposerError("");
    try {
      const response = await fetch("/api/ai/composer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          selectedIds,
          turn: composerTurn + 1,
          selectedMarket,
        }),
      });
      const data = (await response.json()) as ComposerResponse;
      if (!response.ok || !data.ok || !data.answer) {
        throw new Error(data.error || "합성 전략 응답을 받지 못했습니다.");
      }

      setConversation((current) => [
        ...current,
        { role: "user", text: message },
        { role: "assistant", text: data.answer ?? "", provider: data.provider },
      ]);
      setComposerTurn(data.turn ?? composerTurn + 1);
      setComposerMessage("");
      if (data.suggestedIds?.length) {
        setSelectedIds((current) => Array.from(new Set([...current, ...data.suggestedIds!])));
      }
      void trackEvent("Workbench Composer Used", {
        selected_count: selectedIds.length,
        turn: data.turn ?? composerTurn + 1,
      });
    } catch (caught) {
      setComposerError(caught instanceof Error ? caught.message : "합성 전략 응답에 실패했습니다.");
    } finally {
      setComposerLoading(false);
    }
  }

  async function runMiniBacktest() {
    if (!combinedIdea.trim()) return;
    setMiniBacktestLoading(true);
    try {
      const response = await fetch("/api/backtests/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: combinedTitle,
          rawIdea: combinedIdea,
        }),
      });
      const data = (await response.json()) as BacktestResponse;
      if (!response.ok || !data.ok || !data.result) {
        throw new Error(data.error || "최근 1주 성과를 계산하지 못했습니다.");
      }
      setMiniBacktest(data.result);
      void trackEvent("Workbench Mini Backtest Viewed", {
        strategy_hash: data.result.strategyHash,
        strategy_name: data.result.strategyTitle,
      });
    } finally {
      setMiniBacktestLoading(false);
    }
  }

  function openInlineAlertDraft() {
    if (!combinedIdea.trim()) return;
    setAlertDraft(buildAlertBotDraft(combinedIdea));
    void trackEvent("Workbench Inline Alert Viewed", { selected_count: selectedTemplates.length });
  }

  return (
    <section className="mx-auto w-full max-w-6xl space-y-5 pb-28 md:pb-8">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-black text-emerald-700">전략카드 만들기 보강</p>
          <h2 className="mt-2 text-3xl font-black tracking-[-0.04em] text-slate-950">전략 합성 캔버스</h2>
          <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
            80개 조건식 카드에서 필요한 것만 끌어와 조합하고, 3턴 안쪽으로 AI에게 보강 질문을 던질 수 있습니다.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {currentStrategy ? (
            <button
              type="button"
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700"
              onClick={importCurrentStrategy}
            >
              현재 카드 불러오기
            </button>
          ) : null}
          <button
            type="button"
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700"
            onClick={() => setSelectedIds([])}
          >
            캔버스 비우기
          </button>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.05fr)_420px]">
        <div className="space-y-5">
          <Card className="space-y-4">
            <div
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                const templateId = event.dataTransfer.getData("text/plain");
                if (templateId) addCard(templateId);
              }}
              className="rounded-2xl border-2 border-dashed border-emerald-200 bg-emerald-50/50 p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">canvas</p>
                  <h3 className="mt-2 text-lg font-black text-slate-950">{combinedTitle}</h3>
                  <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                    {selectedTemplates.length === 0
                      ? "카드를 드래그하거나 눌러서 합성 전략을 만들어보세요."
                      : `${selectedTemplates.length}장 조합 · 진입/종목/필터/리스크를 한 번에 묶었습니다.`}
                  </p>
                </div>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-emerald-700 shadow-sm">
                  3턴 AI 지원
                </span>
              </div>

              <div className="mt-4 flex min-h-20 flex-wrap gap-2">
                {selectedTemplates.length === 0 ? (
                  <div className="rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-500">
                    드래그 대상: 진입 / 종목 / 필터 / 리스크 카드
                  </div>
                ) : (
                  selectedTemplates.map((template) => (
                    <button
                      key={template.id}
                      type="button"
                      className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left shadow-sm"
                      onClick={() => removeCard(template.id)}
                    >
                      <div className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">{categoryLabels[template.category]}</div>
                      <div className="mt-1 text-sm font-black text-slate-950">{template.title}</div>
                      <div className="mt-1 text-xs font-semibold text-slate-500">눌러서 제거</div>
                    </button>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-black text-slate-950">AI와 합성 보강</h3>
                  <p className="mt-1 text-sm font-semibold text-slate-500">
                    예: “돌파 합성전략 짜줘”, “리스크 카드 하나 더 붙여줘”
                  </p>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">{composerTurn}/3</span>
              </div>

              <div className="mt-4 space-y-3">
                {conversation.length === 0 ? (
                  <div className="rounded-2xl bg-slate-50 p-4 text-sm font-semibold text-slate-500">
                    캔버스를 비워둔 채 질문하면 AI가 조건식 DB에서 카드 2~4장을 먼저 골라줍니다.
                  </div>
                ) : (
                  conversation.map((item, index) => (
                    <div
                      key={`${item.role}-${index}`}
                      className={`rounded-2xl px-4 py-3 text-sm font-semibold leading-6 ${
                        item.role === "user" ? "bg-slate-950 text-white" : "bg-slate-50 text-slate-700"
                      }`}
                    >
                      {item.text}
                    </div>
                  ))
                )}
              </div>

              <div className="mt-4 flex flex-col gap-3">
                <Textarea
                  rows={3}
                  value={composerMessage}
                  onChange={(event) => setComposerMessage(event.target.value)}
                  placeholder="돌파 합성전략 짜줘"
                />
                {composerError ? <p className="text-sm font-bold text-rose-600">{composerError}</p> : null}
                <div className="flex flex-wrap gap-2">
                  <Button className="rounded-2xl" onClick={() => void askComposer()} disabled={composerLoading || composerTurn >= 3}>
                    {composerLoading ? "정리 중" : composerTurn >= 3 ? "3턴 완료" : "AI에게 보강 요청"}
                  </Button>
                  <button
                    type="button"
                    className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700"
                    onClick={() => void askComposer("돌파 합성전략 짜줘")}
                  >
                    돌파 조합 추천
                  </button>
                  <button
                    type="button"
                    className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700"
                    onClick={() => void askComposer("리스크 카드 하나 붙여줘")}
                  >
                    리스크 보강
                  </button>
                </div>
              </div>
            </div>

            <Card className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Button className="rounded-2xl" onClick={() => void runMiniBacktest()} disabled={miniBacktestLoading || !combinedIdea.trim()}>
                  {miniBacktestLoading ? "계산 중" : "최근 1주 미리 성과 보기"}
                </Button>
                <Button variant="secondary" className="rounded-2xl" onClick={openInlineAlertDraft} disabled={!combinedIdea.trim()}>
                  식톡 알림 초안 바로 보기
                </Button>
                <Link
                  href={`/backtests?title=${encodeURIComponent(combinedTitle)}&idea=${encodeURIComponent(combinedIdea)}`}
                  className="inline-flex min-h-10 items-center justify-center rounded-2xl border border-violet-200 bg-violet-50 px-4 text-sm font-black text-violet-900"
                >
                  1년 백테스트 자세히
                </Link>
                <Link
                  href={`/alerts?idea=${encodeURIComponent(combinedIdea)}`}
                  className="inline-flex min-h-10 items-center justify-center rounded-2xl border border-sky-200 bg-sky-50 px-4 text-sm font-black text-sky-900"
                >
                  식톡알림봇 고급 설정
                </Link>
              </div>

              {miniBacktest ? (
                <div className="grid gap-3 md:grid-cols-4">
                  <MiniMetric label="최근 1주 수익률" value={`${formatSigned(miniBacktest.oneWeekPreview.returnPct)}%`} />
                  <MiniMetric label="양수 일수" value={`${miniBacktest.oneWeekPreview.positiveDays}일`} />
                  <MiniMetric label="신호 수" value={`${miniBacktest.oneWeekPreview.signalCount}회`} />
                  <MiniMetric label="평균 체결 수익률" value={`${formatSigned(miniBacktest.oneWeekPreview.averageTradeReturnPct)}%`} />
                </div>
              ) : null}

              {alertDraft ? (
                <div className="grid gap-3 rounded-2xl bg-slate-50 p-4 md:grid-cols-2">
                  <MiniMetric label="알림 이름" value={alertDraft.title} />
                  <MiniMetric label="시간봉" value={alertDraft.timeframe} />
                  <MiniMetric label="알림 조건" value={alertDraft.trigger} />
                  <MiniMetric label="알림 빈도" value={alertDraft.cadence} />
                </div>
              ) : null}
            </Card>
          </Card>
        </div>

        <Card className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {(["all", "entry", "exit", "universe", "filters", "risk"] as Array<ConditionCategory | "all">).map((item) => (
              <button
                key={item}
                type="button"
                className={`rounded-full px-3 py-2 text-sm font-black ${
                  category === item ? "bg-slate-950 text-white" : "bg-slate-100 text-slate-600"
                }`}
                onClick={() => setCategory(item)}
              >
                {categoryLabels[item]}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            {(["all", "koreanStock", "usStock", "crypto", "etf"] as Array<AssetClass | "all">).map((item) => (
              <button
                key={item}
                type="button"
                className={`rounded-full px-3 py-2 text-sm font-black ${
                  market === item ? "bg-emerald-600 text-white" : "bg-emerald-50 text-emerald-700"
                }`}
                onClick={() => setMarket(item)}
              >
                {marketLabels[item]}
              </button>
            ))}
          </div>

          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="거래량, RSI, 돌파, 종가..."
            className="h-12 rounded-2xl border border-slate-200 px-4 text-sm font-bold text-slate-900"
          />

          <div className="max-h-[920px] space-y-3 overflow-auto pr-1">
            {visibleTemplates.map((template) => (
              <button
                key={template.id}
                type="button"
                draggable
                onDragStart={(event) => event.dataTransfer.setData("text/plain", template.id)}
                onClick={() => addCard(template.id)}
                className="w-full rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50/40"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-black text-slate-600">
                        {categoryLabels[template.category]}
                      </span>
                      <span className="rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-black text-emerald-700">
                        {marketLabels[template.market]}
                      </span>
                    </div>
                    <div className="mt-2 text-base font-black text-slate-950">{template.title}</div>
                    <div className="mt-1 text-sm font-semibold leading-6 text-slate-500">{template.plainKorean}</div>
                  </div>
                  <span className="rounded-full bg-slate-950 px-3 py-1 text-xs font-black text-white">추가</span>
                </div>
              </button>
            ))}
          </div>
        </Card>
      </div>
    </section>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">{label}</p>
      <p className="mt-2 text-sm font-black leading-6 text-slate-900">{value}</p>
    </div>
  );
}

function scoreTemplate(text: string, template: ConditionTemplate) {
  let score = 0;
  const haystack = [template.title, template.plainKorean, template.whyUse, ...template.tags].join(" ").toLowerCase();
  text.split(/\s+/).forEach((token) => {
    if (token && haystack.includes(token)) score += 1;
  });
  return score;
}

function formatSigned(value: number) {
  return value > 0 ? `+${value}` : `${value}`;
}
