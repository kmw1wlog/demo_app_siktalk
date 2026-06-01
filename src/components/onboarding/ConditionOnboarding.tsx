"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { getRecommendedConditionTemplates } from "@/lib/condition-templates";
import { addEvent } from "@/lib/storage";
import type { AssetClass, OnboardingAnswers } from "@/lib/types";

const steps = [
  {
    key: "market",
    title: "어느 시장을 먼저 보시나요?",
    description: "조건식 추천 우선순위를 정하기 위한 첫 선택입니다.",
    options: [
      { value: "koreanStock", label: "국장", hint: "상따, 종베, 시초가" },
      { value: "usStock", label: "미장", hint: "ETF, 추세, 뉴스" },
      { value: "crypto", label: "코인", hint: "5분봉, 변동성, 눌림" },
    ],
  },
  {
    key: "setup",
    title: "어떤 그림을 더 자주 찾나요?",
    description: "정답이 아니라 현재 가장 자주 보는 패턴이면 됩니다.",
    options: [
      { value: "breakout", label: "돌파", hint: "상따, 전고점, 신고가" },
      { value: "pullback", label: "눌림", hint: "갭 이후 눌림, 재돌파" },
      { value: "closingBet", label: "종가", hint: "장 막판 강세, 종베" },
      { value: "meanReversion", label: "반등", hint: "RSI, 과매도, 볼린저" },
    ],
  },
  {
    key: "risk",
    title: "손절은 보통 어떤 식으로 생각하나요?",
    description: "리스크 기준이 없으면 조건식도 끝까지 못 갑니다.",
    options: [
      { value: "atr", label: "ATR 기준", hint: "변동폭 보고 자름" },
      { value: "tight", label: "짧게 자름", hint: "고정 퍼센트, 전저점" },
      { value: "time", label: "시간 기준", hint: "오래 안 들고 감" },
      { value: "wide", label: "넓게 버팀", hint: "스윙성 접근" },
    ],
  },
] as const;

const marketIdeas: Record<AssetClass, string> = {
  koreanStock: "국장 단타 아이디어를 조건식으로 정리하고 싶어.",
  usStock: "미장 ETF나 뉴스 반응 종목을 조건식 카드로 보고 싶어.",
  crypto: "코인 5분봉 급등 초입과 눌림 조건을 카드로 정리하고 싶어.",
  etf: "ETF 조건을 카드로 정리하고 싶어.",
  futures: "선물 아이디어를 카드로 정리하고 싶어.",
  unknown: "내 아이디어를 조건식 카드로 정리하고 싶어.",
};

export function ConditionOnboarding() {
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<OnboardingAnswers>({});
  const step = steps[stepIndex];

  const recommendations = useMemo(() => {
    if (!answers.market) return [];
    return getRecommendedConditionTemplates({
      market: answers.market,
      setup: answers.setup,
      risk: answers.risk,
      pace: answers.market === "crypto" ? "fast" : "intraday",
      universe: "volume",
    }).slice(0, 6);
  }, [answers]);

  function choose(value: string) {
    const nextAnswers = { ...answers, [step.key]: value };
    setAnswers(nextAnswers);
    addEvent({ type: "onboarding_answered", step: step.key, answer: value, createdAt: new Date().toISOString() });
    if (stepIndex < steps.length - 1) {
      setStepIndex((current) => current + 1);
      return;
    }
    addEvent({ type: "onboarding_completed", createdAt: new Date().toISOString() });
  }

  return (
    <div className="space-y-6">
      <section className="rounded-3xl bg-slate-950 p-6 text-white">
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-emerald-300">식톡 온보딩</p>
        <h1 className="mt-3 text-3xl font-black tracking-tight md:text-4xl">세 번만 누르면 조건식 추천 방향이 잡힙니다</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
          지금 찾는 시장, 자주 보는 패턴, 손절 습관만 선택하면 80개 조건식 중에서 우선순위를 줄여드립니다.
        </p>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-slate-500">STEP {stepIndex + 1} / {steps.length}</p>
            {stepIndex > 0 ? (
              <Button variant="ghost" onClick={() => setStepIndex((current) => current - 1)}>이전</Button>
            ) : null}
          </div>
          <h2 className="mt-4 text-2xl font-black text-slate-950">{step.title}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">{step.description}</p>
          <div className="mt-6 grid gap-3 md:grid-cols-2">
            {step.options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => choose(option.value)}
                className="rounded-3xl border border-slate-200 bg-slate-50 p-5 text-left transition hover:-translate-y-0.5 hover:border-emerald-400 hover:bg-emerald-50"
              >
                <p className="text-lg font-black text-slate-950">{option.label}</p>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{option.hint}</p>
              </button>
            ))}
          </div>
        </article>

        <aside className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-slate-950">현재 추천 후보</h2>
            {answers.market ? <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">{answers.market === "koreanStock" ? "국장" : answers.market === "usStock" ? "미장" : "코인"}</span> : null}
          </div>
          <div className="mt-4 space-y-3">
            {recommendations.length === 0 ? (
              <p className="rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-500">
                첫 질문부터 고르면, 조건식 후보와 바로 이어질 아이디어 문장이 여기에 나타납니다.
              </p>
            ) : (
              recommendations.map((template) => (
                <div key={template.id} className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-sm font-black text-slate-950">{template.title}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{template.plainKorean}</p>
                </div>
              ))
            )}
          </div>
          <div className="mt-6 flex flex-col gap-3">
            <Link
              href={`/app?idea=${encodeURIComponent(marketIdeas[answers.market ?? "unknown"])}`}
              className="flex min-h-12 items-center justify-center rounded-2xl bg-slate-950 px-4 text-sm font-black text-white"
            >
              이 흐름으로 카드 만들기
            </Link>
            <Link
              href="/conditions"
              className="flex min-h-12 items-center justify-center rounded-2xl border border-slate-200 px-4 text-sm font-black text-slate-700"
            >
              전체 조건식 보기
            </Link>
          </div>
        </aside>
      </section>
    </div>
  );
}
