import type { StrategyCard } from "./types";

const now = "2026-06-01T00:00:00.000Z";

export const DEMO_STRATEGY_QUESTION = `국장, 미장, 코인에서 공통으로 쓸 수 있는 단순한 전략을 만들고 싶어.

15분봉 기준으로
5봉 단순이동평균선이 20봉 단순이동평균선을 상향돌파하고,
현재 봉이 양봉이면 관찰 시작 신호로 보고,

5봉 단순이동평균선이 20봉 단순이동평균선을 하향돌파하면
관찰 종료 신호로 보는 전략 카드를 만들어줘.

그리고 이 전략을 TradingView, 예스트레이더, 키움 조건검색, Telegram 알림, KIS API 연동용 형식으로 각각 퍼갈 수 있게 정리해줘.`;

export const DEMO_STRATEGY: StrategyCard = {
  id: "demo_ma5_ma20_bullish_cross",
  title: "MA5/MA20 양봉 크로스 관찰 전략",
  rawIdea: DEMO_STRATEGY_QUESTION,
  summary: "15분봉에서 MA5가 MA20을 상향돌파하고 현재 봉이 양봉일 때 관찰을 시작하는 플랫폼 변환 데모 전략입니다.",
  strategyType: "dayTrading",
  assetClass: "unknown",
  timeframe: "15m",
  conditions: {
    entry: [
      "5봉 단순이동평균선이 20봉 단순이동평균선을 상향돌파한다.",
      "현재 봉 종가가 시가보다 높다. 즉, 양봉이다.",
    ],
    exit: ["5봉 단순이동평균선이 20봉 단순이동평균선을 하향돌파하면 관찰을 종료한다."],
    universe: ["국장, 미장, 코인에서 공통으로 테스트할 수 있는 유동성 있는 대상만 본다."],
    filters: ["15분봉 기준으로 확인한다.", "플랫폼별 최종 적용 전 사용자가 조건과 차트 표시를 직접 확인한다."],
    risk: ["이 전략은 투자 추천이 아니라 플랫폼별 조건식 변환 데모입니다.", "실제 매매 전에는 반드시 모의검증과 사용자 검수가 필요합니다."],
  },
  suitableRegime: ["단기 이동평균 추세가 새로 만들어지는 구간", "횡보 후 방향성이 생기는 구간"],
  weakRegime: ["급락장", "거래가 얇은 종목", "갭과 슬리피지가 큰 구간"],
  riskSummary: "관찰 시작과 종료 기준만 제공하는 데모입니다. 자동 주문, 수익 보장, 종목 추천이 아닙니다.",
  validationIdea: "같은 MA5/MA20 양봉 크로스 조건을 플랫폼별로 옮긴 뒤, 알림 발생 빈도와 실패 구간을 모의 데이터로 확인합니다.",
  requestedPlatforms: [],
  createdAt: now,
  updatedAt: now,
  version: 1,
  isSaved: false,
  hasReport: false,
};

export const DEMO_NATURAL_LANGUAGE = `전략명: MA5/MA20 양봉 크로스 관찰 전략

시장:
- 국장 / 미장 / 코인 공통으로 테스트 가능

시간봉:
- 15분봉

관찰 시작:
- 5봉 단순이동평균선이 20봉 단순이동평균선을 상향돌파
- 현재 봉이 양봉

관찰 종료:
- 5봉 단순이동평균선이 20봉 단순이동평균선을 하향돌파

주의:
- 이 전략은 투자 추천이 아니라 플랫폼 변환 데모입니다.
- 실제 적용 전 각 플랫폼에서 수식, 알림, 차트 표시를 직접 확인해야 합니다.
- 실거래 전 모의검증과 백테스트가 필요합니다.`;

export const DEMO_PINE_SCRIPT = `//@version=6
indicator("SikTalk Demo - MA5/MA20 Bullish Cross", overlay=true)

fastLen = input.int(5, "Fast MA")
slowLen = input.int(20, "Slow MA")

fastMA = ta.sma(close, fastLen)
slowMA = ta.sma(close, slowLen)

entrySignal = ta.crossover(fastMA, slowMA) and close > open
exitSignal  = ta.crossunder(fastMA, slowMA)

plot(fastMA, title="MA5", color=color.orange, linewidth=2)
plot(slowMA, title="MA20", color=color.blue, linewidth=2)

plotshape(entrySignal, title="SikTalk Entry Signal", style=shape.triangleup, location=location.belowbar, text="ST IN", size=size.small)
plotshape(exitSignal, title="SikTalk Exit Signal", style=shape.triangledown, location=location.abovebar, text="ST OUT", size=size.small)

alertcondition(entrySignal, title="SikTalk Entry Alert", message='{"source":"siktalk","signal":"entry","rule":"MA5 crosses above MA20 + bullish candle","ticker":"{{ticker}}","interval":"{{interval}}","close":"{{close}}"}')
alertcondition(exitSignal, title="SikTalk Exit Alert", message='{"source":"siktalk","signal":"exit","rule":"MA5 crosses below MA20","ticker":"{{ticker}}","interval":"{{interval}}","close":"{{close}}"}')`;

