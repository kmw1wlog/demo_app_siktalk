"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function TopNav() {
  const pathname = usePathname();
  const navItems = [
    { href: "/app", label: "만들기" },
    { href: "/conditions", label: "조건식" },
    { href: "/drawer", label: "식 서랍" },
    { href: "/backtests", label: "백테스트" },
    { href: "/alerts", label: "알림봇" },
    { href: "/pricing", label: "베타 신청" },
  ];

  return (
    <>
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur md:border-b md:border-slate-200">
        <div className="flex min-h-16 items-center justify-between gap-3 px-4 lg:px-6">
          <div className="flex items-center gap-2">
            <Link
              href="/drawer"
              aria-label="식 서랍"
              className="flex size-11 items-center justify-center rounded-full bg-white text-2xl font-bold shadow-sm ring-1 ring-slate-100 md:hidden"
            >
              ≡
            </Link>
            <Link
              href="/app"
              className="rounded-full bg-white px-4 py-2 text-lg font-black tracking-normal text-slate-950 shadow-sm ring-1 ring-slate-100 md:bg-transparent md:px-0 md:py-0 md:text-xl md:shadow-none md:ring-0"
            >
              식톡
            </Link>
          </div>

          <nav className="hidden flex-1 items-center justify-center gap-5 md:flex">
            {navItems.map((item) => {
              const active = pathname === item.href || (item.href === "/app" && pathname.startsWith("/app"));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`text-sm font-black transition ${active ? "text-emerald-700" : "text-slate-600 hover:text-emerald-700"}`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700 shadow-sm">
              <span className="size-2 rounded-full bg-emerald-500" />
              새 소식
            </span>
            <Link
              href="/pricing"
              aria-label="프로필"
              className="flex size-12 items-center justify-center rounded-full border border-slate-200 bg-white text-xl font-black text-slate-700 shadow-sm"
            >
              ⊙
            </Link>
          </div>

          <div className="flex items-center gap-2 md:hidden">
            <Link
              href="/conditions"
              aria-label="조건식 도구함"
              className="flex size-11 items-center justify-center rounded-full bg-white text-2xl shadow-sm ring-1 ring-slate-100"
            >
              ⌕
            </Link>
            <Link
              href="/pricing"
              aria-label="새 소식"
              className="flex size-11 items-center justify-center rounded-full bg-white text-xl shadow-sm ring-1 ring-slate-100"
            >
              •
            </Link>
          </div>
        </div>
      </header>
    </>
  );
}
