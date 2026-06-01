import { DEMO_TELEGRAM_TEXT } from "@/lib/demo-strategy";

export async function POST() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    return Response.json(
      { error: "TELEGRAM_BOT_TOKEN과 TELEGRAM_CHAT_ID 환경변수가 필요합니다." },
      { status: 400 },
    );
  }

  const text = DEMO_TELEGRAM_TEXT.replace("{{market}}", "국장")
    .replace("{{ticker}}", "005930")
    .replace("{{interval}}", "15m")
    .replace("{{close}}", "예시 현재가");

  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text }),
  });

  if (!response.ok) {
    return Response.json({ error: "Telegram API 전송에 실패했습니다." }, { status: 502 });
  }

  return Response.json({ ok: true });
}
