"use client";

import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { DemoPlatformPanel } from "@/components/demo/DemoPlatformPanel";
import { Textarea } from "@/components/ui/Textarea";
import { quickIdeas } from "@/lib/constants";
import { DEMO_STRATEGY, isDemoStrategyQuestion } from "@/lib/demo-strategy";
import { markFeedbackSignal, setFeedbackLastScreen } from "@/lib/feedback-session";
import { trackEvent } from "@/lib/mixpanel";
import { addEvent } from "@/lib/storage";
import type { AssetClass, StrategyCard as StrategyCardType } from "@/lib/types";

const marketOptions: { label: string; value: AssetClass; hint: string }[] = [
  { label: "국장", value: "koreanStock", hint: "상따·종베·거래대금" },
  { label: "미장", value: "usStock", hint: "추세·ETF·뉴스" },
  { label: "코인", value: "crypto", hint: "5분봉·변동성" },
];

const marketIdeas: Record<AssetClass, { label: string; idea: string }[]> = {
  koreanStock: [
    { label: "거래량 돌파", idea: "거래량이 갑자기 늘고 전고점을 돌파하면 관심종목으로 보고 싶어." },
    { label: "종가베팅 후보", idea: "장 막판에 거래대금이 붙고 고가권을 유지하는 종목을 찾고 싶어." },
    { label: "상따 관찰식", idea: "상한가 근처에서 거래대금이 계속 붙는 종목을 관찰하고 싶어." },
  ],
  usStock: [
    { label: "ETF 박스 돌파", idea: "미국 ETF가 20일 박스권 상단을 돌파하면 추세 후보로 보고 싶어." },
    { label: "뉴스 거래량 반응", idea: "뉴스 이후 거래량이 붙고 전일 고가를 회복하는 미국 종목을 보고 싶어." },
    { label: "신고가 추세", idea: "신고가 근처에서 거래대금이 늘어나는 미장 종목을 찾고 싶어." },
  ],
  crypto: [
    { label: "5분봉 급등 초입", idea: "코인 5분봉에서 거래량이 급증하고 박스권 상단을 돌파하면 보고 싶어." },
    { label: "ATR 비중 조절", idea: "ATR이 커지는 코인은 비중을 줄이고 짧게 대응하고 싶어." },
    { label: "급등 후 눌림", idea: "코인이 급등 후 첫 눌림에서 다시 반등할 때 관찰하고 싶어." },
  ],
  etf: quickIdeas.slice(0, 3).map((idea) => ({ label: "예시 전략", idea })),
  futures: quickIdeas.slice(0, 3).map((idea) => ({ label: "예시 전략", idea })),
  unknown: quickIdeas.slice(0, 3).map((idea) => ({ label: "예시 전략", idea })),
};

