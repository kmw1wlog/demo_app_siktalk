"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { DemoPlatformPanel } from "@/components/demo/DemoPlatformPanel";
import { MockBacktestReport } from "@/components/report/MockBacktestReport";
import { Textarea } from "@/components/ui/Textarea";
import { quickIdeas } from "@/lib/constants";
import { DEMO_STRATEGY, DEMO_STRATEGY_QUESTION, isDemoStrategyQuestion } from "@/lib/demo-strategy";
import { addEvent, saveReport, updateStrategy } from "@/lib/storage";
import type { AssetClass, MockBacktestReport as Report, StrategyCard as StrategyCardType } from "@/lib/types";
import { StrategyCard } from "./StrategyCard";

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

export function StrategyInput({ initialIdea = "" }: { initialIdea?: string }) {
  const [rawIdea, setRawIdea] = useState(initialIdea);
  const [selectedMarket, setSelectedMarket] = useState<AssetClass>("koreanStock");
  const [strategy, setStrategy] = useState<StrategyCardType | null>(null);
  const [report, setReport] = useState<Report | null>(null);
  const [showDemoPanel, setShowDemoPanel] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 112)}px`;
  }, [rawIdea]);

  useEffect(() => {
    const saved = window.localStorage.getItem("siktalk.selectedMarket");
    if (saved === "koreanStock" || saved === "usStock" || saved === "crypto") {
      setSelectedMarket(saved);
    }
  }, []);

  function selectMarket(market: AssetClass) {
    setSelectedMarket(market);
    window.localStorage.setItem("siktalk.selectedMarket", market);
  }

  async function createStrategy(ideaFromTemplate?: string) {
    const idea = (ideaFromTemplate ?? rawIdea).trim();
    if (!idea) {
      setError("전략 아이디어를 한 문장으로 적어주세요.");
      return;
    }
    if (isDemoStrategyQuestion(idea)) {
      const createdAt = new Date().toISOString();
      const nextStrategy = { ...DEMO_STRATEGY, createdAt, updatedAt: createdAt };
      setStrategy(nextStrategy);
      setRawIdea("");
      setReport(null);
      setShowDemoPanel(true);
      setError("");
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
    setReport(null);
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

  async function runBacktest(target: StrategyCardType) {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/strategy/backtest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ strategy: target }),
      });
      const data = (await response.json()) as { report?: Report; error?: string };
      if (!response.ok || !data.report) throw new Error(data.error ?? "모의검증을 만들지 못했습니다.");
      saveReport(data.report);
      addEvent({ type: "mock_backtest_generated", strategyId: target.id, createdAt: new Date().toISOString() });
      const next = { ...target, hasReport: true, updatedAt: new Date().toISOString() };
      updateStrategy(next);
      setStrategy(next);
      setReport(data.report);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "알 수 없는 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[calc(100dvh-6rem)] w-full max-w-[calc(100vw-2rem)] flex-col md:max-w-5xl">
      <div className="flex flex-1 flex-col gap-5">
        <section className={`mx-auto max-w-2xl pt-8 text-center ${strategy ? "hidden md:block" : ""}`}>
          <div className="mx-auto mb-5 flex size-14 items-center justify-center rounded-2xl bg-emerald-600 text-2xl font-black text-white shadow-sm">
            식
          </div>
          <h1 className="text-2xl font-black tracking-normal text-slate-950 md:text-4xl">말하면 전략 카드</h1>
          <p className="mt-3 text-sm leading-6 text-slate-500 md:text-base">
            진입·청산·필터로 정리합니다.
          </p>
        </section>

        {!strategy ? (
          <div className="mx-auto mt-auto w-full max-w-2xl space-y-4 pb-24 md:pb-0">
            <button
              type="button"
              className="flex min-h-12 w-full items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50 px-4 text-left text-sm font-black text-emerald-900 transition hover:bg-emerald-100"
              onClick={() => {
                setRawIdea(DEMO_STRATEGY_QUESTION);
                selectMarket("koreanStock");
              }}
            >
              <span>데모 질문 넣기</span>
              <span className="text-xs text-emerald-700">MA5/MA20 플랫폼 변환</span>
            </button>
            <div className="grid gap-2 text-sm font-semibold text-slate-800">
              {marketIdeas[selectedMarket].map((idea, index) => (
                <button
                  key={idea.label}
                  type="button"
                  className="flex min-h-12 items-center gap-4 rounded-2xl bg-white px-2 text-left transition hover:bg-slate-50 md:px-4"
                  onClick={() => setRawIdea(idea.idea)}
                >
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full border border-slate-200 text-lg">
                    {["↗", "⌁", "▤"][index]}
                  </span>
                  <span>{idea.label}</span>
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {strategy ? (
          <div className="mx-auto w-full max-w-5xl space-y-5 pb-44 md:pb-0">
            <StrategyCard strategy={strategy} onBacktest={runBacktest} />
            {showDemoPanel ? <DemoPlatformPanel /> : null}
            {report ? <MockBacktestReport strategy={strategy} report={report} /> : null}
          </div>
        ) : null}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-100 bg-white/95 px-4 pb-4 pt-3 backdrop-blur md:sticky md:bottom-4 md:mx-auto md:mt-6 md:w-full md:max-w-3xl md:rounded-3xl md:border md:px-4 md:shadow-lg md:ring-1 md:ring-slate-100">
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
      </div>
    </div>
  );
}
