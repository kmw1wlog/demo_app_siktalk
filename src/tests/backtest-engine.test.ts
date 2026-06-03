import { describe, expect, it } from "vitest";
import { runLightBacktest } from "@/lib/backtest-engine";

describe("backtest engine", () => {
  it("전략을 stock_app formula 조합으로 매핑해 결과를 만든다", () => {
    const result = runLightBacktest({
      title: "5·20선 재가속 관찰식",
      rawIdea: "5일선 20일선 골든크로스와 거래량 회복이 붙을 때 관찰하고 싶어.",
    });

    expect(result.mappedFormulas.length).toBeGreaterThan(0);
    expect(result.monthlyPoints).toHaveLength(24);
    expect(result.cumulativeCurve).toHaveLength(24);
    expect(result.metrics.monthlySignalCount).toBeGreaterThan(0);
  });

  it("같은 입력에 대해 결정론적 결과를 만든다", () => {
    const left = runLightBacktest({
      title: "RSI 과매도 반등",
      rawIdea: "RSI 과매도 반등이 15분봉에서 나오는 구간을 보고 싶어.",
    });
    const right = runLightBacktest({
      title: "RSI 과매도 반등",
      rawIdea: "RSI 과매도 반등이 15분봉에서 나오는 구간을 보고 싶어.",
    });

    expect(left.strategyHash).toBe(right.strategyHash);
    expect(left.metrics.recentThreeMonthReturnPct).toBe(right.metrics.recentThreeMonthReturnPct);
  });
});