export function StrategyInput({
  initialIdea = "",
  initialView = "home",
  initialSource = "chat",
}: {
  initialIdea?: string;
  initialView?: "home" | "card";
  initialSource?: "chat" | "conditions";
}) {
  const [rawIdea, setRawIdea] = useState(initialIdea);
  const [selectedMarket, setSelectedMarket] = useState<AssetClass>("koreanStock");
  const [strategy, setStrategy] = useState<StrategyCardType | null>(null);
  const [showDemoPanel, setShowDemoPanel] = useState(false);
  const [demoView, setDemoView] = useState<"home" | "chat" | "card" | "chart">(initialView);
  const [previousDemoView, setPreviousDemoView] = useState<"chat" | "conditions">(initialSource);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const appOpenedRef = useRef(false);
  const stageEventKeyRef = useRef("");

  useEffect(() => {
    if (appOpenedRef.current) return;
    appOpenedRef.current = true;
    void trackEvent("Demo Viewed", {
      entry_surface: "app",
      initial_source: initialSource,
      initial_view: initialView,
    });
  }, [initialSource, initialView]);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 112)}px`;
  }, [rawIdea]);

  useEffect(() => {
    const eventKey = `${demoView}:${strategy?.id ?? "none"}:${previousDemoView}`;
    if (stageEventKeyRef.current === eventKey) return;
    stageEventKeyRef.current = eventKey;
    void trackEvent("App Stage Viewed", {
      market: selectedMarket,
      source: previousDemoView,
      stage: demoView,
      strategy_present: Boolean(strategy),
    });
    setFeedbackLastScreen(`/app:${demoView}`);
  }, [demoView, previousDemoView, selectedMarket, strategy]);

  useEffect(() => {
    const saved = window.localStorage.getItem("siktalk.selectedMarket");
    if (saved === "koreanStock" || saved === "usStock" || saved === "crypto") {
      setSelectedMarket(saved);
    }
    if (initialView === "card") {
      const createdAt = new Date().toISOString();
      setStrategy({ ...DEMO_STRATEGY, createdAt, updatedAt: createdAt });
      setShowDemoPanel(true);
      setPreviousDemoView(initialSource);
      setDemoView("card");
    }
  }, [initialSource, initialView]);

  function selectMarket(market: AssetClass) {
    setSelectedMarket(market);
    window.localStorage.setItem("siktalk.selectedMarket", market);
    void trackEvent("Market Selected", { market });
  }

  async function createStrategy(ideaFromTemplate?: string) {
    const idea = (ideaFromTemplate ?? rawIdea).trim();
    if (!idea) {
      setError("전략 아이디어를 한 문장으로 적어주세요.");
      return;
    }
    const demoIntent = isDemoStrategyQuestion(idea) || idea.includes("5일선 20일선") || idea.includes("5·20선");
    void trackEvent("AI Prompt Submitted", {
      input_length: idea.length,
      is_demo_intent: demoIntent,
      market: selectedMarket,
      source: ideaFromTemplate ? "chip" : "composer",
    });
    if (demoIntent) {
      const createdAt = new Date().toISOString();
      const nextStrategy = { ...DEMO_STRATEGY, createdAt, updatedAt: createdAt };
      setStrategy(nextStrategy);
      setRawIdea("");
      setShowDemoPanel(true);
      setDemoView("chat");
      setPreviousDemoView("chat");
      setError("");
      void trackEvent("Strategy Card Created", {
        market: selectedMarket,
        source: ideaFromTemplate ? "chip" : "composer",
        strategy_id: nextStrategy.id,
        strategy_name: nextStrategy.title,
      });
      addEvent({
        type: "strategy_created",
        strategyId: nextStrategy.id,
        strategyType: nextStrategy.strategyType,
        createdAt,
      });
      return;
    }
    setLoading(true);
    setError("");
    setShowDemoPanel(false);
    try {
      const response = await fetch("/api/strategy/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawIdea: idea }),
      });
      const data = (await response.json()) as { strategy?: StrategyCardType; error?: string };
      if (!response.ok || !data.strategy) throw new Error(data.error ?? "전략 카드를 만들지 못했습니다.");
      setStrategy(data.strategy);
      setRawIdea("");
      setShowDemoPanel(false);
      void trackEvent("Strategy Card Created", {
        market: selectedMarket,
        source: ideaFromTemplate ? "chip" : "composer",
        strategy_id: data.strategy.id,
        strategy_name: data.strategy.title,
      });
      addEvent({
        type: "strategy_created",
        strategyId: data.strategy.id,
        strategyType: data.strategy.strategyType,
        createdAt: new Date().toISOString(),
      });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "알 수 없는 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  function selectDemoStrategy(source: "chat" | "conditions" = "chat") {
    const createdAt = new Date().toISOString();
    void trackEvent("Strategy Card Clicked", {
      source,
      strategy_id: DEMO_STRATEGY.id,
      strategy_name: DEMO_STRATEGY.title,
    });
    markFeedbackSignal("strategy_clicked", "/app:card");
    setStrategy({ ...DEMO_STRATEGY, createdAt, updatedAt: createdAt });
    setShowDemoPanel(true);
    setPreviousDemoView(source);
    setDemoView("card");
  }

  return (
    <div className="mx-auto flex min-h-[calc(100dvh-6rem)] w-full max-w-[calc(100vw-2rem)] flex-col md:max-w-6xl">
      <div className="flex flex-1 flex-col gap-5">
        {demoView === "home" && !strategy ? (
          <HomeStage
            marketIdeas={marketIdeas[selectedMarket]}
            onDemo={() => {
              void trackEvent("Demo CTA Clicked", { location: "home_hero" });
              setRawIdea("5일선 20일선 골든크로스 전략 찾아줘");
              selectMarket("koreanStock");
              void createStrategy("5일선 20일선 골든크로스 전략 찾아줘");
            }}
            onPickIdea={(idea) => setRawIdea(idea)}
          />
        ) : null}

        {demoView === "chat" && strategy ? <ChatStage onSelect={() => selectDemoStrategy("chat")} /> : null}

        {demoView === "card" && strategy ? (
          <StrategyCardStage
            previousLabel={previousDemoView === "conditions" ? "전략 목록으로" : "AI 대화로"}
            onBack={() => {
              if (previousDemoView === "conditions") {
                window.location.href = "/conditions";
                return;
              }
              setDemoView("chat");
            }}
            onApply={() => {
              void trackEvent("Chart Render Clicked", {
                strategy_id: strategy.id,
                strategy_name: strategy.title,
              });
              markFeedbackSignal("chart_render_clicked", "/app:chart");
              setDemoView("chart");
            }}
          />
        ) : null}

        {demoView === "chart" && strategy ? (
          <div className="mx-auto w-full max-w-6xl space-y-5 pb-10">
            {showDemoPanel ? <DemoPlatformPanel /> : null}
          </div>
        ) : null}
      </div>

      {(demoView === "home" || demoView === "chat") ? <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-100 bg-white/95 px-4 pb-4 pt-3 backdrop-blur md:sticky md:bottom-4 md:mx-auto md:mt-6 md:w-full md:max-w-3xl md:rounded-3xl md:border md:px-4 md:shadow-lg md:ring-1 md:ring-slate-100">
        {error ? <p className="mb-2 text-center text-sm font-semibold text-rose-600">{error}</p> : null}
        <div className="mb-2 flex items-center justify-between gap-2 px-1">
          <div className="inline-flex rounded-full bg-slate-100 p-1">
            {marketOptions.map((market) => (
              <button
                key={market.value}
                type="button"
                aria-label={`${market.label} 시장 선택`}
                className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${
                  selectedMarket === market.value ? "bg-white text-slate-950 shadow-sm" : "text-slate-500"
                }`}
                onClick={() => selectMarket(market.value)}
              >
                {market.label}
              </button>
            ))}
          </div>
          <Link href="/conditions" className="rounded-full px-2 py-1.5 text-xs font-bold text-emerald-700">
            도구함
          </Link>
        </div>
        <div className="flex items-end gap-2 rounded-full bg-slate-100 px-2 py-2 ring-1 ring-slate-200">
          <button
            type="button"
            aria-label="예시"
            className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white text-3xl leading-none shadow-sm"
            onClick={() => setRawIdea(quickIdeas[0])}
          >
            +
          </button>
          <Textarea
            ref={textareaRef}
            rows={1}
            placeholder="전략 아이디어 입력"
            value={rawIdea}
            onChange={(event) => setRawIdea(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                void createStrategy();
              }
            }}
            className="max-h-28 min-h-10 min-w-0 flex-1 resize-none !rounded-none !border-0 !bg-transparent px-1 py-2 text-base leading-6 shadow-none focus:!border-transparent focus:!ring-0"
          />
          <button
            type="button"
            aria-label="전략 카드 만들기"
            className="flex size-10 shrink-0 items-center justify-center rounded-full bg-slate-950 text-xl font-black text-white transition disabled:bg-slate-300"
            onClick={() => void createStrategy()}
            disabled={loading}
          >
            {loading ? "…" : "↑"}
          </button>
        </div>

        <div className="mt-2 flex items-center justify-center gap-2 text-[11px] font-semibold text-slate-400">
          <span>실제 투자 추천 아님</span>
          <span>·</span>
          <span>모의검증용</span>
        </div>
      </div> : null}
    </div>
  );
}

