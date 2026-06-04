"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { conditionTemplates } from "@/lib/condition-templates";
import { SHOWCASE_STRATEGY } from "@/lib/showcase-data";
import { trackEvent } from "@/lib/mixpanel";
import type { ConditionCategory, ConditionTemplate } from "@/lib/types";

type ComposerResponse = {
  ok?: boolean;
  answer?: string;
  provider?: "qwen" | "fallback";
  turn?: number;
  suggestedIds?: string[];
};

type ColumnKey = "entry" | "filters" | "exit" | "risk";

type ConversationItem = {
  role: "user" | "assistant";
  text: string;
};

type CanvasCard = {
  id: string;
  title: string;
  detail: string;
  column: ColumnKey;
};

const COLUMN_META: Array<{
  key: ColumnKey;
  title: string;
  subtitle: string;
  tone: string;
}> = [
  { key: "entry", title: "진입 조건", subtitle: "모든 조건이 만족되면 진입", tone: "border-emerald-200 bg-emerald-50/40" },
  { key: "filters", title: "필터 조건", subtitle: "시장·종목 필터로 노이즈 제거", tone: "border-sky-200 bg-sky-50/30" },
  { key: "exit", title: "종료 조건", subtitle: "이익 실현 또는 청산 조건", tone: "border-amber-200 bg-amber-50/40" },
  { key: "risk", title: "리스크 조건", subtitle: "손절/포지션 관리 조건", tone: "border-rose-200 bg-rose-50/40" },
];

const INITIAL_CARDS: CanvasCard[] = [
  { id: "canvas-entry-1", title: "5일선 > 20일선", detail: "이동평균선", column: "entry" },
  { id: "canvas-entry-2", title: "거래량 > 20일 평균", detail: "거래량", column: "entry" },
  { id: "canvas-entry-3", title: "양봉 마감", detail: "캔들", column: "entry" },
  { id: "canvas-exit-1", title: "5일선 < 20일선", detail: "이동평균선", column: "exit" },
  { id: "canvas-exit-2", title: "10봉 경과", detail: "시간/봉 수", column: "exit" },
];

const QUICK_DB_IDS = ["condition_base_1", "condition_base_3", "condition_base_6", "condition_base_5", "condition_auto_2", "condition_auto_5"];

const QUICK_PROMPTS = ["너무 자주 뜨면 줄여줘", "손절 라인 추가해줘", "백테스트로 넘겨줘"];

