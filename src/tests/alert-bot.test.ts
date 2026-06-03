import { describe, expect, it } from "vitest";
import { buildAlertBotDraft, buildAlertBotFallbackReply } from "@/lib/alert-bot";

describe("alert bot draft", () => {
  it("5/20 골든크로스 요청을 알림 초안으로 정리한다", () => {
    const draft = buildAlertBotDraft("5일선 20일선 골든크로스가 뜨면 장중에 바로 알려줘");
    expect(draft.title).toContain("5·20선");
    expect(draft.timeframe).toBe("15분봉");
    expect(draft.trigger).toContain("5일선");
  });

  it("fallback reply에 알림 핵심 항목이 들어간다", () => {
    const draft = buildAlertBotDraft("RSI 과매도 반등이 나오면 조용히 알려줘");
    const reply = buildAlertBotFallbackReply(draft, 1);
    expect(reply).toContain("알림 조건");
    expect(reply).toContain("조용 시간");
  });
});
