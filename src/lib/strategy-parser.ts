import { GLOBAL_DISCLAIMER } from "./constants";
import { createId } from "./id";
import type {
  AssetClass,
  ConditionGroup,
  StrategyCard,
  StrategyType,
  Timeframe,
} from "./types";

function includesAny(text: string, keywords: string[]): boolean {
  return keywords.some((keyword) => text.includes(keyword.toLowerCase()));
}

function uniq(items: string[]): string[] {
  return Array.from(new Set(items));
}

function inferStrategyType(text: string): StrategyType {
  if (includesAny(text, ["코인", "btc", "eth", "비트코인", "이더리움"]) && includesAny(text, ["5분", "급등", "스캘핑"])) {
    return "scalping";
  }
  if (includesAny(text, ["전고점", "돌파", "신고가", "고점 돌파"])) return "breakout";
  if (includesAny(text, ["눌림", "조정", "20일선", "5일선", "되돌림"])) return "pullback";
  if (includesAny(text, ["rsi", "과매도", "반등", "볼린저", "하단"])) return "meanReversion";
  if (includesAny(text, ["뉴스", "공시", "테마", "재료"])) return "newsDisclosure";
  if (includesAny(text, ["종가", "장 막판", "마감"])) return "closingBet";
  if (includesAny(text, ["스캘핑", "초단타", "1분", "3분"])) return "scalping";
  if (includesAny(text, ["거래량", "거래대금", "변동성", "atr"])) return "volatility";
  if (includesAny(text, ["스윙", "일봉"])) return "swing";
  return "dayTrading";
}

function inferAssetClass(text: string): AssetClass {
  if (includesAny(text, ["코인", "btc", "eth", "비트코인", "이더리움"])) return "crypto";
  if (includesAny(text, ["etf"])) return "etf";
  if (includesAny(text, ["미국", "나스닥", "s&p", "뉴욕"])) return "usStock";
  if (includesAny(text, ["선물", "해외선물"])) return "futures";
  if (includesAny(text, ["종목", "국내", "코스피", "코스닥"])) return "koreanStock";
  return "unknown";
}

function inferTimeframe(text: string, strategyType: StrategyType): Timeframe {
  if (includesAny(text, ["1분", "1m"])) return "1m";
  if (includesAny(text, ["3분", "3m"])) return "3m";
  if (includesAny(text, ["5분", "5m", "분봉"])) return "5m";
  if (includesAny(text, ["15분", "15m"])) return "15m";
  if (includesAny(text, ["시간봉", "1시간"])) return "1h";
  if (includesAny(text, ["주봉"])) return "weekly";
  if (includesAny(text, ["일봉", "스윙"])) return "daily";
  if (strategyType === "swing" || strategyType === "closingBet") return "daily";
  if (strategyType === "scalping") return "1m";
  return "unknown";
}

function buildTitle(text: string, strategyType: StrategyType): string {
  if (includesAny(text, ["코인", "btc", "eth", "비트코인", "이더리움"]) && includesAny(text, ["5분", "급등", "스캘핑"])) {
    return "코인 5분봉 고변동성 초입 전략";
  }
  if (includesAny(text, ["거래량", "거래대금"]) && includesAny(text, ["전고점", "돌파"])) {
    return "거래량 급증 전고점 돌파 전략";
  }
  if (includesAny(text, ["rsi", "과매도", "반등"])) return "RSI 과매도 반등 전략";
  if (includesAny(text, ["갭", "눌림"])) return "갭 상승 후 눌림목 전략";
  if (includesAny(text, ["뉴스", "거래량"])) return "뉴스 이후 거래량 반응 전략";
  const labels: Record<StrategyType, string> = {
    scalping: "초단기 신호 관찰 전략",
    dayTrading: "당일 조건 정리 전략",
    swing: "일봉 스윙 관찰 전략",
    closingBet: "장 막판 강세 관찰 전략",
    breakout: "주요 가격 돌파 전략",
    pullback: "추세 중 눌림목 전략",
    meanReversion: "과매도 반등 관찰 전략",
    volatility: "변동성 확대 관찰 전략",
    newsDisclosure: "뉴스/공시 반응 관찰 전략",
    fundamentalFilter: "기본 조건 필터 전략",
    marketRegimeFilter: "시장 국면 필터 전략",
  };
  return labels[strategyType];
}

