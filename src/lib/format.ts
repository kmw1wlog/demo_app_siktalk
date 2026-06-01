import type { AssetClass, ConversionPlatform, Timeframe } from "./types";
import { platformLabels } from "./constants";

export function formatPct(value: number): string {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}%`;
}

export function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function assetClassLabel(assetClass: AssetClass): string {
  const labels: Record<AssetClass, string> = {
    koreanStock: "국내주식",
    usStock: "미국주식",
    crypto: "코인",
    etf: "ETF",
    futures: "선물",
    unknown: "미정",
  };
  return labels[assetClass];
}

export function timeframeLabel(timeframe: Timeframe): string {
  const labels: Record<Timeframe, string> = {
    "1m": "1분봉",
    "3m": "3분봉",
    "5m": "5분봉",
    "15m": "15분봉",
    "1h": "1시간봉",
    daily: "일봉",
    weekly: "주봉",
    unknown: "미정",
  };
  return labels[timeframe];
}

export function conversionPlatformLabel(platform: ConversionPlatform): string {
  return platformLabels[platform];
}
