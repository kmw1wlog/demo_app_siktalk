"use client";

import type { ChartSceneVariant } from "@/lib/demo-media";

const sceneText: Record<ChartSceneVariant, { label: string; caption: string; path: string }> = {
  volumeBreakout: {
    label: "volume breakout",
    caption: "고점 돌파 + 거래량 급증",
    path: "M8 118 C36 116 48 110 72 112 C98 114 112 101 132 98 C152 94 166 102 186 95 C214 84 222 62 250 50 C270 42 288 34 316 24",
  },
  moneyRank: {
    label: "money rank",
    caption: "거래대금 상위 유지",
    path: "M8 122 C38 117 54 104 82 106 C116 109 128 92 158 88 C190 83 210 73 238 66 C268 58 292 60 316 52",
  },
  closingHold: {
    label: "closing hold",
    caption: "장 막판 고가권 유지",
    path: "M8 120 C42 98 58 72 92 70 C124 68 138 76 168 70 C198 63 224 65 252 60 C282 56 300 58 316 54",
  },
  openRetest: {
    label: "open retest",
    caption: "시초가 지지 후 재돌파",
    path: "M8 124 C30 92 54 78 84 82 C112 86 126 98 154 92 C186 86 198 72 224 66 C254 58 286 50 316 38",
  },
  gapPullback: {
    label: "gap pullback",
    caption: "갭 상승 뒤 첫 눌림",
    path: "M8 130 C28 128 36 126 52 125 C72 70 100 66 124 72 C154 82 176 94 204 82 C232 69 272 58 316 44",
  },
  rsiBounce: {
    label: "rsi bounce",
    caption: "과매도권 반등",
    path: "M8 82 C34 104 58 126 92 124 C124 122 142 112 164 102 C196 88 224 70 252 62 C282 52 302 45 316 38",
  },
};

export function ChartScene({
  variant,
  motion = false,
  compact = false,
}: {
  variant: ChartSceneVariant;
  motion?: boolean;
  compact?: boolean;
}) {
  const scene = sceneText[variant];
  const bars = variant === "volumeBreakout"
    ? [22, 18, 24, 21, 28, 26, 76, 94]
    : variant === "rsiBounce"
      ? [34, 42, 48, 40, 36, 44, 62, 66]
      : [26, 31, 38, 34, 45, 48, 52, 56];

  return (
    <div className={`relative aspect-video overflow-hidden rounded-lg bg-[#07111f] text-white ${motion ? "chart-scene-motion" : ""}`}>
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0)),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(180deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:100%_100%,40px_40px,40px_40px]" />
      <div className="absolute left-3 top-3 rounded bg-white/10 px-2 py-1 text-[10px] font-bold uppercase text-emerald-200">
        {scene.label}
      </div>
      <svg viewBox="0 0 324 148" className="absolute inset-x-4 top-8 h-[58%] w-[calc(100%-2rem)] overflow-visible">
        <path d="M8 96 H316" stroke="rgba(16,185,129,0.45)" strokeWidth="2" strokeDasharray="6 6" />
        <path d={scene.path} fill="none" stroke="#34d399" strokeWidth="4" strokeLinecap="round" />
        <circle cx="250" cy={variant === "volumeBreakout" ? "50" : "62"} r="5" fill="#f8fafc" />
      </svg>
      {variant === "rsiBounce" ? (
        <div className="absolute inset-x-4 bottom-10 h-10 rounded border border-white/10 bg-white/5">
          <div className="absolute inset-x-0 top-6 border-t border-rose-300/40" />
          <svg viewBox="0 0 324 40" className="h-full w-full">
            <path d="M8 30 C58 32 98 34 126 26 C170 14 214 18 316 8" fill="none" stroke="#93c5fd" strokeWidth="3" />
          </svg>
        </div>
      ) : (
        <div className="absolute inset-x-4 bottom-9 flex h-12 items-end gap-1">
          {bars.map((height, index) => (
            <span
              key={`${variant}-${index}`}
              className="flex-1 rounded-t bg-emerald-300/70"
              style={{ height: `${height}%` }}
            />
          ))}
        </div>
      )}
      <div className="absolute inset-x-3 bottom-3 flex items-center justify-between gap-3">
        <p className="truncate text-xs font-black text-slate-100">{scene.caption}</p>
        {!compact ? <span className="rounded bg-emerald-400 px-2 py-1 text-[10px] font-black text-slate-950">WATCH</span> : null}
      </div>
    </div>
  );
}