export function StrategyWorkbench() {
  const [canvasCards, setCanvasCards] = useState<CanvasCard[]>(INITIAL_CARDS);
  const [composerMessage, setComposerMessage] = useState("돌파 합성전략 짜줘");
  const [composerTurn, setComposerTurn] = useState(3);
  const [composerLoading, setComposerLoading] = useState(false);
  const [conversation, setConversation] = useState<ConversationItem[]>([
    { role: "user", text: "돌파 합성전략 짜줘" },
    { role: "assistant", text: "네. 돌파 전략을 기반으로 3개 카드를 캔버스에 추가했어요.\n진입 조건을 중심으로 거래량과 봉 패턴을 반영했습니다." },
  ]);
  const [copyToast, setCopyToast] = useState("");

  const dbCards = useMemo(
    () =>
      QUICK_DB_IDS.map((id) => conditionTemplates.find((template) => template.id === id)).filter(
        (template): template is ConditionTemplate => Boolean(template),
      ),
    [],
  );

  const grouped = useMemo(
    () => ({
      entry: canvasCards.filter((card) => card.column === "entry"),
      filters: canvasCards.filter((card) => card.column === "filters"),
      exit: canvasCards.filter((card) => card.column === "exit"),
      risk: canvasCards.filter((card) => card.column === "risk"),
    }),
    [canvasCards],
  );

  function addCard(template: ConditionTemplate) {
    const nextCard = normalizeTemplate(template);
    setCanvasCards((current) => (current.some((card) => card.id === nextCard.id) ? current : [...current, nextCard]));
    void trackEvent("Canvas Card Added", { card_id: template.id, card_title: template.title });
  }

  function removeCard(cardId: string) {
    setCanvasCards((current) => current.filter((card) => card.id !== cardId));
  }

  async function askComposer(nextMessage?: string) {
    const message = (nextMessage ?? composerMessage).trim();
    if (!message || composerLoading) return;

    setComposerLoading(true);
    try {
      const response = await fetch("/api/ai/composer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          selectedIds: canvasCards.map((card) => card.id),
          turn: Math.min(composerTurn + 1, 3),
          selectedMarket: "koreanStock",
        }),
      });
      const data = (await response.json()) as ComposerResponse;
      setConversation((current) => [...current, { role: "user", text: message }, { role: "assistant", text: data.answer || "카드를 조금 더 다듬었습니다." }]);
      if (data.suggestedIds?.length) {
        const nextCards = data.suggestedIds
          .slice(0, 2)
          .map((id) => conditionTemplates.find((template) => template.id === id))
          .filter((template): template is ConditionTemplate => Boolean(template))
          .map(normalizeTemplate);
        setCanvasCards((current) => {
          const merged = [...current];
          for (const card of nextCards) {
            if (!merged.some((item) => item.id === card.id)) merged.push(card);
          }
          return merged;
        });
      }
      setComposerTurn(3);
      setComposerMessage("");
      void trackEvent("Canvas Assistant Used", { turn: composerTurn, prompt_text: message });
    } finally {
      setComposerLoading(false);
    }
  }

  async function copyPine() {
    await navigator.clipboard.writeText("// TradingView Pine 복사용 데모 초안\n// 5·20선 골든크로스 + 거래량 회복");
    setCopyToast("TradingView Pine 복사 준비 완료");
  }

  return (
    <section className="mx-auto w-full max-w-[1380px] space-y-5 pb-24">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-4xl font-black tracking-[-0.05em] text-slate-950">전략 합성 캔버스</h1>
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-black text-emerald-700">✓ 저장됨</span>
          </div>
          <p className="mt-3 text-base font-semibold text-slate-500">AI가 찾은 전략을 카드로 조합하고, 바로 성능·알림·차트 적용까지 확인합니다.</p>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_260px]">
        <div className="space-y-5">
          <div className="rounded-[1.7rem] border border-slate-200 bg-white px-6 py-5 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-4">
                <span className="flex size-11 items-center justify-center rounded-2xl bg-emerald-600 text-xl font-black text-white shadow-sm">✦</span>
                <div>
                  <div className="break-keep text-[2.25rem] font-black leading-tight tracking-[-0.04em] text-slate-950">{SHOWCASE_STRATEGY.title}</div>
                </div>
              </div>
              <div className="flex gap-3">
                <button type="button" className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-base font-black text-slate-700">
                  이름 변경
                </button>
                <button type="button" className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-base font-black text-slate-700">
                  전략 요약 보기
                </button>
              </div>
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-4">
            {COLUMN_META.map((column) => {
              const cards = grouped[column.key];
              return (
                <div key={column.key} className={`rounded-[1.6rem] border p-4 ${column.tone}`}>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[2rem] font-black tracking-[-0.04em] text-slate-950">{column.title}</p>
                      <p className="mt-2 text-sm font-semibold text-slate-500">{column.subtitle}</p>
                    </div>
                    <span className="text-lg font-black text-slate-500">{cards.length}/6</span>
                  </div>

                  <div className="mt-5 space-y-3">
                    {cards.map((card) => (
                      <div key={card.id} className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="break-keep text-lg font-black text-slate-950">{card.title}</p>
                            <p className="mt-1 text-sm font-semibold text-slate-400">{card.detail}</p>
                          </div>
                          <button type="button" className="text-xl text-slate-400" onClick={() => removeCard(card.id)}>
                            ×
                          </button>
                        </div>
                      </div>
                    ))}
                    <button type="button" className="flex h-28 w-full flex-col items-center justify-center rounded-[1.4rem] border border-dashed border-slate-200 bg-white text-base font-black text-slate-400">
                      + 카드 추가
                      <span className="mt-2 text-sm font-semibold">또는 드래그</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="rounded-[1.7rem] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-3">
                  <p className="text-xl font-black text-slate-950">AI 합성 도우미</p>
                  <span className="rounded-full bg-sky-50 px-3 py-1 text-sm font-black text-sky-700">3/3</span>
                </div>
                <p className="mt-2 text-sm font-semibold text-slate-500">자연어로 요청하면 카드로 조합해 드려요.</p>
              </div>
              <button type="button" className="text-sm font-black text-slate-500">
                ○ 대화 초기화
              </button>
            </div>

            <div className="mt-5 space-y-4">
              {conversation.map((item, index) => (
                <div key={`${item.role}-${index}`} className={`flex ${item.role === "user" ? "justify-end" : "items-start gap-3"}`}>
                  {item.role === "assistant" ? (
                    <span className="flex size-10 items-center justify-center rounded-2xl bg-emerald-600 text-sm font-black text-white">식</span>
                  ) : null}
                  <div className={`max-w-xl rounded-[1.4rem] px-5 py-4 text-sm font-semibold leading-6 shadow-sm ${
                    item.role === "user" ? "bg-emerald-50 text-slate-800" : "border border-slate-200 bg-white text-slate-700"
                  }`}>
                    {item.text}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <span className="text-sm font-black text-slate-400">빠른 요청 예시</span>
              {QUICK_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700"
                  onClick={() => void askComposer(prompt)}
                >
                  {prompt}
                </button>
              ))}
            </div>

            <div className="mt-5 flex items-end gap-3">
              <Textarea
                rows={2}
                value={composerMessage}
                onChange={(event) => setComposerMessage(event.target.value)}
                placeholder="원하는 전략을 말해보세요. (예: 거래량 돌파 전략 짜줘)"
                className="min-h-16 flex-1 rounded-[1.6rem]"
              />
              <Button className="h-14 min-w-14 rounded-2xl px-5" onClick={() => void askComposer()} disabled={composerLoading}>
                →
              </Button>
            </div>
          </div>
        </div>

        <aside className="rounded-[1.7rem] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-black tracking-[-0.04em] text-slate-950">DB 전략 카드</p>
              <p className="mt-2 text-sm font-semibold text-slate-500">드래그하거나 +추가</p>
            </div>
          </div>

          <div className="mt-5 space-y-4">
            {dbCards.map((card) => (
              <div key={card.id} className="rounded-2xl border border-slate-200 p-4">
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-black text-emerald-700">{labelForCategory(card.category)}</span>
                  <span className="rounded-full bg-sky-50 px-2 py-1 text-xs font-black text-sky-700">{labelForMarket(card.market)}</span>
                </div>
                  <p className="mt-4 break-keep text-xl font-black leading-tight tracking-[-0.03em] text-slate-950">{card.title}</p>
                <button
                  type="button"
                  className="mt-4 inline-flex min-h-11 items-center rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700"
                  onClick={() => addCard(card)}
                >
                  + 추가
                </button>
              </div>
            ))}
          </div>

          <button type="button" className="mt-6 w-full text-sm font-black text-slate-500">
            더 많은 카드 보기 ↓
          </button>
        </aside>
      </div>

      <div className="grid gap-3 md:grid-cols-5">
        <Link href="/preview" className="flex h-16 items-center justify-center rounded-2xl border border-emerald-200 bg-white text-base font-black text-emerald-700 shadow-sm">
          최근 1주 성과 보기
        </Link>
        <Link href="/chart" className="flex h-16 items-center justify-center rounded-2xl bg-emerald-600 text-base font-black text-white shadow-lg shadow-emerald-100">
          차트에 적용
        </Link>
        <Link href="/alerts" className="flex h-16 items-center justify-center rounded-2xl bg-sky-500 text-base font-black text-white shadow-lg shadow-sky-100">
          24시간 알림 초안 만들기
        </Link>
        <Link href="/backtests" className="flex h-16 items-center justify-center rounded-2xl bg-violet-500 text-base font-black text-white shadow-lg shadow-violet-100">
          25~26년 생존력 백테스트
        </Link>
        <button type="button" className="flex h-16 items-center justify-center rounded-2xl bg-[#060820] text-base font-black text-white" onClick={() => void copyPine()}>
          &lt;/&gt; TradingView Pine 복사
        </button>
      </div>

      {copyToast ? (
        <div className="fixed bottom-6 right-6 z-40 rounded-2xl bg-slate-950 px-5 py-4 text-sm font-black text-white shadow-2xl">
          ✓ {copyToast}
        </div>
      ) : null}
    </section>
  );
}

function labelForCategory(category: ConditionCategory) {
  if (category === "entry") return "진입";
  if (category === "filters") return "필터";
  if (category === "risk") return "리스크";
  if (category === "exit") return "종료";
  return "종목";
}

function labelForMarket(market: ConditionTemplate["market"]) {
  if (market === "crypto") return "모멘";
  if (market === "usStock") return "미장";
  return "국장";
}

function normalizeTemplate(template: ConditionTemplate): CanvasCard {
  if (template.title === "거래량 급증 돌파") {
    return { id: template.id, title: "거래량 > 20일 평균", detail: "거래량", column: "entry" };
  }
  if (template.title === "종가베팅 고가권 유지") {
    return { id: template.id, title: "양봉 마감", detail: "캔들", column: "entry" };
  }
  if (template.title === "거래대금 상위 유지") {
    return { id: template.id, title: "시장 거래대금 필터", detail: "필터/시장", column: "filters" };
  }
  if (template.title === "ATR 기준 손절") {
    return { id: template.id, title: "손절 라인 관리", detail: "리스크", column: "risk" };
  }
  if (template.category === "entry") {
    return { id: template.id, title: template.title, detail: "진입 조건", column: "entry" };
  }
  if (template.category === "filters" || template.category === "universe") {
    return { id: template.id, title: template.title, detail: "필터/시장", column: "filters" };
  }
  if (template.category === "exit") {
    return { id: template.id, title: template.title, detail: "청산 조건", column: "exit" };
  }
  return { id: template.id, title: template.title, detail: "리스크", column: "risk" };
}
