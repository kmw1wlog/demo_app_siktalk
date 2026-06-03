import { buildIdeaFromCondition, conditionTemplates } from "./condition-templates";
import { generateQwenText } from "./qwen";
import { parseStrategyIdea } from "./strategy-parser";
import type {
  AssetClass,
  ConditionCategory,
  ConditionTemplate,
  StrategyCard,
  StrategyType,
} from "./types";

export const MAX_ASSISTANT_TURNS = 3;

export type AssistantIntentType =
  | "find_condition"
  | "build_strategy"
  | "explain_condition"
  | "clarify_request";

export type AssistantStage = "clarify" | "recommend" | "done";

export type AssistantCandidate = {
  id: string;
  title: string;
  category: ConditionCategory;
  market: AssetClass;
  strategyType: StrategyType;
  difficulty: ConditionTemplate["difficulty"];
  plainKorean: string;
  whyUse: string;
  tags: string[];
  score: number;
};

export type ConditionAssistantPlan = {
  intentType: AssistantIntentType;
  stage: AssistantStage;
  turn: number;
  maxTurns: number;
  candidates: AssistantCandidate[];
  followUpQuestion?: string;
  followUpOptions: string[];
  shouldCreateStrategy: boolean;
  searchQuery: string;
};

export type ConditionAssistantResult = ConditionAssistantPlan & {
  answer: string;
  provider: "qwen" | "fallback";
  model: string;
  fallbackUsed: boolean;
  error?: string;
};

type ConditionAssistantInput = {
  rawIdea: string;
  selectedMarket?: AssetClass;
  turn?: number;
  history?: string[];
};

const setupKeywords = {
  breakout: ["돌파", "전고점", "상따", "신고가", "시초가"],
  pullback: ["눌림", "조정", "재돌파", "되돌림"],
  meanReversion: ["반등", "과매도", "rsi", "스토캐스틱", "볼린저"],
  closingBet: ["종가", "종베", "장막판", "마감"],
  volatility: ["거래량", "거래대금", "atr", "변동성"],
  newsDisclosure: ["뉴스", "공시", "재료", "실적"],
} as const;

const categoryKeywords: Record<ConditionCategory, string[]> = {
  entry: ["진입", "시작", "돌파", "반등"],
  exit: ["청산", "종료", "이탈", "손절", "익절"],
  universe: ["종목", "유니버스", "대상", "거래대금"],
  filters: ["필터", "제외", "시장", "국면", "추세"],
  risk: ["리스크", "손절", "atr", "하락폭"],
};

const marketKeywords: Record<AssetClass, string[]> = {
  koreanStock: ["국장", "국내", "코스피", "코스닥", "키움"],
  usStock: ["미장", "미국", "나스닥", "s&p", "실적"],
  crypto: ["코인", "비트코인", "이더리움", "btc", "eth"],
  etf: ["etf"],
  futures: ["선물", "해외선물"],
  unknown: [],
};

export async function runConditionAssistant(input: ConditionAssistantInput): Promise<ConditionAssistantResult> {
  const plan = planConditionAssistant(input);
  const fallback = buildAssistantFallback(plan);

  if (plan.stage === "clarify") {
    return {
      ...plan,
      answer: fallback,
      provider: "fallback",
      model: "planner",
      fallbackUsed: true,
    };
  }

  const qwenResult = await generateQwenText({
    systemPrompt: [
      "너는 식톡의 조건식 큐레이터다.",
      "역할은 80개 조건식 DB에서 상위 후보를 짧게 정리해 주는 것이다.",
      "투자 추천, 매수/매도 지시, 수익 보장 표현을 금지한다.",
      "반드시 아래 형식을 지킨다.",
      "요청 이해: 한 문장",
      "우선 후보: 1) 제목 2) 제목 3) 제목",
      "다음 행동: 한 문장",
      "총 3줄만 답하고, 과장 없이 한국어로 쓴다.",
    ].join("\n"),
    userPrompt: [
      `사용자 요청: ${plan.searchQuery}`,
      `의도: ${plan.intentType}`,
      `대화 턴: ${plan.turn}/${plan.maxTurns}`,
      "상위 후보:",
      ...plan.candidates.slice(0, 3).map((candidate, index) =>
        `${index + 1}. ${candidate.title} | ${candidate.plainKorean} | 이유: ${candidate.whyUse}`,
      ),
    ].join("\n"),
    fallback,
  });

  return {
    ...plan,
    answer: qwenResult.text,
    provider: qwenResult.provider,
    model: qwenResult.model,
    fallbackUsed: qwenResult.fallbackUsed,
    error: qwenResult.error,
  };
}

