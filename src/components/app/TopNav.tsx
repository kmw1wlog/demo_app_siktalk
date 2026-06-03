import Link from "next/link";

export function TopNav() {
  return (
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
          <Link href="/" className="rounded-full bg-white px-4 py-2 text-lg font-black tracking-normal text-slate-950 shadow-sm ring-1 ring-slate-100 md:bg-transparent md:px-0 md:py-0 md:text-xl md:shadow-none md:ring-0">
            식톡
          </Link>
        </div>
        <nav className="hidden items-center gap-4 text-sm font-semibold text-slate-600 md:flex">
          <Link href="/app" className="hover:text-emerald-700">
            만들기
          </Link>
          <Link href="/conditions" className="hover:text-emerald-700">
            조건식
          </Link>
          <Link href="/drawer" className="hover:text-emerald-700">
            식 서랍
          </Link>
          <Link href="/library" className="hover:text-emerald-700">
            자료실
          </Link>
          <Link href="/paper-trading" className="hover:text-emerald-700">
            모의투자
          </Link>
        </nav>
        <div className="flex items-center md:hidden">
          <Link
            href="/conditions"
            aria-label="조건식 도구함"
            className="flex size-11 items-center justify-center rounded-full bg-white text-2xl shadow-sm ring-1 ring-slate-100"
          >
            ⌕
          </Link>
        </div>
      </div>
    </header>
  );
}
