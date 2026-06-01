"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { conditionTemplates } from "@/lib/condition-templates";
import { platformLabels } from "@/lib/constants";
import { addEvent } from "@/lib/storage";
import type { AssetClass, ConditionCategory, ConditionTemplate, ConversionPlatform } from "@/lib/types";
import { VisualConditionGallery } from "./VisualConditionGallery";

const categoryLabels: Record<ConditionCategory | "all", string> = {
  all: "전체",
  entry: "진입",
  exit: "청산",
  universe: "종목",
  filters: "필터",
  risk: "리스크",
};

const marketLabels: Record<AssetClass | "all", string> = {
  all: "전체 시장",
  koreanStock: "국장",
  usStock: "미장",
  crypto: "코인",
  etf: "ETF",
  futures: "선물",
  unknown: "공통",
};

const categoryOptions: (ConditionCategory | "all")[] = ["all", "entry", "exit", "universe", "filters", "risk"];
const marketOptions: (AssetClass | "all")[] = ["all", "koreanStock", "usStock", "crypto", "etf"];

export function ConditionsExplorer() {
  const [category, setCategory] = useState<ConditionCategory | "all">("all");
  const [market, setMarket] = useState<AssetClass | "all">("all");
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState("");

  const filtered = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return conditionTemplates.filter((template) => {
      const categoryOk = category === "all" || template.category === category;
      const marketOk = market === "all" || template.market === market;
      const queryOk =
        !keyword ||
        [template.title, template.plainKorean, template.whyUse, ...template.tags, ...template.requiredInputs]
          .join(" ")
          .toLowerCase()
          .includes(keyword);
      return categoryOk && marketOk && queryOk;
    });
  }, [category, market, query]);

  function requestApply(template: ConditionTemplate, platform: ConversionPlatform) {
    addEvent({
      type: "apply_clicked",
      conditionId: template.id,
      platform,
      createdAt: new Date().toISOString(),
    });
    setMessage(`${template.title} ${platformLabels[platform]} 적용 요청을 기록했습니다.`);
  }

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <section className="rounded-[2rem] bg-slate-950 p-6 text-white">
        <p className="text-xs font-black text-emerald-300">조건식 도구함</p>
        <div className="mt-3 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <h1 className="text-3xl font-black md:text-5xl">80개 조건식을 검색하세요.</h1>
            <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-slate-300">
              상따, 종베, 거래량, ATR, RSI를 카테고리별로 봅니다.
            </p>
          </div>
          <Link href="/app" className="rounded-2xl bg-emerald-600 px-5 py-3 text-center text-sm font-black text-white">
            말로 만들기
          </Link>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="거래량, 상따, 종베, ATR, RSI..."
            className="min-h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
          />
          <p className="text-sm font-black text-slate-500">결과 {filtered.length}개</p>
        </div>
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {categoryOptions.map((option) => (
            <FilterButton key={option} active={category === option} onClick={() => setCategory(option)}>
              {categoryLabels[option]}
            </FilterButton>
          ))}
        </div>
        <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
          {marketOptions.map((option) => (
            <FilterButton key={option} active={market === option} onClick={() => setMarket(option)}>
              {marketLabels[option]}
            </FilterButton>
          ))}
        </div>
      </section>

      {message ? <p className="rounded-2xl bg-emerald-50 p-4 text-sm font-black text-emerald-700">{message}</p> : null}

      {filtered.length ? (
        <VisualConditionGallery
          templates={filtered}
          categoryLabels={categoryLabels}
          marketLabels={marketLabels}
          onRequestApply={requestApply}
        />
      ) : (
        <section className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center text-sm font-semibold text-slate-500">
          검색 조건에 맞는 조건식이 없습니다.
        </section>
      )}
    </div>
  );
}

function FilterButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={`shrink-0 rounded-full px-4 py-2 text-sm font-black transition ${
        active ? "bg-slate-950 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
      }`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
