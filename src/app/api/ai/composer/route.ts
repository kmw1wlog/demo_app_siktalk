import { runComposerAssistant } from "@/lib/composer-assistant";
import type { AssetClass } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      message?: string;
      selectedIds?: string[];
      turn?: number;
      selectedMarket?: AssetClass;
    };

    const message = body.message?.trim();
    if (!message) {
      return Response.json({ error: "message가 필요합니다." }, { status: 400 });
    }

    const result = await runComposerAssistant({
      message,
      selectedIds: body.selectedIds ?? [],
      turn: body.turn ?? 1,
      selectedMarket: body.selectedMarket,
    });

    return Response.json({ ok: true, ...result });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "합성 전략 응답 생성에 실패했습니다." },
      { status: 400 },
    );
  }
}
