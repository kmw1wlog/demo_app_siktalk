"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { ChartScene } from "@/components/media/ChartScene";
import { conditionTemplates } from "@/lib/condition-templates";
import { resolveChartSceneVariant } from "@/lib/demo-media";
import { markFeedbackSignal, setFeedbackLastScreen } from "@/lib/feedback-session";
import { trackEvent } from "@/lib/mixpanel";
import type { AssetClass, ConditionCategory, ConditionTemplate } from "@/lib/types";

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
const priorityIds = ["condition_base_7", "condition_base_6", "condition_base_8"];

type Rect = {
  left: number;
  top: number;
  width: number;
  height: number;
};

type IndicatorGuide = {
  image: string;
  label: string;
  description: string;
};

const indicatorGuides: Record<string, IndicatorGuide> = {
  condition_base_7: {
    image: "/indicator-guides/stochastic.png",
    label: "스토캐스틱",
    description: "과매수·과매도와 K/D선 교차를 보는 모멘텀 보조지표입니다.",
  },
  condition_base_6: {
    image: "/indicator-guides/rsi.png",
    label: "RSI",
    description: "매수·매도 힘의 균형과 과열/침체 구간을 읽는 보조지표입니다.",
  },
  condition_base_8: {
    image: "/indicator-guides/psar.png",
    label: "PSAR",
    description: "캔들 위아래 점 위치로 추세 방향과 반전 가능성을 보는 보조지표입니다.",
  },
};

