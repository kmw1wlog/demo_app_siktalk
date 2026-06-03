import { describe, expect, it } from "vitest";
import {
  MAX_ASSISTANT_TURNS,
  createStrategyFromConditionCandidate,
  planConditionAssistant,
  retrieveConditionCandidates,
} from "@/lib/condition-assistant";

describe("condition assistant", () => {
  it("RSI 요청에 RSI 조건식을 우선 추천한다", () => {
    const candidates = retrieveConditionCandidates("코인에서 RSI 과매도 반등 조건식 찾아줘", "crypto");
    expect(candidates[0]?.title).toContain("RSI");
  });

  it("모호한 첫 요청에는 후속 질문으로 좁힌다", () => {
    const plan = planConditionAssistant({
      rawIdea: "좋은 조건식 추천해줘",
      selectedMarket: "koreanStock",
      turn: 1,
    });

    expect(plan.stage).toBe("clarify");
    expect(plan.followUpOptions.length).toBeGreaterThan(0);
    expect(plan.turn).toBe(1);
    expect(plan.maxTurns).toBe(MAX_ASSISTANT_TURNS);
  });

  it("구체적인 요청은 바로 추천 단계로 보낸다", () => {
    const plan = planConditionAssistant({
      rawIdea: "국장에서 거래량 돌파 관찰식 찾아줘",
      selectedMarket: "koreanStock",
      turn: 1,
    });

    expect(plan.stage).toBe("recommend");
    expect(plan.candidates[0]?.title).toContain("거래량");
  });

  it("후보를 전략 카드로 변환한다", () => {
    const strategy = createStrategyFromConditionCandidate(
      "condition_base_1",
      "국장에서 거래량 붙는 돌파 조건식을 카드로 만들고 싶어",
    );

    expect(strategy).not.toBeNull();
    expect(strategy?.title).toBe("거래량 급증 돌파");
    expect(strategy?.conditions.entry[0]).toContain("최근 평균 거래량");
  });
});
