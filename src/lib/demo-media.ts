export type ChartSceneVariant =
  | "volumeBreakout"
  | "moneyRank"
  | "closingHold"
  | "openRetest"
  | "gapPullback"
  | "rsiBounce";

export function resolveChartSceneVariant(input: { title: string; strategyType: string; rawIdea?: string }): ChartSceneVariant {
  const text = `${input.title} ${input.rawIdea ?? ""}`.toLowerCase();

  if (text.includes("rsi") || text.includes("볼린저") || text.includes("과매도")) return "rsiBounce";
  if (text.includes("갭") || text.includes("눌림")) return "gapPullback";
  if (text.includes("시초가")) return "openRetest";
  if (text.includes("종가") || text.includes("장 막판")) return "closingHold";
  if (text.includes("거래대금")) return "moneyRank";
  if (text.includes("거래량") || text.includes("돌파") || input.strategyType === "breakout") return "volumeBreakout";
  return "moneyRank";
}
