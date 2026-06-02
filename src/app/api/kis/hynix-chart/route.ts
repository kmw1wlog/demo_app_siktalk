import { fetchHynixChartSnapshot } from "@/lib/kis-minute-chart";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const threshold = Number(url.searchParams.get("strengthThreshold") || "99");
    const snapshot = await fetchHynixChartSnapshot(180, Number.isFinite(threshold) ? threshold : 99);
    return Response.json({
      ok: true,
      snapshot,
    });
  } catch (error) {
    return Response.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "KIS 차트 데이터를 불러오지 못했습니다.",
      },
      { status: 502 },
    );
  }
}
