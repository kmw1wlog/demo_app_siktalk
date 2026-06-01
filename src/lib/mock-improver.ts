import type { MockBacktestReport, StrategyCard } from "./types";

export function generateImprovementAdvice(
  strategy: StrategyCard,
  report: MockBacktestReport,
): string[] {
  return [
    `이 전략에서 확인된 장점: ${strategy.title}은 조건을 진입, 청산, 필터로 나눠 다시 살펴볼 수 있어 다음 실험을 정하기 쉽습니다.`,
    report.totalReturnPct >= 0
      ? "이 전략은 특정 구간에서는 방향성이 맞을 때 손익이 비교적 명확하게 드러났습니다."
      : "첫 결과가 나쁘더라도 알게 된 것이 있습니다. 어떤 시간대와 장세에서 신호가 약해지는지 분리해 볼 수 있습니다.",
    `가장 큰 약점: ${report.weaknesses[0]}`,
    `잘 먹힌 구간: ${report.bestTimeSlots.join(", ")}에서 상대적으로 해석이 쉬웠습니다.`,
    `안 먹힌 구간: ${report.weakTimeSlots.join(", ")}에서는 신호를 줄이거나 관찰 기준을 보수적으로 둘 필요가 있습니다.`,
    `개선 후보: ${report.improvementCandidates.join(", ")}.`,
    "다음 20분 동안 해볼 실험: 거래대금 필터 강화, 손절 기준 추가, 시장 지수 방향 필터를 각각 하나씩 켜고 꺼보며 결과 차이를 비교합니다.",
    "현재 결과는 미래 수익을 의미하지 않으며, 전략 이해를 위한 가상 검증입니다.",
  ];
}
