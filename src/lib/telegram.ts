const TELEGRAM_MAX_LENGTH = 4096;
const TELEGRAM_SUFFIX = "\n\n... (메시지 길이 제한으로 일부 생략)";

export type SendTelegramMessageInput = {
  chatId?: string;
  text: string;
  disableNotification?: boolean;
};

export type SendTelegramMessageResult = {
  delivered: boolean;
  demoMode: boolean;
  reason?: string;
};

type TelegramSendMessageResponse =
  | {
      ok: true;
      result: Record<string, unknown>;
    }
  | {
      ok: false;
      description?: string;
      error_code?: number;
    };

export async function sendTelegramMessage(input: SendTelegramMessageInput): Promise<SendTelegramMessageResult> {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  const fallbackChatId = process.env.TELEGRAM_DEFAULT_CHAT_ID?.trim() || process.env.TELEGRAM_CHAT_ID?.trim();
  const chatId = input.chatId?.trim() || fallbackChatId;

  if (!token) {
    return {
      delivered: false,
      demoMode: true,
      reason: "TELEGRAM_BOT_TOKEN이 없어 영상 촬영용 데모 전송으로 처리했습니다.",
    };
  }

  if (!chatId) {
    return {
      delivered: false,
      demoMode: true,
      reason: "TELEGRAM_DEFAULT_CHAT_ID가 없어 영상 촬영용 데모 전송으로 처리했습니다.",
    };
  }

  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text: truncateTelegramText(input.text),
      disable_notification: input.disableNotification ?? false,
    }),
    cache: "no-store",
  });

  let payload: TelegramSendMessageResponse | null = null;

  try {
    payload = (await response.json()) as TelegramSendMessageResponse;
  } catch {
    payload = null;
  }

  if (!response.ok) {
    throw new Error(`Telegram API 호출에 실패했습니다. status=${response.status}`);
  }

  if (!payload || payload.ok !== true) {
    const message = payload && "description" in payload && payload.description
      ? payload.description
      : "Telegram API가 ok:false를 반환했습니다.";
    throw new Error(message);
  }

  return {
    delivered: true,
    demoMode: false,
  };
}

export function getTelegramRuntimeConfig() {
  return {
    hasBotToken: Boolean(process.env.TELEGRAM_BOT_TOKEN?.trim()),
    hasDefaultChatId: Boolean(
      process.env.TELEGRAM_DEFAULT_CHAT_ID?.trim() || process.env.TELEGRAM_CHAT_ID?.trim(),
    ),
    botUsername: process.env.TELEGRAM_BOT_USERNAME?.trim() || "",
  };
}

function truncateTelegramText(text: string): string {
  if (text.length <= TELEGRAM_MAX_LENGTH) return text;
  return `${text.slice(0, TELEGRAM_MAX_LENGTH - TELEGRAM_SUFFIX.length)}${TELEGRAM_SUFFIX}`;
}
