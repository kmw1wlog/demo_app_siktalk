"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
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

const ageOptions = ["10대", "20대", "30대", "40대", "50대 이상"];
const genderOptions = ["남성", "여성", "응답 안 함"];

const previewCards = [
  {
    id: "ai",
    title: "AI가 전략 3개를 바로 추천",
    description: "돌파 전략을 말로 입력하면 바로 카드 후보가 뜹니다.",
    src: "/demo-gifs/ai-recommendation.gif",
  },
  {
    id: "chart",
    title: "차트에 5-20선과 거래량이 바로 렌더",
    description: "실제 차트 위에서 대표 전략 흐름을 빠르게 확인합니다.",
    src: "/demo-gifs/chart-render.gif",
  },
  {
    id: "alert",
    title: "24시간 알림 초안이 대화로 정리",
    description: "알림 조건을 직접 쓰지 않고 초안부터 빠르게 만듭니다.",
    src: "/demo-gifs/alert-draft.gif",
  },
];

const privacyDetailSections = [
  {
    title: "수집 목적",
    items: [
      "앱 링크 발송, 무료 PDF/쿠폰 제공, 설문 응답 분석, 서비스 개선",
    ],
  },
  {
    title: "수집 항목",
    items: [
      "이메일 주소",
      "설문 응답",
      "앱 데모 사용 기록",
    ],
  },
  {
    title: "보유 기간",
    items: ["수집일로부터 1년 또는 삭제 요청 시까지"],
  },
  {
    title: "거부 권리",
    items: ["동의 거부 가능하나 앱 링크 발송 및 혜택 제공이 제한될 수 있습니다."],
  },
];

const marketingDetailSections = [
  {
    title: "수신 목적",
    items: [
      "식톡 베타 데모 및 정식 출시 안내",
      "앱 쿠폰, 조건식 실험권, 무료 지표 제공 안내",
      "신규 기능, 업데이트, 이벤트 안내",
    ],
  },
  {
    title: "수집·이용 항목",
    items: ["이메일 주소", "신청 및 설문 응답 내용", "앱 데모 사용 기록"],
  },
  {
    title: "보유·이용 기간",
    items: ["동의일로부터 1년 또는 수신 거부/삭제 요청 시까지"],
  },
  {
    title: "동의 거부권",
    items: ["선택 사항이며 동의하지 않아도 무료 PDF 신청 및 기본 데모 이용은 가능합니다."],
  },
];

type Step = 1 | 2 | 3 | 4 | 5 | 6;

type ConsentSheet =
  | null
  | {
      type: "privacy" | "marketing";
    };

