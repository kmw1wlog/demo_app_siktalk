import { formatTradingViewWebhookMessage } from "@/lib/telegramMessage";
import { sendTelegramMessage } from "@/lib/telegram";

export async function POST(request: Request) {
  const expectedSecret = process.env.TRADINGVIEW_WEBHOOK_SECRET?.trim();

  const runtimeSecret = expectedSecret || "siktalk-demo-secret";

  try {
    const url = new URL(request.url);
    const querySecret = url.searchParams.get("secret")?.trim();
    const contentType = request.headers.get("content-type") || "";

    let payload: unknown = null;

    if (contentType.includes("application/json")) {
      payload = await request.json();
    } else {
      payload = await request.text();
    }

    const bodySecret = extractSecret(payload);
    const providedSecret = querySecret || bodySecret;

    if (!providedSecret || providedSecret !== runtimeSecret) {
      return Response.json({ ok: false, error: "유효하지 않은 webhook secret입니다." }, { status: 401 });
    }

    const text = typeof payload === "string"
      ? `[식톡 TradingView 알림]\n\n원본 메시지:\n${payload}\n\n※ 본 알림은 투자 추천이 아니라 사용자가 설정한 조건의 감지 알림입니다.`
      : formatTradingViewWebhookMessage(payload);

    const result = await sendTelegramMessage({ text });

    return Response.json({
      ok: true,
      delivered: result.delivered,
      demoMode: result.demoMode || !expectedSecret,
      message: result.demoMode ? result.reason : "TradingView webhook 알림을 Telegram으로 전송했습니다.",
    });
  } catch (error) {
    return Response.json(
      { ok: false, error: error instanceof Error ? error.message : "TradingView webhook 처리에 실패했습니다." },
      { status: 400 },
    );
  }
}

function extractSecret(payload: unknown): string {
  if (typeof payload !== "object" || payload === null || Array.isArray(payload)) return "";
  const value = (payload as Record<string, unknown>).secret;
  return typeof value === "string" ? value.trim() : "";
}
