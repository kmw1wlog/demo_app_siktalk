"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { SHOWCASE_ALERT, SHOWCASE_STRATEGY } from "@/lib/showcase-data";

const quickPrompts = SHOWCASE_ALERT.quickChips;
const footerPrompts = SHOWCASE_ALERT.footerChips;

export function AlertBotClient({ initialMessage = "" }: { initialMessage?: string }) {
  const [message, setMessage] = useState(initialMessage || "5·20선 골든크로스 + 거래량 회복\n뜨면 바로 알려줘\n텔레그램으로 받고 싶어");
  const [draft] = useState(SHOWCASE_ALERT);
  const summaryList = useMemo(() => SHOWCASE_ALERT.conversationAssistant.slice(1), []);

  return (
    <section className="mx-auto max-w-[1380px] space-y-6">
      <div>
        <h1 className="text-[2.9rem] font-black tracking-[-0.05em] text-slate-950">24시간 자동 알림봇 만들기</h1>
        <p className="mt-3 text-base font-semibold text-slate-500">전략이 뜨는 순간을 놓치지 않도록 알림 조건을 정리합니다.</p>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_0.72fr_0.8fr]">
        <div className="rounded-[1.8rem] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <p className="text-2xl font-black tracking-[-0.04em] text-slate-950">AI와 알림 설정 대화</p>
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-sm font-black text-emerald-700">1분 안에 설정</span>
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            {quickPrompts.map((prompt) => (
              <button
                key={prompt}
                type="button"
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700"
                data-demo-notice-title="알림 조건 데모"
                data-demo-notice-message="현재는 알림 조건을 어떻게 정리할지 대화 흐름을 먼저 보여드리는 데모입니다."
              >
                {prompt}
              </button>
            ))}
          </div>

          <div className="mt-6 space-y-5">
            <div className="flex justify-end">
              <div className="max-w-lg rounded-[1.5rem] bg-emerald-50 px-5 py-4 text-base font-semibold leading-7 text-slate-800 shadow-sm">
                {message.split("\n").map((line) => (
                  <div key={line}>{line}</div>
                ))}
                <div className="mt-3 text-right text-sm font-black text-slate-400">오전 10:48</div>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-xl font-black text-white">식</span>
              <div className="flex-1 rounded-[1.6rem] border border-slate-200 bg-white px-5 py-5 shadow-sm">
                <p className="text-base font-semibold leading-7 text-slate-700">{SHOWCASE_ALERT.conversationAssistant[0]}</p>
                <ul className="mt-4 space-y-3 text-base font-semibold text-slate-700">
                  {summaryList.map((line) => (
                    <li key={line} className="flex gap-3">
                      <span className="mt-1 text-emerald-500">●</span>
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-5 text-base font-semibold text-slate-500">아래 초안을 확인하고, 필요하면 수정해 주세요!</p>
                <div className="mt-4 text-right text-sm font-black text-slate-400">오전 10:48</div>
              </div>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            {footerPrompts.map((prompt) => (
              <button
                key={prompt}
                type="button"
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700"
                data-demo-notice-title="알림 조건 데모"
                data-demo-notice-message="현재는 자주 쓰는 알림 수정 흐름을 먼저 보여드리는 데모입니다."
              >
                {prompt}
              </button>
            ))}
          </div>

          <div className="mt-5 rounded-[1.6rem] border border-slate-200 bg-white p-3">
            <div className="flex items-end gap-3">
              <textarea
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                className="min-h-28 flex-1 resize-none rounded-[1.2rem] border-0 bg-transparent px-4 py-4 text-base font-semibold text-slate-700 outline-none"
                placeholder="원하는 알림 조건을 말해보세요..."
              />
              <button
                type="button"
                className="mb-2 flex size-12 items-center justify-center rounded-full bg-emerald-400 text-xl font-black text-white"
                data-demo-notice-title="알림봇 답변 데모"
                data-demo-notice-message="현재는 알림봇이 어떤 초안을 만들어줄지 데모 흐름만 먼저 보여드리고 있습니다."
              >
                ↗
              </button>
            </div>
            <div className="pr-2 text-right text-sm font-black text-slate-300">0/300</div>
          </div>

          <p className="mt-4 text-sm font-semibold text-slate-400">ⓘ 전략 추천이 아니라, 사용자가 선택한 전략을 놓치지 않도록 돕는 알림 설정입니다.</p>
        </div>

        <div className="space-y-5">
          <div className="rounded-[1.8rem] border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-[1.8rem] font-black tracking-[-0.04em] text-slate-950">현재 전략 요약</p>
            <div className="mt-5 rounded-[1.6rem] border border-emerald-200 bg-emerald-50/60 p-5">
              <p className="text-sm font-black text-emerald-700">ACTIVE 전략</p>
              <h2 className="mt-3 break-keep text-[2rem] font-black leading-tight tracking-[-0.04em] text-slate-950">{SHOWCASE_STRATEGY.title}</h2>
              <Link href="/chart" className="mt-4 inline-flex text-base font-black text-emerald-700">
                차트에서 보기 ↗
              </Link>
            </div>
            <div className="mt-5 space-y-4 text-base font-semibold leading-7 text-slate-600">
              <div>
                <p className="text-base font-black text-slate-400">전략 설명</p>
                <p className="mt-1">{SHOWCASE_STRATEGY.description}</p>
              </div>
              <div>
                <p className="text-base font-black text-slate-400">핵심 조건</p>
                <ul className="mt-2 space-y-1">
                  <li>· 5·20선 골든크로스</li>
                  <li>· 거래량 &gt; 최근 20일 평균 거래량</li>
                  <li>· 15분봉 기준</li>
                </ul>
              </div>
              <div>
                <p className="text-base font-black text-slate-400">주요 성과 (백테스트)</p>
                <ul className="mt-2 space-y-1">
                  {SHOWCASE_ALERT.strategyScore.map((item) => (
                    <li key={item}>· {item}</li>
                  ))}
                </ul>
              </div>
            </div>
            <Link href="/backtests" className="mt-5 flex h-14 items-center justify-center rounded-2xl border border-slate-200 bg-white text-base font-black text-slate-700">
              전략 성과 다시 보기
            </Link>
          </div>

          <div className="rounded-[1.8rem] border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-[1.8rem] font-black tracking-[-0.04em] text-slate-950">현재 감시 대상</p>
            <div className="mt-5 grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-black text-slate-400">전체 종목</p>
                <p className="mt-2 text-[2.2rem] font-black tracking-[-0.04em] text-slate-950">{SHOWCASE_ALERT.targetCount}</p>
              </div>
              <div>
                <p className="text-sm font-black text-slate-400">실시간 감시 중</p>
                <p className="mt-2 text-[2.2rem] font-black tracking-[-0.04em] text-slate-950">{SHOWCASE_ALERT.liveWatchingCount}</p>
              </div>
            </div>
            <p className="mt-5 text-base font-semibold text-slate-500">조건 충족 시 즉시 알려드릴게요.</p>
          </div>
        </div>

        <div className="rounded-[1.8rem] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-[1.8rem] font-black tracking-[-0.04em] text-slate-950">알림봇 초안</p>
            <button
              type="button"
              className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-600"
              data-demo-notice-title="알림 미리보기 데모"
              data-demo-notice-message="실제 발송 미리보기보다, 현재는 알림 초안 화면을 먼저 보여드리는 데모입니다."
            >
              ○ 미리보기
            </button>
          </div>

          <div className="mt-5 space-y-4">
            <DraftField label="알림봇 이름" value={draft.title} />
            <DraftField label="감시 시장" value={`${draft.market}   ${draft.marketDetail}`} />
            <DraftField label="감시 봉" value={draft.timeframe} />
            <DraftField label="감시 시간" value={SHOWCASE_STRATEGY.monitoringHours} />
            <DraftField label="알림 조건" value={draft.trigger} />
            <DraftField label="알림 빈도" value={draft.cadence} />
            <DraftField label="전송 방식" value={draft.delivery} />
            <DraftField label="상태" value={draft.status} />
          </div>

          <button
            type="button"
            className="mt-5 flex h-16 w-full items-center justify-center rounded-2xl bg-emerald-600 text-xl font-black text-white shadow-lg shadow-emerald-100"
            data-demo-notice-title="알림 저장 데모"
            data-demo-notice-message="현재는 알림 저장 전 화면과 흐름을 먼저 보여드리는 데모입니다. 실제 저장/자동감시가 꼭 필요하면 우측 하단 설문에 남겨주세요."
          >
            알림 초안 저장
          </button>
          <Link href="/chart" className="mt-3 flex h-14 items-center justify-center rounded-2xl border border-slate-200 bg-white text-base font-black text-slate-700">
            차트 적용으로 돌아가기
          </Link>
          <button
            type="button"
            className="mt-3 flex h-14 w-full items-center justify-center rounded-2xl border border-slate-200 bg-white text-base font-black text-slate-700"
            data-demo-notice-title="고급 설정 데모"
            data-demo-notice-message="세부 알림 로직과 빈도 조정은 순차적으로 붙일 예정입니다. 꼭 필요하면 우측 하단 설문에 남겨주세요."
          >
            ⚙ 고급 설정 열기
          </button>
        </div>
      </div>
    </section>
  );
}

function DraftField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.4rem] border border-slate-200 bg-white px-5 py-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-black text-slate-400">{label}</p>
          <p className="mt-3 break-keep text-xl font-black leading-tight tracking-[-0.04em] text-slate-950">{value}</p>
        </div>
        <button
          type="button"
          className="text-lg text-slate-400"
          data-demo-notice-title="알림 수정 데모"
          data-demo-notice-message="각 항목 수정 기능은 준비 중이며, 현재는 구조만 먼저 보여드리고 있습니다."
        >
          ✎
        </button>
      </div>
    </div>
  );
}
