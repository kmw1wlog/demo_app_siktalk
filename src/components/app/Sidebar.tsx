import Link from "next/link";

const navItems = [
  { href: "/app", label: "말로 만들기", icon: "○" },
  { href: "/conditions", label: "조건식 도구함", icon: "▣" },
  { href: "/app?idea=5일선%2020일선%20골든크로스%20전략%20찾아줘&view=card&from=chat", label: "차트 적용", icon: "↗" },
  { href: "/pricing", label: "베타 신청", icon: "△" },
];

export function Sidebar() {
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
        <Link href="/library" className="block rounded-2xl border border-emerald-100 bg-emerald-50 p-5 text-slate-950">
          <p className="text-base font-black leading-6">무료 영웅문 세팅 PDF 받기</p>
          <p className="mt-3 text-xl font-black text-emerald-700">→</p>
        </Link>
        <Link href="/pricing" className="block rounded-2xl bg-slate-950 p-5 text-white">
          <p className="text-base font-black leading-6">베타 신청하고 먼저 써보기</p>
          <p className="mt-3 text-xl font-black">→</p>
        </Link>
        <Link href="/community" className="block border-t border-slate-200 pt-5 text-sm font-black text-slate-500">
          ? 도움말
        </Link>
      </div>
    </aside>
  );
}