export const DEMO_YES_LANGUAGE = `// SikTalk Demo - MA5/MA20 Bullish Cross
// 기준: 15분봉 권장
// 목적: 데모용 전략식. 실제 투자 추천 아님.

input : Short(5), Long(20), 투자금액(1000000);

Var : ShortMa(0), LongMa(0), 양봉(False), 수량(0);

ShortMa = Ma(C, Short);
LongMa = Ma(C, Long);
양봉 = C > O;
수량 = Int(투자금액 / C);

if CrossUp(ShortMa, LongMa) and 양봉 == True Then
{
    Buy("SikTalk_Buy", OnClose, Def, 수량);
}

if CrossDown(ShortMa, LongMa) Then
{
    ExitLong("SikTalk_Exit");
}`;

export const DEMO_YES_INDICATOR = `// SikTalk Demo - MA5/MA20 Bullish Cross Indicator
// 기준: 15분봉 권장
// 목적: 신호 표시용 지표식. 실제 투자 추천 아님.

input : Short(5), Long(20);

Var : ShortMa(0), LongMa(0), 양봉(False);

ShortMa = Ma(C, Short);
LongMa = Ma(C, Long);
양봉 = C > O;

Plot1(ShortMa, "MA5");
Plot2(LongMa, "MA20");

if CrossUp(ShortMa, LongMa) and 양봉 == True Then
{
    Plot3(C, "SikTalk_IN");
}

if CrossDown(ShortMa, LongMa) Then
{
    Plot4(C, "SikTalk_OUT");
}`;

export const DEMO_KIWOOM_TABLE = `전략명: SikTalk_MA5_MA20_Cross
사용 화면: 영웅문 HTS [0150] 조건검색
시간 기준: 15분봉 또는 사용자가 선택한 분봉

조건 A
기술적분석 > 이동평균선
단기 이동평균: 5
장기 이동평균: 20
조건: 단기 이동평균선이 장기 이동평균선을 상향돌파

조건 B
캔들/가격 조건
현재 봉 종가 > 현재 봉 시가
즉, 양봉 조건

조건 C, 선택
대상 시장: 코스피 / 코스닥
가격대, 거래대금, 관리종목 제외 등은 사용자가 직접 추가

관찰 종료 조건
단기 이동평균선 5가 장기 이동평균선 20을 하향돌파`;

export const DEMO_TELEGRAM_TEXT = `[식톡 데모 알림]

전략명: MA5/MA20 양봉 크로스 관찰 전략
시장: {{market}}
종목: {{ticker}}
시간봉: {{interval}}

관찰 시작 조건 충족:
- MA5가 MA20을 상향돌파
- 현재 봉 양봉

현재가: {{close}}

주의:
이 알림은 투자 추천이 아니라 사용자가 설정한 조건 충족 알림입니다.`;

export const DEMO_TELEGRAM_JSON = `{
  "source": "siktalk",
  "strategy": "MA5/MA20 Bullish Cross",
  "signal": "entry",
  "market": "{{market}}",
  "ticker": "{{ticker}}",
  "interval": "{{interval}}",
  "condition": [
    "MA5 crosses above MA20",
    "close > open"
  ],
  "notice": "This is not investment advice. Demo alert only."
}`;

export const DEMO_KIS_JSON = `{
  "strategy_id": "siktalk_ma5_ma20_bullish_cross",
  "strategy_name": "MA5/MA20 양봉 크로스 관찰 전략",
  "market": "KR_STOCK",
  "timeframe": "15m",
  "entry": {
    "logic": "cross_up(sma(close, 5), sma(close, 20)) AND close > open",
    "conditions": [
      {
        "type": "cross_up",
        "left": "sma(close, 5)",
        "right": "sma(close, 20)"
      },
      {
        "type": "candle",
        "condition": "close > open"
      }
    ]
  },
  "exit": {
    "logic": "cross_down(sma(close, 5), sma(close, 20))",
    "conditions": [
      {
        "type": "cross_down",
        "left": "sma(close, 5)",
        "right": "sma(close, 20)"
      }
    ]
  },
  "mode": "paper_trading_demo",
  "notice": "This is a demo strategy schema, not an order instruction."
}`;

export function isDemoStrategyQuestion(value: string): boolean {
  const normalized = value.replace(/\s+/g, " ");
  return normalized.includes("5봉 단순이동평균선") && normalized.includes("20봉 단순이동평균선") && normalized.includes("TradingView");
}
