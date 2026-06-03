import { buildAlertBotDraft, buildAlertBotFallbackReply } from "@/lib/alert-bot";
import { generateQwenText } from "@/lib/qwen";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      history?: string[];
      message?: string;
      turn?: number;
    };

    const message = body.message?.trim();
    if (!message) {
      return Response.json({ error: "message가 필요합니다." }, { status: 400 });
    }

    const turn = Math.max(1, Math.min(body.turn ?? 1, 3));
    const draft = buildAlertBotDraft([...(body.history ?? []), message].join(" "));
    const fallback = buildAlertBotFallbackReply(draft, turn);

    const qwen = await generateQwenText({
      systemPrompt: [
        "너는 식톡의 알림봇 설정 도우미다.",
        "투자 추천이나 자동매매 지시를 하지 않는다.",
        "사용자가 관찰 알림을 언제, 어떤 조건으로, 얼마나 자주 받을지 짧게 정리한다.",
        "답변은 한국어 5줄 이내로 한다.",
        "반드시 아래 항목을 모두 포함한다.",
        "1) 한 줄 요약",
        "2) 알림 조건",
        "3) 알림 빈도",
        "4) 조용 시간",
        "5) 다음에 좁혀야 할 한 가지",
      ].join("\n"),
      userPrompt: [`기존 대화: ${(body.history ?? []).join(" | ")}`, `현재 요청: ${message}`].join("\n"),
      fallback,
    });

    return Response.json({
      ok: true,
      answer: qwen.text,
      draft,
      fallbackUsed: qwen.fallbackUsed,
      model: qwen.model,
      provider: qwen.provider,
      turn,
    });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "알림봇 응답 생성에 실패했습니다." },
      { status: 400 },
    );
  }
}
