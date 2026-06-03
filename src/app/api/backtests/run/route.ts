import { runLightBacktest } from "@/lib/backtest-engine";

const cache = new Map<string, ReturnType<typeof runLightBacktest>>();

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      rawIdea?: string;
      title?: string;
    };

    const rawIdea = body.rawIdea?.trim();
    if (!rawIdea) {
      return Response.json({ error: "rawIdea가 필요합니다." }, { status: 400 });
    }

    const cacheKey = `${body.title ?? ""}:${rawIdea}`;
    const cached = cache.get(cacheKey);
    if (cached) {
      return Response.json({ ok: true, cached: true, result: cached });
    }

    const result = runLightBacktest({
      rawIdea,
      title: body.title,
    });
    cache.set(cacheKey, result);

    return Response.json({ ok: true, cached: false, result });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "백테스트 계산에 실패했습니다." },
      { status: 400 },
    );
  }
}
