import { conditionTemplates } from "@/lib/condition-templates";
import { retrieveConditionCandidates } from "@/lib/condition-assistant";
import { generateQwenText } from "@/lib/qwen";
import type { AssetClass, ConditionCategory, ConditionTemplate } from "@/lib/types";

export type ComposerSuggestion = {
  answer: string;
  provider: "qwen" | "fallback";
  model: string;
  fallbackUsed: boolean;
  turn: number;
  suggestedIds: string[];
};

type ComposerInput = {
  message: string;
  selectedIds: string[];
  turn: number;
  selectedMarket?: AssetClass;
};

export async function runComposerAssistant(input: ComposerInput): Promise<ComposerSuggestion> {
  const turn = Math.max(1, Math.min(input.turn, 3));
  const candidates = pickComposerCards(input.message, input.selectedIds, input.selectedMarket);
  const fallback = buildFallback(candidates, turn);

  const qwen = await generateQwenText({
    systemPrompt: [
      "너는 식톡의 합성 전략 도우미다.",
      "사용자 요청에 맞춰 조건식 카드를 2~4장 조합한다.",
      "투자 추천을 하지 않는다.",
      "답변은 한국어 4줄 이내로 쓴다.",
      "형식:",
      "합성 방향: ...",
      "추가 카드: 1) ... 2) ... 3) ...",
      "바로 확인: 최근 1주 미리보기 또는 알림 초안",
    ].join("\n"),
    userPrompt: [
      `사용자 요청: ${input.message}`,
      `현재 턴: ${turn}/3`,
      `이미 선택된 카드: ${input.selectedIds.join(", ") || "없음"}`,
      `추천 카드: ${candidates.map((item) => item.title).join(", ")}`,
    ].join("\n"),
    fallback,
  });

  return {
    answer: qwen.text,
    provider: qwen.provider,
    model: qwen.model,
    fallbackUsed: qwen.fallbackUsed,
    turn,
    suggestedIds: candidates.map((item) => item.id),
  };
}

export function pickComposerCards(message: string, selectedIds: string[], selectedMarket?: AssetClass) {
  const pool = retrieveConditionCandidates(message, selectedMarket)
    .map((candidate) => conditionTemplates.find((template) => template.id === candidate.id))
    .filter((template): template is ConditionTemplate => Boolean(template))
    .filter((template) => !selectedIds.includes(template.id));

  if (pool.length === 0) {
    return conditionTemplates.filter((template) => !selectedIds.includes(template.id)).slice(0, 3);
  }

  const picked: ConditionTemplate[] = [];
  const usedCategories = new Set<ConditionCategory>();

  for (const item of pool) {
    if (!usedCategories.has(item.category) || picked.length < 2) {
      picked.push(item);
      usedCategories.add(item.category);
    }
    if (picked.length >= 4) break;
  }

  if (picked.length < 3) {
    for (const item of pool) {
      if (!picked.some((pickedItem) => pickedItem.id === item.id)) {
        picked.push(item);
      }
      if (picked.length >= 3) break;
    }
  }

  return picked.slice(0, 4);
}

function buildFallback(templates: ConditionTemplate[], turn: number) {
  const titles = templates.map((item) => item.title);
  const lines = [
    "합성 방향: 지금 요청에 맞는 카드 조합을 캔버스에 올렸습니다.",
    `추가 카드: ${titles.map((title, index) => `${index + 1}) ${title}`).join(" / ")}`,
    "바로 확인: 최근 1주 미리보기 또는 알림 초안",
  ];
  if (turn < 3) {
    lines.push("다음 턴에서는 종료 조건이나 리스크 카드만 더 보강하면 됩니다.");
  }
  return lines.join("\n");
}
