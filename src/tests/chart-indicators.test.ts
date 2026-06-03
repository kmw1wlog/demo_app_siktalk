import { describe, expect, it } from "vitest";
import { calculateRsi, calculateSma, calculateStochastic } from "@/lib/chart-indicators";
import type { HynixChartCandle } from "@/lib/kis-minute-chart";

const candles: HynixChartCandle[] = [
  { time: 1, open: 10, high: 11, low: 9, close: 10, volume: 100 },
  { time: 2, open: 10, high: 12, low: 10, close: 11, volume: 110 },
  { time: 3, open: 11, high: 13, low: 11, close: 12, volume: 120 },
  { time: 4, open: 12, high: 14, low: 12, close: 13, volume: 130 },
  { time: 5, open: 13, high: 15, low: 13, close: 14, volume: 140 },
  { time: 6, open: 14, high: 16, low: 14, close: 15, volume: 150 },
  { time: 7, open: 15, high: 17, low: 15, close: 16, volume: 160 },
];

describe("chart indicators", () => {
  it("calculates sma with aligned output length", () => {
    const result = calculateSma(candles, 3);
    expect(result).toHaveLength(5);
    expect(result[0]).toEqual({ time: 3, value: 11 });
    expect(result.at(-1)).toEqual({ time: 7, value: 15 });
  });

  it("calculates rsi without producing invalid values", () => {
    const result = calculateRsi(candles, 3);
    expect(result.length).toBeGreaterThan(0);
    result.forEach((point) => {
      expect(point.value).toBeGreaterThanOrEqual(0);
      expect(point.value).toBeLessThanOrEqual(100);
    });
  });

  it("calculates stochastic k/d ranges", () => {
    const result = calculateStochastic(candles, 3, 3);
    expect(result.k.length).toBeGreaterThan(0);
    expect(result.d.length).toBeGreaterThan(0);
    [...result.k, ...result.d].forEach((point) => {
      expect(point.value).toBeGreaterThanOrEqual(0);
      expect(point.value).toBeLessThanOrEqual(100);
    });
  });
});
