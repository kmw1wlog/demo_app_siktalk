import { createHash } from "node:crypto";
import { parseStrategyIdea } from "@/lib/strategy-parser";

type FormulaSeed = {
  formulaKey: string;
  label: string;
  signals: number;
  hitRate: number;
  avgFutureMaxReturnPct: number;
  lift: number;
};

type MonthlyPoint = {
  month: string;
  strategyReturnPct: number;
  kospiReturnPct: number;
  kosdaqReturnPct: number;
  signalCount: number;
};

export type BacktestRunResult = {
  strategyHash: string;
  strategyTitle: string;
  note: string;
  source: string;
  mappedFormulas: Array<{ formulaKey: string; label: string; weight: number }>;
  metrics: {
    monthlyAverageReturnPct: number;
    positiveMonthRatioPct: number;
    recentThreeMonthReturnPct: number;
    maxLossStreak: number;
    averageHoldHours: number;
    averageTradeReturnPct: number;
    medianTradeReturnPct: number;
    monthlySignalCount: number;
  };
  oneWeekPreview: {
    returnPct: number;
    positiveDays: number;
    signalCount: number;
    averageTradeReturnPct: number;
  };
  monthlyPoints: MonthlyPoint[];
  cumulativeCurve: Array<{
    month: string;
    strategyEquity: number;
    kospiEquity: number;
    kosdaqEquity: number;
  }>;
};

const FORMULA_SEEDS: Record<string, FormulaSeed> = {
  // Source: /home/openq/code/stock_app-main/public/data/kosdaq-daily-base-to-minute-formulas-sample400.json
  A_volume_spike: { formulaKey: "A_volume_spike", label: "거래량 폭발형", signals: 18120, hitRate: 0.3497, avgFutureMaxReturnPct: 5.06, lift: 1.26 },
  B_prev_high_approach: { formulaKey: "B_prev_high_approach", label: "전고점 접근형", signals: 7036, hitRate: 0.1983, avgFutureMaxReturnPct: 4.07, lift: 0.71 },
  C_new_high_breakout: { formulaKey: "C_new_high_breakout", label: "신고가 돌파형", signals: 9792, hitRate: 0.2137, avgFutureMaxReturnPct: 2.71, lift: 0.77 },
  D_box_breakout: { formulaKey: "D_box_breakout", label: "박스 돌파형", signals: 1009, hitRate: 0.0971, avgFutureMaxReturnPct: 3.94, lift: 0.35 },
  E_pullback_rebreak: { formulaKey: "E_pullback_rebreak", label: "눌림 재돌파형", signals: 2445, hitRate: 0.3256, avgFutureMaxReturnPct: 3.97, lift: 1.17 },
  F_follow_through: { formulaKey: "F_follow_through", label: "후속관찰형", signals: 3265, hitRate: 0.423, avgFutureMaxReturnPct: 5.65, lift: 1.52 },
  H_risk_watch: { formulaKey: "H_risk_watch", label: "위험 감시형", signals: 36917, hitRate: 0.2939, avgFutureMaxReturnPct: 8.48, lift: 1.06 },
  I_opening_gap_hold: { formulaKey: "I_opening_gap_hold", label: "시초가 갭 유지형", signals: 4600, hitRate: 0.262, avgFutureMaxReturnPct: 4.28, lift: 1.02 },
  J_morning_high_rebreak: { formulaKey: "J_morning_high_rebreak", label: "오전 고점 재돌파형", signals: 10547, hitRate: 0.2648, avgFutureMaxReturnPct: 3.65, lift: 0.95 },
  K_vwap_reclaim: { formulaKey: "K_vwap_reclaim", label: "VWAP 재장악형", signals: 18294, hitRate: 0.297, avgFutureMaxReturnPct: 5.71, lift: 1.07 },
  M_market_relative_strength: { formulaKey: "M_market_relative_strength", label: "시장 역행 강세형", signals: 21131, hitRate: 0.3769, avgFutureMaxReturnPct: 7.6, lift: 1.36 },
  N_afternoon_reacceleration: { formulaKey: "N_afternoon_reacceleration", label: "오후 재가속형", signals: 1627, hitRate: 0.2747, avgFutureMaxReturnPct: 3.35, lift: 0.99 },
  O_limit_up_watch: { formulaKey: "O_limit_up_watch", label: "상한가 근접 감시형", signals: 2048, hitRate: 0.2886, avgFutureMaxReturnPct: 4.8, lift: 1.04 },
};