export function planConditionAssistant(input: ConditionAssistantInput): ConditionAssistantPlan {
  const turn = clampTurn(input.turn);
  const history = (input.history ?? []).filter(Boolean);
  const searchQuery = [...history, input.rawIdea].join(" ").trim();
  const normalized = normalize(searchQuery);
  const intentType = detectIntentType(normalized);
  const candidates = retrieveConditionCandidates(searchQuery, input.selectedMarket);
  const topScore = candidates[0]?.score ?? 0;
  const hasSetupSignal = detectSetupSignal(normalized);
  const genericPrompt = isGenericPrompt(normalized);

  if (turn < MAX_ASSISTANT_TURNS && !hasSetupSignal && (topScore < 14 || genericPrompt)) {
    return {
      intentType: "clarify_request",
      stage: "clarify",
      turn,
      maxTurns: MAX_ASSISTANT_TURNS,
      candidates: candidates.slice(0, 3),
      followUpQuestion: "어느 쪽에 더 가깝나요?",
      followUpOptions: ["돌파 쪽", "눌림 쪽", "반등 쪽"],
      shouldCreateStrategy: false,
      searchQuery,
    };
  }

  return {
    intentType,
    stage: turn >= MAX_ASSISTANT_TURNS ? "done" : "recommend",
    turn,
    maxTurns: MAX_ASSISTANT_TURNS,
    candidates: candidates.slice(0, 3),
    followUpQuestion: undefined,
    followUpOptions: [],
    shouldCreateStrategy: candidates.length > 0,
    searchQuery,
  };
}

export function retrieveConditionCandidates(rawIdea: string, selectedMarket?: AssetClass): AssistantCandidate[] {
  const normalized = normalize(rawIdea);
  const tokens = extractTokens(normalized);
  const desiredMarket = resolveDesiredMarket(normalized, selectedMarket);
  const desiredCategory = resolveDesiredCategory(normalized);
  const desiredSetup = detectSetupSignal(normalized);

  return conditionTemplates
    .map((template) => {
      let score = 0;

      if (template.id.startsWith("condition_base_")) score += 8;
      if (template.id.startsWith("condition_auto_")) score -= 2;
      if (desiredMarket && (template.market === desiredMarket || template.market === "unknown")) score += template.market === desiredMarket ? 6 : 2;
      if (desiredCategory && template.category === desiredCategory) score += 4;
      if (desiredSetup && template.strategyType === desiredSetup) score += 5;

      for (const token of tokens) {
        if (template.title.toLowerCase().includes(token)) score += 5;
        if (template.plainKorean.toLowerCase().includes(token)) score += 3;
        if (template.whyUse.toLowerCase().includes(token)) score += 1;
        if (template.tags.some((tag) => tag.toLowerCase().includes(token))) score += 6;
      }

      for (const keyword of categoryKeywords[template.category]) {
        if (normalized.includes(keyword)) score += 2;
      }

      return {
        id: template.id,
        title: template.title,
        category: template.category,
        market: template.market,
        strategyType: template.strategyType,
        difficulty: template.difficulty,
        plainKorean: template.plainKorean,
        whyUse: template.whyUse,
        tags: template.tags,
        score,
      };
    })
    .filter((candidate) => candidate.score > 0)
    .sort((left, right) => right.score - left.score || left.title.localeCompare(right.title, "ko"))
    .slice(0, 6);
}

