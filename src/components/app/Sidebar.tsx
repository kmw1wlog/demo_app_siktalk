import Link from "next/link";

const groups = [
  "전체 전략",
  "최근 생성한 전략",
  "최근 모의검증한 전략",
  "변환 요청한 전략",
  "진입식",
  "청산식",
  "종목식",
  "필터식",
  "리스크 관리식",
];

const bottomLinks = [
  { href: "/app", label: "말로 만들기" },
  { href: "/conditions", label: "조건식 도구함" },
  { href: "/paper-trading", label: "모의투자" },
  { href: "/library", label: "자료실" },
  { href: "/dashboard", label: "분석" },
];

export function Sidebar() {
  return (
    <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white px-4 py-6 lg:block">
      <div className="mb-4 text-xs font-bold uppercase tracking-wider text-slate-400">식 서랍</div>
      <nav className="space-y-1">
        {groups.map((group) => (
          <Link
            key={group}
            href="/drawer"
            className="block rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-950"
          >
            {group}
          </Link>
        ))}
      </nav>
      <div className="mt-8 border-t border-slate-200 pt-4">
        <div className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">바로가기</div>
        <nav className="space-y-1">
          {bottomLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="block rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-950"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </aside>
  );
}
