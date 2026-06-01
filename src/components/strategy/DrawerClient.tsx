"use client";

import { useEffect, useMemo, useState } from "react";
import { EmptyState } from "@/components/app/EmptyState";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Tabs } from "@/components/ui/Tabs";
import { strategyTypeLabels } from "@/lib/constants";
import { deleteStrategy, getReports, getStrategies } from "@/lib/storage";
import type { StrategyCard as StrategyCardType, StrategyType } from "@/lib/types";
import { StrategyCard } from "./StrategyCard";

const tabs = [
  { value: "all", label: "전체 전략" },
  { value: "recent", label: "최근 생성한 전략" },
  { value: "reported", label: "최근 모의검증한 전략" },
  { value: "breakout", label: "진입식" },
  { value: "pullback", label: "종목식" },
  { value: "meanReversion", label: "필터식" },
] as const;

type TabValue = (typeof tabs)[number]["value"];

export function DrawerClient() {
  const [strategies, setStrategies] = useState<StrategyCardType[]>([]);
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<TabValue>("all");
  const [reportedIds, setReportedIds] = useState<string[]>([]);

  function refresh() {
    setStrategies(getStrategies());
    setReportedIds(getReports().map((report) => report.strategyId));
  }

  useEffect(() => {
    refresh();
  }, []);

  const filtered = useMemo(() => {
    return strategies.filter((strategy) => {
      const matchesQuery = `${strategy.title} ${strategy.rawIdea} ${strategy.summary}`.toLowerCase().includes(query.toLowerCase());
      const matchesTab =
        tab === "all" ||
        tab === "recent" ||
        (tab === "reported" && reportedIds.includes(strategy.id)) ||
        strategy.strategyType === (tab as StrategyType);
      return matchesQuery && matchesTab;
    });
  }, [query, reportedIds, strategies, tab]);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-3xl font-black text-slate-950">식 서랍</h1>
        <p className="mt-2 text-sm text-slate-600">저장된 전략 카드 목록, 필터, 검색, 카테고리 탭을 제공합니다.</p>
      </div>
      <Input placeholder="전략명, 원문, 설명으로 검색" value={query} onChange={(event) => setQuery(event.target.value)} />
      <Tabs tabs={tabs.map((item) => ({ ...item }))} value={tab} onChange={setTab} />
      {filtered.length ? (
        <div className="space-y-4">
          {filtered.map((strategy) => (
            <div key={strategy.id} className="space-y-2">
              <StrategyCard strategy={strategy} compact />
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs text-slate-500">{strategyTypeLabels[strategy.strategyType]}</span>
                <Button
                  variant="danger"
                  onClick={() => {
                    deleteStrategy(strategy.id);
                    refresh();
                  }}
                >
                  삭제
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState title="아직 저장된 전략이 없습니다" description="홈에서 아이디어를 입력하고 식 서랍에 저장해보세요." />
      )}
    </div>
  );
}
