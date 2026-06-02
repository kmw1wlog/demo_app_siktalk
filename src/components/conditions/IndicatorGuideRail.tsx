"use client";

import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { indicatorGuides } from "@/lib/indicator-guides";

export function IndicatorGuideRail({
  onPickKeyword,
}: {
  onPickKeyword: (keyword: string) => void;
}) {
  return (
    <aside className="space-y-3 xl:sticky xl:top-20 xl:self-start">
      <div className="rounded-[1.75rem] border border-slate-200 bg-white p-4 shadow-sm">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">보조지표 1열</p>
        <h2 className="mt-2 text-xl font-black text-slate-950">지표 해석 카드를 같이 둡니다.</h2>
        <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
          기존 조건식 카드 흐름은 건드리지 않고, 왼쪽 열에서 RSI·스토캐스틱·PSAR·복합신호 해석 카드를 바로 볼 수 있게 구성했습니다.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-1">
        {indicatorGuides.map((guide) => (
          <article
            key={guide.id}
            className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm"
          >
            <div className="relative">
              <Image
                src={guide.imageSrc}
                alt={`${guide.title} 설명 카드`}
                width={1125}
                height={1773}
                className="h-auto w-full"
                priority={guide.id === "stochastic"}
              />
            </div>

            <div className="space-y-3 p-4">
              <div className="flex flex-wrap gap-2">
                <Badge tone="blue">보조지표</Badge>
                <Badge tone={guide.family === "복합신호" ? "emerald" : guide.family === "추세" ? "amber" : "slate"}>
                  {guide.family}
                </Badge>
              </div>

              <div>
                <h3 className="text-base font-black text-slate-950">{guide.title}</h3>
                <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">{guide.summary}</p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="rounded-full bg-slate-950 px-3 py-2 text-xs font-black text-white"
                  onClick={() => onPickKeyword(guide.keyword)}
                >
                  관련 조건식 보기
                </button>
                <Link
                  href={`/app?idea=${encodeURIComponent(guide.idea)}`}
                  className="rounded-full border border-slate-200 px-3 py-2 text-xs font-black text-slate-700"
                >
                  이 아이디어로 시작
                </Link>
              </div>
            </div>
          </article>
        ))}
      </div>
    </aside>
  );
}