export function createStrategyFromConditionCandidate(candidateId: string, rawIdea: string): StrategyCard | null {
  const template = conditionTemplates.find((item) => item.id === candidateId);
  if (!template) return null;

  const strategy = parseStrategyIdea(`${rawIdea} ${buildIdeaFromCondition(template)}`);
  const nextConditions = {
    ...strategy.conditions,
    [template.category]: uniq([template.plainKorean, ...strategy.conditions[template.category]]),
  };

  return {
    ...strategy,
    title: template.title,
    summary: template.plainKorean,
    strategyType: template.strategyType,
    assetClass: template.market,
    conditions: nextConditions,
    suitableRegime: uniq([template.whyUse, ...strategy.suitableRegime]).slice(0, 3),
    riskSummary:
      template.category === "risk"
        ? `${template.plainKorean} 기준을 먼저 고정하고 나머지 조건을 붙이는 편이 안전합니다.`
        : strategy.riskSummary,
    validationIdea: `${template.title} 기준을 먼저 모의검증하고, 실제로 잘 안 맞는 시간대나 시장을 조건식 도구함에서 다시 좁혀보세요.`,
  };
}

function buildAssistantFallback(plan: ConditionAssistantPlan) {
  if (plan.stage === "clarify") {
    return [
      "요청은 이해했습니다.",
      `먼저 ${plan.followUpQuestion ?? "핵심 방향"}만 정하면 80개 DB에서 더 정확히 줄일 수 있습니다.`,
      `선택: ${plan.followUpOptions.join(" / ")}`,
    ].join("\n");
  }

  const labels = plan.candidates.map((candidate, index) => `${index + 1}) ${candidate.title}`).join(" / ");
  const nextAction =
    plan.stage === "done"
      ? "상세 조합은 조건식 도구함에서 확인하세요."
      : "가장 가까운 카드 하나를 눌러 전략 카드로 정리하세요.";

  return [
    `요청 이해: ${plan.searchQuery}`,
    `우선 후보: ${labels}`,
    `다음 행동: ${nextAction}`,
  ].join("\n");
}

function detectIntentType(normalized: string): AssistantIntentType {
  if (includesAny(normalized, ["설명", "뜻", "해석", "뭐야", "어떻게"])) return "explain_condition";
  if (includesAny(normalized, ["전략", "조합", "카드", "만들", "관찰식"])) return "build_strategy";
  if (includesAny(normalized, ["조건식", "추천", "찾아", "골라", "보여"])) return "find_condition";
  return "find_condition";
}

function detectSetupSignal(normalized: string): StrategyType | null {
  for (const [type, keywords] of Object.entries(setupKeywords) as Array<[StrategyType, readonly string[]]>) {
    if (keywords.some((keyword) => normalized.includes(keyword))) {
      return type;
    }
  }
  return null;
}

function resolveDesiredMarket(normalized: string, selectedMarket?: AssetClass) {
  for (const [market, keywords] of Object.entries(marketKeywords) as Array<[AssetClass, string[]]>) {
    if (keywords.some((keyword) => normalized.includes(keyword))) {
      return market;
    }
  }
  return selectedMarket && selectedMarket !== "unknown" ? selectedMarket : null;
}

function resolveDesiredCategory(normalized: string): ConditionCategory | null {
  for (const [category, keywords] of Object.entries(categoryKeywords) as Array<[ConditionCategory, string[]]>) {
    if (keywords.some((keyword) => normalized.includes(keyword))) {
      return category;
    }
  }
  return null;
}

function extractTokens(normalized: string) {
  return normalized
    .split(/[\s,./!?()]+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 2);
}

function normalize(value: string) {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function includesAny(text: string, keywords: string[]) {
  return keywords.some((keyword) => text.includes(keyword));
}

function uniq(items: string[]) {
  return Array.from(new Set(items));
}

function clampTurn(turn?: number) {
  if (!turn || Number.isNaN(turn)) return 1;
  return Math.min(Math.max(turn, 1), MAX_ASSISTANT_TURNS);
}

function isGenericPrompt(normalized: string) {
  return includesAny(normalized, [
    "좋은 조건식 추천",
    "조건식 추천해줘",
    "추천해줘",
    "뭐가 좋아",
    "뭘 봐야 해",
  ]);
}
