import { parseStrategyIdea } from "@/lib/strategy-parser";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { rawIdea?: string };
    if (!body.rawIdea?.trim()) {
      return Response.json({ error: "rawIdea가 비어 있습니다." }, { status: 400 });
    }
    return Response.json({ strategy: parseStrategyIdea(body.rawIdea) });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "전략 파싱 중 오류가 발생했습니다." },
      { status: 400 },
    );
  }
}
