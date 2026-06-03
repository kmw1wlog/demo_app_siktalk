"use client";

import { useEffect, useRef, useState } from "react";
import type { Dispatch, ReactNode, SetStateAction } from "react";
import { Button } from "@/components/ui/Button";
import {
  dismissFeedbackForSession,
  ensureFeedbackSession,
  getFeedbackContext,
  hasFeedbackCompleted,
  isFeedbackDismissedForSession,
  markFeedbackCompleted,
  recordFeedbackEvent,
} from "@/lib/feedback-session";
import { trackEvent } from "@/lib/mixpanel";

const feelingOptions = [
  "키움에서 직접 하는 게 더 낫다",
  "TradingView에서 하는 게 더 낫다",
  "TradingView 지표로 가져가는 기능만 있으면 좋겠다",
  "조건식 DB를 빠르게 보는 건 괜찮았다",
  "AI가 조건식 찾아주는 건 편했다",
  "차트 위에 찍히는 기능이 제일 좋았다",
  "자동감시/모의투자까지 있어야 쓸 것 같다",
  "아직 잘 모르겠다",
];

const frictionOptions = [
  "차트가 키움/트뷰보다 불편하다",
  "조건식 설명이 부족하다",
  "조건식이 실제로 통할지 신뢰가 안 간다",
  "앱이 느리거나 무겁게 느껴진다",
  "어디를 눌러야 할지 모르겠다",
  "TradingView로 가져가는 과정이 더 중요하다",
  "자동감시/알림이 없으면 의미가 약하다",
  "불편한 점은 딱히 없었다",
];

const botOptions = [
  "예, 지금도 사용 중이다",
  "예, 만들어봤지만 지금은 안 쓴다",
  "아니오, 아직 없다",
  "잘 모르겠다",
];

const satisfactionOptions = ["만족한다", "반쯤 만족한다", "만족하지 않는다", "거의 안 쓴다"];

const referenceOptions = [
  "유튜브",
  "블로그/카페",
  "텔레그램/단톡방",
  "TradingView 공개지표",
  "키움 조건검색",
  "직접 코딩",
  "유료 강의/전자책",
  "지인/커뮤니티",
  "기타",
];

const noBotReasonOptions = [
  "필요성을 크게 못 느꼈다",
  "어떤 조건식이 좋은지 못 찾았다",
  "무료 지표/조건식을 찾기 어렵다",
  "유료 자료는 비싸다고 느꼈다",
  "만드는 방법이 어렵다",
  "API나 자동매매 연결이 어렵다",
  "실제로 돈 넣고 돌리기 무섭다",
  "백테스트/검증을 못 믿겠다",
  "시간이 없어서 미뤘다",
];

const oneThingOptions = [
  "국장 조건식 DB를 잘 정리해주는 것",
  "AI가 내 목적에 맞는 조건식을 찾아주는 것",
  "조건식을 차트에 바로 렌더링하는 것",
  "TradingView 지표로 바로 변환하는 것",
  "조건식 성능을 실험/검증해주는 것",
  "장중 자동감시/알림을 해주는 것",
  "영웅문 세팅과 조건식을 쉽게 연결해주는 것",
];

