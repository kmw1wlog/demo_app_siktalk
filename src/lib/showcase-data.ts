export const SHOWCASE_STRATEGY = {
  title: "5·20선 골든크로스 + 거래량 회복",
  shortTitle: "5·20선 + 거래량 회복",
  market: "전체 (코스피·코스닥)",
  chartMarket: "코스피",
  chartPreset: "KOSPI 종합 (일봉)",
  timeframe: "15분봉",
  previewTimeframe: "1분봉",
  monitoringHours: "09:00 ~ 10:00 / 14:30 ~ 15:20",
  description: "5일선 20일선 골든크로스가 뜨고 거래량이 최근 평균보다 회복되는 종목을 포착",
  entryCards: [
    { title: "5일선 > 20일선", detail: "이동평균선" },
    { title: "거래량 > 20일 평균", detail: "거래량" },
    { title: "양봉 마감", detail: "캔들" },
  ],
  filterCards: [],
  exitCards: [
    { title: "5일선 < 20일선", detail: "이동평균선" },
    { title: "10봉 경과", detail: "시간/봉 수" },
  ],
  riskCards: [],
  dbCards: [
    { id: "volume-breakout", title: "거래량 급증 돌파", badge: "진입", market: "국민" },
    { id: "closing-bet", title: "종가베팅 고가권 유지", badge: "진입", market: "국민" },
    { id: "rsi-rebound", title: "RSI 과매도 반등", badge: "진입", market: "모멘" },
    { id: "gap-pullback", title: "갭 상승 후 눌림", badge: "진입", market: "국민" },
    { id: "turnover-rank", title: "거래대금 상위 유지", badge: "필터", market: "국민" },
    { id: "strength-rise", title: "체결강도 동반 상승", badge: "필터", market: "모멘" },
  ],
  assistantPrompts: ["너무 자주 뜨면 줄여줘", "손절 라인 추가해줘", "백테스트로 넘겨줘"],
};

export const SHOWCASE_ALERT = {
  title: "5·20선 거래량 회복 알림봇",
  market: "국장",
  marketDetail: "코스피/코스닥",
  timeframe: "15분봉",
  trigger: "5·20선 골든크로스 발생 / 거래량 > 최근 20일 평균 거래량",
  cadence: "동일 종목 하루 1회",
  delivery: "인앱 푸시 / 텔레그램 준비",
  status: "초안 (저장 전)",
  strategyScore: ["수익률 +9.79%", "승률 75%", "최대 손실 10회", "(최근 5년 기준)"],
  targetCount: "약 1,856개",
  liveWatchingCount: "0개",
  conversationUser: "5·20선 골든크로스 + 거래량 회복 뜨면 바로 알려줘\n텔레그램으로 받고 싶어",
  conversationAssistant: [
    "알겠습니다! 조건을 정리해서 알림봇 초안을 만들어드릴게요.",
    "전략: 5·20선 골든크로스 + 거래량 회복",
    "시장: 국장(코스피/코스닥)",
    "봉/시간: 15분봉, 장중 09:00~10:00 / 14:30~15:20",
    "알림: 조건 충족 시 즉시 알림",
    "전송: 인앱 푸시 + 텔레그램 준비",
    "빈도: 동일 종목 하루 1회",
  ],
  quickChips: ["5·20선 조건 뜨면 바로 알려줘", "종가 근처에만 알려줘", "너무 자주 울리면 줄여줘", "텔레그램으로 받고 싶어"],
  footerChips: ["빈도 하루 1회로 해줘", "장 시작 직후만 알려줘", "종가±1% 구간에서만", "이대로 저장할게"],
};

