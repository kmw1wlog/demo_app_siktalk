import type { ConversionPlatform } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      strategyId?: string;
      platform?: ConversionPlatform;
      email?: string;
    };
    if (!body.strategyId || !body.platform || !body.email?.includes("@")) {
      return Response.json({ error: "strategyId, platform, email이 필요합니다." }, { status: 400 });
    }
    return Response.json({ ok: true, message: "대기 등록이 완료되었습니다." });
  } catch {
    return Response.json({ error: "대기 등록 중 오류가 발생했습니다." }, { status: 400 });
  }
}
