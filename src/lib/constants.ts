import type { ConversionPlatform, StrategyType } from "./types";

export const INVESTMENT_DISCLAIMER =
  "이 결과는 실제 투자 추천이 아닙니다. 현재는 전략 문장과 인앱 가상 데이터를 바탕으로 한 전략 이해용 모의검증입니다. 실제 시장에서는 체결 실패, 수수료, 슬리피지, 데이터 지연, 과최적화 위험이 존재합니다. 최종 투자 판단은 사용자 본인의 책임입니다.";

export const GLOBAL_DISCLAIMER =
  "실제 투자 추천이 아닙니다. 현재는 전략 이해를 돕는 모의검증입니다. 실제 시장에서는 체결 실패, 수수료, 슬리피지, 데이터 지연, 과최적화 위험이 존재합니다. 최종 투자 판단은 사용자 본인의 책임입니다.";

export const platformLabels: Record<ConversionPlatform, string> = {
  tradingview: "트레이딩뷰 알람식",
  kiwoom: "키움 조건검색식",
  yestrader: "예스트레이더 조건식",
  mts: "MTS 알람 문장",
  webhook: "웹훅 알림용 문장",
  telegram: "텔레그램 알림 문구",
};

export const strategyTypeLabels: Record<StrategyType, string> = {
  scalping: "스캘핑",
  dayTrading: "데이 트레이딩",
  swing: "스윙",
  closingBet: "종가베팅",
  breakout: "돌파",
  pullback: "눌림목",
  meanReversion: "평균회귀",
  volatility: "변동성",
  newsDisclosure: "뉴스/공시",
  fundamentalFilter: "펀더멘털 필터",
  marketRegimeFilter: "시장 국면 필터",
};

export const quickIdeas = [
  "거래량이 갑자기 늘고 전고점을 돌파하면 관심종목으로 보고 싶어.",
  "RSI가 너무 낮다가 반등할 때 알람 받고 싶어.",
  "볼린저밴드 하단을 찍고 거래량이 붙으면 관찰하고 싶어.",
  "전고점 돌파 후 다시 밀리지 않는 종목을 보고 싶어.",
  "갭 상승 후 눌림목이 오면 진입 후보로 보고 싶어.",
  "ATR 기준으로 손절선을 잡고 싶어.",
  "뉴스 이후 거래량이 반응하는 종목만 보고 싶어.",
  "손익비가 맞을 때만 청산 기준을 세우고 싶어.",
];

export const quickIdeaButtons = [
  { label: "거래량 돌파", idea: quickIdeas[0] },
  { label: "RSI 반등", idea: quickIdeas[1] },
  { label: "볼린저밴드 하단 반등", idea: quickIdeas[2] },
  { label: "전고점 돌파", idea: quickIdeas[3] },
  { label: "갭 상승 후 눌림", idea: quickIdeas[4] },
  { label: "ATR 손절", idea: quickIdeas[5] },
  { label: "뉴스 이후 거래량 반응", idea: quickIdeas[6] },
  { label: "손익비 기반 청산", idea: quickIdeas[7] },
];