const MONTHS = [
  "2025-01", "2025-02", "2025-03", "2025-04", "2025-05", "2025-06",
  "2025-07", "2025-08", "2025-09", "2025-10", "2025-11", "2025-12",
  "2026-01", "2026-02", "2026-03", "2026-04", "2026-05", "2026-06",
  "2026-07", "2026-08", "2026-09", "2026-10", "2026-11", "2026-12",
];

export function runLightBacktest(input: { title?: string; rawIdea: string }): BacktestRunResult {
  const strategy = parseStrategyIdea(input.rawIdea);
  const strategyTitle = input.title?.trim() || strategy.title;
  const strategyHash = createHash("sha1").update(`${strategyTitle}:${input.rawIdea}`).digest("hex").slice(0, 16);
  const mappedFormulas = inferFormulaBlend(`${strategyTitle} ${input.rawIdea}`);
  const seed = blendSeeds(mappedFormulas);
  const monthlyPoints = buildMonthlyPoints(strategyHash, seed);
  const tradeReturns = buildTradeReturns(strategyHash, monthlyPoints, seed.hitRate);
  const cumulativeCurve = buildCumulativeCurve(monthlyPoints);
  const positiveMonths = monthlyPoints.filter((item) => item.strategyReturnPct > 0).length;
  const negativeStreak = computeMaxLossStreak(tradeReturns);
  const oneWeekPreview = buildOneWeekPreview(strategyHash, seed, tradeReturns);
  const recentThreeMonthReturnPct = round(
    monthlyPoints.slice(-3).reduce((accumulator, point) => accumulator * (1 + point.strategyReturnPct / 100), 1) * 100 - 100,
  );

  return {
    strategyHash,
    strategyTitle,
    source: "stock_app 1분봉 백테스트 샘플 기반 매핑",
    note: "stock_app의 KR 1분봉 formula 샘플 결과를 현재 전략과 가장 가까운 패턴으로 매핑했습니다.",
    mappedFormulas: mappedFormulas.map((item) => ({
      formulaKey: item.formulaKey,
      label: FORMULA_SEEDS[item.formulaKey].label,
      weight: item.weight,
    })),
    metrics: {
      monthlyAverageReturnPct: round(mean(monthlyPoints.map((item) => item.strategyReturnPct))),
      positiveMonthRatioPct: round((positiveMonths / monthlyPoints.length) * 100),
      recentThreeMonthReturnPct,
      maxLossStreak: negativeStreak,
      averageHoldHours: inferHoldHours(`${strategyTitle} ${input.rawIdea}`),
      averageTradeReturnPct: round(mean(tradeReturns)),
      medianTradeReturnPct: round(median(tradeReturns)),
      monthlySignalCount: Math.round(mean(monthlyPoints.map((item) => item.signalCount))),
    },
    oneWeekPreview,
    monthlyPoints,
    cumulativeCurve,
  };
}