function HomeStage({
  marketIdeas,
  onDemo,
  onPickIdea,
}: {
  marketIdeas: { label: string; idea: string }[];
  onDemo: () => void;
  onPickIdea: (idea: string) => void;
}) {
  return (
    <section className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center px-3 pb-32 pt-6 text-center md:pb-10 md:pt-14">
      <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-black text-emerald-800">
        <span className="size-2 rounded-full bg-emerald-500" />
        80개 조건식 DB 보유
      </div>

      <h1 className="mt-6 text-4xl font-black leading-tight tracking-[-0.04em] text-slate-950 md:text-6xl">
        바쁜 개인투자자를 위한
        <br />
        <span className="text-emerald-600">조건식 탐색</span> 앱
      </h1>
      <p className="mt-4 max-w-2xl text-base font-semibold leading-7 text-slate-500 md:text-lg">
        말로 찾고, 카드로 확인하고, 차트에 바로 겹쳐봅니다.
      </p>

      <div className="mt-7 grid w-full max-w-3xl overflow-hidden rounded-[1.6rem] border border-slate-200 bg-white shadow-sm md:grid-cols-[1fr_auto_1fr]">
        <div className="p-5">
          <p className="text-xs font-black text-slate-400">기존 방식</p>
          <p className="mt-2 text-3xl font-black text-slate-950">5~10분</p>
          <p className="mt-2 text-sm font-semibold text-slate-500">조건식 찾고, 복사하고, 차트에 넣고...</p>
        </div>
        <div className="hidden items-center justify-center border-x border-slate-100 px-5 md:flex">
          <span className="rounded-full bg-white p-3 text-xl shadow-md">→</span>
        </div>
        <div className="bg-emerald-50/70 p-5">
          <p className="text-xs font-black text-emerald-700">식톡</p>
          <p className="mt-2 text-3xl font-black text-emerald-700">30초~1분</p>
          <p className="mt-2 text-sm font-semibold text-emerald-800">AI로 찾고, 카드로 확인, 원클릭 적용</p>
        </div>
      </div>

      <button
        type="button"
        className="mt-7 w-full max-w-3xl rounded-[1.7rem] border border-emerald-500 bg-white p-4 text-left shadow-[0_18px_60px_rgba(16,185,129,0.12)] transition hover:-translate-y-0.5 hover:shadow-[0_22px_70px_rgba(16,185,129,0.18)]"
        onClick={onDemo}
      >
        <span className="flex items-center gap-3">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-emerald-600 text-xl font-black text-white">식</span>
          <span className="min-w-0 flex-1">
            <span className="block text-base font-black text-slate-950">5일선 20일선 골든크로스 전략 찾아줘</span>
            <span className="mt-1 block text-sm font-semibold text-slate-500">데모 흐름 바로 보기</span>
          </span>
          <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-xl font-black text-white">↑</span>
        </span>
      </button>

      <div className="mt-5 flex w-full max-w-4xl flex-wrap justify-center gap-2">
        {marketIdeas.map((idea) => (
          <button
            key={idea.idea}
            type="button"
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700 shadow-sm transition hover:border-emerald-200 hover:text-emerald-700"
            onClick={() => onPickIdea(idea.idea)}
          >
            {idea.label}
          </button>
        ))}
      </div>

      <div className="mt-9 grid w-full max-w-4xl gap-3 rounded-[1.6rem] border border-slate-200 bg-white p-4 text-left shadow-sm md:grid-cols-3">
        <StepItem index="1" title="AI로 찾기" body="말하면 80개 DB에서 후보를 찾습니다." />
        <StepItem index="2" title="전략 카드로 정리" body="조건, 난이도, 쓰는 상황을 한눈에 봅니다." />
        <StepItem index="3" title="차트 적용/복사" body="차트에 겹쳐보고 TradingView로 옮깁니다." />
      </div>

      <p className="mt-7 text-sm font-black text-slate-600">국장 조건식만 엄선하여 제공합니다. 실제 투자 추천이 아닙니다.</p>
    </section>
  );
}

