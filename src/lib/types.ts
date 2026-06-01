export type StrategyType =
  | "scalping"
  | "dayTrading"
  | "swing"
  | "closingBet"
  | "breakout"
  | "pullback"
  | "meanReversion"
  | "volatility"
  | "newsDisclosure"
  | "fundamentalFilter"
  | "marketRegimeFilter";

export type AssetClass =
  | "koreanStock"
  | "usStock"
  | "crypto"
  | "etf"
  | "futures"
  | "unknown";

export type Timeframe =
  | "1m"
  | "3m"
  | "5m"
  | "15m"
  | "1h"
  | "daily"
  | "weekly"
  | "unknown";

export type ConditionGroup = {
  entry: string[];
  exit: string[];
  universe: string[];
  filters: string[];
  risk: string[];
};

export type ConversionPlatform =
  | "tradingview"
  | "kiwoom"
  | "yestrader"
  | "mts"
  | "webhook"
  | "telegram";

export type ConditionCategory = "entry" | "exit" | "universe" | "filters" | "risk";

export type ConditionTemplate = {
  id: string;
  title: string;
  category: ConditionCategory;
  market: AssetClass;
  strategyType: StrategyType;
  difficulty: "easy" | "medium" | "advanced";
  plainKorean: string;
  whyUse: string;
  tags: string[];
  requiredInputs: string[];
};

export type OnboardingAnswers = {
  market?: AssetClass;
  pace?: "fast" | "intraday" | "swing";
  setup?: "breakout" | "pullback" | "meanReversion" | "closingBet" | "volume" | "risk";
  universe?: "volume" | "news" | "leader" | "fundamental" | "all";
  risk?: "tight" | "atr" | "time" | "wide";
};

export type PaperTrade = {
  id: string;
  side: "buy" | "sell";
  price: number;
  quantity: number;
  createdAt: string;
};

export type PaperCandle = {
  index: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  atr: number;
};

export type StrategyCard = {
  id: string;
  title: string;
  rawIdea: string;
  summary: string;
  strategyType: StrategyType;
  assetClass: AssetClass;
  timeframe: Timeframe;
  conditions: ConditionGroup;
  suitableRegime: string[];
  weakRegime: string[];
  riskSummary: string;
  validationIdea: string;
  requestedPlatforms: ConversionPlatform[];
  createdAt: string;
  updatedAt: string;
  version: number;
  isSaved: boolean;
  hasReport: boolean;
};

export type ConversionRequest = {
  id: string;
  strategyId: string;
  platform: ConversionPlatform;
  strategyType: StrategyType;
  requestedSection: "entry" | "exit" | "universe" | "filter" | "full";
  email?: string;
  createdAt: string;
  source: "card" | "detail" | "library" | "dashboard";
  intentLevel: "click" | "waitlist" | "topChoice";
};

export type MockBacktestReport = {
  id: string;
  strategyId: string;
  generatedAt: string;
  disclaimer: string;
  totalReturnPct: number;
  winRatePct: number;
  averagePnlPct: number;
  maxDrawdownPct: number;
  tradeCount: number;
  bestTimeSlots: string[];
  weakTimeSlots: string[];
  bestAssetFit: string[];
  weakAssetFit: string[];
  plainLanguageSummary: string;
  strengths: string[];
  weaknesses: string[];
  warnings: string[];
  improvementCandidates: string[];
  oracleScenarios: OracleScenario[];
};

export type OracleScenario = {
  label: string;
  change: string;
  observedReturnPct: number;
  riskNote: string;
  overfitRisk: "low" | "medium" | "high";
};

export type AnalyticsEvent =
  | {
      type: "strategy_created";
      strategyId: string;
      createdAt: string;
      strategyType: StrategyType;
    }
  | {
      type: "strategy_saved";
      strategyId: string;
      createdAt: string;
    }
  | {
      type: "mock_backtest_generated";
      strategyId: string;
      createdAt: string;
    }
  | {
      type: "conversion_clicked";
      strategyId: string;
      platform: ConversionPlatform;
      createdAt: string;
    }
  | {
      type: "waitlist_submitted";
      strategyId: string;
      platform: ConversionPlatform;
      email: string;
      createdAt: string;
    }
  | {
      type: "oracle_clicked";
      strategyId: string;
      createdAt: string;
    }
  | {
      type: "onboarding_started";
      createdAt: string;
    }
  | {
      type: "onboarding_answered";
      step: string;
      answer: string;
      createdAt: string;
    }
  | {
      type: "onboarding_completed";
      createdAt: string;
    }
  | {
      type: "condition_recommended";
      conditionId: string;
      createdAt: string;
    }
  | {
      type: "condition_saved";
      conditionId: string;
      createdAt: string;
    }
  | {
      type: "apply_clicked";
      conditionId?: string;
      strategyId?: string;
      platform: ConversionPlatform;
      createdAt: string;
    }
  | {
      type: "paper_trading_opened";
      createdAt: string;
    }
  | {
      type: "paper_trade_executed";
      side: PaperTrade["side"];
      price: number;
      createdAt: string;
    };
