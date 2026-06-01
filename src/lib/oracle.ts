import type { MockBacktestReport, OracleScenario, StrategyCard } from "./types";

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function generateOracleScenarios(
  strategy: StrategyCard,
  report: MockBacktestReport,
): OracleScenario[] {
  const base = report.totalReturnPct;
  const scenarios: OracleScenario[] = [
    {
      label: "거래량 임계치 강화",
      change: "평균 대비 거래량 조건을 조금 더 엄격하게 두어 약한 신호를 줄입니다.",
      observedReturnPct: Number(clamp(base + 2.4, -12, 18).toFixed(1)),
      riskNote: "신호 수가 줄어들어 좋은 기회를 놓칠 수 있습니다. 이 수치는 실제 미래 수익이 아니라, 인앱 가상 데이터에서 관찰된 개선 가능성입니다.",
      overfitRisk: "medium",
    },
    {
      label: "손절폭 축소",
      change: "조건 실패 시 더 빠르게 관찰을 종료하는 손절 기준을 추가합니다.",
      observedReturnPct: Number(clamp(base + 1.2, -12, 18).toFixed(1)),
      riskNote: "너무 좁은 손절은 정상 변동에도 잦은 이탈을 만들 수 있습니다.",
      overfitRisk: report.maxDrawdownPct < -18 ? "low" : "medium",
    },
    {
      label: "시간대 필터 추가",
      change: `${report.bestTimeSlots[0] ?? "반응이 좋은 시간대"} 중심으로만 신호를 확인합니다.`,
      observedReturnPct: Number(clamp(base + 1.8, -12, 18).toFixed(1)),
      riskNote: "특정 시간대에 맞춘 결과는 기간이 바뀌면 약해질 수 있습니다.",
      overfitRisk: "high",
    },
    {
      label: "시장 지수 방향 필터",
      change: "시장 전체가 약한 날에는 신규 관찰을 줄이는 필터를 추가합니다.",
      observedReturnPct: Number(clamp(base + 2.9, -12, 18).toFixed(1)),
      riskNote: "지수 필터가 너무 강하면 개별 강세 종목을 늦게 볼 수 있습니다.",
      overfitRisk: "medium",
    },
    {
      label: "자산군 적합도 재확인",
      change: `${strategy.assetClass === "crypto" ? "고변동성 코인" : "유동성 높은 주식/ETF"} 중심으로 조건을 다시 묶습니다.`,
      observedReturnPct: Number(clamp(base + 0.9, -12, 18).toFixed(1)),
      riskNote: "자산군 변경은 거래 시간, 변동성, 수수료 구조가 달라지는 점을 같이 봐야 합니다.",
      overfitRisk: "low",
    },
  ];

  return scenarios;
}
