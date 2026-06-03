import { parseStrategyIdea } from "@/lib/strategy-parser";

type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type QwenTextResult = {
  text: string;
  provider: "qwen" | "fallback";
  model: string;
  fallbackUsed: boolean;
  error?: string;
};

export type QwenStrategyChatResult = {
  answer: string;
  provider: "qwen" | "fallback";
  model: string;
  fallbackUsed: boolean;
  error?: string;
};

const DEFAULT_QWEN_BASE_URL = "https://dashscope.aliyuncs.com/compatible-mode/v1";
const DEFAULT_QWEN_MODEL = "qwen-plus";

export async function generateQwenStrategyChat(rawIdea: string): Promise<QwenStrategyChatResult> {
  const idea = rawIdea.trim();
  const fallback = buildFallbackAnswer(idea);
  const result = await generateQwenText({
    systemPrompt: [
      "너는 식톡의 조건식 큐레이터다.",
      "투자 추천이나 매수/매도 지시를 하지 않는다.",
      "사용자 문장을 조건식 DB에서 찾을 관찰식 후보로 정리한다.",
      "한국어로 짧고 구체적으로 답한다.",
      "반드시 관찰 시작 조건, 관찰 종료 조건, 차트에 올릴 때 볼 지표를 포함한다.",
    ].join("\n"),
    userPrompt: idea,
    fallback,
  });

  return {
    answer: result.text,
    provider: result.provider,
    model: result.model,
    fallbackUsed: result.fallbackUsed,
    error: result.error,
  };
}

export async function generateQwenText(input: {
  systemPrompt: string;
  userPrompt: string;
  fallback: string;
}): Promise<QwenTextResult> {
  const model = process.env.QWEN_MODEL || DEFAULT_QWEN_MODEL;
  const apiKey = process.env.QWEN_API_KEY || process.env.DASHSCOPE_API_KEY || "";
  const baseUrl = normalizeQwenBaseUrl(process.env.QWEN_BASE_URL || DEFAULT_QWEN_BASE_URL);

  if (!apiKey) {
    return {
      text: input.fallback,
      provider: "fallback",
      model,
      fallbackUsed: true,
      error: "QWEN_API_KEY is not configured",
    };
  }

  try {
    const text = await callOpenAiCompatibleChat({
      apiKey,
      baseUrl,
      model,
      messages: [
        { role: "system", content: input.systemPrompt },
        { role: "user", content: input.userPrompt },
      ],
      timeoutMs: 20_000,
    });

    return {
      text,
      provider: "qwen",
      model,
      fallbackUsed: false,
    };
  } catch (error) {
    return {
      text: input.fallback,
      provider: "fallback",
      model,
      fallbackUsed: true,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

function buildFallbackAnswer(rawIdea: string) {
  if (isMaCrossIdea(rawIdea)) {
    return [
      "5·20선 재가속 관찰식 후보로 정리했습니다.",
      "관찰 시작: 5일선이 20일선을 상향 교차 / 거래량이 20일 평균 이상으로 회복 / 양봉 마감 확인",
      "관찰 종료: 5일선이 20일선 아래로 재이탈 / 사용자가 정한 N봉 경과 / 설정한 하락폭 도달",
      "차트 확인: 5일선, 20일선, 거래량 회복 마커를 함께 봅니다.",
    ].join("\n");
  }

  const strategy = parseStrategyIdea(rawIdea);
  return [
    `${strategy.title} 후보로 정리했습니다.`,
    `관찰 시작: ${strategy.conditions.entry.slice(0, 2).join(" / ")}`,
    `관찰 종료: ${strategy.conditions.exit.slice(0, 2).join(" / ")}`,
    `차트 확인: 이동평균, 거래량, 조건 발생 마커를 함께 봅니다.`,
  ].join("\n");
}

function isMaCrossIdea(rawIdea: string) {
  const normalized = rawIdea.toLowerCase();
  return (
    (normalized.includes("5일선") || normalized.includes("5선") || normalized.includes("ma5")) &&
    (normalized.includes("20일선") || normalized.includes("20선") || normalized.includes("ma20"))
  );
}

async function callOpenAiCompatibleChat(input: {
  apiKey: string;
  baseUrl: string;
  model: string;
  messages: ChatMessage[];
  timeoutMs: number;
}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), input.timeoutMs);

  try {
    const response = await fetch(`${input.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "authorization": `Bearer ${input.apiKey}`,
        "content-type": "application/json",
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: input.model,
        temperature: 0.2,
        max_tokens: 500,
        messages: input.messages,
      }),
    });

    if (!response.ok) {
      throw new Error(`Qwen request failed: ${response.status} ${await response.text()}`);
    }

    const payload = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const content = payload.choices?.[0]?.message?.content?.trim();
    if (!content) throw new Error("Qwen returned an empty response");
    return content;
  } finally {
    clearTimeout(timeout);
  }
}

function normalizeQwenBaseUrl(baseUrl: string) {
  return baseUrl.replace(/\/$/, "").replace(/\/compatible-mode\/v1d$/, "/compatible-mode/v1");
}