function ChatStage({ onSelect }: { onSelect: () => void }) {
  const candidates = [
    {
      label: "추천 1",
      title: "5·20선 골든크로스 + 거래량 회복",
      summary: "5일선이 20일선을 돌파하고, 거래량이 최근 평균보다 회복된 종목을 관찰합니다.",
      situation: "상승 추세 전환 초기 구간에서 모멘텀을 확인하고 싶을 때",
      difficulty: "쉬움",
      active: true,
    },
    {
      label: "추천 2",
      title: "거래량 돌파 확인식",
      summary: "거래량이 전일 대비 크게 증가하며 주요 가격선을 돌파한 구간을 봅니다.",
      situation: "강한 수급이 유입되는 단기 돌파 구간을 찾고 싶을 때",
      difficulty: "중간",
      active: false,
    },
    {
      label: "추천 3",
      title: "눌림목 재상승 관찰식",
      summary: "조정 후 5일선 지지 확인과 거래량 반응으로 재상승 후보를 봅니다.",
      situation: "단기 조정 이후 반등 시점을 관찰하고 싶을 때",
      difficulty: "중간",
      active: false,
    },
  ];

  return (
    <section className="mx-auto w-full max-w-5xl space-y-7 px-3 pb-32 pt-6 md:pb-10 md:pt-12">
      <div>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-4xl font-black tracking-[-0.04em] text-slate-950 md:text-5xl">AI와 대화</h1>
          <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-sm font-black text-emerald-700">1분 안에 전략 찾기</span>
        </div>
        <p className="mt-3 text-base font-semibold text-slate-500">추천 매매가 아니라, 조건식 DB에서 관찰식을 빠르게 찾아드립니다.</p>
      </div>

      <div className="flex justify-end">
        <div className="max-w-xl rounded-[1.3rem] bg-emerald-50 px-5 py-4 text-sm font-bold leading-6 text-slate-800 shadow-sm">
          5일선 20일선 골든크로스 전략 찾아줘
          <span className="ml-3 text-xs text-slate-400">오전 10:42</span>
        </div>
      </div>

      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-sm font-black text-white">식</span>
        <div className="max-w-2xl rounded-[1.3rem] border border-slate-200 bg-white px-5 py-4 text-sm font-bold leading-6 text-slate-700 shadow-sm">
          네. 유사한 전략을 80개 조건식 DB에서 찾았습니다. 아래 3가지를 먼저 확인하세요.
          <span className="ml-3 text-xs text-slate-400">오전 10:42</span>
        </div>
      </div>

      <div>
        <p className="text-sm font-black text-slate-950">AI 추천 전략 3개</p>
        <p className="mt-1 text-sm font-semibold text-slate-500">유사도와 실제 활용도를 기준으로 정렬했습니다.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {candidates.map((candidate) => (
          <button
            key={candidate.title}
            type="button"
            className={`rounded-[1.5rem] border bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
              candidate.active ? "border-emerald-500 ring-4 ring-emerald-50" : "border-slate-200"
            }`}
            onClick={onSelect}
          >
            <div className="flex items-center justify-between gap-3">
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">{candidate.label}</span>
              {candidate.active ? <span className="rounded-full bg-emerald-500 px-2 py-1 text-xs font-black text-white">BEST</span> : null}
            </div>
            <h2 className="mt-5 min-h-[4rem] text-2xl font-black leading-tight tracking-[-0.03em] text-slate-950">{candidate.title}</h2>
            <div className="my-5 h-px bg-slate-100" />
            <p className="text-xs font-black text-slate-500">한 줄 설명</p>
            <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{candidate.summary}</p>
            <p className="mt-4 text-xs font-black text-slate-500">쓰는 상황</p>
            <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{candidate.situation}</p>
            <div className="mt-5 flex items-center justify-between">
              <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-black text-slate-600">난이도 {candidate.difficulty}</span>
              <span className="text-sm font-black text-emerald-700">전략 카드로 정리 →</span>
            </div>
          </button>
        ))}
      </div>

      <button
        type="button"
        className="ml-auto flex w-full max-w-md items-center justify-center gap-3 rounded-2xl bg-emerald-600 px-5 py-4 text-base font-black text-white shadow-lg shadow-emerald-200 transition hover:bg-emerald-700"
        onClick={onSelect}
      >
        선택한 전략 카드로 정리
        <span>→</span>
      </button>
    </section>
  );
}

