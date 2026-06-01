import type { PaperCandle } from "./types";

export function createVirtualCandles(length = 80): PaperCandle[] {
  const candles: PaperCandle[] = [];
  let close = 100;
  for (let index = 0; index < length; index += 1) {
    const drift = Math.sin(index / 8) * 1.4 + (index % 17 === 0 ? 3.2 : 0) - (index % 23 === 0 ? 2.4 : 0);
    const open = close;
    close = Math.max(72, open + drift);
    const high = Math.max(open, close) + 1.3;
    const low = Math.min(open, close) - 1.2;
    const atr = Math.abs(close - open) + 1.1;
    const volume = 120_000 + ((index * 7331) % 90_000);
    candles.push({ index, open, high, low, close, atr, volume });
  }
  return candles;
}

export function paperSignal(candles: PaperCandle[], cursor: number): string {
  const current = candles[cursor];
  const prev = candles[cursor - 1];
  if (!current || !prev) return "관찰";
  if (current.close > prev.close && current.volume > prev.volume) return "상승 재가속 관찰";
  if (current.close < prev.close && current.atr > prev.atr) return "변동성 경계";
  return "기준 대기";
}