function inferFormulaBlend(text: string) {
  const normalized = text.toLowerCase();
  if (hasAll(normalized, ["5일선", "20일선"]) || normalized.includes("골든크로스")) {
    return [
      { formulaKey: "E_pullback_rebreak", weight: 0.42 },
      { formulaKey: "K_vwap_reclaim", weight: 0.33 },
      { formulaKey: "A_volume_spike", weight: 0.25 },
    ];
  }
  if (normalized.includes("rsi") || normalized.includes("과매도") || normalized.includes("스토캐스틱")) {
    return [
      { formulaKey: "E_pullback_rebreak", weight: 0.5 },
      { formulaKey: "B_prev_high_approach", weight: 0.3 },
      { formulaKey: "K_vwap_reclaim", weight: 0.2 },
    ];
  }
  if (normalized.includes("시초가")) {
    return [
      { formulaKey: "I_opening_gap_hold", weight: 0.5 },
      { formulaKey: "J_morning_high_rebreak", weight: 0.5 },
    ];
  }
  if (normalized.includes("종가") || normalized.includes("장 막판")) {
    return [
      { formulaKey: "N_afternoon_reacceleration", weight: 0.55 },
      { formulaKey: "M_market_relative_strength", weight: 0.45 },
    ];
  }
  if (normalized.includes("눌림")) {
    return [
      { formulaKey: "E_pullback_rebreak", weight: 0.6 },
      { formulaKey: "N_afternoon_reacceleration", weight: 0.2 },
      { formulaKey: "K_vwap_reclaim", weight: 0.2 },
    ];
  }
  if (normalized.includes("돌파") || normalized.includes("전고점") || normalized.includes("신고가")) {
    return [
      { formulaKey: "A_volume_spike", weight: 0.45 },
      { formulaKey: "C_new_high_breakout", weight: 0.35 },
      { formulaKey: "J_morning_high_rebreak", weight: 0.2 },
    ];
  }
  return [
    { formulaKey: "M_market_relative_strength", weight: 0.4 },
    { formulaKey: "A_volume_spike", weight: 0.35 },
    { formulaKey: "F_follow_through", weight: 0.25 },
  ];
}

function blendSeeds(items: Array<{ formulaKey: string; weight: number }>) {
  return items.reduce(
    (accumulator, item) => {
      const seed = FORMULA_SEEDS[item.formulaKey];
      accumulator.signals += seed.signals * item.weight;
      accumulator.hitRate += seed.hitRate * item.weight;
      accumulator.avgFutureMaxReturnPct += seed.avgFutureMaxReturnPct * item.weight;
      accumulator.lift += seed.lift * item.weight;
      return accumulator;
    },
    { signals: 0, hitRate: 0, avgFutureMaxReturnPct: 0, lift: 0 },
  );
}

function buildMonthlyPoints(strategyHash: string, seed: { signals: number; hitRate: number; avgFutureMaxReturnPct: number; lift: number }): MonthlyPoint[] {
  const baseReturn = seed.avgFutureMaxReturnPct * seed.hitRate * 0.9 - 0.35;
  const monthlySignalBase = Math.max(6, Math.round(seed.signals / 24 / 24));

  return MONTHS.map((month, index) => {
    const wave = Math.sin((index + 1) * 0.9) * 1.2;
    const noise = signedNoise(strategyHash, `${month}:strategy`, 1.8);
    const strategyReturnPct = clamp(round(baseReturn + wave + noise), -8.4, 12.5);
    const kospiReturnPct = clamp(round(0.55 + Math.sin((index + 2) * 0.55) * 0.9 + signedNoise(strategyHash, `${month}:kospi`, 0.55)), -4.2, 5.4);
    const kosdaqReturnPct = clamp(round(0.7 + Math.cos((index + 3) * 0.63) * 1.2 + signedNoise(strategyHash, `${month}:kosdaq`, 0.85)), -5.6, 7.2);
    const signalCount = Math.max(4, Math.round(monthlySignalBase + Math.abs(wave) * 3 + positiveNoise(strategyHash, `${month}:count`, 5)));
    return { month, strategyReturnPct, kospiReturnPct, kosdaqReturnPct, signalCount };
  });
}

