import { createId } from "./id";
import type {
  AnalyticsEvent,
  ConversionPlatform,
  ConversionRequest,
  MockBacktestReport,
  StrategyCard,
  StrategyType,
} from "./types";

const keys = {
  strategies: "siktalk.strategies",
  reports: "siktalk.reports",
  events: "siktalk.events",
  waitlist: "siktalk.waitlist",
};

function safeRead<T>(key: string): T[] {
  if (typeof window === "undefined") return [];
  try {
    const value = window.localStorage.getItem(key);
    if (!value) return [];
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

function safeWrite<T>(key: string, value: T[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

export function getStrategies(): StrategyCard[] {
  return safeRead<StrategyCard>(keys.strategies);
}

export function saveStrategy(strategy: StrategyCard): void {
  const strategies = getStrategies();
  const next = {
    ...strategy,
    isSaved: true,
    updatedAt: new Date().toISOString(),
  };
  safeWrite(keys.strategies, [next, ...strategies.filter((item) => item.id !== strategy.id)]);
}

export function updateStrategy(strategy: StrategyCard): void {
  const strategies = getStrategies();
  safeWrite(
    keys.strategies,
    strategies.map((item) => (item.id === strategy.id ? strategy : item)),
  );
}

export function deleteStrategy(id: string): void {
  safeWrite(
    keys.strategies,
    getStrategies().filter((strategy) => strategy.id !== id),
  );
}

export function getReports(): MockBacktestReport[] {
  return safeRead<MockBacktestReport>(keys.reports);
}

export function saveReport(report: MockBacktestReport): void {
  const reports = getReports();
  safeWrite(keys.reports, [report, ...reports.filter((item) => item.strategyId !== report.strategyId)]);
}

export function getEvents(): AnalyticsEvent[] {
  return safeRead<AnalyticsEvent>(keys.events);
}

export function addEvent(event: AnalyticsEvent): void {
  safeWrite(keys.events, [event, ...getEvents()]);
}

export function getConversionRequests(): ConversionRequest[] {
  return safeRead<ConversionRequest>(keys.waitlist);
}

export function addConversionRequest(request: ConversionRequest): void {
  safeWrite(keys.waitlist, [request, ...getConversionRequests()]);
}

export function recordConversionClick(
  strategyId: string,
  platform: ConversionPlatform,
  strategyType: StrategyType,
  source: ConversionRequest["source"] = "card",
): void {
  const createdAt = new Date().toISOString();
  addEvent({ type: "conversion_clicked", strategyId, platform, createdAt });
  addConversionRequest({
    id: createId("conversion"),
    strategyId,
    platform,
    strategyType,
    requestedSection: "full",
    createdAt,
    source,
    intentLevel: "click",
  });
}