export function PreSurveyPage() {
  const searchParams = useSearchParams();
  const source = searchParams.get("source") || "survey";
  const campaign = searchParams.get("campaign") || "feedback_reward";

  const [step, setStep] = useState<Step>(1);
  const [email, setEmail] = useState("");
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [activityFrequency, setActivityFrequency] = useState("");
  const [tools, setTools] = useState<string[]>([]);
  const [ageRange, setAgeRange] = useState("");
  const [gender, setGender] = useState("");
  const [privacyConsent, setPrivacyConsent] = useState(false);
  const [sheet, setSheet] = useState<ConsentSheet>(null);
  const [previewIndex, setPreviewIndex] = useState(0);
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

  const activePreview = previewCards[previewIndex] ?? previewCards[0];

  function goNext() {
    setStep((current) => Math.min(current + 1, 6) as Step);
  }

  function goBack() {
    setStep((current) => Math.max(current - 1, 1) as Step);
  }

  function toggleTool(value: string) {
    setTools((current) =>
      current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value],
    );
  }

  async function submit() {
    setSubmitting(true);
    setError("");
    try {
      const response = await fetch("/api/feedback/pre", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          marketing_consent: marketingConsent,
          activity_frequency: activityFrequency,
          tools,
          age_range: ageRange,
          gender,
          privacy_consent: privacyConsent,
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
        age_range: ageRange,
        gender,
        marketing_consent: marketingConsent,
        pre_sid: data.pre_sid,
        privacy_consent: privacyConsent,
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

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-5 text-slate-950 md:px-6">
      <div className="mx-auto max-w-2xl space-y-4">
        <CompactBenefitCard
          activePreview={activePreview}
          previewIndex={previewIndex}
          setPreviewIndex={setPreviewIndex}
        />

        <section className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm md:p-6">
          <div className="flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={goBack}
              disabled={step === 1 || Boolean(result)}
              className="text-sm font-black text-slate-400 transition enabled:text-slate-700"
            >
              이전
            </button>
            <div className="text-sm font-black text-slate-500">{result ? "완료" : `${step} / 6`}</div>
          </div>

          <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all"
              style={{ width: result ? "100%" : `${(step / 6) * 100}%` }}
            />
          </div>

          {!result ? (
            <div className="mt-6">
              {step === 1 ? (
                <StepCard
                  title="이메일 남기고 식톡 데모와 혜택 먼저 받아보세요"
                  description="30초 설문 후 앱 링크, TradingView 관찰용 지표, 영웅문 PDF를 보내드립니다."
                >
                  <div className="space-y-4">
                    <Input
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="앱 링크와 혜택을 받을 이메일을 입력해주세요"
                    />

                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <label className="flex items-start gap-3 text-sm font-semibold text-slate-700">
                        <input
                          type="checkbox"
                          checked={marketingConsent}
                          onChange={(event) => setMarketingConsent(event.target.checked)}
                          className="mt-1"
                        />
                        <span>[선택] TradingView 관찰용 지표와 앱 쿠폰 안내를 이메일로 받겠습니다</span>
                      </label>
                      <p className="mt-2 text-xs font-semibold leading-5 text-slate-500">
                        트뷰 지표·앱 쿠폰은 수신 동의한 분께만 보내드립니다.
                      </p>
                      <button
                        type="button"
                        onClick={() => setSheet({ type: "marketing" })}
                        className="mt-3 text-xs font-black text-emerald-700"
                      >
                        자세히 보기
                      </button>
                    </div>

                    <Button
                      className="w-full"
                      disabled={!email.includes("@")}
                      onClick={goNext}
                    >
                      다음
                    </Button>
                  </div>
                </StepCard>
              ) : null}

              {step === 2 ? (
                <StepCard title="최근 한 달 기준, 차트나 단타 관련 화면을 얼마나 자주 봤나요?">
                  <RadioList
                    options={activityOptions}
                    value={activityFrequency}
                    onChange={(value) => {
                      setActivityFrequency(value);
                      window.setTimeout(goNext, 180);
                    }}
                  />
                </StepCard>
              ) : null}

              {step === 3 ? (
                <StepCard title="현재 주로 쓰는 도구는 무엇인가요?" description="복수 선택 가능">
                  <div className="space-y-4">
                    <CheckboxList values={tools} options={toolOptions} onToggle={toggleTool} />
                    <Button className="w-full" onClick={goNext} disabled={!tools.length}>
                      다음
                    </Button>
                  </div>
                </StepCard>
              ) : null}

              {step === 4 ? (
                <StepCard
                  title="연령대를 선택해주세요"
                  description="연령대별로 용어 난이도와 화면 구성을 다르게 보기 위해 참고합니다."
                >
                  <RadioList
                    options={ageOptions}
                    value={ageRange}
                    onChange={(value) => {
                      setAgeRange(value);
                      window.setTimeout(goNext, 180);
                    }}
                  />
                </StepCard>
              ) : null}

              {step === 5 ? (
                <StepCard
                  title="성별을 선택해주세요"
                  description="응답은 익명 통계로만 활용되며 서비스 개선 참고용입니다."
                >
                  <RadioList
                    options={genderOptions}
                    value={gender}
                    onChange={(value) => {
                      setGender(value);
                      window.setTimeout(goNext, 180);
                    }}
                  />
                </StepCard>
              ) : null}

              {step === 6 ? (
                <StepCard
                  title="마지막으로 개인정보 수집·이용에 동의해주세요"
                  description="앱 링크 발송, 설문 응답 저장, 쿠폰 제공을 위해 필요합니다."
                >
                  <div className="space-y-4">
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <label className="flex items-start gap-3 text-sm font-semibold text-slate-700">
                        <input
                          type="checkbox"
                          checked={privacyConsent}
                          onChange={(event) => setPrivacyConsent(event.target.checked)}
                          className="mt-1"
                        />
                        <span>[필수] 개인정보 수집·이용에 동의합니다</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setSheet({ type: "privacy" })}
                        className="mt-3 text-xs font-black text-emerald-700"
                      >
                        자세히 보기
                      </button>
                    </div>

                    {error ? <p className="rounded-lg bg-rose-50 p-3 text-sm font-bold text-rose-700">{error}</p> : null}

                    <Button
                      className="w-full"
                      disabled={submitting || !privacyConsent}
                      onClick={() => void submit()}
                    >
                      앱 링크 받고 시작하기
                    </Button>
                  </div>
                </StepCard>
              ) : null}
            </div>
          ) : (
            <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
              <p className="text-sm font-black text-emerald-900">저장 완료</p>
              <p className="mt-2 text-sm font-semibold leading-6 text-emerald-800">
                아래 버튼으로 데모 앱을 열고 둘러본 뒤, 마지막에 짧은 사용 의견만 남기면 혜택 발송 대상에 함께 포함됩니다.
              </p>
              <Link
                href={demoHref}
                className="mt-4 inline-flex min-h-11 items-center justify-center rounded-lg bg-emerald-600 px-4 text-sm font-black text-white"
              >
                식톡 데모 앱 열기
              </Link>
            </div>
          )}

          <p className="mt-6 text-[11px] font-semibold leading-5 text-slate-400">
            ※ 본 자료와 식톡 데모는 투자 추천, 종목 추천, 매매 리딩, 수익 보장을 목적으로 하지 않습니다.
            화면 세팅과 조건식 실험을 돕기 위한 교육·도구성 자료입니다.
          </p>
        </section>
      </div>

      {sheet ? (
        <ConsentBottomSheet
          onClose={() => setSheet(null)}
          title={sheet.type === "marketing" ? "마케팅 정보 수신 안내" : "개인정보 수집·이용 안내"}
          sections={sheet.type === "marketing" ? marketingDetailSections : privacyDetailSections}
          confirmLabel={sheet.type === "marketing" ? "동의하고 닫기" : "확인"}
          onConfirm={() => {
            if (sheet.type === "marketing") {
              setMarketingConsent(true);
            }
            setSheet(null);
          }}
        />
      ) : null}
    </main>
  );
}