function StrategyCardStage({
  previousLabel,
  onBack,
  onApply,
}: {
  previousLabel: string;
  onBack: () => void;
  onApply: () => void;
}) {
  return (
    <section className="mx-auto w-full max-w-6xl space-y-6 px-3 pb-10 pt-6 md:pt-10">
      <button type="button" className="inline-flex items-center gap-2 text-sm font-black text-slate-500 hover:text-slate-950" onClick={onBack}>
        <span className="flex size-9 items-center justify-center rounded-full bg-slate-100 text-lg">←</span>
        {previousLabel}
      </button>

      <div>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-4xl font-black tracking-[-0.04em] text-slate-950 md:text-5xl">전략 카드</h1>
          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-black text-emerald-700">선택 완료</span>
        </div>
        <h2 className="mt-5 text-4xl font-black leading-tight tracking-[-0.05em] text-slate-950 md:text-6xl">
          <span className="text-emerald-600">5·20선 골든크로스</span> + 거래량 회복
        </h2>
        <p className="mt-4 text-base font-semibold text-slate-500">이평선 상향 교차 뒤 거래량이 회복되는 구간을 빠르게 관찰할 때 쓰는 전략식입니다.</p>
      </div>

      <div className="grid gap-5 rounded-[1.7rem] border border-slate-200 bg-white p-5 shadow-sm xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="divide-y divide-slate-100">
          <CardRow icon="◎" label="전략 목적" body="돌파 관찰 / 종가베팅 보조 / 눌림 후 재상승 확인" />
          <CardRow
            icon="▶"
            label="관찰 시작 조건"
            body={
              <ul className="space-y-2">
                <li>5일선이 20일선을 상향 돌파</li>
                <li>현재 거래량이 최근 평균 거래량보다 증가</li>
                <li>양봉 마감</li>
              </ul>
            }
          />
          <CardRow
            icon="■"
            label="관찰 종료 조건"
            body={
              <ul className="space-y-2">
                <li>5일선이 20일선 아래로 재이탈</li>
                <li>또는 10봉 경과</li>
              </ul>
            }
          />
          <CardRow icon="▥" label="적용 시장" body="국장 단타 / 스윙 초입 / 거래량 붙는 종목 관찰" />
          <CardRow icon="ⓘ" label="한 줄 요약" body="복잡한 조건식을 카드로 정리해 바로 적용할 수 있습니다." />

          <div className="flex flex-wrap gap-3 py-5">
            <Pill label="난이도" value="중간" />
            <Pill label="활용도" value="높음" />
            <Pill label="추천 상황" value="거래량 회복 구간" tone="amber" />
          </div>
        </div>

        <aside className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-black text-slate-700">전략 미리보기</p>
          <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-white p-3">
            <MiniPreviewChart />
          </div>
          <ul className="mt-4 space-y-3 text-sm font-bold text-slate-600">
            <li>✓ 5일선 &gt; 20일선 상향 교차</li>
            <li>✓ 거래량 회복 확인</li>
            <li>✓ 양봉 마감 관찰</li>
          </ul>
          <button
            type="button"
            className="mt-5 flex h-14 w-full items-center justify-center rounded-2xl bg-emerald-600 text-base font-black text-white shadow-lg shadow-emerald-100 transition hover:bg-emerald-700"
            onClick={onApply}
          >
            차트에 적용
          </button>
          <button
            type="button"
            className="mt-3 flex h-12 w-full items-center justify-center rounded-2xl border border-slate-200 bg-white text-sm font-black text-slate-700"
          >
            TradingView Pine 복사
          </button>
          <button
            type="button"
            className="mt-3 flex h-12 w-full items-center justify-center rounded-2xl border border-slate-200 bg-white text-sm font-black text-slate-700"
          >
            다른 전략과 비교
          </button>
        </aside>

        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 xl:col-span-2">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-lg font-black text-emerald-900">키움 수동 정리 대신 1분 내 카드 완성</p>
              <p className="mt-1 text-sm font-semibold text-emerald-800">조건 정리부터 코드 생성까지 자동화로 시간을 줄입니다.</p>
            </div>
            <button type="button" className="rounded-2xl border border-emerald-200 bg-white px-5 py-3 text-sm font-black text-emerald-800" onClick={onApply}>
              자세히 보기 →
            </button>
          </div>
        </div>
      </div>

      <p className="text-center text-sm font-black text-slate-600">국장(한국 주식)에 최적화된 조건식만 엄선하여 제공합니다.</p>
    </section>
  );
}

