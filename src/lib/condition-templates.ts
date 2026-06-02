import type { AssetClass, ConditionTemplate, OnboardingAnswers, StrategyType } from "./types";

const baseTemplates: Array<Omit<ConditionTemplate, "id">> = [
  {
    title: "거래량 급증 돌파",
    category: "entry",
    market: "koreanStock",
    strategyType: "breakout",
    difficulty: "easy",
    plainKorean: "최근 평균 거래량보다 크게 늘고, 직전 고점을 뚫는 순간을 봅니다.",
    whyUse: "상따나 전고점 돌파 관찰식의 기본 축입니다.",
    tags: ["거래량", "돌파", "상따"],
    requiredInputs: ["최근 평균 거래량", "직전 고점"],
  },
  {
    title: "거래대금 상위 유지",
    category: "universe",
    market: "koreanStock",
    strategyType: "dayTrading",
    difficulty: "easy",
    plainKorean: "장중 거래대금 상위권을 오래 유지하는 종목만 봅니다.",
    whyUse: "유동성이 받쳐줘야 단타 기준도 실행하기 쉽습니다.",
    tags: ["거래대금", "유동성", "국장"],
    requiredInputs: ["거래대금 순위", "유지 시간"],
  },
  {
    title: "종가베팅 고가권 유지",
    category: "entry",
    market: "koreanStock",
    strategyType: "closingBet",
    difficulty: "easy",
    plainKorean: "장 막판에도 고가권을 지키고, 매수세가 크게 빠지지 않는 종목을 봅니다.",
    whyUse: "종베 후보를 고를 때 많이 쓰는 기본 틀입니다.",
    tags: ["종베", "장막판", "고가권"],
    requiredInputs: ["현재가 위치", "매수잔량"],
  },
  {
    title: "시초가 돌파 재진입",
    category: "entry",
    market: "koreanStock",
    strategyType: "breakout",
    difficulty: "medium",
    plainKorean: "시초가 위에서 버티다가 재돌파할 때만 진입 후보로 봅니다.",
    whyUse: "시초가 기준이 흔들리면 눌림과 실패를 구분하기 어렵습니다.",
    tags: ["시초가", "재돌파", "국장"],
    requiredInputs: ["시초가", "재돌파 시점"],
  },
  {
    title: "갭 상승 후 첫 눌림",
    category: "entry",
    market: "koreanStock",
    strategyType: "pullback",
    difficulty: "medium",
    plainKorean: "갭 상승 뒤 첫 눌림이 짧게 끝나고 다시 방향을 돌리는 순간을 봅니다.",
    whyUse: "시초가 급등 이후 무리한 추격을 줄이는 데 도움이 됩니다.",
    tags: ["갭상승", "눌림", "시초가"],
    requiredInputs: ["갭 크기", "눌림 저점"],
  },
  {
    title: "RSI 과매도 반등",
    category: "entry",
    market: "crypto",
    strategyType: "meanReversion",
    difficulty: "easy",
    plainKorean: "RSI가 과매도권에 있다가 다시 올라올 때 반등 신호로 봅니다.",
    whyUse: "코인 단기 반등 관찰에서 이해하기 쉬운 기준입니다.",
    tags: ["RSI", "과매도", "반등"],
    requiredInputs: ["RSI 값", "반등 시점"],
  },
  {
    title: "스토캐스틱 K선 상향 돌파",
    category: "entry",
    market: "unknown",
    strategyType: "meanReversion",
    difficulty: "easy",
    plainKorean: "스토캐스틱 K선이 D선을 아래에서 위로 넘길 때 단기 반등 신호로 봅니다.",
    whyUse: "과매도권 반등을 가장 직관적으로 읽을 수 있는 보조지표 기준입니다.",
    tags: ["스토캐스틱", "K선", "D선", "모멘텀"],
    requiredInputs: ["K선 값", "D선 값", "과매도 구간"],
  },
  {
    title: "PSAR 점 위치 전환",
    category: "filters",
    market: "unknown",
    strategyType: "marketRegimeFilter",
    difficulty: "medium",
    plainKorean: "PSAR 점이 캔들 위에서 아래로, 또는 아래에서 위로 바뀌는 순간을 추세 전환 후보로 봅니다.",
    whyUse: "상승·하락 방향을 빠르게 정리하고 손절 기준과 함께 보기 좋습니다.",
    tags: ["PSAR", "추세", "전환"],
    requiredInputs: ["점 위치", "캔들 방향", "전환 시점"],
  },
  {
    title: "복합신호 동시 확인",
    category: "filters",
    market: "unknown",
    strategyType: "marketRegimeFilter",
    difficulty: "advanced",
    plainKorean: "스토캐스틱, RSI, PSAR가 같은 방향을 가리킬 때만 진입 후보로 남깁니다.",
    whyUse: "단일 신호보다 보수적으로 진입 후보를 줄이고 싶을 때 유용합니다.",
    tags: ["복합신호", "RSI", "스토캐스틱", "PSAR"],
    requiredInputs: ["지표 3개 방향", "우선순위 기준", "제외 조건"],
  },
  {
    title: "5분봉 박스 상단 돌파",
    category: "entry",
    market: "crypto",
    strategyType: "scalping",
    difficulty: "easy",
    plainKorean: "5분봉 박스권 상단을 거래량과 함께 넘는 순간을 봅니다.",
    whyUse: "코인 급등 초입에서 가장 직관적인 형태 중 하나입니다.",
    tags: ["코인", "5분봉", "돌파"],
    requiredInputs: ["박스 상단", "돌파 거래량"],
  },
  {
    title: "ATR 기준 손절",
    category: "risk",
    market: "unknown",
    strategyType: "volatility",
    difficulty: "medium",
    plainKorean: "평균 변동폭인 ATR을 기준으로 손절 폭을 정합니다.",
    whyUse: "시장마다 다른 변동폭을 반영하기 쉽습니다.",
    tags: ["ATR", "손절", "리스크"],
    requiredInputs: ["ATR 값", "배수"],
  },
  {
    title: "뉴스 직후 거래량 반응",
    category: "filters",
    market: "usStock",
    strategyType: "newsDisclosure",
    difficulty: "medium",
    plainKorean: "뉴스가 나온 뒤 실제 거래량이 붙는지 확인하고 나서만 봅니다.",
    whyUse: "기사만으로는 과열과 진짜 반응을 구분하기 어렵기 때문입니다.",
    tags: ["뉴스", "거래량", "미장"],
    requiredInputs: ["뉴스 시각", "거래량 반응"],
  },
  {
    title: "전일 고가 회복",
    category: "entry",
    market: "usStock",
    strategyType: "dayTrading",
    difficulty: "easy",
    plainKorean: "뉴스나 실적 이후 전일 고가를 다시 넘는지 확인합니다.",
    whyUse: "미장 추세 확인식의 기본 축으로 쓰기 좋습니다.",
    tags: ["전일고가", "미장", "실적"],
    requiredInputs: ["전일 고가", "회복 시 거래량"],
  },
];

