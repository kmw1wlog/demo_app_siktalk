import { generateMockBacktestReport } from "@/lib/mock-backtest";
import type { StrategyCard } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { strategy?: StrategyCard };
    if (!body.strategy?.id) {
      return Response.json({ error: "strategy가 필요합니다." }, { status: 400 });
    }
    return Response.json({ report: generateMockBacktestReport(body.strategy) });
  } catch {
    return Response.json({ error: "모의검증 리포트 생성 중 오류가 발생했습니다." }, { status: 400 });
  }
}
