import Link from "next/link";
import { AppShell } from "@/components/app/AppShell";

export default function CommunityPage() {
  return (
    <AppShell>
      <section className="mx-auto max-w-4xl rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
        <p className="text-sm font-black text-slate-500">도움말</p>
        <h1 className="mt-3 text-3xl font-black tracking-[-0.04em] text-slate-950 md:text-4xl">
          식톡 데모 사용 흐름
        </h1>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-base font-black text-slate-950">1. 설문 시작</p>
            <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">
              `/survey`에서 이메일과 사용 배경을 남기면 데모 흐름이 이어집니다.
            </p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-base font-black text-slate-950">2. 전략 선택</p>
            <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">
              AI 추천 카드나 조건식 DB에서 전략 카드를 선택한 뒤 차트에 적용합니다.
            </p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-base font-black text-slate-950">3. 복사와 피드백</p>
            <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">
              TradingView 복사와 인앱 피드백까지 완료하면 주요 행동 데이터가 저장됩니다.
            </p>
          </div>
        </div>

        <div className="mt-8">
          <Link
            href="/app"
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-slate-950 px-4 text-sm font-black text-white"
          >
            데모 앱으로 이동
          </Link>
        </div>
      </section>
    </AppShell>
  );
}
