const DISCLAIMER =
  "※ 본 알림은 투자 추천이 아니라 사용자가 설정한 조건의 감지 알림입니다.";

export function formatSiktokTestMessage(): string {
  return `[식톡 테스트 알림]

상태: Telegram 연동 테스트 메시지
의미: 서버에서 Telegram Bot API 호출이 가능한지 확인합니다.

${DISCLAIMER}`;
}

export function formatStrategyCardMessage(input: {
  strategyName?: string;
  market?: string;
  symbol?: string;
  timeframe?: string;
  observeCondition?: string;
  exitCondition?: string;
  filterCondition?: string;
  riskRule?: string;
  cardUrl?: string;
}): string {
  const lines = [
    "[식톡 관찰 알림]",
    "",
    `전략명: ${input.strategyName || "전략 카드"}`,
    `시장: ${input.market || "-"}`,
    `종목: ${input.symbol || "-"}`,
    `시간봉: ${input.timeframe || "-"}`,
    "상태: 사용자가 설정한 관찰 조건 감지",
  ];

  if (input.observeCondition) {
    lines.push(`관찰 조건: ${input.observeCondition}`);
  }
  if (input.exitCondition) {
    lines.push(`종료 조건: ${input.exitCondition}`);
  }
  if (input.filterCondition) {
    lines.push(`필터 조건: ${input.filterCondition}`);
  }
  if (input.riskRule) {
    lines.push(`리스크 메모: ${input.riskRule}`);
  }
  if (input.cardUrl) {
    lines.push(`전략 카드: ${input.cardUrl}`);
  }

  lines.push("", DISCLAIMER);
  return lines.join("\n");
}

export function formatTradingViewWebhookMessage(payload: unknown): string {
  const record = toRecord(payload);

  if (!record) {
    return `[식톡 TradingView 알림]

상태: 사용자가 설정한 조건 감지
원본: JSON 구조를 해석하지 못해 원문 기반으로 정리했습니다.

${DISCLAIMER}`;
  }

  const strategyName = getFirstString(record, ["strategyName", "strategy_name", "name"]) || "TradingView 전략";
  const exchange = getFirstString(record, ["exchange"]);
  const ticker = getFirstString(record, ["ticker", "symbol"]);
  const interval = getFirstString(record, ["interval", "timeframe"]);
  const price = getFirstString(record, ["price", "close", "last"]);
  const event = getFirstString(record, ["event", "signalType", "signal", "state"]) || "사용자가 설정한 조건 감지";
  const volume = getFirstString(record, ["volume"]);
  const eventTime = getFirstString(record, ["time", "timestamp"]);

  const lines = [
    "[식톡 관찰 알림]",
    "",
    `전략명: ${strategyName}`,
    `시장: ${[exchange, ticker].filter(Boolean).join(":") || ticker || "-"}`,
    `시간봉: ${interval || "-"}`,
    `상태: ${normalizeSignalLabel(event)}`,
  ];

  if (price) lines.push(`가격: ${price}`);
  if (volume) lines.push(`거래량: ${volume}`);
  if (eventTime) lines.push(`발생 시각: ${eventTime}`);

  lines.push("", DISCLAIMER);
  return lines.join("\n");
}

export function buildTradingViewAlertPayload(input: {
  secret?: string;
  strategyName: string;
  symbol?: string;
  timeframe?: string;
}): string {
  return JSON.stringify(
    {
      secret: input.secret || "__SET_ON_SERVER__",
      source: "tradingview",
      app: "siktok",
      event: "strategy_condition_detected",
      strategyName: input.strategyName,
      signalType: "observe",
      exchange: "{{exchange}}",
      ticker: input.symbol || "{{ticker}}",
      interval: input.timeframe || "{{interval}}",
      price: "{{close}}",
      volume: "{{volume}}",
      time: "{{time}}",
    },
    null,
    2,
  );
}

function normalizeSignalLabel(value: string): string {
  const normalized = value.toLowerCase();
  if (normalized.includes("exit") || normalized.includes("close")) return "종료 조건 감지";
  if (normalized.includes("observe")) return "사용자가 설정한 관찰 조건 감지";
  if (normalized.includes("entry")) return "사용자가 설정한 관찰 조건 감지";
  return value;
}

function toRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function getFirstString(record: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number") return String(value);
  }
  return "";
}