function buildConditions(text: string, strategyType: StrategyType): ConditionGroup {
  const entry: string[] = [];
  const exit: string[] = [];
  const universe: string[] = [];
  const filters: string[] = [];
  const risk: string[] = [];

  if (includesAny(text, ["거래량", "거래대금"])) {
    entry.push("최근 평균 대비 거래량 또는 거래대금이 뚜렷하게 증가한다.");
    universe.push("유동성이 충분하고 최근 거래대금이 지나치게 낮지 않은 대상만 본다.");
  }
  if (includesAny(text, ["전고점", "돌파", "신고가"])) {
    entry.push("가격이 직전 주요 고점 부근을 돌파하거나 돌파 직전 구간에 위치한다.");
    exit.push("돌파 이후 종가가 다시 돌파 가격 아래로 내려오면 관찰을 종료한다.");
    filters.push("윗꼬리가 반복되는 과열 구간은 주의한다.");
  }
  if (includesAny(text, ["눌림", "조정", "20일선", "5일선", "갭"])) {
    entry.push("상승 흐름 이후 단기 조정이 나오고 주요 이동평균 또는 이전 지지 구간에서 멈추는지 본다.");
    exit.push("눌림 구간의 저점을 명확히 이탈하면 전략 가정을 다시 확인한다.");
    filters.push("추세가 이미 꺾인 하락 전환 구간은 제외한다.");
  }
  if (includesAny(text, ["rsi", "과매도", "반등", "볼린저", "하단"])) {
    entry.push("과매도 지표가 완화되며 가격이 반등 신호를 보이는지 확인한다.");
    filters.push("하락 추세가 강하게 이어지는 구간에서는 단순 반등 신호를 낮게 평가한다.");
  }
  if (includesAny(text, ["뉴스", "공시", "테마"])) {
    universe.push("뉴스나 공시 이후 실제 거래 반응이 확인된 대상만 본다.");
    filters.push("재료가 이미 가격에 과하게 반영된 구간은 피한다.");
  }
  if (includesAny(text, ["손절", "익절", "atr", "손익비"])) {
    exit.push("사전에 정한 손절, 익절 또는 손익비 기준에 도달하면 관찰을 종료한다.");
    risk.push("ATR 또는 최근 변동폭을 참고해 손절 기준을 너무 좁게 잡지 않는다.");
  }

  if (entry.length === 0) entry.push("사용자가 말한 핵심 조건이 발생하는 구간을 관찰한다.");
  if (exit.length === 0) {
    exit.push("핵심 조건이 사라지거나 가격 흐름이 반대로 바뀌면 관찰을 종료한다.");
    exit.push("단기 이동평균 이탈 또는 고정 손절 기준을 둔다.");
  }
  if (universe.length === 0) {
    universe.push("거래가 너무 얇거나 변동성이 비정상적인 대상은 제외한다.");
    universe.push("추가 확인 필요: 어떤 자산군과 시장을 볼지 정한다.");
  }
  if (filters.length === 0) {
    filters.push("시장 전체가 급락 중인 구간은 피한다.");
    filters.push("추가 확인 필요: 시간대와 시장 국면 필터를 정한다.");
  }
  if (risk.length === 0) risk.push("손절 기준이 없으면 최대 손실 구간이 커질 수 있다.");

  if (strategyType === "breakout") {
    filters.push("돌파 직후 거래량이 줄어드는 가짜 돌파 가능성을 확인한다.");
  }
  if (strategyType === "meanReversion") {
    risk.push("강한 하락 추세에서는 과매도 신호가 반복될 수 있다.");
  }

  return {
    entry: uniq(entry),
    exit: uniq(exit),
    universe: uniq(universe),
    filters: uniq(filters),
    risk: uniq(risk),
  };
}

export function parseStrategyIdea(rawIdea: string): StrategyCard {
  const trimmed = rawIdea.trim();
  if (!trimmed) {
    throw new Error("투자 아이디어를 한 문장 이상 입력해주세요.");
  }

  const normalized = trimmed.toLowerCase();
  const strategyType = inferStrategyType(normalized);
  const assetClass = inferAssetClass(normalized);
  const timeframe = inferTimeframe(normalized, strategyType);
  const conditions = buildConditions(normalized, strategyType);
  const now = new Date().toISOString();

  const riskSummary =
    strategyType === "breakout"
      ? "돌파 직후 되돌림과 가짜 돌파를 특히 조심해야 합니다."
      : strategyType === "meanReversion"
        ? "과매도 반등은 하락 추세가 강할 때 신호가 반복 실패할 수 있습니다."
        : "조건이 맞더라도 수수료, 슬리피지, 데이터 지연, 과최적화 위험을 함께 봐야 합니다.";

  return {
    id: createId("strategy"),
    title: buildTitle(normalized, strategyType),
    rawIdea: trimmed,
    summary: "말로 적은 아이디어를 진입, 청산, 종목, 필터, 리스크 조건으로 나눈 문장형 전략 카드입니다.",
    strategyType,
    assetClass,
    timeframe,
    conditions,
    suitableRegime:
      strategyType === "breakout"
        ? ["거래량이 붙는 상승 전환 구간", "시장 지수가 안정적인 구간"]
        : ["변동성이 과하지 않고 조건 확인이 가능한 구간", "시장 방향이 급격히 흔들리지 않는 구간"],
    weakRegime:
      strategyType === "meanReversion"
        ? ["강한 추세 하락장", "악재가 이어지는 구간"]
        : ["시장 전체 급락장", "유동성이 급격히 줄어드는 구간"],
    riskSummary,
    validationIdea: `${GLOBAL_DISCLAIMER} 같은 조건을 인앱 가상 데이터에 적용해 신호 빈도, 손실 구간, 잘 맞는 시간대를 먼저 확인합니다.`,
    requestedPlatforms: [],
    createdAt: now,
    updatedAt: now,
    version: 1,
    isSaved: false,
    hasReport: false,
  };
}
