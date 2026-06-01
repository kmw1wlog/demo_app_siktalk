import { describe, expect, it } from "vitest";
import { conditionTemplates, getRecommendedConditionTemplates } from "@/lib/condition-templates";

describe("conditionTemplates", () => {
  it("조건식 템플릿을 80개 이상 제공한다", () => {
    expect(conditionTemplates.length).toBeGreaterThanOrEqual(80);
  });

  it("국장 돌파 온보딩에는 돌파/거래량 조건을 우선 추천한다", () => {
    const recommended = getRecommendedConditionTemplates({
      market: "koreanStock",
      setup: "breakout",
      universe: "volume",
      risk: "atr",
      pace: "intraday",
    });

    expect(recommended.length).toBeGreaterThan(0);
    expect(recommended[0].tags.join(" ")).toMatch(/돌파|거래량|ATR/);
  });
});