export const SHOWCASE_PREVIEW = {
  signalCount: "14회",
  averagePerDay: "하루 평균 2.0회",
  positiveRatio: "64%",
  positiveDetail: "9회 / 14회",
  averageAfterReturn: "+1.2%",
  maxLossStreak: "3회",
  peakTime: "14:30~15:20",
  peakTimeDetail: "전체 발생의 35%",
  holdHours: "2.8시간",
  holdDetail: "진입→청산 평균",
  note: "정확한 성과 판단은 25~26년 생존력 백테스트에서 확인해 주세요.",
  footer: "본 미리보기는 최근 1주 (2025.05.28 ~ 2025.06.04) 데이터를 기준으로 산출했습니다.",
};

export const SHOWCASE_BACKTEST = {
  title: "25~26년 생존력 백테스트",
  description: "이 전략이 최근 시장에서도 꾸준히 작동했는지 확인합니다.",
  metrics: [
    { label: "월평균 수익률", value: "+1.72%", tone: "emerald" },
    { label: "양수 월 비율", value: "68%", tone: "emerald" },
    { label: "최근 3개월 성과", value: "+6.84%", tone: "emerald" },
    { label: "최대 연속 손실", value: "8회", tone: "violet" },
    { label: "평균 보유 시간", value: "7.6시간", tone: "slate" },
    { label: "매매 1회당 평균/중앙 수익률", value: "-0.04% / +0.06%", tone: "mixed" },
    { label: "월별 발생 횟수", value: "월 22.3회", tone: "slate" },
  ],
  months: ["'25.01", "'25.03", "'25.05", "'25.07", "'25.09", "'25.11", "'26.01", "'26.현재"],
  equityPoints: [0, 10, 52, 78, 112, 108, 142, 168],
  kospiPoints: [0, 6, 14, 22, 29, 31, 34, 38],
  kosdaqPoints: [0, 4, 10, 14, 18, 22, 25, 30],
  monthlyBars: [4, 7, 2, 11, -5, 3, 8, -9, -3, 6, 7, -2, 5, 5, -1],
  monthlySignals: [29, 28, 29, 26, 22, 34, 27, 35, 31, 28, 27, 22, 24, 40, 29, 28, 31],
} as const;

export const SHOWCASE_CHART = {
  lastUpdated: "12:24:18",
  kpis: [
    { label: "총 진입 신호", value: "24회", sub: "최근 3개월", tone: "emerald" },
    { label: "승률(예상)", value: "66.7%", sub: "최근 3개월", tone: "sky" },
    { label: "평균 보유 기간", value: "9.3일", sub: "최근 3개월", tone: "slate" },
    { label: "누적 수익률(예상)", value: "+18.2%", sub: "최근 3개월", tone: "violet" },
  ],
  monthlyDistribution: [
    { month: "1월", entry: 4, exit: 1 },
    { month: "2월", entry: 6, exit: 2 },
    { month: "3월", entry: 7, exit: 2 },
    { month: "4월", entry: 9, exit: 3 },
    { month: "5월", entry: 12, exit: 2 },
    { month: "6월", entry: 8, exit: 3 },
    { month: "7월", entry: 6, exit: 2 },
    { month: "9월", entry: 5, exit: 2 },
    { month: "10월", entry: 4, exit: 2 },
    { month: "11월", entry: 3, exit: 1 },
    { month: "12월", entry: 2, exit: 1 },
  ],
};

export const SHOWCASE_HEATMAP = [
  [1, 1, 1, 1, 1, 0, 0, 1, 2, 2, 3, 2],
  [1, 1, 1, 2, 1, 0, 0, 1, 2, 2, 3, 2],
  [0, 1, 1, 1, 1, 0, 0, 1, 3, 3, 2, 2],
  [0, 1, 1, 1, 1, 0, 0, 1, 3, 3, 2, 2],
  [0, 1, 1, 1, 1, 0, 0, 1, 3, 2, 2, 1],
];

export const SHOWCASE_DAYS = ["월", "화", "수", "목", "금"];
export const SHOWCASE_HOURS = ["09시", "10시", "11시", "12시", "13시", "14시", "15시"];
