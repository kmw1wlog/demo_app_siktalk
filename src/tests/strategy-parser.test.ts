import { describe, expect, it } from "vitest";
import { parseStrategyIdea } from "@/lib/strategy-parser";

describe("parseStrategyIdea", () => {
  it("빈 문자열은 카드 생성을 막는다", () => {
    expect(() => parseStrategyIdea("   ")).toThrow();
  });

  it("거래량, 전고점, 돌파 입력은 breakout 전략으로 분류한다", () => {
    const card = parseStrategyIdea("거래량이 늘고 전고점을 돌파하면 보고 싶어.");
    expect(card.strategyType).toBe("breakout");
  });

  it("RSI와 반등 입력은 meanReversion 전략으로 분류한다", () => {
    const card = parseStrategyIdea("RSI가 낮다가 반등하면 알림 받고 싶어.");
    expect(card.strategyType).toBe("meanReversion");
  });

  it("코인과 BTC 입력은 crypto 자산군으로 분류한다", () => {
    const card = parseStrategyIdea("코인 BTC가 1분봉에서 거래량이 붙으면 보고 싶어.");
    expect(card.assetClass).toBe("crypto");
  });

  it("코인 5분봉 급등 입력은 코인 초입 전략으로 제목을 잡는다", () => {
    const card = parseStrategyIdea("코인 5분봉에서 거래량이 급증하고 박스권 상단을 돌파하면 보고 싶어.");
    expect(card.assetClass).toBe("crypto");
    expect(card.strategyType).toBe("scalping");
    expect(card.title).toContain("코인 5분봉");
  });

  it("생성된 전략 카드는 필수 필드를 가진다", () => {
    const card = parseStrategyIdea("갭 상승 후 눌림목이 오면 진입하고 싶어.");
    expect(card.id).toBeTruthy();
    expect(card.title).toBeTruthy();
    expect(card.conditions.entry.length).toBeGreaterThan(0);
    expect(card.conditions.exit.length).toBeGreaterThan(0);
    expect(card.conditions.universe.length).toBeGreaterThan(0);
    expect(card.conditions.filters.length).toBeGreaterThan(0);
    expect(card.riskSummary).toBeTruthy();
    expect(card.validationIdea).toContain("실제 투자 추천이 아닙니다");
  });
});
