import { runConditionAssistant } from "@/lib/condition-assistant";
import type { AssetClass } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      rawIdea?: string;
      selectedMarket?: AssetClass;
      turn?: number;
      history?: string[];
    };
    const rawIdea = body.rawIdea?.trim();
    if (!rawIdea) {
      return Response.json({ error: "rawIdea가 비어 있습니다." }, { status: 400 });
    }

    const result = await runConditionAssistant({
      rawIdea,
      selectedMarket: body.selectedMarket,
      turn: body.turn,
      history: body.history,
    });
    return Response.json({ ok: true, ...result });
  } catch (error) {
    return Response.json(
      { ok: false, error: error instanceof Error ? error.message : "AI 응답 생성 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}
