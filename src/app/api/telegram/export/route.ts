import { assetClassLabel, timeframeLabel } from "@/lib/format";
import { buildTradingViewAlertPayload } from "@/lib/telegramMessage";
import type { StrategyCard } from "@/lib/types";

type ExportRequest = {
  strategy?: StrategyCard;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ExportRequest;
    const strategy = body.strategy;

    if (!strategy) {
      return Response.json({ ok: false, error: "strategy 정보가 필요합니다." }, { status: 400 });
    }

    const requestUrl = new URL(request.url);
    const appBaseUrl = process.env.NEXT_PUBLIC_APP_BASE_URL?.trim() || requestUrl.origin;
    const secret = process.env.TRADINGVIEW_WEBHOOK_SECRET?.trim() || "siktalk-demo-secret";

    const webhookUrl = `${trimTrailingSlash(appBaseUrl)}/api/webhooks/tradingview?secret=${encodeURIComponent(secret)}`;
    const tradingViewJson = buildTradingViewAlertPayload({
      secret,
      strategyName: strategy.title,
      symbol: "{{ticker}}",
      timeframe: timeframeLabel(strategy.timeframe),
    });

    return Response.json({
      ok: true,
      webhookUrl,
      tradingViewJson,
      demoMode: !process.env.TRADINGVIEW_WEBHOOK_SECRET?.trim(),
      telegramSummary: {
        strategyName: strategy.title,
        market: assetClassLabel(strategy.assetClass),
        timeframe: timeframeLabel(strategy.timeframe),
      },
    });
  } catch (error) {
    return Response.json(
      { ok: false, error: error instanceof Error ? error.message : "Telegram export 정보를 만들지 못했습니다." },
      { status: 400 },
    );
  }
}

function trimTrailingSlash(value: string): string {
  return value.endsWith("/") ? value.slice(0, -1) : value;
}
