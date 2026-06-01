import { generateOracleScenarios } from "@/lib/oracle";
import type { MockBacktestReport, StrategyCard } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { strategy?: StrategyCard; report?: MockBacktestReport };
    if (!body.strategy || !body.report) {
      return Response.json({ error: "strategy와 report가 필요합니다." }, { status: 400 });
    }
    return Response.json({ scenarios: generateOracleScenarios(body.strategy, body.report) });
  } catch {
    return Response.json({ error: "오라클 시나리오 생성 중 오류가 발생했습니다." }, { status: 400 });
  }
}