export function ConditionsExplorer() {
  const [category, setCategory] = useState<ConditionCategory | "all">("all");
  const [market, setMarket] = useState<AssetClass | "all">("all");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(priorityIds[0]);
  const [activeTemplate, setActiveTemplate] = useState<ConditionTemplate | null>(null);
  const [originRect, setOriginRect] = useState<Rect | null>(null);
  const [expanded, setExpanded] = useState(false);
  const cardRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const lastSearchKeyRef = useRef("");
  const openedRef = useRef(false);

  const filtered = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    const matches = conditionTemplates.filter((template) => {
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
    return orderTemplates(matches);
  }, [category, market, query]);

  const visibleTemplates = filtered.slice(0, 80);
  const selectedTemplate = visibleTemplates.find((template) => template.id === selectedId) ?? visibleTemplates[0] ?? conditionTemplates[0];

  useEffect(() => {
    setFeedbackLastScreen("/conditions");
    if (openedRef.current) {
      return;
    }
    openedRef.current = true;
    void trackEvent("Condition DB Opened", {
      category,
      market,
      result_count: visibleTemplates.length,
    });
  }, [category, market, visibleTemplates.length]);

  useEffect(() => {
    void trackEvent("Condition List Viewed", {
      category,
      market,
      result_count: visibleTemplates.length,
      selected_condition_id: selectedTemplate?.id ?? null,
    });
  }, [category, market, selectedTemplate?.id, visibleTemplates.length]);

  useEffect(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) {
      lastSearchKeyRef.current = "";
      return;
    }
    const searchKey = `${category}:${market}:${keyword}`;
    if (lastSearchKeyRef.current === searchKey) {
      return;
    }
    lastSearchKeyRef.current = searchKey;
    void trackEvent("Condition Search Performed", {
      category,
      market,
      query: keyword,
      query_length: keyword.length,
      result_count: visibleTemplates.length,
    });
  }, [category, market, query, visibleTemplates.length]);

  useEffect(() => {
    if (!activeTemplate) {
      return;
    }
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeDetail();
      }
    }
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleEscape);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleEscape);
    };
  }, [activeTemplate]);

  function openDetail(template: ConditionTemplate, source: "grid" | "preview") {
    setSelectedId(template.id);
    void trackEvent("Strategy Card Clicked", {
      category: template.category,
      condition_id: template.id,
      condition_name: template.title,
      difficulty: template.difficulty,
      guide_available: Boolean(indicatorGuides[template.id]),
      market: template.market,
      source,
    });
    markFeedbackSignal("strategy_clicked", "/conditions:detail");
    const node = cardRefs.current[template.id];
    if (!node) {
      setActiveTemplate(template);
      setExpanded(true);
      return;
    }
    const rect = node.getBoundingClientRect();
    setOriginRect({
      left: rect.left,
      top: rect.top,
      width: rect.width,
      height: rect.height,
    });
    setActiveTemplate(template);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setExpanded(true);
      });
    });
  }

  function closeDetail() {
    setExpanded(false);
    window.setTimeout(() => {
      setActiveTemplate(null);
      setOriginRect(null);
    }, 360);
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-2 pb-10">
      <section className="pt-5 text-center md:pt-10">
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-black text-emerald-800">
          <span className="size-2 rounded-full bg-emerald-500" />
          80개 조건식 DB 보유
        </div>
        <h1 className="mt-5 text-4xl font-black tracking-[-0.05em] text-slate-950 md:text-6xl">
          <span className="text-emerald-600">80개 조건식</span>을 빠르게 찾으세요
        </h1>
        <p className="mt-3 text-base font-semibold text-slate-500">
          상한가 관찰, 종가베팅, 거래량 돌파, 눌림목 등 국장에 맞는 조건식을 카드로 정리했습니다.
        </p>
      </section>

      <section className="mx-auto max-w-4xl rounded-[1.35rem] border border-slate-200 bg-white p-3 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xl">⌕</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="전략명, 거래량, 돌파, RSI, 눌림목..."
            className="h-12 min-w-0 flex-1 bg-transparent text-sm font-bold text-slate-900 outline-none placeholder:text-slate-400"
          />
          {query ? (
            <button type="button" className="rounded-full bg-slate-100 px-3 py-1 text-sm font-black text-slate-500" onClick={() => setQuery("")}>
              ×
            </button>
          ) : null}
        </div>
      </section>

      <div className="mx-auto flex max-w-6xl flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {categoryOptions.map((option) => (
            <FilterButton key={option} active={category === option} onClick={() => setCategory(option)}>
              {categoryLabels[option]}
            </FilterButton>
          ))}
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {marketOptions.map((option) => (
            <FilterButton key={option} active={market === option} onClick={() => setMarket(option)}>
              {marketLabels[option]}
            </FilterButton>
          ))}
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_390px]">
        {filtered.length ? (
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {visibleTemplates.map((template) => (
              <ConditionTile
                key={template.id}
                refSetter={(node) => {
                  cardRefs.current[template.id] = node;
                }}
                template={template}
                active={selectedTemplate?.id === template.id}
                onSelect={() => openDetail(template, "grid")}
              />
            ))}
          </section>
        ) : (
          <section className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center text-sm font-semibold text-slate-500">
            검색 조건에 맞는 조건식이 없습니다.
          </section>
        )}

        {selectedTemplate ? <SelectedPreview template={selectedTemplate} onOpen={() => openDetail(selectedTemplate, "preview")} /> : null}
      </div>

      {activeTemplate ? (
        <ExpandedConditionCard
          template={activeTemplate}
          originRect={originRect}
          expanded={expanded}
          onClose={closeDetail}
        />
      ) : null}

      <section className="grid gap-4 rounded-[1.6rem] border border-slate-200 bg-white p-5 md:grid-cols-2">
        <InfoBlock title="국장용 전략식만 엄선" body="국내 주식 시장성에 맞는 조건식만 제공합니다." />
        <InfoBlock title="카드형으로 빠르게 선택" body="전략 설명을 길게 읽기 전에, 프리뷰와 핵심 조건으로 먼저 판단합니다." />
      </section>
    </div>
  );
}

function ConditionTile({
  refSetter,
  template,
  active,
  onSelect,
}: {
  refSetter: (node: HTMLButtonElement | null) => void;
  template: ConditionTemplate;
  active: boolean;
  onSelect: () => void;
}) {
  const variant = resolveChartSceneVariant({ title: template.title, strategyType: template.strategyType });
  const guide = indicatorGuides[template.id];
  return (
    <button
      ref={refSetter}
      type="button"
      aria-label={`${template.title} 상세 보기`}
      className={`rounded-[1.5rem] border bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
        active ? "border-emerald-500 ring-4 ring-emerald-50" : "border-slate-200"
      }`}
      onClick={onSelect}
    >
      {guide ? (
        <div className="relative aspect-video overflow-hidden rounded-xl bg-slate-100">
          <Image src={guide.image} alt={`${guide.label} 설명 이미지`} fill sizes="(min-width: 1280px) 30vw, (min-width: 768px) 45vw, 90vw" className="object-cover object-top" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/35 via-transparent to-transparent" />
          <span className="absolute bottom-2 left-2 rounded-full bg-white/90 px-3 py-1 text-xs font-black text-slate-800">이미지 가이드</span>
        </div>
      ) : (
        <ChartScene variant={variant} compact />
      )}
      <div className="mt-4 flex items-start justify-between gap-3">
        <span className={badgeClass(template.category)}>{template.tags[0] ?? categoryLabels[template.category]}</span>
        {active ? <span className="flex size-8 items-center justify-center rounded-full bg-emerald-600 text-sm font-black text-white">✓</span> : null}
      </div>
      <h2 className="mt-3 text-xl font-black leading-tight tracking-[-0.03em] text-slate-950">{template.title}</h2>
      <DifficultyDots difficulty={template.difficulty} />
      <p className="mt-3 line-clamp-2 text-sm font-semibold leading-6 text-slate-600">{template.plainKorean}</p>
      <span className="mt-4 inline-flex rounded-full border border-slate-200 px-4 py-2 text-sm font-black text-slate-700">상세 보기 →</span>
    </button>
  );
}

