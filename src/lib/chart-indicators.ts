import { RSI, SMA, Stochastic } from "technicalindicators";
import type { HynixChartCandle } from "@/lib/kis-minute-chart";

export type IndicatorPoint = {
  time: number;
  value: number;
};

export type StochasticResult = {
  k: IndicatorPoint[];
  d: IndicatorPoint[];
};

export function calculateSma(candles: HynixChartCandle[], length: number) {
  if (length < 1 || candles.length < length) {
    return [] as IndicatorPoint[];
  }

  const values = SMA.calculate({
    period: length,
    values: candles.map((candle) => candle.close),
  });

  return values.map((value, index) => ({
    time: candles[index + length - 1].time,
    value: round(value),
  }));
}

export function calculateRsi(candles: HynixChartCandle[], length: number) {
  if (length < 2 || candles.length <= length) {
    return [] as IndicatorPoint[];
  }

  const values = RSI.calculate({
    period: length,
    values: candles.map((candle) => candle.close),
  });

  return values.map((value, index) => ({
    time: candles[index + length].time,
    value: round(value),
  }));
}

export function calculateStochastic(candles: HynixChartCandle[], kLength: number, dLength: number): StochasticResult {
  if (kLength < 1 || dLength < 1 || candles.length < kLength) {
    return { k: [], d: [] };
  }

  const values = Stochastic.calculate({
    high: candles.map((candle) => candle.high),
    low: candles.map((candle) => candle.low),
    close: candles.map((candle) => candle.close),
    period: kLength,
    signalPeriod: dLength,
  });

  return {
    k: values
      .map((value, index) => ({
        time: candles[index + kLength - 1].time,
        value: round(value.k),
      }))
      .filter((point) => Number.isFinite(point.value)),
    d: values
      .map((value, index) => ({
        time: candles[index + kLength - 1].time,
        value: round(value.d),
      }))
      .filter((point) => Number.isFinite(point.value)),
  };
}

function round(value: number) {
  return Math.round(value * 100) / 100;
}
