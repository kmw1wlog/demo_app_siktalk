import { insertSupabaseRow } from "@/lib/supabase-feedback";

type LeadRow = {
  id: string;
};

type PreSurveyRow = {
  id: string;
};

type PreSurveyBody = {
  email?: string;
  activity_frequency?: string;
  tools?: string[];
  has_bot?: string;
  session_id?: string;
  source?: string;
  campaign?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as PreSurveyBody;
    const email = body.email?.trim().toLowerCase();
    const sessionId = body.session_id?.trim() || createSessionId();
    if (!email || !email.includes("@")) {
      return Response.json({ error: "이메일을 입력해주세요." }, { status: 400 });
    }
    if (!body.activity_frequency || !body.has_bot) {
      return Response.json({ error: "필수 문항을 선택해주세요." }, { status: 400 });
    }

    const lead = await insertSupabaseRow<LeadRow>("leads", {
      email,
      source: body.source || "survey",
      campaign: body.campaign || "feedback",
      user_agent: request.headers.get("user-agent") || "",
    });

    const preSurvey = await insertSupabaseRow<PreSurveyRow>("pre_surveys", {
      lead_id: lead.id,
      activity_frequency: body.activity_frequency,
      tools: Array.isArray(body.tools) ? body.tools : [],
      has_bot: body.has_bot,
    });

    return Response.json({
      ok: true,
      rid: lead.id,
      pre_sid: preSurvey.id,
      session_id: sessionId,
    });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "사전 설문 저장에 실패했습니다." },
      { status: 500 },
    );
  }
}

function createSessionId(): string {
  return `session_${crypto.randomUUID()}`;
}