export function FeedbackWidget() {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [surveyOpen, setSurveyOpen] = useState(false);
  const [completed, setCompleted] = useState(false);
  const viewedRef = useRef(false);

  useEffect(() => {
    ensureFeedbackSession();
    setCompleted(hasFeedbackCompleted());
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || completed) return;
    if (!viewedRef.current) {
      viewedRef.current = true;
      recordFeedbackEvent("Feedback Widget Viewed", { state: "collapsed" });
    }

    const timer = window.setTimeout(() => {
      if (!isFeedbackDismissedForSession() && !hasFeedbackCompleted()) {
        setOpen(true);
        recordFeedbackEvent("Feedback Widget Opened", { trigger: "time_60s" });
      }
    }, 60000);

    function handleSignal(event: Event) {
      if (isFeedbackDismissedForSession() || hasFeedbackCompleted()) return;
      const detail = (event as CustomEvent<{ signal?: string }>).detail;
      setOpen(true);
      recordFeedbackEvent("Feedback Widget Opened", { trigger: detail?.signal || "usage_signal" });
    }

    window.addEventListener("siktalk:feedback-signal", handleSignal);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("siktalk:feedback-signal", handleSignal);
    };
  }, [completed, mounted]);

  if (!mounted || completed) return null;

  function openSurvey() {
    recordFeedbackEvent("Feedback CTA Clicked", { source: open ? "expanded_card" : "collapsed_button" });
    setSurveyOpen(true);
    setOpen(false);
  }

  function dismiss() {
    dismissFeedbackForSession();
    setOpen(false);
    recordFeedbackEvent("Feedback Widget Dismissed", { source: "later_button" });
  }

  return (
    <>
      <div className="fixed bottom-24 right-4 z-40 md:right-6">
        {open ? (
          <div className="w-[calc(100vw-2rem)] rounded-lg border border-slate-200 bg-white p-4 shadow-2xl md:w-96">
            <p className="text-base font-black text-slate-950">앱을 써보신 느낌이 궁금합니다.</p>
            <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
              30초 피드백을 남겨주시면 식톡 베타 쿠폰과 TradingView 관찰용 무료 지표를 보내드립니다.
            </p>
            <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
              “키움이 더 낫다”, “트뷰로만 쓰고 싶다” 같은 의견도 환영합니다.
            </p>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <Button className="flex-1" onClick={openSurvey}>피드백 남기고 혜택 받기</Button>
              <Button variant="secondary" onClick={dismiss}>나중에 할게요</Button>
            </div>
            <p className="mt-3 text-xs font-semibold text-slate-400">투자 추천이 아닌 서비스 개선용 설문입니다.</p>
          </div>
        ) : (
          <button
            type="button"
            className="min-h-11 rounded-lg border border-slate-200 bg-white px-4 text-sm font-black text-slate-900 shadow-xl"
            onClick={() => {
              setOpen(true);
              recordFeedbackEvent("Feedback Widget Opened", { trigger: "collapsed_button" });
            }}
          >
            30초 피드백
          </button>
        )}
      </div>

      {surveyOpen ? (
        <FeedbackSurveyModal
          onClose={() => setSurveyOpen(false)}
          onCompleted={() => {
            markFeedbackCompleted();
            setCompleted(true);
            setSurveyOpen(false);
          }}
        />
      ) : null}
    </>
  );
}

