import type { AnalyticsEvent } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as AnalyticsEvent;
    if (!body.type) {
      return Response.json({ error: "이벤트 type이 필요합니다." }, { status: 400 });
    }
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "이벤트 처리 중 오류가 발생했습니다." }, { status: 400 });
  }
}
