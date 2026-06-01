"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { buildIdeaFromCondition } from "@/lib/condition-templates";
import type { AssetClass, ConditionCategory, ConditionTemplate, ConversionPlatform } from "@/lib/types";

const artDirections = [
  {
    shell: "bg-[linear-gradient(180deg,#eff6ff_0%,#dbeafe_26%,#e2e8f0_100%)]",
    sheen: "before:bg-[radial-gradient(circle_at_20%_18%,rgba(255,255,255,0.95),transparent_38%)] after:bg-[linear-gradient(135deg,rgba(15,23,42,0.04),rgba(15,23,42,0.22))]",
    accent: "bg-[linear-gradient(180deg,rgba(148,163,184,0.12),rgba(15,23,42,0.32))]",
    aspect: "aspect-[0.84]",
  },
  {
    shell: "bg-[linear-gradient(180deg,#d1fae5_0%,#99f6e4_34%,#0f766e_100%)]",
    sheen: "before:bg-[radial-gradient(circle_at_72%_12%,rgba(255,255,255,0.88),transparent_32%)] after:bg-[linear-gradient(160deg,rgba(255,255,255,0.05),rgba(15,23,42,0.28))]",
    accent: "bg-[linear-gradient(180deg,rgba(15,23,42,0.02),rgba(15,23,42,0.3))]",
    aspect: "aspect-[0.98]",
  },
  {
    shell: "bg-[linear-gradient(180deg,#fef3c7_0%,#fdba74_28%,#9a3412_100%)]",
    sheen: "before:bg-[radial-gradient(circle_at_50%_16%,rgba(255,255,255,0.72),transparent_28%)] after:bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(15,23,42,0.18))]",
    accent: "bg-[linear-gradient(180deg,rgba(255,255,255,0),rgba(15,23,42,0.22))]",
    aspect: "aspect-[0.74]",
  },
  {
    shell: "bg-[linear-gradient(180deg,#e2e8f0_0%,#94a3b8_22%,#0f172a_100%)]",
    sheen: "before:bg-[radial-gradient(circle_at_48%_20%,rgba(255,255,255,0.88),transparent_26%)] after:bg-[linear-gradient(140deg,rgba(255,255,255,0.04),rgba(15,23,42,0.35))]",
    accent: "bg-[linear-gradient(180deg,rgba(15,23,42,0.02),rgba(15,23,42,0.36))]",
    aspect: "aspect-[1.1]",
  },
  {
    shell: "bg-[linear-gradient(180deg,#ecfccb_0%,#86efac_32%,#166534_100%)]",
    sheen: "before:bg-[radial-gradient(circle_at_78%_22%,rgba(255,255,255,0.78),transparent_24%)] after:bg-[linear-gradient(155deg,rgba(255,255,255,0.04),rgba(15,23,42,0.28))]",
    accent: "bg-[linear-gradient(180deg,rgba(15,23,42,0),rgba(15,23,42,0.28))]",
    aspect: "aspect-[0.88]",
  },
  {
    shell: "bg-[linear-gradient(180deg,#f8fafc_0%,#e2e8f0_42%,#cbd5e1_100%)]",
    sheen: "before:bg-[radial-gradient(circle_at_40%_18%,rgba(255,255,255,0.96),transparent_34%)] after:bg-[linear-gradient(135deg,rgba(255,255,255,0.04),rgba(15,23,42,0.12))]",
    accent: "bg-[linear-gradient(180deg,rgba(15,23,42,0.02),rgba(15,23,42,0.18))]",
    aspect: "aspect-[0.78]",
  },
] as const;

type Rect = {
  left: number;
  top: number;
  width: number;
  height: number;
};

function getVisualIndex(id: string) {
  return id.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0) % artDirections.length;
}

function getTone(category: ConditionCategory) {
  const tones = {
    entry: "emerald",
    exit: "rose",
    universe: "blue",
    filters: "amber",
    risk: "slate",
  } as const;
  return tones[category];
}

function getViewportRect(width: number, height: number): Rect {
  const isMobile = width < 768;
  const horizontalPadding = isMobile ? 12 : 24;
  const panelWidth = Math.min(width - horizontalPadding * 2, 760);
  const panelHeight = Math.min(height - (isMobile ? 24 : 48), isMobile ? height - 24 : 820);
  const panelLeft = Math.max(horizontalPadding, (width - panelWidth) / 2);
  const panelTop = isMobile ? 12 : Math.max(24, (height - panelHeight) / 2);

  return {
    left: panelLeft,
    top: panelTop,
    width: panelWidth,
    height: panelHeight,
  };
}

