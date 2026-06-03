"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { buildAlertBotDraft, type AlertBotDraft } from "@/lib/alert-bot";
import { trackEvent } from "@/lib/mixpanel";

type AlertBotResponse = {
  ok?: boolean;
  answer?: string;
  draft?: AlertBotDraft;
  provider?: "qwen" | "fallback";
  turn?: number;
  error?: string;
};

type BacktestPreviewResponse = {
  ok?: boolean;
  result?: {
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

const quickPrompts = [
  "5일선 20일선 골든크로스가 뜨면 장중에 바로 알려줘",
  "RSI 과매도 반등이 15분봉에서 나오면 조용히 모아서 알려줘",
  "장 막판 거래대금 상위 유지 종목만 텔레그램으로 받고 싶어",
];

export function AlertBotClient({ initialMessage = "" }: { initialMessage?: string }) {
  const [message, setMessage] = useState(initialMessage);
  const [turn, setTurn] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [conversation, setConversation] = useState<ConversationItem[]>([]);
  const [draft, setDraft] = useState<AlertBotDraft>(buildAlertBotDraft(initialMessage || quickPrompts[0]));
  const [backtestPreview, setBacktestPreview] = useState<BacktestPreviewResponse["result"] | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  useEffect(() => {
    void trackEvent("Alert Bot Viewed", { source: initialMessage ? "chart" : "nav" });
  }, [initialMessage]);

  const canSubmit = message.trim().length > 0 && turn < 3 && !loading;
  const turnLabel = useMemo(() => `가벼운 설정 대화 ${Math.min(turn + 1, 3)}/3`, [turn]);
  const previewIdea = conversation.filter((item) => item.role === "user").map((item) => item.text).join(" ") || initialMessage || quickPrompts[0];

  async function submit(nextMessage?: string) {
    const outgoing = (nextMessage ?? message).trim();
    if (!outgoing || loading || turn >= 3) return;

    setLoading(true);
    setError("");
    const nextHistory = [...conversation.filter((item) => item.role === "user").map((item) => item.text), outgoing];
    setDraft(buildAlertBotDraft(nextHistory.join(" ")));
    void trackEvent("Alert Bot Message Sent", {
      message_length: outgoing.length,
      turn: turn + 1,
    });

    try {
      const response = await fetch("/api/ai/alert-bot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          history: conversation.filter((item) => item.role === "user").map((item) => item.text),
          message: outgoing,
          turn: turn + 1,
        }),
      });
      const data = (await response.json()) as AlertBotResponse;
      if (!response.ok || !data.ok || !data.answer || !data.draft) {
        throw new Error(data.error || "알림봇 응답을 만들지 못했습니다.");
      }

      setConversation((current) => [
        ...current,
        { role: "user", text: outgoing },
        { role: "assistant", text: data.answer ?? "", provider: data.provider },
      ]);
      setDraft(data.draft);
      setTurn(data.turn ?? turn + 1);
      setMessage("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "알림봇 응답에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }

  async function loadPreview() {
    setPreviewLoading(true);
    setError("");
    try {
      const response = await fetch("/api/backtests/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: draft.title,
          rawIdea: previewIdea,
        }),
      });
      const data = (await response.json()) as BacktestPreviewResponse;
      if (!response.ok || !data.ok || !data.result) {
        throw new Error(data.error || "성과 미리보기를 불러오지 못했습니다.");
      }
      setBacktestPreview(data.result);
      void trackEvent("Alert Bot Backtest Preview Viewed", { title: draft.title });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "성과 미리보기에 실패했습니다.");
    } finally {
      setPreviewLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-black text-emerald-700">24시간 자동 알림봇 만들기</p>
          <h1 className="mt-2 text-3xl font-black tracking-[-0.04em] text-slate-950">식톡앱알람봇</h1>
          <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
            조건식을 새로 만들지 않고, 이미 정한 관찰 기준을 언제 어떤 방식으로 받을지 빠르게 정리합니다.
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700">
          {turnLabel}
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <Card className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {quickPrompts.map((prompt) => (
              <button
                key={prompt}
                type="button"
                className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-black text-slate-700"
                onClick={() => void submit(prompt)}
              >
                {prompt}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            {conversation.length === 0 ? (
              <div className="rounded-2xl bg-slate-50 p-4 text-sm font-semibold leading-6 text-slate-500">
                예: “5일선 20일선 골든크로스가 뜨면 장중에 바로 알려줘”
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
                  {item.role === "assistant" && item.provider ? (
                    <div className="mt-2 text-xs font-black uppercase tracking-[0.18em] text-emerald-600">{item.provider}</div>
                  ) : null}
                </div>
              ))
            )}
          </div>

          <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
            <Textarea
              rows={3}
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="어떤 조건을 얼마나 자주, 어디로 받고 싶은지 적어주세요."
            />
            {error ? <p className="text-sm font-bold text-rose-600">{error}</p> : null}
            <div className="flex flex-wrap gap-3">
              <Button className="rounded-2xl" onClick={() => void submit()} disabled={!canSubmit}>
                {loading ? "정리 중" : turn >= 3 ? "3턴 완료" : "알림 초안 받기"}
              </Button>
              <Link
                href="/app?idea=5일선%2020일선%20골든크로스%20전략%20찾아줘&view=card&from=chat"
                className="inline-flex min-h-10 items-center justify-center rounded-2xl border border-slate-200 px-4 text-sm font-black text-slate-700"
              >
                차트 적용으로 가기
              </Link>
            </div>
          </div>
        </Card>

        <Card className="space-y-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">draft</p>
            <h2 className="mt-2 text-xl font-black text-slate-950">현재 알림 초안</h2>
          </div>
          <DraftRow label="알림 이름" value={draft.title} />
          <DraftRow label="시장" value={draft.market === "crypto" ? "코인" : draft.market === "usStock" ? "미장" : "국장"} />
          <DraftRow label="시간봉" value={draft.timeframe} />
          <DraftRow label="관찰 조건" value={draft.trigger} />
          <DraftRow label="알림 빈도" value={draft.cadence} />
          <DraftRow label="조용 시간" value={draft.quietHours} />
          <DraftRow label="전달 방식" value={draft.delivery} />
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">preview</p>
                <h3 className="mt-2 text-base font-black text-slate-950">알림 전에 전략 체력 미리보기</h3>
              </div>
              <Button variant="secondary" className="rounded-2xl" onClick={() => void loadPreview()} disabled={previewLoading}>
                {previewLoading ? "확인 중" : "최근 1주 미리보기"}
              </Button>
            </div>
            {backtestPreview ? (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <DraftRow label="최근 1주 수익률" value={`${backtestPreview.oneWeekPreview.returnPct}%`} />
                <DraftRow label="양수 일수" value={`${backtestPreview.oneWeekPreview.positiveDays}일`} />
                <DraftRow label="신호 수" value={`${backtestPreview.oneWeekPreview.signalCount}회`} />
                <DraftRow label="평균 체결 수익률" value={`${backtestPreview.oneWeekPreview.averageTradeReturnPct}%`} />
              </div>
            ) : null}
            <Link
              href={`/backtests?title=${encodeURIComponent(draft.title)}&idea=${encodeURIComponent(previewIdea)}`}
              className="mt-4 inline-flex min-h-10 items-center justify-center rounded-2xl border border-violet-200 bg-violet-50 px-4 text-sm font-black text-violet-900"
            >
              1년 백테스트 자세히
            </Link>
          </div>
          <div className="rounded-2xl bg-emerald-50 p-4 text-sm font-semibold leading-6 text-emerald-800">
            실제 자동매매가 아니라, 어떤 조건을 언제 다시 보게 만들지 정리하는 화면입니다.
          </div>
        </Card>
      </div>
    </div>
  );
}

function DraftRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <p className="mt-2 text-sm font-semibold leading-6 text-slate-800">{value}</p>
    </div>
  );
}
