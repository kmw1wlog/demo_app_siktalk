import { formatStrategyCardMessage } from "@/lib/telegramMessage";
import { sendTelegramMessage } from "@/lib/telegram";

export async function POST() {
  try {
    const result = await sendTelegramMessage({
      text: formatStrategyCardMessage({
        strategyName: "MA5/MA20 양봉 크로스 관찰 전략",
        market: "국장",
        symbol: "005930",
        timeframe: "15m",
        observeCondition: "5봉 단순이동평균선이 20봉 단순이동평균선을 상향돌파",
        exitCondition: "5봉 단순이동평균선이 20봉 단순이동평균선을 하향돌파",
      }),
    });
    return Response.json({
      ok: true,
      delivered: result.delivered,
      demoMode: result.demoMode,
      message: result.demoMode ? result.reason : "Telegram 데모 알림을 전송했습니다.",
    });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Telegram API 전송에 실패했습니다." },
      { status: 400 },
    );
  }
}
