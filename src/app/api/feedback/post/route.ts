import { insertSupabaseRow } from "@/lib/supabase-feedback";

type PostSurveyRow = {
  id: string;
};

type PostSurveyBody = {
  rid?: string | null;
  session_id?: string;
  overall_feeling?: string;
  reason?: string;
  main_friction?: string;
  has_bot?: string;
  bot_satisfaction?: string;
  reference_sources?: string[];
  no_bot_reason?: string[];
  one_thing?: string;
  source?: string;
  campaign?: string;
  pre_sid?: string | null;
  last_screen?: string;
  strategy_clicked?: boolean;
  chart_render_clicked?: boolean;
  export_clicked?: boolean;
  time_spent_sec?: number;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as PostSurveyBody;
    if (!body.overall_feeling || !body.reason?.trim() || !body.main_friction || !body.one_thing) {
      return Response.json({ error: "필수 문항을 모두 입력해주세요." }, { status: 400 });
    }

    const survey = await insertSupabaseRow<PostSurveyRow>("post_surveys", {
      lead_id: body.rid || null,
      session_id: body.session_id || null,
      overall_feeling: body.overall_feeling,
      reason: body.reason.trim(),
      main_friction: body.main_friction,
      one_thing: body.one_thing,
      no_bot_reason: Array.isArray(body.no_bot_reason) ? body.no_bot_reason : [],
      reference_sources: Array.isArray(body.reference_sources) ? body.reference_sources : [],
    });

    if (body.rid) {
      await insertSupabaseRow("rewards", {
        lead_id: body.rid,
        coupon_code: createCouponCode(),
        free_indicator_sent: false,
      });
    }

    return Response.json({ ok: true, post_sid: survey.id });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "후설문 저장에 실패했습니다." },
      { status: 500 },
    );
  }
}

function createCouponCode(): string {
  return `SIKTALK-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
}
