import { fetchHynixChartSnapshot, type ChartInterval } from "@/lib/kis-minute-chart";

function parseInterval(value: string | null): ChartInterval {
  if (value === "1m" || value === "15m" || value === "1d") {
    return value;
  }
  return "15m";
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const interval = parseInterval(url.searchParams.get("interval"));
    const count = Number(url.searchParams.get("count") || "80");
    const beforeDate = url.searchParams.get("beforeDate");
    const beforeTime = url.searchParams.get("beforeTime");
    const includeExecutionStrength = url.searchParams.get("includeExecutionStrength") !== "0";

    const snapshot = await fetchHynixChartSnapshot({
      interval,
      count: Number.isFinite(count) ? count : 80,
      beforeDate,
      beforeTime,
      includeExecutionStrength,
    });

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
