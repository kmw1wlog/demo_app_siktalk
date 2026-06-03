import type { AssetClass } from "@/lib/types";

export type AlertBotDraft = {
  market: AssetClass;
  timeframe: string;
  trigger: string;
  cadence: string;
  quietHours: string;
  delivery: string;
  title: string;
};

function includesAny(text: string, keywords: string[]) {
  return keywords.some((keyword) => text.includes(keyword));
}

function inferMarket(text: string): AssetClass {
  if (includesAny(text, ["코인", "비트코인", "btc", "eth"])) return "crypto";
  if (includesAny(text, ["미장", "나스닥", "미국", "s&p"])) return "usStock";
  if (includesAny(text, ["etf"])) return "etf";
  return "koreanStock";
}

function inferTimeframe(text: string) {
  if (includesAny(text, ["1분", "1m"])) return "1분봉";
  if (includesAny(text, ["5분", "5m"])) return "5분봉";
  if (includesAny(text, ["15분", "15m"])) return "15분봉";
  if (includesAny(text, ["일봉", "종가"])) return "일봉";
  return "15분봉";
}

function inferTrigger(text: string) {
  if (includesAny(text, ["rsi", "과매도", "반등"])) {
    return "RSI 과매도 반등 + 거래량 이탈 없는 구간만 알림";
  }
  if (includesAny(text, ["스토캐스틱"])) {
    return "스토캐스틱 K선 상향 전환 + 추세 이탈 없는 구간만 알림";
  }
  if (includesAny(text, ["돌파", "전고점", "신고가"])) {
    return "직전 고점 돌파 + 거래량 회복이 동시에 확인될 때 알림";
  }
  if (includesAny(text, ["종가", "장 막판"])) {
    return "장 막판 고가권 유지 + 거래대금 상위 유지 시 알림";
  }
  if (includesAny(text, ["5일선", "20일선", "골든크로스", "이평선"])) {
    return "5일선이 20일선을 상향 돌파하고 거래량이 회복될 때 알림";
  }
  return "조건식 카드의 관찰 시작 조건이 다시 살아날 때 알림";
}

function inferCadence(text: string, timeframe: string) {
  if (includesAny(text, ["실시간", "바로", "즉시"])) return "신호 발생 즉시 1회";
  if (timeframe === "1분봉" || timeframe === "5분봉") return "봉 마감마다 재확인";
  if (timeframe === "일봉") return "장 마감 전후 1회";
  return "15분마다 조건 재점검";
}

function inferQuietHours(market: AssetClass) {
  if (market === "crypto") return "00:00~07:00는 묶음 알림";
  if (market === "usStock") return "한국시간 01:00~18:00는 요약만";
  return "08:40~09:00, 15:20~15:35는 집중 알림";
}

function inferDelivery(text: string) {
  if (includesAny(text, ["텔레그램", "telegram"])) return "텔레그램 + 인앱 푸시";
  if (includesAny(text, ["앱", "인앱"])) return "인앱 푸시";
  return "인앱 푸시 + 텔레그램 준비";
}

export function buildAlertBotDraft(rawText: string): AlertBotDraft {
  const text = rawText.trim().toLowerCase();
  const market = inferMarket(text);
  const timeframe = inferTimeframe(text);
  const trigger = inferTrigger(text);
  return {
    market,
    timeframe,
    trigger,
    cadence: inferCadence(text, timeframe),
    quietHours: inferQuietHours(market),
    delivery: inferDelivery(text),
    title: includesAny(text, ["5일선", "20일선", "골든크로스"])
      ? "5·20선 관찰 알림봇"
      : includesAny(text, ["rsi", "과매도"])
        ? "RSI 반등 알림봇"
        : "조건식 관찰 알림봇",
  };
}

export function buildAlertBotFallbackReply(draft: AlertBotDraft, turn: number) {
  const lines = [
    `${draft.title} 초안으로 정리했습니다.`,
    `시장/시간봉: ${marketLabel(draft.market)} · ${draft.timeframe}`,
    `알림 조건: ${draft.trigger}`,
    `알림 방식: ${draft.cadence} / ${draft.delivery}`,
    `조용 시간: ${draft.quietHours}`,
  ];

  if (turn < 3) {
    lines.push("다음으로 시장이나 시간봉을 더 좁혀주면 알림 강도를 바로 줄일 수 있습니다.");
  } else {
    lines.push("세부 조건은 차트 적용 화면의 관찰 알림 설정과 함께 맞추면 됩니다.");
  }

  return lines.join("\n");
}

function marketLabel(market: AssetClass) {
  switch (market) {
    case "crypto":
      return "코인";
    case "usStock":
      return "미장";
    case "etf":
      return "ETF";
    default:
      return "국장";
  }
}
