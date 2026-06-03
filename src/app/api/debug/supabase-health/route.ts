import { getSupabaseDebugInfo, insertSupabaseRow } from "@/lib/supabase-feedback";

type LeadRow = {
  id: string;
};

export async function GET(request: Request) {
  const url = new URL(request.url);
  const secret = url.searchParams.get("secret");

  if (!process.env.EXPORT_SECRET || secret !== process.env.EXPORT_SECRET) {
    return Response.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  try {
    const row = await insertSupabaseRow<LeadRow>("leads", {
      email: `debug-${Date.now()}@example.com`,
      source: "debug-health",
      campaign: "debug-health",
      user_agent: request.headers.get("user-agent") || "debug-health",
    });

    return Response.json({
      ok: true,
      debug: getSupabaseDebugInfo(),
      insertedLeadId: row.id,
    });
  } catch (error) {
    return Response.json(
      {
        ok: false,
        debug: getSupabaseDebugInfo(),
        error: error instanceof Error ? error.message : "SUPABASE_HEALTH_FAILED",
      },
      { status: 500 },
    );
  }
}