function SelectedPreview({ template, onOpen }: { template: ConditionTemplate; onOpen: () => void }) {
  const variant = resolveChartSceneVariant({ title: template.title, strategyType: template.strategyType });
  const strategyHref = `/app?idea=${encodeURIComponent("5일선 20일선 골든크로스 전략 찾아줘")}&view=card&from=conditions`;
  const guide = indicatorGuides[template.id];

  return (
    <aside className="sticky top-6 h-fit rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-black text-slate-700">선택한 전략 미리보기</p>
        <button type="button" className="text-2xl leading-none text-slate-400" aria-label="미리보기 접기">
          ×
        </button>
      </div>
      <div className="mt-4">
        {guide ? (
          <button type="button" className="block w-full overflow-hidden rounded-2xl bg-slate-100 text-left" onClick={onOpen}>
            <Image src={guide.image} alt={`${guide.label} 설명 이미지`} width={1122} height={1402} className="max-h-[560px] w-full object-contain" />
          </button>
        ) : (
          <ChartScene variant={variant} motion />
        )}
      </div>
      <div className="mt-5">
        <span className={badgeClass(template.category)}>{template.tags[0] ?? categoryLabels[template.category]}</span>
        <h2 className="mt-4 text-2xl font-black leading-tight tracking-[-0.03em] text-slate-950">{template.title}</h2>
      </div>
      <div className="mt-6 space-y-5">
        <PreviewSection title="전략 한 줄 요약" body={template.plainKorean} />
        <PreviewSection title="쓰는 상황" body={template.whyUse} />
        <div>
          <p className="text-sm font-black text-slate-700">핵심 조건 요약</p>
          <ol className="mt-3 space-y-2 text-sm font-bold leading-6 text-slate-600">
            {template.requiredInputs.slice(0, 3).map((input, index) => (
              <li key={input} className="flex gap-2">
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-black text-emerald-700">{index + 1}</span>
                {input}
              </li>
            ))}
          </ol>
        </div>
      </div>

      <div className="mt-6 rounded-2xl bg-slate-50 p-4 text-sm font-semibold leading-6 text-slate-500">
        이 전략으로 과거 백테스트 결과를 확인해보세요.
      </div>

      <Link
        href={strategyHref}
        onClick={() => {
          void trackEvent("Strategy Card Requested", {
            condition_id: template.id,
            condition_name: template.title,
            source: "conditions_preview",
          });
        }}
        className="mt-5 flex h-14 items-center justify-center rounded-2xl bg-emerald-600 text-base font-black text-white shadow-lg shadow-emerald-100 transition hover:bg-emerald-700"
      >
        전략 카드 만들기 →
      </Link>
      <button type="button" className="mt-3 flex h-12 w-full items-center justify-center rounded-2xl border border-slate-200 bg-white text-sm font-black text-slate-700">
        즐겨찾기에 추가
      </button>
    </aside>
  );
}