export function VisualConditionGallery({
  templates,
  categoryLabels,
  marketLabels,
  onRequestApply,
}: {
  templates: ConditionTemplate[];
  categoryLabels: Record<ConditionCategory | "all", string>;
  marketLabels: Record<AssetClass | "all", string>;
  onRequestApply: (template: ConditionTemplate, platform: ConversionPlatform) => void;
}) {
  const cardRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [activeTemplate, setActiveTemplate] = useState<ConditionTemplate | null>(null);
  const [originRect, setOriginRect] = useState<Rect | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [viewport, setViewport] = useState(() => ({
    width: typeof window === "undefined" ? 1200 : window.innerWidth,
    height: typeof window === "undefined" ? 900 : window.innerHeight,
  }));

  useEffect(() => {
    function updateViewport() {
      setViewport({ width: window.innerWidth, height: window.innerHeight });
    }
    updateViewport();
    window.addEventListener("resize", updateViewport);
    return () => window.removeEventListener("resize", updateViewport);
  }, []);

  useEffect(() => {
    if (!activeTemplate) {
      return;
    }
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeDetail();
      }
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleEscape);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleEscape);
    };
  }, [activeTemplate]);

  const targetRect = useMemo(
    () => getViewportRect(viewport.width, viewport.height),
    [viewport.height, viewport.width],
  );

  function openDetail(template: ConditionTemplate) {
    const node = cardRefs.current[template.id];
    if (!node) {
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
    <>
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {templates.map((template) => {
          const art = artDirections[getVisualIndex(template.id)];
          const hidden = activeTemplate?.id === template.id;

          return (
            <button
              key={template.id}
              ref={(node) => {
                cardRefs.current[template.id] = node;
              }}
              type="button"
              className={`group relative overflow-hidden rounded-[2rem] border border-slate-200 bg-white text-left shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md ${art.aspect} ${
                hidden ? "opacity-0" : "opacity-100"
              }`}
              aria-label={`${template.title} 상세 보기`}
              onClick={() => openDetail(template)}
            >
              <div className={`absolute inset-0 ${art.shell}`} />
              <div className={`absolute inset-0 before:absolute before:inset-0 after:absolute after:inset-0 ${art.sheen}`} />
              <div className="absolute inset-x-0 top-0 h-[65%] bg-[linear-gradient(180deg,rgba(255,255,255,0.02),rgba(15,23,42,0.05))]" />
              <div className={`absolute inset-x-0 bottom-0 h-[48%] ${art.accent}`} />
              <div className="absolute inset-3 rounded-[1.55rem] border border-white/30" />
              <div className="relative flex h-full flex-col justify-between p-4">
                <div className="flex items-start justify-between gap-3">
                  <Badge tone={getTone(template.category)}>{categoryLabels[template.category]}</Badge>
                  <span className="rounded-full bg-white/70 px-2.5 py-1 text-[11px] font-black text-slate-600 backdrop-blur">
                    {marketLabels[template.market]}
                  </span>
                </div>
                <div className="space-y-2 rounded-[1.4rem] bg-white/70 p-4 backdrop-blur-md">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                    {template.difficulty === "easy" ? "easy" : template.difficulty === "medium" ? "medium" : "advanced"}
                  </p>
                  <h2 className="text-lg font-black leading-6 text-slate-950">{template.title}</h2>
                  <p className="line-clamp-2 text-sm font-semibold leading-6 text-slate-700">{template.plainKorean}</p>
                </div>
              </div>
            </button>
          );
        })}
      </section>

      {activeTemplate && originRect ? (
        <div className="fixed inset-0 z-50">
          <button
            type="button"
            aria-label="상세 닫기"
            className={`absolute inset-0 bg-slate-950/45 transition duration-300 ${expanded ? "opacity-100" : "opacity-0"}`}
            onClick={closeDetail}
          />

          <div
            role="dialog"
            aria-modal="true"
            aria-label={`${activeTemplate.title} 상세`}
            className="absolute overflow-hidden rounded-[2rem] bg-white shadow-[0_40px_100px_rgba(15,23,42,0.25)] transition-[left,top,width,height,border-radius] duration-[420ms] ease-[cubic-bezier(0.19,1,0.22,1)]"
            style={{
              left: expanded ? targetRect.left : originRect.left,
              top: expanded ? targetRect.top : originRect.top,
              width: expanded ? targetRect.width : originRect.width,
              height: expanded ? targetRect.height : originRect.height,
              borderRadius: expanded ? 34 : 28,
            }}
          >
            <DetailCard
              expanded={expanded}
              template={activeTemplate}
              categoryLabel={categoryLabels[activeTemplate.category]}
              marketLabel={marketLabels[activeTemplate.market]}
              art={artDirections[getVisualIndex(activeTemplate.id)]}
              onClose={closeDetail}
              onRequestApply={onRequestApply}
            />
          </div>
        </div>
      ) : null}
    </>
  );
}

