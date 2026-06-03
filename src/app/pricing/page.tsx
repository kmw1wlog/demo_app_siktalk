import Link from "next/link";
import { AppShell } from "@/components/app/AppShell";

export default function PricingPage() {
  return (
    <AppShell>
      <section className="mx-auto max-w-4xl rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
        <p className="text-sm font-black text-emerald-700">베타 신청</p>
        <h1 className="mt-3 text-3xl font-black tracking-[-0.04em] text-slate-950 md:text-4xl">
          정식 유료화 전, 데모 사용자를 먼저 모읍니다
        </h1>
        <p className="mt-4 max-w-2xl text-base font-semibold leading-7 text-slate-600">
          아직 결제나 유료 플랜은 열지 않았습니다. 지금은 데모 사용 흐름과 조건식 탐색 경험을
          확인하는 단계입니다.
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-base font-black text-slate-950">지금 가능한 것</p>
            <ul className="mt-4 space-y-2 text-sm font-semibold leading-6 text-slate-600">
              <li>조건식 DB 탐색</li>
              <li>전략 카드 정리</li>
              <li>차트 적용 데모</li>
              <li>TradingView 복사용 초안 확인</li>
            </ul>
          </div>
          <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5">
            <p className="text-base font-black text-slate-950">먼저 써보려면</p>
            <p className="mt-3 text-sm font-semibold leading-6 text-slate-700">
              사전 설문을 남기면 데모 링크와 전자책 다운로드 흐름을 바로 확인할 수 있습니다.
            </p>
            <Link
              href="/survey"
              className="mt-5 inline-flex min-h-11 items-center justify-center rounded-xl bg-emerald-600 px-4 text-sm font-black text-white"
            >
              데모 신청 열기
            </Link>
          </div>
        </div>
      </section>
    </AppShell>
  );
}
