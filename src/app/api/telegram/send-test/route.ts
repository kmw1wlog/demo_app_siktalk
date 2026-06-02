import { formatSiktokTestMessage, formatStrategyCardMessage } from "@/lib/telegramMessage";
import { sendTelegramMessage } from "@/lib/telegram";

type SendTestRequest = {
  chatId?: string;
  strategyName?: string;
  market?: string;
  symbol?: string;
  timeframe?: string;
  observeCondition?: string;
  exitCondition?: string;
  filterCondition?: string;
  riskRule?: string;
  cardUrl?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as SendTestRequest;

    const text = body.strategyName
      ? formatStrategyCardMessage(body)
      : formatSiktokTestMessage();

    const result = await sendTelegramMessage({
      chatId: body.chatId,
      text,
    });

    return Response.json({
      ok: true,
      delivered: result.delivered,
      demoMode: result.demoMode,
      message: result.demoMode ? result.reason : "Telegram 테스트 알림을 전송했습니다.",
    });
  } catch (error) {
    return Response.json(
      { ok: false, error: error instanceof Error ? error.message : "Telegram 테스트 알림 전송에 실패했습니다." },
      { status: 400 },
    );
  }
}
