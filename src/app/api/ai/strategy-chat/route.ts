import { generateQwenStrategyChat } from "@/lib/qwen";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { rawIdea?: string };
    const rawIdea = body.rawIdea?.trim();
    if (!rawIdea) {
      return Response.json({ error: "rawIdea가 비어 있습니다." }, { status: 400 });
    }

    const result = await generateQwenStrategyChat(rawIdea);
    return Response.json({ ok: true, ...result });
  } catch (error) {
    return Response.json(
      { ok: false, error: error instanceof Error ? error.message : "AI 응답 생성 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}