const markets: AssetClass[] = ["koreanStock", "usStock", "crypto", "etf"];
const categories: ConditionTemplate["category"][] = ["entry", "exit", "universe", "filters", "risk"];
const strategyTypes: StrategyType[] = ["breakout", "pullback", "closingBet", "meanReversion", "volatility", "dayTrading", "scalping"];
const tagSets = [
  ["거래량", "돌파"],
  ["종베", "시간대"],
  ["ATR", "손절"],
  ["RSI", "반등"],
  ["뉴스", "추세"],
  ["갭", "눌림"],
];

const autoTemplates: ConditionTemplate[] = [];

for (let index = 0; index < 72; index += 1) {
  const market = markets[index % markets.length];
  const category = categories[index % categories.length];
  const strategyType = strategyTypes[index % strategyTypes.length];
  const tags = tagSets[index % tagSets.length];
  autoTemplates.push({
    id: `condition_auto_${index + 1}`,
    title: `${marketLabel(market)} ${tags[0]} ${index + 1}`,
    category,
    market,
    strategyType,
    difficulty: index % 3 === 0 ? "easy" : index % 3 === 1 ? "medium" : "advanced",
    plainKorean: `${marketLabel(market)}에서 ${tags.join("·")} 기준을 보기 쉽게 정리한 조건식입니다.`,
    whyUse: `${categoryLabel(category)} 판단을 반복 가능한 문장으로 남기기 좋습니다.`,
    tags,
    requiredInputs: ["기준 값", "시간대", "제외 조건"],
  });
}

export const conditionTemplates: ConditionTemplate[] = [
  ...baseTemplates.map((template, index) => ({ ...template, id: `condition_base_${index + 1}` })),
  ...autoTemplates,
];

export function getRecommendedConditionTemplates(answers: OnboardingAnswers): ConditionTemplate[] {
  return conditionTemplates
    .filter((template) => {
      const marketOk = !answers.market || template.market === answers.market || template.market === "unknown";
      const setupOk = !answers.setup || template.strategyType === answers.setup || sharedSetupMatch(template.strategyType, answers.setup);
      const riskOk = !answers.risk || (answers.risk === "atr" ? template.tags.includes("ATR") : true);
      return marketOk && setupOk && riskOk;
    })
    .sort((left, right) => scoreTemplate(right, answers) - scoreTemplate(left, answers));
}

export function buildIdeaFromCondition(template: ConditionTemplate): string {
  return `${template.title}처럼 ${template.plainKorean} 조건을 전략 카드로 정리하고 싶어.`;
}

function scoreTemplate(template: ConditionTemplate, answers: OnboardingAnswers): number {
  let score = 0;
  if (answers.market && template.market === answers.market) score += 5;
  if (answers.setup && (template.strategyType === answers.setup || sharedSetupMatch(template.strategyType, answers.setup))) score += 4;
  if (answers.risk === "atr" && template.tags.includes("ATR")) score += 3;
  if (answers.universe === "volume" && template.tags.includes("거래량")) score += 2;
  if (answers.pace === "fast" && (template.strategyType === "scalping" || template.tags.includes("5분봉"))) score += 2;
  if (template.difficulty === "easy") score += 1;
  return score;
}

function sharedSetupMatch(type: StrategyType, setup: NonNullable<OnboardingAnswers["setup"]>): boolean {
  if (setup === "volume") return type === "volatility" || type === "dayTrading";
  if (setup === "risk") return type === "volatility";
  return false;
}

function marketLabel(market: AssetClass): string {
  switch (market) {
    case "koreanStock":
      return "국장";
    case "usStock":
      return "미장";
    case "crypto":
      return "코인";
    case "etf":
      return "ETF";
    case "futures":
      return "선물";
    default:
      return "공통";
  }
}

function categoryLabel(category: ConditionTemplate["category"]): string {
  switch (category) {
    case "entry":
      return "진입";
    case "exit":
      return "청산";
    case "universe":
      return "종목";
    case "filters":
      return "필터";
    case "risk":
      return "리스크";
    default:
      return "조건";
  }
}
