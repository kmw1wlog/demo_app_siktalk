import { parseStrategyIdea } from "./strategy-parser";
import type { StrategyCard } from "./types";

const seedIdeas = [
  "거래량 돌파: 거래량이 갑자기 늘고 전고점을 돌파하면 관심종목으로 보고 싶어.",
  "RSI 반등: RSI가 너무 낮다가 반등할 때 알람 받고 싶어.",
  "볼린저밴드 하단 반등: 밴드 하단을 찍고 반등하면 관찰하고 싶어.",
  "전고점 돌파: 전고점을 강하게 돌파하는 종목을 보고 싶어.",
  "장 막판 강세: 장 막판 거래량이 붙고 종가가 강한 종목을 보고 싶어.",
  "갭 상승 후 눌림: 갭 상승 후 눌림목이 오면 진입 후보로 보고 싶어.",
  "ATR 손절: ATR 기준으로 손절선을 잡고 싶어.",
  "이동평균 골든크로스: 5일선이 20일선을 돌파하면 보고 싶어.",
  "신고가 돌파: 신고가 돌파 이후 거래대금이 유지되는 종목을 보고 싶어.",
  "거래대금 상위 종목 필터: 거래대금 상위 종목만 필터링하고 싶어.",
  "코인 고변동성 스캘핑: BTC와 ETH에서 1분봉 고변동성 구간만 보고 싶어.",
  "뉴스 이후 거래량 반응: 뉴스 이후 거래량이 반응하는 종목만 보고 싶어.",
  "공시 이후 추세 확인: 공시 이후 가격이 무너지지 않는 종목을 보고 싶어.",
  "종가베팅 후보 필터: 종가 근처 강세와 거래량이 유지되는 후보를 보고 싶어.",
  "오전장 급등 후 눌림: 오전장 급등 후 5일선 부근 눌림을 보고 싶어.",
  "오후장 재돌파: 오후장에 전고점을 다시 돌파하는 종목을 보고 싶어.",
  "과열 회피 필터: 윗꼬리와 과열이 심한 종목은 제외하고 싶어.",
  "저변동성 돌파: 조용하던 종목이 거래량과 함께 돌파할 때 보고 싶어.",
  "섹터 대장주 추적: 테마 안에서 거래대금이 가장 큰 대장주를 추적하고 싶어.",
  "손익비 기반 청산: 손익비가 맞을 때만 익절과 손절 기준을 세우고 싶어.",
];

export const seedStrategies: StrategyCard[] = seedIdeas.map((idea, index) => {
  const card = parseStrategyIdea(idea);
  const title = idea.split(":")[0];
  const createdAt = new Date(Date.UTC(2026, 0, index + 1, 9, 0, 0)).toISOString();
  return {
    ...card,
    id: `seed_${index + 1}`,
    title,
    createdAt,
    updatedAt: createdAt,
    isSaved: false,
  };
});
