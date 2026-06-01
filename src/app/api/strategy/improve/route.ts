import { generateImprovementAdvice } from "@/lib/mock-improver";
import type { MockBacktestReport, StrategyCard } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { strategy?: StrategyCard; report?: MockBacktestReport };
    if (!body.strategy || !body.report) {
      return Response.json({ error: "strategy와 report가 필요합니다." }, { status: 400 });
    }
    return Response.json({ advices: generateImprovementAdvice(body.strategy, body.report) });
  } catch {
    return Response.json({ error: "개선 코치 생성 중 오류가 발생했습니다." }, { status: 400 });
  }
}
