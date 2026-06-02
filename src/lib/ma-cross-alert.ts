export type MaCrossCandle = {
  index: number;
  close: number;
  ma5: number | null;
  ma20: number | null;
};

export type MaCrossAlert = {
  source: "KIS_PAPER" | "KIS_AUTHENTICATED_PAPER";
  symbol: string;
  timeframe: "15m";
  strategyName: string;
  triggered: boolean;
  signalIndex: number;
  latestClose: number;
  latestMa5: number;
  latestMa20: number;
  message: string;
  credentialMessage?: string;
  candles: MaCrossCandle[];
};

export function buildMaCrossAlert({
  authenticated = false,
  credentialMessage,
}: {
  authenticated?: boolean;
  credentialMessage?: string;
} = {}): MaCrossAlert {
  const closes = createMaCrossCloses();
  const candles = closes.map((close, index) => ({
    index,
    close,
    ma5: movingAverage(closes, index, 5),
    ma20: movingAverage(closes, index, 20),
  }));

  const signalIndex = findLatestCrossIndex(candles);
  const latest = candles[candles.length - 1];
  const triggered = signalIndex >= candles.length - 4;

  return {
    source: authenticated ? "KIS_AUTHENTICATED_PAPER" : "KIS_PAPER",
    symbol: "005930",
    timeframe: "15m",
    strategyName: "MA5/MA20 양봉 크로스 관찰 전략",
    triggered,
    signalIndex,
    latestClose: latest.close,
    latestMa5: latest.ma5 ?? latest.close,
    latestMa20: latest.ma20 ?? latest.close,
    message: triggered
      ? "KIS 인앱 알림: MA5가 MA20을 상향돌파한 관찰 조건을 감지했습니다."
      : "KIS 인앱 알림: MA5/MA20 관찰 조건을 대기 중입니다.",
    credentialMessage,
    candles,
  };
}

function createMaCrossCloses(): number[] {
  return Array.from({ length: 31 }, (_, index) => {
    if (index < 24) return round(112 - index * 0.62);
    return round(97 + (index - 24) * 1.72);
  });
}

function movingAverage(values: number[], index: number, length: number): number | null {
  if (index + 1 < length) return null;
  const slice = values.slice(index + 1 - length, index + 1);
  return round(slice.reduce((sum, value) => sum + value, 0) / length);
}

function findLatestCrossIndex(candles: MaCrossCandle[]): number {
  let latest = -1;
  for (let index = 1; index < candles.length; index += 1) {
    const prev = candles[index - 1];
    const current = candles[index];
    if (prev.ma5 === null || prev.ma20 === null || current.ma5 === null || current.ma20 === null) continue;
    if (prev.ma5 <= prev.ma20 && current.ma5 > current.ma20) {
      latest = index;
    }
  }
  return latest;
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}