function CompactBenefitCard({
  activePreview,
  previewIndex,
  setPreviewIndex,
}: {
  activePreview: (typeof previewCards)[number];
  previewIndex: number;
  setPreviewIndex: (index: number) => void;
}) {
  return (
    <section className="overflow-hidden rounded-[1.25rem] border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-black text-emerald-700">혜택 미리보기</p>
          <p className="mt-1 text-sm font-semibold text-slate-500">앱 링크, 무료 PDF, 지표 안내를 받기 전 화면만 빠르게 확인하세요.</p>
        </div>
        <a
          href="/api/feedback/ebook"
          download
          className="hidden min-h-10 items-center justify-center rounded-lg border border-emerald-600 px-3 text-xs font-black text-emerald-700 sm:inline-flex"
        >
          PDF 받기
        </a>
      </div>

      <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
        <Image
          src={activePreview.src}
          alt={activePreview.title}
          width={720}
          height={420}
          unoptimized
          className="block aspect-[12/7] w-full object-cover"
        />
      </div>

      <div className="mt-3">
        <p className="text-sm font-black text-slate-800">{activePreview.title}</p>
        <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">{activePreview.description}</p>
      </div>

      <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
        {previewCards.map((preview, index) => (
          <button
            key={preview.id}
            type="button"
            onClick={() => setPreviewIndex(index)}
            className={`shrink-0 rounded-full px-3 py-2 text-xs font-black transition ${
              previewIndex === index
                ? "bg-emerald-600 text-white"
                : "border border-slate-200 bg-white text-slate-600"
            }`}
          >
            {preview.id.toUpperCase()}
          </button>
        ))}
      </div>
    </section>
  );
}

function StepCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <h1 className="text-2xl font-black leading-tight text-slate-950 md:text-3xl">{title}</h1>
      {description ? <p className="mt-3 text-sm font-semibold leading-6 text-slate-500">{description}</p> : null}
      <div className="mt-6">{children}</div>
    </div>
  );
}

function RadioList({
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
        <label key={option} className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 p-4 text-sm font-semibold text-slate-700">
          <input type="radio" checked={value === option} onChange={() => onChange(option)} />
          <span>{option}</span>
        </label>
      ))}
    </div>
  );
}

function CheckboxList({
  values,
  options,
  onToggle,
}: {
  values: string[];
  options: string[];
  onToggle: (value: string) => void;
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {options.map((option) => (
        <label key={option} className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 p-4 text-sm font-semibold text-slate-700">
          <input type="checkbox" checked={values.includes(option)} onChange={() => onToggle(option)} />
          <span>{option}</span>
        </label>
      ))}
    </div>
  );
}

function ConsentBottomSheet({
  title,
  sections,
  confirmLabel,
  onClose,
  onConfirm,
}: {
  title: string;
  sections: { title: string; items: string[] }[];
  confirmLabel: string;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 bg-slate-950/35">
      <button type="button" aria-label="동의문 닫기" className="absolute inset-0" onClick={onClose} />
      <div className="absolute inset-x-0 bottom-0 mx-auto max-w-2xl rounded-t-[1.5rem] bg-white px-5 pb-6 pt-5 shadow-2xl">
        <div className="mx-auto h-1.5 w-14 rounded-full bg-slate-200" />
        <h2 className="mt-4 text-lg font-black text-slate-950">{title}</h2>
        <div className="mt-4 space-y-4 text-sm font-semibold leading-6 text-slate-600">
          {sections.map((section) => (
            <div key={section.title}>
              <p className="font-black text-slate-900">{section.title}</p>
              <ul className="mt-1 list-disc space-y-1 pl-5">
                {section.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-5 flex gap-2">
          <Button variant="secondary" className="flex-1" onClick={onClose}>
            닫기
          </Button>
          <Button className="flex-1" onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