function StepItem({ index, title, body }: { index: string; title: string; body: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-black text-emerald-700">{index}</span>
      <span>
        <span className="block text-sm font-black text-slate-950">{title}</span>
        <span className="mt-1 block text-sm font-semibold leading-5 text-slate-500">{body}</span>
      </span>
    </div>
  );
}

function CardRow({ icon, label, body }: { icon: string; label: string; body: ReactNode }) {
  return (
    <div className="grid gap-3 py-5 md:grid-cols-[180px_minmax(0,1fr)]">
      <p className="flex items-center gap-3 text-base font-black text-slate-900">
        <span className="flex size-9 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">{icon}</span>
        {label}
      </p>
      <div className="text-base font-bold leading-7 text-slate-700">{body}</div>
    </div>
  );
}

function Pill({ label, value, tone = "emerald" }: { label: string; value: string; tone?: "emerald" | "amber" }) {
  const className =
    tone === "amber"
      ? "border-amber-200 bg-amber-50 text-amber-700"
      : "border-emerald-200 bg-emerald-50 text-emerald-700";
  return (
    <span className={`inline-flex items-center gap-2 rounded-full border px-4 py-3 text-sm font-black ${className}`}>
      <span className="text-slate-500">{label}</span>
      {value}
    </span>
  );
}

