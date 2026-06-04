"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

export function Sidebar({ mode = "default" }: { mode?: "default" | "canvas" | "chart" }) {
  const router = useRouter();
  const pathname = usePathname();
  const useCanvasNav = mode === "canvas" || pathname.startsWith("/canvas");
  const useChartNav = mode === "chart";
  const navItems = useCanvasNav
    ? [
        { href: "/app", label: "말로 만들기", icon: "◔" },
        { href: "/canvas", label: "전략 합성 캔버스", icon: "▣" },
        { href: "/chart", label: "차트 적용", icon: "↗" },
        { href: "/pricing", label: "베타 신청", icon: "⌂" },
      ]
    : [
        { href: "/app", label: "말로 만들기", icon: "◔" },
        { href: "/conditions", label: "조건식 도구함", icon: "▣" },
        { href: "/chart", label: "차트 적용", icon: "↗" },
        { href: "/pricing", label: "베타 신청", icon: "⌂" },
      ];

  return (
    <aside className="hidden w-72 shrink-0 border-r border-slate-200 bg-white px-5 py-7 lg:flex lg:min-h-dvh lg:flex-col">
      <Link href="/app" className="flex items-center gap-3">
        <span className="flex size-12 items-center justify-center rounded-2xl bg-emerald-600 text-xl font-black text-white shadow-sm">식</span>
        <span className="text-3xl font-black tracking-[-0.04em] text-slate-950">식톡</span>
      </Link>

      <nav className="mt-12 space-y-3">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-4 rounded-2xl px-4 py-4 text-base font-black transition ${
              pathname === item.href || (item.href === "/app" && pathname.startsWith("/app"))
                ? "bg-emerald-50 text-emerald-700"
                : "text-slate-600 hover:bg-emerald-50 hover:text-emerald-700"
            }`}
          >
            <span className="w-6 text-center text-xl text-slate-700">{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>

      {!useChartNav ? (
        <div className="mt-6 space-y-3">
          <button
            type="button"
            onClick={() => router.push("/conditions")}
            className="block w-full rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-left text-emerald-950"
          >
            <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">01</p>
            <p className="mt-2 text-base font-black leading-6">80개 조건식 DB 확인하기</p>
            <p className="mt-3 text-xl font-black text-emerald-700">→</p>
          </button>
          <button
            type="button"
            onClick={() => router.push("/alerts")}
            className="block w-full rounded-2xl border border-sky-200 bg-sky-50 p-4 text-left text-sky-950"
          >
            <p className="text-xs font-black uppercase tracking-[0.18em] text-sky-700">02</p>
            <p className="mt-2 text-base font-black leading-6">24시간 자동 알림봇 만들기</p>
            <p className="mt-3 text-xl font-black text-sky-700">→</p>
          </button>
          <button
            type="button"
            onClick={() => router.push("/backtests")}
            className="block w-full rounded-2xl border border-violet-200 bg-violet-50 p-4 text-left text-violet-950"
          >
            <p className="text-xs font-black uppercase tracking-[0.18em] text-violet-700">03</p>
            <p className="mt-2 text-base font-black leading-6">25·26년 전략 생존력 백테스트</p>
            <p className="mt-3 text-xl font-black text-violet-700">→</p>
          </button>
          <button
            type="button"
            onClick={() => {
              window.dispatchEvent(new CustomEvent("siktalk:feedback-open", { detail: { mode: "survey", trigger: "sidebar_cta" } }));
            }}
            data-feedback-open="survey"
            data-feedback-only="true"
            data-feedback-trigger="sidebar_survey_cta"
            className="block w-full rounded-2xl bg-slate-950 p-4 text-left text-white"
          >
            <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-200">04</p>
            <p className="mt-2 text-base font-black leading-6">설문하고 앱AI쿠폰 + 트뷰 지표 받기</p>
            <p className="mt-3 text-xl font-black text-amber-200">→</p>
          </button>
          <a href="/api/feedback/ebook" download className="block rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-950">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-rose-700">05</p>
            <p className="mt-2 text-base font-black leading-6">무료 영웅문 세팅 PDF 받기</p>
            <p className="mt-3 text-xl font-black text-rose-700">→</p>
          </a>
        </div>
      ) : null}

      <div className="mt-6 space-y-3">
        <a href="/api/feedback/ebook" download className="block rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-emerald-950">
          <p className="text-base font-black leading-6">무료 영웅문
            <br />
            세팅 PDF 받기</p>
          <p className="mt-3 text-xl font-black text-emerald-700">→</p>
        </a>
        <button
          type="button"
          data-feedback-open="card"
          data-feedback-only="true"
          data-feedback-trigger="sidebar_beta_cta"
          className="block w-full rounded-2xl bg-[#060820] p-4 text-left text-white"
        >
          <p className="text-base font-black leading-6">베타 신청하고
            <br />
            먼저 써보기</p>
          <p className="mt-3 text-xl font-black text-white/90">→</p>
        </button>
      </div>

      <div className="mt-auto space-y-3 border-t border-slate-200 pt-5">
        <Link href="/survey" className="block text-xs font-bold text-slate-300 hover:text-slate-400">
          사전 설문
        </Link>
        <Link href="/community" className="block text-sm font-black text-slate-500">
          ? 도움말
        </Link>
        <Link href="/pricing" className="block text-sm font-black text-slate-500">
          ⚙ 설정
        </Link>
      </div>
    </aside>
  );
}
