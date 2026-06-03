import { insertSupabaseRow } from "@/lib/supabase-feedback";

type EventsBody = {
  eventName?: string;
  properties?: Record<string, unknown>;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as EventsBody;
    if (!body.eventName) {
      return Response.json({ error: "eventName이 필요합니다." }, { status: 400 });
    }

    const properties = body.properties || {};
    const leadId = typeof properties.lead_id === "string" ? properties.lead_id : null;
    const sessionId = typeof properties.session_id === "string" ? properties.session_id : null;

    await insertSupabaseRow("app_events", {
      lead_id: leadId,
      session_id: sessionId,
      event_name: body.eventName,
      event_props: properties,
    });

    return Response.json({ ok: true });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "이벤트 저장에 실패했습니다." },
      { status: 500 },
    );
  }
}
