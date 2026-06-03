import { assetClassLabel, timeframeLabel } from "./format";
import type { StrategyCard } from "./types";

export type PlatformCopyTab = "natural" | "tradingview" | "yestrader" | "kiwoom" | "telegram";

export const platformCopyTabs: { id: PlatformCopyTab; label: string; hint: string }[] = [
  { id: "natural", label: "자연어 설명", hint: "사람이 읽는 관찰 흐름" },
  { id: "tradingview", label: "TradingView Pine", hint: "알람식 초안" },
  { id: "yestrader", label: "예스랭귀지", hint: "전략식 초안" },
  { id: "kiwoom", label: "키움 설정표", hint: "HTS 입력 순서" },
  { id: "telegram", label: "Telegram", hint: "알림 문구 템플릿" },
];

export function getPlatformCopy(strategy: StrategyCard, tab: PlatformCopyTab): string {
  switch (tab) {
    case "natural":
      return buildNaturalCopy(strategy);
    case "tradingview":
      return buildTradingViewDraft(strategy);
    case "yestrader":
      return buildYesLanguageDraft(strategy);
    case "kiwoom":
      return buildKiwoomDraft(strategy);
    case "telegram":
      return buildTelegramDraft(strategy);
    default:
      return buildNaturalCopy(strategy);
  }
}

function buildNaturalCopy(strategy: StrategyCard): string {
  return `전략명: ${strategy.title}

시장:
- ${assetClassLabel(strategy.assetClass)}

시간봉:
- ${timeframeLabel(strategy.timeframe)}

관찰 시작:
${listWithDash(strategy.conditions.entry)}

관찰 종료:
${listWithDash(strategy.conditions.exit)}

종목 조건:
${listWithDash(strategy.conditions.universe)}

필터 조건:
${listWithDash(strategy.conditions.filters)}

주의:
- 이 전략은 투자 추천이 아니라 플랫폼 변환 데모입니다.
- 실제 적용 전 각 플랫폼에서 수식, 알림, 차트 표시를 직접 확인해야 합니다.
- 실거래 전 모의검증과 백테스트가 필요합니다.`;
}

function buildTradingViewDraft(strategy: StrategyCard): string {
  return `//@version=6
indicator("SikTalk Draft - ${sanitizeTitle(strategy.title)}", overlay=true)

// Draft only. Manual review is required before use.
// 시장: ${assetClassLabel(strategy.assetClass)}
// 시간봉: ${timeframeLabel(strategy.timeframe)}

entrySignal = false
exitSignal = false

// ENTRY
${listAsComments(strategy.conditions.entry)}

// EXIT
${listAsComments(strategy.conditions.exit)}

// FILTER
${listAsComments(strategy.conditions.filters)}

plotshape(entrySignal, title="SikTalk Entry", style=shape.triangleup, location=location.belowbar, text="IN")
plotshape(exitSignal, title="SikTalk Exit", style=shape.triangledown, location=location.abovebar, text="OUT")

alertcondition(entrySignal, title="SikTalk Entry Alert", message="${sanitizeLine(strategy.title)} entry draft")
alertcondition(exitSignal, title="SikTalk Exit Alert", message="${sanitizeLine(strategy.title)} exit draft")`;
}

function buildYesLanguageDraft(strategy: StrategyCard): string {
  return `// SikTalk Draft - ${strategy.title}
// 시간봉: ${timeframeLabel(strategy.timeframe)}
// 목적: 예스랭귀지 변환 초안. 실제 주문 전 수동 검수 필요.

// ENTRY
${listAsComments(strategy.conditions.entry)}

// EXIT
${listAsComments(strategy.conditions.exit)}

// UNIVERSE
${listAsComments(strategy.conditions.universe)}

// FILTER
${listAsComments(strategy.conditions.filters)}

// 아래는 자리표시자입니다.
If EntryCondition Then
{
    // Buy or alert logic
}

If ExitCondition Then
{
    // Exit logic
}`;
}

function buildKiwoomDraft(strategy: StrategyCard): string {
  return `전략명: ${strategy.title}
사용 화면: 영웅문 HTS 조건검색
시장: ${assetClassLabel(strategy.assetClass)}
시간 기준: ${timeframeLabel(strategy.timeframe)}

조건 A. 진입
${listWithNumber(strategy.conditions.entry)}

조건 B. 청산
${listWithNumber(strategy.conditions.exit)}

조건 C. 종목
${listWithNumber(strategy.conditions.universe)}

조건 D. 필터
${listWithNumber(strategy.conditions.filters)}

주의
1. 플랫폼별 세부 메뉴명은 HTS 버전에 따라 다를 수 있습니다.
2. 자동 변환이 아니라 입력 순서 초안입니다.`;
}

function buildTelegramDraft(strategy: StrategyCard): string {
  return `[식톡 조건 알림 초안]

전략명: ${strategy.title}
시장: ${assetClassLabel(strategy.assetClass)}
시간봉: ${timeframeLabel(strategy.timeframe)}
종목: {{ticker}}

관찰 시작 조건:
${listWithDash(strategy.conditions.entry)}

관찰 종료 조건:
${listWithDash(strategy.conditions.exit)}

주의:
이 알림은 투자 추천이 아니라 사용자가 설정한 조건 충족 알림 초안입니다.`;
}

function listWithDash(items: string[]): string {
  return items.map((item) => `- ${item}`).join("\n");
}

function listWithNumber(items: string[]): string {
  return items.map((item, index) => `${index + 1}. ${item}`).join("\n");
}

function listAsComments(items: string[]): string {
  return items.map((item, index) => `// ${index + 1}. ${item}`).join("\n");
}

function sanitizeTitle(value: string): string {
  return value.replace(/"/g, "").replace(/\s+/g, "_");
}

function sanitizeLine(value: string): string {
  return value.replace(/\n/g, " ").replace(/"/g, '\\"');
}
