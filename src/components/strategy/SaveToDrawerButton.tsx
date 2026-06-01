"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { addEvent, saveStrategy } from "@/lib/storage";
import type { StrategyCard } from "@/lib/types";

export function SaveToDrawerButton({ strategy }: { strategy: StrategyCard }) {
  const [saved, setSaved] = useState(strategy.isSaved);

  function handleSave() {
    saveStrategy({ ...strategy, isSaved: true });
    addEvent({ type: "strategy_saved", strategyId: strategy.id, createdAt: new Date().toISOString() });
    setSaved(true);
  }

  return (
    <Button variant={saved ? "secondary" : "primary"} onClick={handleSave}>
      {saved ? "식 서랍에 저장됨" : "식 서랍에 저장"}
    </Button>
  );
}
