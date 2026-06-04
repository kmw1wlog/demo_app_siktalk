"use client";

import { useEffect, useRef, useState } from "react";
import type { Dispatch, ReactNode, SetStateAction } from "react";
import { Button } from "@/components/ui/Button";
import {
  dismissFeedbackForSession,
  ensureFeedbackSession,
  getFeedbackContext,
  isFeedbackDismissedForSession,
  markFeedbackCompleted,
  recordFeedbackEvent,
} from "@/lib/feedback-session";
import { trackEvent } from "@/lib/mixpanel";

const feelingOptions = [
  "조건식 DB를 빨리 찾는 흐름은 괜찮았다",
  "TradingView로 넘기는 기능이 더 먼저 필요하다",
  "자동 알림까지 이어져야 계속 쓸 것 같다",
  "아직 잘 모르겠다",
];

const frictionOptions = [
  "차트가 아직 키움이나 TradingView보다 불편했다",
  "조건식 설명만으로 실제 쓰는 장면이 잘 안 떠올랐다",
  "알림이나 백테스트가 어디까지 되는지 바로 이해되지 않았다",
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
  "텔레그램/단톡방",
  "TradingView 공개지표",
  "직접 코딩/API",
];

const noBotReasonOptions = [
  "어떤 조건식이 좋은지 고르기 어렵다",
  "만드는 방법이나 연결 방식이 어렵다",
  "백테스트 결과를 믿기 어렵다",
  "아직 필요성을 크게 못 느낀다",
];

const oneThingOptions = [
  "AI가 조건식을 빨리 찾아주는 것",
  "차트에 바로 겹쳐보는 것",
  "백테스트로 성과를 빨리 확인하는 것",
  "장중 자동 알림까지 이어지는 것",
];

export function FeedbackWidget() {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [surveyOpen, setSurveyOpen] = useState(false);
  const [pulse, setPulse] = useState(false);
  const viewedRef = useRef(false);

  useEffect(() => {
    ensureFeedbackSession();
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (!viewedRef.current) {
      viewedRef.current = true;
      recordFeedbackEvent("Feedback Widget Viewed", { state: "collapsed" });
    }

    const timer = window.setTimeout(() => {
      if (!isFeedbackDismissedForSession()) {
        setPulse(true);
        recordFeedbackEvent("Feedback Widget Viewed", { trigger: "time_60s_nudge" });
      }
    }, 60000);

    function handleSignal(event: Event) {
      if (isFeedbackDismissedForSession()) return;
      const detail = (event as CustomEvent<{ signal?: string }>).detail;
      setOpen(false);
      setPulse(true);
      recordFeedbackEvent("Feedback Widget Viewed", { trigger: detail?.signal || "usage_signal" });
    }

    function handleOpen(event: Event) {
      const detail = (event as CustomEvent<{ mode?: "card" | "survey"; trigger?: string }>).detail;
      if (detail?.mode === "survey") {
        setSurveyOpen(true);
        setOpen(false);
      } else {
        setOpen(true);
        setPulse(false);
      }
      recordFeedbackEvent("Feedback Widget Opened", { trigger: detail?.trigger || "manual_open" });
    }

    window.addEventListener("siktalk:feedback-signal", handleSignal);
    window.addEventListener("siktalk:feedback-open", handleOpen);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("siktalk:feedback-signal", handleSignal);
      window.removeEventListener("siktalk:feedback-open", handleOpen);
    };
  }, [mounted]);

  if (!mounted) return null;

  function openSurvey() {
    recordFeedbackEvent("Feedback CTA Clicked", { source: open ? "expanded_card" : "collapsed_button" });
    setSurveyOpen(true);
    setOpen(false);
    setPulse(false);
  }

  function dismiss() {
    dismissFeedbackForSession();
    setOpen(false);
    setPulse(false);
    recordFeedbackEvent("Feedback Widget Dismissed", { source: "later_button" });
  }

  return (
    <>
      <div className="fixed bottom-24 right-4 z-40 md:right-6">
        {open ? (
          <div className="w-[calc(100vw-2rem)] rounded-lg border border-slate-200 bg-white p-4 shadow-2xl md:w-96">
            <p className="text-base font-black text-slate-950">앱을 써보신 느낌이 궁금합니다.</p>
            <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
              30초 의견을 남겨주시면 AI 앱 쿠폰과 TradingView 관찰용 지표를 보내드립니다.
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
            className={`min-h-11 rounded-lg border bg-white px-4 text-sm font-black text-slate-900 shadow-xl transition ${
              pulse ? "border-emerald-300 ring-4 ring-emerald-100" : "border-slate-200"
            }`}
            onClick={() => {
              setOpen(true);
              setPulse(false);
              recordFeedbackEvent("Feedback Widget Opened", { trigger: "collapsed_button" });
            }}
          >
            피드백 남기고 혜택 받기
          </button>
        )}
      </div>

      {surveyOpen ? (
        <FeedbackSurveyModal
          onClose={() => setSurveyOpen(false)}
          onCompleted={() => {
            markFeedbackCompleted();
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
            <h2 className="text-xl font-black text-slate-950">앱 체험 의견</h2>
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

          <SurveyField
            title="6. 식톡이 단 한 가지만 제대로 해야 한다면?"
            hint="반드시 먼저 갖춰졌으면 하는 기능 한 가지를 골라주세요."
          >
            <RadioList options={oneThingOptions} value={oneThing} onChange={setOneThing} />
          </SurveyField>

          <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-600">
            피드백 메일: <a href="mailto:issue.research777@gmail.com" className="font-black text-emerald-700">issue.research777@gmail.com</a>
          </div>

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

function SurveyField({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <div>
      <p className="mb-3 text-sm font-black text-slate-900">{title}</p>
      {hint ? <p className="mb-3 text-xs font-semibold text-slate-500">{hint}</p> : null}
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