function FeedbackSurveyModal({
  onClose,
  onCompleted,
}: {
  onClose: () => void;
  onCompleted: () => void;
}) {
  const [overallFeeling, setOverallFeeling] = useState("");
  const [reason, setReason] = useState("");
  const [mainFriction, setMainFriction] = useState("");
  const [hasBot, setHasBot] = useState("");
  const [botSatisfaction, setBotSatisfaction] = useState("");
  const [referenceSources, setReferenceSources] = useState<string[]>([]);
  const [noBotReason, setNoBotReason] = useState<string[]>([]);
  const [oneThing, setOneThing] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const ownsBot = hasBot === "예, 지금도 사용 중이다" || hasBot === "예, 만들어봤지만 지금은 안 쓴다";

  async function submit() {
    const context = getFeedbackContext();
    if (!context) return;
    setSubmitting(true);
    setError("");
    try {
      const response = await fetch("/api/feedback/post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...context,
          overall_feeling: overallFeeling,
          reason,
          main_friction: mainFriction,
          has_bot: hasBot,
          bot_satisfaction: botSatisfaction,
          reference_sources: referenceSources,
          no_bot_reason: noBotReason,
          one_thing: oneThing,
        }),
      });
      const data = (await response.json()) as { ok?: boolean; error?: string };
      if (!response.ok || !data.ok) {
        throw new Error(data.error || "피드백 저장에 실패했습니다.");
      }
      await trackEvent("Post Survey Submitted", {
        ...context,
        has_bot: hasBot,
        main_friction: mainFriction,
        one_thing: oneThing,
        overall_feeling: overallFeeling,
      });
      onCompleted();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "피드백 저장 중 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-3">
      <div className="max-h-[92dvh] w-full max-w-3xl overflow-y-auto rounded-lg bg-white p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-black text-slate-950">앱 사용 후 피드백</h2>
            <p className="mt-1 text-sm font-semibold text-slate-500">제출 후 바로 앱으로 돌아갑니다.</p>
          </div>
          <Button variant="ghost" className="min-h-8 px-2 py-1" onClick={onClose}>닫기</Button>
        </div>

        <div className="mt-5 space-y-6">
          <SurveyField title="1. 방금 데모를 써본 뒤 가장 가까운 느낌은?">
            <RadioList options={feelingOptions} value={overallFeeling} onChange={setOverallFeeling} />
          </SurveyField>

          <SurveyField title="2. 왜 그렇게 느꼈나요?">
            <textarea
              className="min-h-24 w-full rounded-lg border border-slate-200 p-3 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="예: 차트는 트뷰가 나은데 조건식 찾는 건 편했다"
            />
          </SurveyField>

          <SurveyField title="3. 앱에서 제일 불편했던 점은?">
            <RadioList options={frictionOptions} value={mainFriction} onChange={setMainFriction} />
          </SurveyField>

          <SurveyField title="4. 현재 자동으로 돌아가는 조건식/봇/알림을 보유하고 있나요?">
            <RadioList options={botOptions} value={hasBot} onChange={setHasBot} />
          </SurveyField>

          {ownsBot ? (
            <SurveyField title="5-A. 만족하시나요? 만들 때 주로 뭘 참고했나요?">
              <RadioList options={satisfactionOptions} value={botSatisfaction} onChange={setBotSatisfaction} />
              <CheckboxList options={referenceOptions} values={referenceSources} onToggle={(value) => toggleValue(value, setReferenceSources)} />
            </SurveyField>
          ) : hasBot ? (
            <SurveyField title="5-B. 아직 없는 이유는?">
              <CheckboxList options={noBotReasonOptions} values={noBotReason} onToggle={(value) => toggleValue(value, setNoBotReason)} />
            </SurveyField>
          ) : null}

          <SurveyField title="6. 식톡이 딱 하나만 잘해야 한다면?">
            <RadioList options={oneThingOptions} value={oneThing} onChange={setOneThing} />
          </SurveyField>

          {error ? <p className="rounded-lg bg-rose-50 p-3 text-sm font-bold text-rose-700">{error}</p> : null}

          <Button
            className="w-full"
            disabled={submitting || !overallFeeling || !reason.trim() || !mainFriction || !hasBot || !oneThing}
            onClick={() => void submit()}
          >
            제출하고 쿠폰 + 무료지표 받기
          </Button>
        </div>
      </div>
    </div>
  );
}

function SurveyField({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <p className="mb-3 text-sm font-black text-slate-900">{title}</p>
      {children}
    </div>
  );
}

function RadioList({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="grid gap-2 md:grid-cols-2">
      {options.map((option) => (
        <label key={option} className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 p-3 text-sm font-semibold">
          <input type="radio" checked={value === option} onChange={() => onChange(option)} />
          <span>{option}</span>
        </label>
      ))}
    </div>
  );
}

function CheckboxList({
  options,
  values,
  onToggle,
}: {
  options: string[];
  values: string[];
  onToggle: (value: string) => void;
}) {
  return (
    <div className="mt-3 grid gap-2 md:grid-cols-2">
      {options.map((option) => (
        <label key={option} className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 p-3 text-sm font-semibold">
          <input type="checkbox" checked={values.includes(option)} onChange={() => onToggle(option)} />
          <span>{option}</span>
        </label>
      ))}
    </div>
  );
}

function toggleValue(value: string, setValues: Dispatch<SetStateAction<string[]>>) {
  setValues((current) => current.includes(value) ? current.filter((item) => item !== value) : [...current, value]);
}
