"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

const navItems = [
  { href: "/app", label: "말로 만들기", icon: "○" },
  { href: "/conditions", label: "조건식 도구함", icon: "▣" },
  { href: "/app?idea=5일선%2020일선%20골든크로스%20전략%20찾아줘&view=card&from=chat", label: "차트 적용", icon: "↗" },
];

export function Sidebar() {
  const router = useRouter();

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
            className="flex items-center gap-4 rounded-2xl px-4 py-4 text-base font-black text-slate-600 transition hover:bg-emerald-50 hover:text-emerald-700"
          >
            <span className="w-6 text-center text-xl text-slate-700">{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="mt-auto space-y-4">
        <button
          type="button"
          onClick={() => router.push("/conditions")}
          className="block w-full rounded-2xl bg-slate-950 p-5 text-left text-white"
        >
          <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-300">01</p>
          <p className="mt-2 text-base font-black leading-6">80개 조건식 DB 확인하기</p>
          <p className="mt-3 text-xl font-black text-emerald-300">→</p>
        </button>
        <button
          type="button"
          onClick={() => {
            window.dispatchEvent(new CustomEvent("siktalk:feedback-open", { detail: { mode: "survey", trigger: "sidebar_cta" } }));
          }}
          className="block w-full rounded-2xl bg-slate-950 p-5 text-left text-white"
        >
          <p className="text-xs font-black uppercase tracking-[0.18em] text-sky-300">02</p>
          <p className="mt-2 text-base font-black leading-6">설문하고 앱AI쿠폰 + 트뷰 지표 받기</p>
          <p className="mt-3 text-xl font-black text-sky-300">→</p>
        </button>
        <a href="/api/feedback/ebook" download className="block rounded-2xl bg-slate-950 p-5 text-white">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-300">03</p>
          <p className="mt-2 text-base font-black leading-6">무료 영웅문 세팅 PDF 받기</p>
          <p className="mt-3 text-xl font-black text-amber-300">→</p>
        </a>
        <Link href="/community" className="block border-t border-slate-200 pt-5 text-sm font-black text-slate-500">
          ? 도움말
        </Link>
      </div>
    </aside>
  );
}
