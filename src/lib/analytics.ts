import { getConversionRequests, getEvents, getReports, getStrategies } from "./storage";
import type { AnalyticsEvent, ConversionPlatform, StrategyType } from "./types";

export function countBy<T extends string>(items: T[]): Record<T, number> {
  return items.reduce(
    (acc, item) => {
      acc[item] = (acc[item] ?? 0) + 1;
      return acc;
    },
    {} as Record<T, number>,
  );
}

export function topEntry<T extends string>(counts: Record<T, number>): T | undefined {
  return Object.entries(counts).sort((a, b) => Number(b[1]) - Number(a[1]))[0]?.[0] as T | undefined;
}

export function getLocalAnalytics() {
  const strategies = getStrategies();
  const reports = getReports();
  const events = getEvents();
  const requests = getConversionRequests();
  const conversionClicks = events.filter((event): event is Extract<AnalyticsEvent, { type: "conversion_clicked" }> => event.type === "conversion_clicked");
  const waitlists = events.filter((event) => event.type === "waitlist_submitted");
  const created = events.filter((event) => event.type === "strategy_created");
  const saved = events.filter((event) => event.type === "strategy_saved");

  const typeCounts = countBy(
    strategies.map((strategy) => strategy.strategyType).concat(
      created.map((event) => ("strategyType" in event ? event.strategyType : "dayTrading")),
    ) as StrategyType[],
  );
  const platformCounts = countBy(conversionClicks.map((event) => event.platform) as ConversionPlatform[]);

  return {
    strategies,
    reports,
    events,
    requests,
    conversionClicks,
    waitlists,
    created,
    saved,
    typeCounts,
    platformCounts,
    totalStrategies: Math.max(strategies.length, created.length),
    savedStrategies: strategies.length || saved.length,
    reportCount: reports.length,
    conversionCount: requests.length || conversionClicks.length,
    topStrategyType: topEntry(typeCounts),
    topPlatform: topEntry(platformCounts),
  };
}

export function pct(part: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((part / total) * 100);
}