function ExpandedConditionCard({
  template,
  originRect,
  expanded,
  onClose,
}: {
  template: ConditionTemplate;
  originRect: Rect | null;
  expanded: boolean;
  onClose: () => void;
}) {
  const guide = indicatorGuides[template.id];
  const variant = resolveChartSceneVariant({ title: template.title, strategyType: template.strategyType });
  const targetRect = getTargetRect();
  const startRect = originRect ?? targetRect;

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        aria-label="조건식 상세 닫기"
        className={`absolute inset-0 bg-slate-950/50 transition duration-300 ${expanded ? "opacity-100" : "opacity-0"}`}
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`${template.title} 상세`}
        className="absolute overflow-hidden rounded-[2rem] bg-white shadow-[0_40px_100px_rgba(15,23,42,0.28)] transition-[left,top,width,height,border-radius] duration-[420ms] ease-[cubic-bezier(0.19,1,0.22,1)]"
        style={{
          left: expanded ? targetRect.left : startRect.left,
          top: expanded ? targetRect.top : startRect.top,
          width: expanded ? targetRect.width : startRect.width,
          height: expanded ? targetRect.height : startRect.height,
          borderRadius: expanded ? 34 : 24,
        }}
      >
        <div className={`h-full overflow-y-auto bg-white transition duration-200 ${expanded ? "opacity-100" : "opacity-0"}`}>
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white/90 px-5 py-4 backdrop-blur">
            <button type="button" className="text-sm font-black text-slate-500 hover:text-slate-950" onClick={onClose}>
              ← 조건식
            </button>
            <p className="text-sm font-black text-slate-950">상세 이미지</p>
            <span className="w-14 text-right text-sm font-black text-emerald-600">식톡</span>
          </div>

          <div className="mx-auto max-w-3xl p-4">
            {guide ? (
              <Image src={guide.image} alt={`${guide.label} 설명 이미지`} width={1122} height={1402} className="w-full rounded-[2rem]" priority />
            ) : (
              <div className="space-y-5 rounded-[2rem] border border-slate-200 p-5">
                <ChartScene variant={variant} motion />
                <div>
                  <span className={badgeClass(template.category)}>{template.tags[0] ?? categoryLabels[template.category]}</span>
                  <h2 className="mt-4 text-3xl font-black text-slate-950">{template.title}</h2>
                  <p className="mt-3 text-base font-semibold leading-7 text-slate-600">{template.plainKorean}</p>
                </div>
              </div>
            )}

            <div className="mt-4 rounded-[1.5rem] border border-slate-200 bg-white p-5">
              <p className="text-lg font-black text-slate-950">{template.title}</p>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{guide?.description ?? template.whyUse}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {template.tags.map((tag) => (
                  <span key={tag} className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-500">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
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
        active ? "bg-emerald-600 text-white shadow-sm" : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
      }`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function DifficultyDots({ difficulty }: { difficulty: ConditionTemplate["difficulty"] }) {
  const count = difficulty === "easy" ? 2 : difficulty === "medium" ? 3 : 4;
  return (
    <div className="mt-3 flex items-center gap-2 text-xs font-black text-slate-500">
      난이도
      <span className="flex gap-1">
        {Array.from({ length: 4 }).map((_, index) => (
          <span key={index} className={`size-2 rounded-full ${index < count ? "bg-emerald-500" : "bg-slate-200"}`} />
        ))}
      </span>
    </div>
  );
}

function PreviewSection({ title, body }: { title: string; body: string }) {
  return (
    <div>
      <p className="text-sm font-black text-slate-700">{title}</p>
      <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{body}</p>
    </div>
  );
}

function InfoBlock({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-5">
      <p className="text-base font-black text-slate-950">{title}</p>
      <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">{body}</p>
    </div>
  );
}

function badgeClass(category: ConditionCategory) {
  if (category === "entry") return "rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700";
  if (category === "exit") return "rounded-full bg-rose-50 px-3 py-1 text-xs font-black text-rose-700";
  if (category === "universe") return "rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-700";
  if (category === "filters") return "rounded-full bg-amber-50 px-3 py-1 text-xs font-black text-amber-700";
  return "rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700";
}

function orderTemplates(templates: ConditionTemplate[]) {
  return [...templates].sort((left, right) => {
    const leftPriority = priorityIds.indexOf(left.id);
    const rightPriority = priorityIds.indexOf(right.id);
    if (leftPriority >= 0 && rightPriority >= 0) return leftPriority - rightPriority;
    if (leftPriority >= 0) return -1;
    if (rightPriority >= 0) return 1;
    return conditionTemplates.findIndex((template) => template.id === left.id) - conditionTemplates.findIndex((template) => template.id === right.id);
  });
}

function getTargetRect(): Rect {
  if (typeof window === "undefined") {
    return { left: 24, top: 24, width: 760, height: 820 };
  }
  const isMobile = window.innerWidth < 768;
  const padding = isMobile ? 12 : 24;
  const width = Math.min(window.innerWidth - padding * 2, 820);
  const height = Math.min(window.innerHeight - padding * 2, 900);
  return {
    left: Math.max(padding, (window.innerWidth - width) / 2),
    top: Math.max(padding, (window.innerHeight - height) / 2),
    width,
    height,
  };
}
