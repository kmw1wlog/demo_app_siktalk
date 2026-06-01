import { describe, expect, it } from "vitest";
import { generateMockBacktestReport } from "@/lib/mock-backtest";
import { parseStrategyIdea } from "@/lib/strategy-parser";

const strategy = {
  ...parseStrategyIdea("거래량이 늘고 전고점을 돌파하면 보고 싶어."),
  id: "strategy_test_seed",
};

describe("generateMockBacktestReport", () => {
  it("같은 strategy.id는 같은 리포트 값을 반환한다", () => {
    const first = generateMockBacktestReport(strategy);
    const second = generateMockBacktestReport(strategy);
    expect(first.totalReturnPct).toBe(second.totalReturnPct);
    expect(first.winRatePct).toBe(second.winRatePct);
    expect(first.tradeCount).toBe(second.tradeCount);
  });

  it("리포트 지표가 지정 범위 안에 있다", () => {
    const report = generateMockBacktestReport(strategy);
    expect(report.totalReturnPct).toBeGreaterThanOrEqual(-12);
    expect(report.totalReturnPct).toBeLessThanOrEqual(18);
    expect(report.winRatePct).toBeGreaterThanOrEqual(32);
    expect(report.winRatePct).toBeLessThanOrEqual(68);
    expect(report.averagePnlPct).toBeGreaterThanOrEqual(-1.5);
    expect(report.averagePnlPct).toBeLessThanOrEqual(2.5);
    expect(report.maxDrawdownPct).toBeGreaterThanOrEqual(-28);
    expect(report.maxDrawdownPct).toBeLessThanOrEqual(-4);
    expect(report.tradeCount).toBeGreaterThanOrEqual(8);
    expect(report.tradeCount).toBeLessThanOrEqual(120);
  });

  it("disclaimer와 오라클 시나리오를 포함한다", () => {
    const report = generateMockBacktestReport(strategy);
    expect(report.disclaimer).toContain("실제 투자 추천이 아닙니다");
    expect(report.oracleScenarios.length).toBeGreaterThanOrEqual(3);
  });
});