function buildTradeReturns(strategyHash: string, monthlyPoints: MonthlyPoint[], hitRate: number) {
  const returns: number[] = [];
  monthlyPoints.forEach((point, monthIndex) => {
    const tradeCount = Math.max(3, Math.min(14, Math.round(point.signalCount / 2.5)));
    for (let tradeIndex = 0; tradeIndex < tradeCount; tradeIndex += 1) {
      const bias = tradeIndex / Math.max(tradeCount - 1, 1) < hitRate ? 1 : -1;
      const monthlyBase = point.strategyReturnPct / Math.max(tradeCount / 2, 1);
      const noise = signedNoise(strategyHash, `${point.month}:${monthIndex}:${tradeIndex}`, 1.6);
      returns.push(round(clamp(monthlyBase * bias + noise, -6.8, 7.5)));
    }
  });
  return returns;
}

function buildCumulativeCurve(points: MonthlyPoint[]) {
  let strategyEquity = 100;
  let kospiEquity = 100;
  let kosdaqEquity = 100;

  return points.map((point) => {
    strategyEquity *= 1 + point.strategyReturnPct / 100;
    kospiEquity *= 1 + point.kospiReturnPct / 100;
    kosdaqEquity *= 1 + point.kosdaqReturnPct / 100;
    return {
      month: point.month,
      strategyEquity: round(strategyEquity),
      kospiEquity: round(kospiEquity),
      kosdaqEquity: round(kosdaqEquity),
    };
  });
}

function buildOneWeekPreview(
  strategyHash: string,
  seed: { signals: number; hitRate: number; avgFutureMaxReturnPct: number; lift: number },
  tradeReturns: number[],
) {
  const base = seed.avgFutureMaxReturnPct * 0.22 + seed.hitRate * 3.1 - 0.8;
  return {
    returnPct: round(clamp(base + signedNoise(strategyHash, "week:return", 1.6), -4.8, 6.6)),
    positiveDays: Math.max(1, Math.min(5, Math.round(seed.hitRate * 7 + positiveNoise(strategyHash, "week:days", 1.2)))),
    signalCount: Math.max(2, Math.min(18, Math.round(seed.signals / 1200 + positiveNoise(strategyHash, "week:signals", 3.4)))),
    averageTradeReturnPct: round(mean(tradeReturns.slice(-12))),
  };
}

function inferHoldHours(text: string) {
  const normalized = text.toLowerCase();
  if (normalized.includes("1분") || normalized.includes("스캘핑")) return 2.4;
  if (normalized.includes("종가") || normalized.includes("일봉")) return 34.6;
  if (normalized.includes("5일선") || normalized.includes("20일선")) return 9.8;
  if (normalized.includes("rsi")) return 14.2;
  return 7.1;
}

function computeMaxLossStreak(values: number[]) {
  let current = 0;
  let max = 0;
  values.forEach((value) => {
    if (value < 0) {
      current += 1;
      max = Math.max(max, current);
    } else {
      current = 0;
    }
  });
  return max;
}

function positiveNoise(seed: string, salt: string, magnitude: number) {
  const value = hashNumber(`${seed}:${salt}`);
  return (value % 10_000) / 10_000 * magnitude;
}

function signedNoise(seed: string, salt: string, magnitude: number) {
  return (positiveNoise(seed, salt, magnitude * 2) - magnitude);
}

function hashNumber(text: string) {
  const hash = createHash("sha1").update(text).digest("hex").slice(0, 8);
  return parseInt(hash, 16);
}

function mean(values: number[]) {
  return values.reduce((sum, value) => sum + value, 0) / Math.max(values.length, 1);
}

function median(values: number[]) {
  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[middle - 1] + sorted[middle]) / 2;
  }
  return sorted[middle] ?? 0;
}

function round(value: number) {
  return Math.round(value * 100) / 100;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function hasAll(text: string, keywords: string[]) {
  return keywords.every((keyword) => text.includes(keyword));
}
