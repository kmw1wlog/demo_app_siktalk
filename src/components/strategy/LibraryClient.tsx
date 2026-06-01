"use client";

import { useState } from "react";
import { ChartScene } from "@/components/media/ChartScene";
import { assetSpecs, libraryDemoAssets, libraryLongRead, libraryPlatformCopies } from "@/lib/demo-media";

type PlatformTab = keyof typeof libraryPlatformCopies;

const platformTabs: { id: PlatformTab; label: string }[] = [
  { id: "natural", label: "자연어" },
  { id: "tradingview", label: "TradingView" },
  { id: "kiwoom", label: "키움" },
  { id: "yestrader", label: "예스트레이더" },
  { id: "telegram", label: "Telegram" },
];

export function LibraryClient() {
  const [selectedId, setSelectedId] = useState(libraryDemoAssets[0].id);
  const [activeTab, setActiveTab] = useState<PlatformTab>("tradingview");
  const [showRead, setShowRead] = useState(false);
  const [copyStatus, setCopyStatus] = useState("");
  const selected = libraryDemoAssets.find((asset) => asset.id === selectedId) ?? libraryDemoAssets[0];
  const related = libraryDemoAssets.filter((asset) => asset.id !== selected.id);

  async function copyCurrent() {
    try {
      await navigator.clipboard.writeText(libraryPlatformCopies[activeTab]);
      setCopyStatus("복사했습니다.");
    } catch {
      setCopyStatus("복사에 실패했습니다. 내용을 직접 선택해주세요.");
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
        <div>
          <h1 className="text-3xl font-black text-slate-950">자료실</h1>
          <p className="mt-2 text-sm font-semibold text-slate-500">영상으로 먼저 보고, 바로 아래에서 플랫폼별 식을 확인합니다.</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-500">
          영상 {assetSpecs.libraryMainVideo.ratio} · {assetSpecs.libraryMainVideo.requestSize}
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <main className="min-w-0 space-y-4">
          <section className="overflow-hidden rounded-lg border border-slate-200 bg-black">
            <ChartScene variant={selected.variant} motion />
          </section>

          <section className="rounded-lg border border-slate-200 bg-white">
            <div className="border-b border-slate-200 p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="flex flex-wrap gap-1.5 text-[11px] font-black">
                    <span className="rounded bg-emerald-50 px-2 py-1 text-emerald-700">{selected.category}</span>
                    <span className="rounded bg-slate-100 px-2 py-1 text-slate-600">{selected.market}</span>
                    <span className="rounded bg-slate-100 px-2 py-1 text-slate-600">{selected.difficulty}</span>
                  </div>
                  <h2 className="mt-2 text-2xl font-black text-slate-950">{selected.title}</h2>
                  <p className="mt-1 text-sm font-semibold text-slate-500">{selected.summary}</p>
                </div>
                <button
                  type="button"
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-black text-slate-800"
                  onClick={() => void copyCurrent()}
                >
                  현재 탭 복사
                </button>
              </div>
            </div>

            <div className="border-b border-slate-200 p-3">
              <div className="flex flex-wrap gap-2">
                {platformTabs.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    className={`rounded px-3 py-2 text-sm font-black ${
                      activeTab === tab.id ? "bg-slate-950 text-white" : "bg-slate-100 text-slate-600"
                    }`}
                    onClick={() => {
                      setActiveTab(tab.id);
                      setCopyStatus("");
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <pre className="max-h-[360px] overflow-auto bg-[#07111f] p-4 text-xs leading-5 text-slate-100">
              <code>{libraryPlatformCopies[activeTab]}</code>
            </pre>
            {copyStatus ? <p className="border-t border-slate-200 p-3 text-sm font-bold text-emerald-700">{copyStatus}</p> : null}
          </section>

          <section className="rounded-lg border border-slate-200 bg-white">
            <button
              type="button"
              className="flex w-full items-center justify-between px-4 py-4 text-left text-base font-black text-slate-950"
              onClick={() => setShowRead((value) => !value)}
            >
              <span>텍스트 설명</span>
              <span className="text-xl">{showRead ? "−" : "+"}</span>
            </button>
            {showRead ? (
              <div className="space-y-3 border-t border-slate-200 p-4 text-sm font-semibold leading-6 text-slate-600">
                {libraryLongRead.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            ) : null}
          </section>
        </main>

        <aside className="space-y-3 lg:sticky lg:top-20 lg:self-start">
          <h3 className="text-sm font-black text-slate-500">연관 조건식</h3>
          {related.map((asset) => (
            <button
              key={asset.id}
              type="button"
              className="grid w-full grid-cols-[150px_minmax(0,1fr)] gap-3 rounded-lg border border-slate-200 bg-white p-2 text-left transition hover:border-slate-400"
              onClick={() => {
                setSelectedId(asset.id);
                setShowRead(false);
                setCopyStatus("");
              }}
            >
              <ChartScene variant={asset.variant} compact />
              <div className="min-w-0 py-1">
                <p className="text-xs font-black text-emerald-700">{asset.category} · {asset.market}</p>
                <p className="mt-1 line-clamp-2 text-sm font-black leading-5 text-slate-950">{asset.title}</p>
                <p className="mt-1 line-clamp-2 text-xs font-semibold leading-4 text-slate-500">{asset.summary}</p>
              </div>
            </button>
          ))}
          <div className="rounded-lg border border-slate-200 bg-white p-3 text-xs font-bold leading-5 text-slate-500">
            연관 이미지는 조건식 상단 6개 자산 중 자료실 첫 행과 중복 사용합니다. 우측 썸네일 권장 생성 규격은 {assetSpecs.libraryRelatedImage.requestSize}입니다.
          </div>
        </aside>
      </div>
    </div>
  );
}
