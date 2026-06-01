import Link from "next/link";

const reasons = [
  {
    title: "상따·종베를 하기 전",
    text: "진입 이유와 빠질 기준을 먼저 적습니다.",
  },
  {
    title: "HTS로 옮기기 전",
    text: "조건을 문장으로 정리해 빠진 부분을 봅니다.",
  },
  {
    title: "매매 후 복기할 때",
    text: "같은 기준으로 봤는지 다시 확인합니다.",
  },
];

const hints = [
  "국장 단타 기준 정리",
  "거래량 붙는 코인 초입 메모",
  "손절 기준 빠졌는지 확인",
];

export function LandingPage() {
  return (
    <div className="min-h-screen bg-[#f5f6f2] text-slate-950">
      <main className="mx-auto flex min-h-screen w-full max-w-md flex-col px-5 pb-32 pt-6 md:max-w-6xl md:px-8 md:pb-16 md:pt-8">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-3xl font-black tracking-tight">
            식톡
          </Link>
        </div>

        <section className="pt-24 md:grid md:grid-cols-[1.1fr_0.9fr] md:items-end md:gap-10 md:pt-20">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.2em] text-emerald-700">조건식으로 옮기기 전</p>
            <h1 className="mt-6 text-[3.4rem] font-black leading-[0.95] tracking-[-0.06em] text-slate-950 md:text-[5.4rem]">
              매매 아이디어를
              <br />
              기준으로 남깁니다
            </h1>
            <p className="mt-8 max-w-xl text-xl font-bold leading-10 text-slate-600 md:text-2xl">
              장중에 흔들리는 생각을 진입, 청산, 종목 조건으로 나눠 봅니다.
            </p>
            <div className="mt-10 flex flex-col gap-4 md:flex-row">
              <Link
                href="/app"
                className="flex min-h-18 items-center justify-center rounded-[1.75rem] bg-[#05081c] px-7 text-2xl font-black text-white shadow-[0_18px_50px_rgba(5,8,28,0.18)]"
              >
                아이디어 정리하기
              </Link>
              <Link
                href="/conditions"
                className="flex min-h-18 items-center justify-center rounded-[1.75rem] border border-slate-200 bg-white px-7 text-2xl font-black text-slate-950 shadow-sm"
              >
                조건식 둘러보기
              </Link>
            </div>
            <p className="mt-8 text-base font-bold leading-7 text-slate-500 md:text-lg">
              실제 투자 추천, 자동매매, 실거래 연동이 아닙니다.
            </p>
          </div>

          <div className="mt-10 rounded-[2rem] border border-white/70 bg-white/85 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur md:mt-0">
            <div className="space-y-4">
              {reasons.map((reason) => (
                <article key={reason.title} className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
                  <h2 className="text-2xl font-black tracking-tight">{reason.title}</h2>
                  <p className="mt-4 text-lg font-bold leading-8 text-slate-600">{reason.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-14 grid gap-4 md:mt-16 md:grid-cols-3">
          {hints.map((hint) => (
            <div key={hint} className="rounded-[1.5rem] border border-slate-200 bg-white px-5 py-4 text-base font-black text-slate-700 shadow-sm">
              {hint}
            </div>
          ))}
        </section>

        <section className="mt-16 space-y-5 md:mt-20">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-black tracking-tight md:text-3xl">처음 보는 사람을 위한 흐름</h2>
            <Link href="/library" className="text-sm font-black text-emerald-700">
              예시 보기
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              ["1", "아이디어를 적습니다", "상따인지, 종베인지, 코인 급등 초입인지 한 문장으로 적습니다."],
              ["2", "빠진 기준을 찾습니다", "손절, 시간대, 거래량 조건처럼 누락된 기준을 카드에서 바로 봅니다."],
              ["3", "필요하면 도구함으로 갑니다", "문장만으로 부족하면 80개 조건식 목록에서 바로 찾아갑니다."],
            ].map(([step, title, body]) => (
              <article key={step} className="rounded-[1.8rem] bg-[#05081c] p-6 text-white shadow-[0_20px_40px_rgba(5,8,28,0.12)]">
                <p className="text-sm font-black text-emerald-300">STEP {step}</p>
                <h3 className="mt-3 text-2xl font-black tracking-tight">{title}</h3>
                <p className="mt-4 text-base font-semibold leading-7 text-slate-300">{body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-16 grid gap-4 md:grid-cols-2">
          <article className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-emerald-700">About</p>
            <h2 className="mt-4 text-3xl font-black tracking-tight">왜 쓰는가</h2>
            <p className="mt-4 text-lg font-bold leading-8 text-slate-600">
              매매 기준이 머릿속에서 섞이면, 진입은 쉬워지고 복기는 어려워집니다. 식톡은 그 기준을 문장으로 꺼내는 용도입니다.
            </p>
          </article>
          <article className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-emerald-700">FAQ</p>
            <div className="mt-4 space-y-4 text-base font-bold leading-7 text-slate-600">
              <p>트레이딩뷰 코드가 바로 나오나요? 아직 아닙니다. 요청 수요를 기록하는 단계입니다.</p>
              <p>비용이 있나요? 현재 데모 앱은 무료로 제공합니다.</p>
              <p>실거래용인가요? 아닙니다. 전략 정리와 가상 검증용입니다.</p>
            </div>
          </article>
        </section>
      </main>

      <div className="fixed inset-x-0 bottom-0 border-t border-slate-200 bg-white/95 px-5 py-4 backdrop-blur md:hidden">
        <div className="mx-auto flex max-w-md gap-3">
          <Link
            href="/conditions"
            className="flex-1 rounded-[1.2rem] border border-slate-200 px-4 py-4 text-center text-lg font-black text-slate-900"
          >
            도구함
          </Link>
          <Link
            href="/app"
            className="flex-[1.35] rounded-[1.2rem] bg-[#05081c] px-4 py-4 text-center text-lg font-black text-white"
          >
            정리하기
          </Link>
        </div>
      </div>
    </div>
  );
}