function DetailCard({
  expanded,
  template,
  categoryLabel,
  marketLabel,
  art,
  onClose,
  onRequestApply,
}: {
  expanded: boolean;
  template: ConditionTemplate;
  categoryLabel: string;
  marketLabel: string;
  art: (typeof artDirections)[number];
  onClose: () => void;
  onRequestApply: (template: ConditionTemplate, platform: ConversionPlatform) => void;
}) {
  return (
    <div className="relative flex h-full flex-col bg-white">
      <div className={`absolute inset-x-0 top-0 h-[43%] ${art.shell}`} />
      <div className={`absolute inset-x-0 top-0 h-[43%] before:absolute before:inset-0 after:absolute after:inset-0 ${art.sheen}`} />
      <div className="absolute inset-x-0 top-0 h-[43%] bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(15,23,42,0.14))]" />

      <div className={`relative z-10 flex h-full flex-col transition duration-300 ${expanded ? "opacity-100" : "opacity-0"}`}>
        <div className="flex items-center justify-between px-5 py-4 text-sm font-black text-slate-900">
          <button type="button" className="text-sky-600" onClick={onClose}>
            ← 조건식
          </button>
          <span>상세</span>
          <span className="w-14 text-right text-slate-400">식톡</span>
        </div>

        <div className="h-[38%] shrink-0 px-4">
          <div className="h-full rounded-[1.75rem] border border-white/35 bg-transparent" />
        </div>

        <div className="relative -mt-4 flex-1 overflow-y-auto rounded-t-[2rem] bg-white px-5 pb-6 pt-5">
          <div className="flex flex-wrap gap-2">
            <Badge tone={getTone(template.category)}>{categoryLabel}</Badge>
            <Badge>{marketLabel}</Badge>
            <Badge tone={template.difficulty === "easy" ? "blue" : template.difficulty === "medium" ? "amber" : "rose"}>
              {template.difficulty === "easy" ? "쉬움" : template.difficulty === "medium" ? "보통" : "고급"}
            </Badge>
          </div>

          <h2 className="mt-4 text-3xl font-black leading-tight text-slate-950">{template.title}</h2>
          <p className="mt-4 text-base font-semibold leading-7 text-slate-700">{template.plainKorean}</p>
          <p className="mt-3 text-sm leading-6 text-slate-500">{template.whyUse}</p>

          <div className="mt-5 rounded-[1.5rem] bg-slate-50 p-4">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">필요한 입력</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {template.requiredInputs.map((input) => (
                <span key={input} className="rounded-full bg-white px-3 py-2 text-sm font-semibold text-slate-700 ring-1 ring-slate-200">
                  {input}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {template.tags.map((tag) => (
              <span key={tag} className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-500">
                #{tag}
              </span>
            ))}
          </div>

          <div className="mt-6 grid gap-2">
            <Link
              href={`/app?idea=${encodeURIComponent(buildIdeaFromCondition(template))}`}
              className="rounded-2xl bg-slate-950 px-4 py-3 text-center text-sm font-black text-white"
            >
              카드로 만들기
            </Link>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="secondary" className="rounded-2xl px-2" onClick={() => onRequestApply(template, "tradingview")}>
                트레이딩뷰 적용
              </Button>
              <Button variant="secondary" className="rounded-2xl px-2" onClick={() => onRequestApply(template, "yestrader")}>
                예스트레이더 적용
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
