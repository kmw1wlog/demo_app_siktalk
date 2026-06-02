"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { platformLabels } from "@/lib/constants";
import { addEvent, recordConversionClick } from "@/lib/storage";
import type { ConversionPlatform, StrategyCard } from "@/lib/types";
import { FakeDoorModal } from "./FakeDoorModal";

const platforms: ConversionPlatform[] = [
  "tradingview",
  "kiwoom",
  "yestrader",
  "mts",
  "webhook",
  "telegram",
];

export function ConversionButtons({ strategy }: { strategy: StrategyCard }) {
  const [selected, setSelected] = useState<ConversionPlatform | null>(null);
  const [message, setMessage] = useState("");

  function open(platform: ConversionPlatform) {
    if (platform === "tradingview" || platform === "yestrader") {
      addEvent({
        type: "apply_clicked",
        strategyId: strategy.id,
        platform,
        createdAt: new Date().toISOString(),
      });
      recordConversionClick(strategy.id, platform, strategy.strategyType, "card");
      setMessage(`${platformLabels[platform]} 적용 요청을 기록했습니다.`);
      return;
    }
    recordConversionClick(strategy.id, platform, strategy.strategyType, "card");
    setSelected(platform);
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-bold text-slate-950">플랫폼 변환 요청</h3>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {platforms.map((platform) => (
          <Button
            key={platform}
            variant="secondary"
            className="shrink-0 whitespace-nowrap rounded-full px-3 text-xs font-black"
            onClick={() => open(platform)}
          >
            {platform === "tradingview" || platform === "yestrader"
              ? `${platformLabels[platform]} 적용`
              : `${platformLabels[platform]} 요청`}
          </Button>
        ))}
      </div>
      {message ? <p className="rounded-lg bg-emerald-50 p-3 text-sm font-semibold text-emerald-700">{message}</p> : null}
      {selected ? (
        <FakeDoorModal
          strategy={strategy}
          platform={selected}
          open={Boolean(selected)}
          onClose={() => setSelected(null)}
        />
      ) : null}
    </div>
  );
}