function MiniPreviewChart() {
  return (
    <div className="relative aspect-[1.35] overflow-hidden rounded-lg bg-white">
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(148,163,184,0.16)_1px,transparent_1px),linear-gradient(180deg,rgba(148,163,184,0.16)_1px,transparent_1px)] bg-[size:42px_34px]" />
      <svg viewBox="0 0 300 190" className="absolute inset-0 h-full w-full">
        <path d="M20 128 C60 120 74 142 112 118 C144 98 164 116 196 82 C228 48 252 72 280 48" fill="none" stroke="#10b981" strokeWidth="4" />
        <path d="M20 145 C70 138 110 130 150 112 C190 94 236 88 280 72" fill="none" stroke="#f59e0b" strokeWidth="3" />
        <rect x="42" y="128" width="10" height="35" fill="#10b981" />
        <rect x="74" y="116" width="10" height="47" fill="#ef4444" />
        <rect x="110" y="104" width="10" height="59" fill="#10b981" />
        <rect x="168" y="82" width="10" height="81" fill="#10b981" />
        <rect x="230" y="56" width="10" height="107" fill="#10b981" />
      </svg>
      <span className="absolute bottom-10 right-8 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-black text-white shadow">골든크로스</span>
      <span className="absolute bottom-3 right-8 rounded-lg bg-blue-500 px-3 py-2 text-xs font-black text-white shadow">거래량 회복</span>
    </div>
  );
}
