"use client";

import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { getAnalyticsContext, identifyLead, trackEvent } from "@/lib/mixpanel";

const activityOptions = [
  "거의 매일 봤다",
  "주 2~3회 봤다",
  "가끔 봤다",
  "예전엔 봤는데 요즘은 거의 안 본다",
  "아직 배우는 중이다",
];

const toolOptions = [
  "키움 영웅문 PC",
  "영웅문 모바일",
  "TradingView",
  "네이버증권/MTS",
  "텔레그램/단톡방",
  "유튜브/블로그 자료",
  "직접 만든 조건식/봇",
  "아직 정해진 도구 없음",
];

const botOptions = [
  "예, 실제로 쓰고 있다",
  "예, 만들어봤지만 지금은 안 쓴다",
  "아니오, 만들어본 적 없다",
  "아직 잘 모른다",
];

export function PreSurveyPage() {
  const searchParams = useSearchParams();
  const source = searchParams.get("source") || "survey";
  const campaign = searchParams.get("campaign") || "feedback_reward";
  const [email, setEmail] = useState("");
  const [activityFrequency, setActivityFrequency] = useState("");
  const [tools, setTools] = useState<string[]>([]);
  const [hasBot, setHasBot] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{
    rid: string;
    pre_sid: string;
    session_id: string;
  } | null>(null);

  useEffect(() => {
    void trackEvent("Landing Viewed", {
      campaign,
      source,
      surface: "pre_survey",
    });
  }, [campaign, source]);

  const demoHref = useMemo(() => {
    if (!result) return "/app";
    const params = new URLSearchParams({
      rid: result.rid,
      pre_sid: result.pre_sid,
      session_id: result.session_id,
      source,
      campaign,
    });
    return `/app?${params.toString()}`;
  }, [campaign, result, source]);

  async function submit() {
    setSubmitting(true);
    setError("");
    try {
      const response = await fetch("/api/feedback/pre", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          activity_frequency: activityFrequency,
          tools,
          has_bot: hasBot,
          session_id: getAnalyticsContext().session_id,
          source,
          campaign,
        }),
      });
      const data = (await response.json()) as {
        ok?: boolean;
        error?: string;
        rid?: string;
        pre_sid?: string;
        session_id?: string;
      };
      if (!response.ok || !data.ok || !data.rid || !data.pre_sid || !data.session_id) {
        throw new Error(data.error || "저장에 실패했습니다.");
      }
      window.localStorage.setItem("siktalk_feedback_rid", data.rid);
      window.localStorage.setItem("siktalk_feedback_pre_sid", data.pre_sid);
      window.localStorage.setItem("siktalk_feedback_session_id", data.session_id);
      window.localStorage.setItem("siktalk_feedback_source", source);
      window.localStorage.setItem("siktalk_feedback_campaign", campaign);
      identifyLead(data.rid);
      await trackEvent("Pre Survey Submitted", {
        activity_frequency: activityFrequency,
        has_bot: hasBot,
        pre_sid: data.pre_sid,
        session_id: data.session_id,
        source,
        tool_count: tools.length,
      });
      setResult({ rid: data.rid, pre_sid: data.pre_sid, session_id: data.session_id });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "설문 저장 중 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  }

  function toggleTool(value: string) {
    setTools((current) =>
      current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value],
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 text-slate-950 md:px-8">
      <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <section className="space-y-5">
          <div>
            <p className="text-sm font-black text-emerald-700">식톡 데모 리서치</p>
            <h1 className="mt-3 text-4xl font-black leading-tight md:text-5xl">이메일 남기고 식톡 데모와 혜택을 먼저 받아보세요</h1>
            <p className="mt-4 text-base font-semibold leading-7 text-slate-600">
              이메일을 남기면 AI 앱 쿠폰, TradingView 관찰용 지표, 영웅문 세팅 PDF를 함께 보내드립니다.
            </p>
            <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
              앱 체험을 마친 뒤 마지막에 짧은 사용 의견까지 남기면 혜택 발송 대상에 함께 포함됩니다.
            </p>
          </div>

          <a
            href="/api/feedback/ebook"
            download
            className="inline-flex min-h-11 items-center justify-center rounded-lg border border-emerald-600 bg-white px-4 text-sm font-black text-emerald-700 shadow-sm"
            onClick={() => {
              void trackEvent("PDF Download Clicked", {
                campaign,
                source,
              });
            }}
          >
            무료 영웅문 세팅 PDF 바로 받기
          </a>

          <div className="grid gap-3">
            <MediaSlot title="앱 온보딩 이미지" />
            <MediaSlot title="인앱 이미지" />
            <MediaSlot title="앱 GIF" />
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="space-y-6">
            <Field title="1. 이메일">
              <Input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="AI 앱 쿠폰과 TradingView 지표를 받을 이메일"
              />
            </Field>

            <Field title="2. 최근 한 달 기준, 차트나 단타 관련 화면을 얼마나 자주 봤나요?">
              <RadioGroup value={activityFrequency} options={activityOptions} onChange={setActivityFrequency} />
            </Field>

            <Field title="3. 현재 주로 쓰는 도구는 무엇인가요?">
              <CheckboxGroup values={tools} options={toolOptions} onToggle={toggleTool} />
            </Field>

            <Field title="4. 지금 자동으로 돌아가는 조건식/봇/알림을 1개 이상 갖고 있나요?">
              <RadioGroup value={hasBot} options={botOptions} onChange={setHasBot} />
            </Field>

            {error ? <p className="rounded-lg bg-rose-50 p-3 text-sm font-bold text-rose-700">{error}</p> : null}

            {result ? (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                <p className="text-sm font-black text-emerald-900">저장 완료</p>
                <p className="mt-1 text-sm font-semibold text-emerald-800">
                  아래 버튼으로 데모 앱을 열고 둘러본 뒤, 마지막에 짧은 사용 의견만 남기면 혜택 발송 대상에 함께 포함됩니다.
                </p>
                <Link
                  href={demoHref}
                  className="mt-4 inline-flex min-h-11 items-center justify-center rounded-lg bg-emerald-600 px-4 text-sm font-black text-white"
                >
                  식톡 데모 앱 열기
                </Link>
              </div>
            ) : (
              <Button
                className="w-full"
                disabled={submitting}
                onClick={() => void submit()}
              >
                앱 링크 받고 시작하기
              </Button>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function Field({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <p className="mb-3 text-sm font-black text-slate-900">{title}</p>
      {children}
    </div>
  );
}

function RadioGroup({
  value,
  options,
  onChange,
}: {
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <div className="grid gap-2">
      {options.map((option) => (
        <label key={option} className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 p-3 text-sm font-semibold">
          <input type="radio" checked={value === option} onChange={() => onChange(option)} />
          <span>{option}</span>
        </label>
      ))}
    </div>
  );
}

function CheckboxGroup({
  values,
  options,
  onToggle,
}: {
  values: string[];
  options: string[];
  onToggle: (value: string) => void;
}) {
  return (
    <div className="grid gap-2 md:grid-cols-2">
      {options.map((option) => (
        <label key={option} className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 p-3 text-sm font-semibold">
          <input type="checkbox" checked={values.includes(option)} onChange={() => onToggle(option)} />
          <span>{option}</span>
        </label>
      ))}
    </div>
  );
}

function MediaSlot({ title }: { title: string }) {
  return (
    <div className="flex h-28 items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white text-sm font-black text-slate-400">
      {title}
    </div>
  );
}
