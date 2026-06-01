export type ChartSceneVariant =
  | "volumeBreakout"
  | "moneyRank"
  | "closingHold"
  | "openRetest"
  | "gapPullback"
  | "rsiBounce";

export type DemoConditionAsset = {
  id: string;
  title: string;
  category: string;
  market: string;
  difficulty: "easy" | "medium";
  summary: string;
  variant: ChartSceneVariant;
};

export const assetSpecs = {
  conditionImage: {
    ratio: "16:9",
    requestSize: "960x540",
    desktopSlot: "3-column cards, min 320x180",
    mobileSlot: "full width, 16:9",
  },
  libraryMainVideo: {
    ratio: "16:9",
    requestSize: "1280x720",
    desktopSlot: "main player, max 820x461",
    mobileSlot: "full width, 16:9",
  },
  libraryRelatedImage: {
    ratio: "16:9",
    requestSize: "640x360",
    desktopSlot: "right rail cards, 168x94 thumbnail minimum",
    mobileSlot: "horizontal related cards, 160x90 thumbnail",
  },
} as const;

export const demoConditionAssets: DemoConditionAsset[] = [
  {
    id: "volume-breakout",
    title: "거래량 급증 돌파",
    category: "진입",
    market: "국장",
    difficulty: "easy",
    summary: "평균보다 큰 거래량이 붙고 직전 고점을 넘는 순간",
    variant: "volumeBreakout",
  },
  {
    id: "money-rank",
    title: "거래대금 상위 유지",
    category: "종목",
    market: "국장",
    difficulty: "easy",
    summary: "장중 거래대금 상위권을 오래 유지하는 종목",
    variant: "moneyRank",
  },
  {
    id: "closing-hold",
    title: "종가베팅 고가권 유지",
    category: "진입",
    market: "국장",
    difficulty: "easy",
    summary: "장 막판까지 당일 고가권을 지키는 흐름",
    variant: "closingHold",
  },
  {
    id: "open-retest",
    title: "시초가 돌파 재진입",
    category: "진입",
    market: "국장",
    difficulty: "medium",
    summary: "시초가 위에서 버틴 뒤 재돌파하는 순간",
    variant: "openRetest",
  },
  {
    id: "gap-pullback",
    title: "갭 상승 후 첫 눌림",
    category: "진입",
    market: "국장",
    difficulty: "medium",
    summary: "갭 상승 뒤 첫 조정이 짧게 끝나는 구간",
    variant: "gapPullback",
  },
  {
    id: "rsi-bounce",
    title: "RSI 과매도 반등",
    category: "진입",
    market: "코인",
    difficulty: "easy",
    summary: "RSI가 과매도권에서 다시 위로 꺾이는 장면",
    variant: "rsiBounce",
  },
];

export const libraryDemoAssets = demoConditionAssets.slice(0, 3);

export const libraryPlatformCopies = {
  natural: `거래량 급증 돌파

관찰 상황:
- 가격이 직전 고점 근처에서 횡보
- 거래량이 최근 평균보다 뚜렷하게 증가
- 고점을 넘는 양봉이 나오면 관찰 시작

관찰 종료:
- 돌파 가격 아래로 다시 내려오면 종료
- 돌파 뒤 거래량이 빠르게 식으면 가짜 돌파로 분류`,
  tradingview: `//@version=6
indicator("SikTalk Demo - Volume Breakout", overlay=true)

lookback = input.int(20, "High lookback")
volLen = input.int(20, "Volume average")

prevHigh = ta.highest(high[1], lookback)
volAvg = ta.sma(volume, volLen)

entrySignal = close > prevHigh and volume > volAvg * 2 and close > open
exitSignal = close < prevHigh

plot(prevHigh, "Previous high", color=color.new(color.green, 0))
plotshape(entrySignal, title="SikTalk IN", style=shape.triangleup, location=location.belowbar, text="IN")
alertcondition(entrySignal, title="SikTalk Volume Breakout", message="Volume breakout observation signal")`,
  kiwoom: `키움 조건검색 설정표

조건 A: 가격
- 현재가가 최근 20봉 고점 이상

조건 B: 거래량
- 현재 거래량이 최근 20봉 평균 거래량의 2배 이상

조건 C: 캔들
- 현재 봉 종가 > 현재 봉 시가

관찰 종료:
- 현재가가 돌파 기준선 아래로 재하락`,
  yestrader: `// SikTalk Demo - Volume Breakout
input : HighLen(20), VolLen(20), VolMult(2);

Var : PrevHigh(0), VolAvg(0), Entry(False), ExitRule(False);

PrevHigh = Highest(H[1], HighLen);
VolAvg = Avg(V, VolLen);

Entry = C > PrevHigh and V > VolAvg * VolMult and C > O;
ExitRule = C < PrevHigh;

if Entry Then Buy("SikTalk_Breakout", OnClose);
if ExitRule Then ExitLong("SikTalk_Exit");`,
  telegram: `[식톡 관찰 알림]

조건식: 거래량 급증 돌파
시장: {{market}}
종목: {{ticker}}

관찰 시작:
- 직전 고점 돌파
- 평균 대비 거래량 급증

주의: 투자 추천이 아니라 사용자가 설정한 조건 충족 알림입니다.`,
} as const;

export const libraryLongRead = [
  "거래량 급증 돌파는 조용하던 종목에 갑자기 관심이 몰리는 순간을 보기 위한 조건식입니다.",
  "핵심은 가격만 오른 것이 아니라 거래량이 같이 붙었는지 확인하는 것입니다. 가격 돌파와 거래량 증가가 동시에 나올 때만 관찰 가치가 생깁니다.",
  "다만 돌파 직후 거래량이 바로 줄거나 윗꼬리가 길게 반복되면 가짜 돌파일 수 있습니다. 이 경우에는 관찰을 종료하거나 다른 필터와 함께 봐야 합니다.",
  "식톡에서는 이 조건을 TradingView, 키움, 예스트레이더, Telegram 알림 문장으로 옮겨 볼 수 있게 정리합니다. 실제 적용 전에는 각 플랫폼에서 차트 표시와 알림 조건을 직접 확인해야 합니다.",
];
