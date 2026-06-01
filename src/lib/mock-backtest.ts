import { INVESTMENT_DISCLAIMER } from "./constants";
import { createDeterministicId, hashString } from "./id";
import { generateOracleScenarios } from "./oracle";
import type { MockBacktestReport, StrategyCard, StrategyType } from "./types";

function seededUnit(seed: string, salt: string): number {
  return hashString(`${seed}:${salt}`) / 0xffffffff;
}

function range(seed: string, salt: string, min: number, max: number): number {
  return min + seededUnit(seed, salt) * (max - min);
}

function intRange(seed: string, salt: string, min: number, max: number): number {
  return Math.round(range(seed, salt, min, max));
}

function typeBias(strategyType: StrategyType): number {
  const biases: Record<StrategyType, number> = {
    scalping: -1.2,
    dayTrading: 0.2,
    swing: 1.1,
    closingBet: 0.5,
    breakout: 2.2,
    pullback: 1.4,
    meanReversion: 0.7,
    volatility: 0.8,
    newsDisclosure: -0.6,
    fundamentalFilter: 1.0,
    marketRegimeFilter: 1.7,
  };
  return biases[strategyType];
}

export function generateMockBacktestReport(strategy: StrategyCard): MockBacktestReport {
  const seed = strategy.id;
  const bias = typeBias(strategy.strategyType);
  const totalReturnPct = Number(Math.max(-12, Math.min(18, range(seed, "return", -10, 15) + bias)).toFixed(1));
  const winRatePct = Number(Math.max(32, Math.min(68, range(seed, "win", 34, 66) + bias)).toFixed(1));
  const averagePnlPct = Number(Math.max(-1.5, Math.min(2.5, range(seed, "pnl", -1.2, 2.1) + bias / 10)).toFixed(1));
  const maxDrawdownPct = Number((-1 * range(seed, "dd", 4, 28)).toFixed(1));
  const tradeCount = intRange(seed, "trades", 8, 120);

  const bestTimeSlots =
    strategy.timeframe === "daily"
      ? ["장 마감 전 40분", "전일 대비 거래대금 확인 구간"]
      : ["오전 9:20-10:20", "오후 2:00-2:50"];
  const weakTimeSlots =
    strategy.strategyType === "breakout"
      ? ["점심 유동성 공백", "시장 급락 직후"]
      : ["개장 직후 과열 구간", "뉴스 소멸 직후"];

  const bestAssetFit =
    strategy.assetClass === "crypto"
      ? ["코인 고변동성 구간", "거래량이 유지되는 대형 코인"]
      : ["유동성 높은 국내/미국 주식", "ETF 또는 대형주 중심"];

  const weakAssetFit =
    strategy.assetClass === "crypto"
      ? ["거래량이 얇은 알트코인", "스프레드가 넓은 구간"]
      : ["거래대금이 낮은 소형주", "뉴스만 있고 거래 반응이 약한 종목"];

  const plainLanguageSummary =
    tradeCount > 70
      ? "많이 잡지만 헛신호도 많은 전략입니다. 거래량 필터와 시장 국면 필터를 더하면 신호 품질을 확인하기 좋습니다."
      : totalReturnPct > 4
        ? "적게 잡지만 맞을 때 강한 전략입니다. 다만 손절 기준이 없으면 최대 손실 구간이 커질 수 있습니다."
        : "첫 결과는 조심스럽지만, 어떤 장세에서 약한지 알 수 있는 전략 이해용 출발점입니다.";

  const reportBase: Omit<MockBacktestReport, "oracleScenarios"> = {
    id: createDeterministicId("report", strategy.id),
    strategyId: strategy.id,
    generatedAt: new Date(hashString(strategy.id) * 1000).toISOString(),
    disclaimer: INVESTMENT_DISCLAIMER,
    totalReturnPct,
    winRatePct,
    averagePnlPct,
    maxDrawdownPct,
    tradeCount,
    bestTimeSlots,
    weakTimeSlots,
    bestAssetFit,
    weakAssetFit,
    plainLanguageSummary,
    strengths: [
      "조건이 문장으로 분해되어 신호가 발생하는 이유를 설명하기 쉽습니다.",
      strategy.strategyType === "breakout"
        ? "거래량이 동반된 돌파 구간에서는 비교적 명확한 신호를 제공합니다."
        : "반복 관찰할 수 있는 기준을 만들기 좋습니다.",
    ],
    weaknesses: [
      "시장 전체가 약한 날에는 조건이 맞아도 되돌림이 빠르게 발생할 수 있습니다.",
      "거래량 필터가 약하면 신호 수에 비해 품질이 떨어질 수 있습니다.",
    ],
    warnings: [
      "현재 결과는 미래 수익을 의미하지 않으며, 전략 이해를 위한 가상 검증입니다.",
      "손절 기준이 없으면 최대 손실 구간이 커질 수 있음.",
    ],
    improvementCandidates: [
      "거래량 필터 강화 필요",
      "시장 국면 필터 추가 필요",
      "손절과 관찰 종료 기준을 더 구체화하기",
    ],
  };

  return {
    ...reportBase,
    oracleScenarios: generateOracleScenarios(strategy, reportBase as MockBacktestReport),
  };
}
