import { getKisAccessToken, getKisCredentials } from "@/lib/kis";
import { fetchKiwoomExecutionStrength, type KiwoomExecutionStrength } from "@/lib/kiwoom";

type BaseCandle = {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

export type HynixChartCandle = BaseCandle & {
  ma5: number | null;
  ma20: number | null;
  volumeMa20: number | null;
};

export type HynixConditionMarker = {
  time: number;
  price: number;
  type: "start" | "end";
  label: string;
};

export type HynixChartSnapshot = {
  symbol: "000660";
  name: "SK하이닉스";
  source: "kis";
  basis: string;
  updatedAt: string | null;
  candles: HynixChartCandle[];
  latestClose: number | null;
  latestMa5: number | null;
  latestMa20: number | null;
  latestVolumeMa20: number | null;
  executionStrength: KiwoomExecutionStrength;
  markers: HynixConditionMarker[];
  lastBullishCrossTime: number | null;
  lastBullishCrossPrice: number | null;
};

type CandleCacheEntry = {
  expiresAt: number;
  snapshot: HynixChartSnapshot;
};

type KisChartResponse = {
  rt_cd?: string;
  msg1?: string;
  output2?: Array<Record<string, string>>;
};

const MINUTE_ENDPOINT = "/uapi/domestic-stock/v1/quotations/inquire-time-itemchartprice";
const MINUTE_TR_ID = "FHKST03010200";
const HYNIX_SYMBOL = "000660";
const HYNIX_NAME = "SK하이닉스";

const chartCache = new Map<string, CandleCacheEntry>();

function nowKst() {
  return new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Seoul" }));
}

function kstDateParts(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  const hour = `${date.getHours()}`.padStart(2, "0");
  const minute = `${date.getMinutes()}`.padStart(2, "0");
  const second = `${date.getSeconds()}`.padStart(2, "0");
  return {
    date: `${year}${month}${day}`,
    hourMinuteSecond: `${hour}${minute}${second}`,
  };
}

function previousBusinessDay(date: Date) {
  const next = new Date(date);
  next.setDate(next.getDate() - 1);
  while (next.getDay() === 0 || next.getDay() === 6) {
    next.setDate(next.getDate() - 1);
  }
  return next;
}

function clampMinuteAnchorCursor() {
  const kst = nowKst();
  const hour = kst.getHours();
  const minute = kst.getMinutes();

  if (hour < 9) {
    const previous = previousBusinessDay(kst);
    previous.setHours(15, 30, 0, 0);
    return previous;
  }
  if (hour > 15 || (hour === 15 && minute > 30)) {
    const current = new Date(kst);
    current.setHours(15, 30, 0, 0);
    return current;
  }

  const current = new Date(kst);
  current.setSeconds(0, 0);
  return current;
}

function subtractOneMinute(dateText: string, timeText: string) {
  const cursor = new Date(
    `${dateText.slice(0, 4)}-${dateText.slice(4, 6)}-${dateText.slice(6, 8)}T${timeText.slice(0, 2)}:${timeText.slice(2, 4)}:${timeText.slice(4, 6)}+09:00`,
  );
  cursor.setMinutes(cursor.getMinutes() - 1);
  return kstDateParts(cursor);
}

async function fetchMinutePage(_anchorDate: string, anchorTime: string) {
  const { appkey, appsecret, baseUrl } = getKisCredentials();
  const token = await getKisAccessToken();
  const url = new URL(`${baseUrl}${MINUTE_ENDPOINT}`);

  const params = {
    FID_ETC_CLS_CODE: "",
    FID_COND_MRKT_DIV_CODE: "J",
    FID_INPUT_ISCD: HYNIX_SYMBOL,
    FID_INPUT_HOUR_1: anchorTime,
    FID_PW_DATA_INCU_YN: "N",
  };

  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  const response = await fetch(url, {
    headers: {
      authorization: `Bearer ${token}`,
      appkey,
      appsecret,
      tr_id: MINUTE_TR_ID,
      custtype: "P",
    },
    cache: "no-store",
  });

  const data = (await response.json()) as KisChartResponse;
  if (!response.ok || (data.rt_cd && data.rt_cd !== "0")) {
    throw new Error(data.msg1 || `KIS minute chart failed: HTTP ${response.status}`);
  }

  return data.output2 ?? [];
}

function minuteRowToCandle(row: Record<string, string>): BaseCandle | null {
  const dateText = row.stck_bsop_date;
  const timeText = (row.stck_cntg_hour || "").padStart(6, "0");
  const close = Number(row.stck_prpr || 0);

  if (!dateText || !timeText || !Number.isFinite(close) || close <= 0) {
    return null;
  }

  const iso = `${dateText.slice(0, 4)}-${dateText.slice(4, 6)}-${dateText.slice(6, 8)}T${timeText.slice(0, 2)}:${timeText.slice(2, 4)}:${timeText.slice(4, 6)}+09:00`;

  return {
    time: Math.floor(new Date(iso).getTime() / 1000),
    open: Number(row.stck_oprc || close),
    high: Number(row.stck_hgpr || close),
    low: Number(row.stck_lwpr || close),
    close,
    volume: Number(row.cntg_vol || 0),
  };
}

// Adapted from TradingView Lightweight Charts moving-average examples:
// https://github.com/tradingview/lightweight-charts
function appendMovingAverages(candles: BaseCandle[]): HynixChartCandle[] {
  return candles.map((candle, index) => ({
    ...candle,
    ma5: movingAverage(candles, index, 5),
    ma20: movingAverage(candles, index, 20),
    volumeMa20: volumeAverage(candles, index, 20),
  }));
}

function movingAverage(candles: BaseCandle[], index: number, length: number) {
  if (index < length - 1) {
    return null;
  }
  let sum = 0;
  for (let cursor = index - length + 1; cursor <= index; cursor += 1) {
    sum += candles[cursor].close;
  }
  return Math.round((sum / length) * 100) / 100;
}

function volumeAverage(candles: BaseCandle[], index: number, length: number) {
  if (index < length - 1) {
    return null;
  }
  let sum = 0;
  for (let cursor = index - length + 1; cursor <= index; cursor += 1) {
    sum += candles[cursor].volume;
  }
  return Math.round((sum / length) * 100) / 100;
}

function findLastBullishCross(candles: HynixChartCandle[]) {
  for (let index = candles.length - 1; index >= 1; index -= 1) {
    const prev = candles[index - 1];
    const current = candles[index];

    if (prev.ma5 === null || prev.ma20 === null || current.ma5 === null || current.ma20 === null) {
      continue;
    }

    if (prev.ma5 <= prev.ma20 && current.ma5 > current.ma20) {
      return {
        time: current.time,
        price: current.close,
      };
    }
  }
  return {
    time: null,
    price: null,
  };
}

function hasVolumeRecovery(candles: HynixChartCandle[], index: number) {
  const current = candles[index];
  if (!current?.volumeMa20) return false;

  const previousWindow = candles.slice(Math.max(0, index - 10), index);
  const compressed = previousWindow.some((candle) => candle.volumeMa20 !== null && candle.volume < candle.volumeMa20 * 0.8);
  return compressed && current.volume >= current.volumeMa20 * 0.7;
}

function buildConditionMarkers(candles: HynixChartCandle[], executionStrength: KiwoomExecutionStrength, strengthThreshold: number): HynixConditionMarker[] {
  const markers: HynixConditionMarker[] = [];
  const strengthOk = (executionStrength.value ?? 0) >= strengthThreshold;

  for (let index = 1; index < candles.length; index += 1) {
    const prev = candles[index - 1];
    const current = candles[index];

    if (prev.ma5 !== null && prev.ma20 !== null && current.ma5 !== null && current.ma20 !== null) {
      const bullishCross = prev.ma5 <= prev.ma20 && current.ma5 > current.ma20;
      const bearishCross = prev.ma5 >= prev.ma20 && current.ma5 < current.ma20;

      if (bullishCross && strengthOk && hasVolumeRecovery(candles, index)) {
        markers.push({
          time: current.time,
          price: current.close,
          type: "start",
          label: "시작 조건",
        });
      }

      if (bearishCross) {
        markers.push({
          time: current.time,
          price: current.close,
          type: "end",
          label: "종료 조건",
        });
      }
    }
  }

  if (!markers.some((marker) => marker.type === "start")) {
    const fallback = findLastBullishCross(candles);
    if (fallback.time && fallback.price) {
      markers.push({
        time: fallback.time,
        price: fallback.price,
        type: "start",
        label: "시작 조건",
      });
    }
  }

  return markers.slice(-8);
}

export async function fetchHynixChartSnapshot(lookbackMinutes = 180, strengthThreshold = 99): Promise<HynixChartSnapshot> {
  try {
    return await fetchHynixChartSnapshotLive(lookbackMinutes, strengthThreshold);
  } catch {
    return buildFallbackSnapshot(lookbackMinutes, strengthThreshold);
  }
}

async function fetchHynixChartSnapshotLive(lookbackMinutes = 180, strengthThreshold = 99): Promise<HynixChartSnapshot> {
  const cacheKey = `${lookbackMinutes}:${strengthThreshold}`;
  const cached = chartCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.snapshot;
  }

  const anchor = clampMinuteAnchorCursor();
  let anchorParts = kstDateParts(anchor);
  let remaining = Math.max(lookbackMinutes, 60);
  const rows: BaseCandle[] = [];
  const seen = new Set<string>();
  let emptyPages = 0;

  while (remaining > 0) {
    const pageRows = await fetchMinutePage(anchorParts.date, anchorParts.hourMinuteSecond);

    if (!pageRows.length) {
      emptyPages += 1;
      if (emptyPages >= 2) {
        break;
      }
      const previous = previousBusinessDay(
        new Date(`${anchorParts.date.slice(0, 4)}-${anchorParts.date.slice(4, 6)}-${anchorParts.date.slice(6, 8)}T12:00:00+09:00`),
      );
      previous.setHours(15, 30, 0, 0);
      anchorParts = kstDateParts(previous);
      continue;
    }

    emptyPages = 0;
    for (const row of pageRows) {
      const candle = minuteRowToCandle(row);
      if (!candle) {
        continue;
      }
      const uniqueKey = `${row.stck_bsop_date}-${row.stck_cntg_hour}`;
      if (seen.has(uniqueKey)) {
        continue;
      }
      seen.add(uniqueKey);
      rows.push(candle);
    }

    remaining -= pageRows.length;
    if (rows.length >= lookbackMinutes) {
      break;
    }

    const last = pageRows[pageRows.length - 1];
    if (!last?.stck_cntg_hour || !last?.stck_bsop_date) {
      break;
    }

    anchorParts = subtractOneMinute(last.stck_bsop_date, String(last.stck_cntg_hour).padStart(6, "0"));
  }

  rows.sort((left, right) => left.time - right.time);
  const candles = appendMovingAverages(rows.slice(-lookbackMinutes));
  const executionStrength = await fetchKiwoomExecutionStrength();
  const latest = candles.at(-1) || null;
  const lastBullishCross = findLastBullishCross(candles);
  const markers = buildConditionMarkers(candles, executionStrength, strengthThreshold);

  const snapshot: HynixChartSnapshot = {
    symbol: HYNIX_SYMBOL,
    name: HYNIX_NAME,
    source: "kis",
    basis: "KIS 실시간 분봉 기준",
    updatedAt: new Date().toISOString(),
    candles,
    latestClose: latest?.close ?? null,
    latestMa5: latest?.ma5 ?? null,
    latestMa20: latest?.ma20 ?? null,
    latestVolumeMa20: latest?.volumeMa20 ?? null,
    executionStrength,
    markers,
    lastBullishCrossTime: lastBullishCross.time,
    lastBullishCrossPrice: lastBullishCross.price,
  };

  chartCache.set(cacheKey, {
    snapshot,
    expiresAt: Date.now() + 45_000,
  });

  return snapshot;
}

function buildFallbackSnapshot(lookbackMinutes: number, strengthThreshold: number): HynixChartSnapshot {
  const baseCandles = Array.from({ length: lookbackMinutes }, (_, index) => {
    const wave = Math.sin(index / 7) * 1800;
    const trend = index * 65;
    const open = Math.round(185000 + trend + wave);
    const close = Math.round(open + Math.cos(index / 3) * 900 + (index % 4 === 0 ? 600 : -200));
    const high = Math.max(open, close) + 1100;
    const low = Math.min(open, close) - 1000;
    const volume = Math.round(90000 + index * 2500 + Math.abs(Math.sin(index / 5) * 45000));
    return {
      time: Math.floor(Date.now() / 1000) - (lookbackMinutes - index) * 60,
      open,
      high,
      low,
      close,
      volume,
    };
  });

  const candles = appendMovingAverages(baseCandles);
  const executionStrength: KiwoomExecutionStrength = {
    source: "kiwoom",
    symbol: HYNIX_SYMBOL,
    value: 103.4,
    value5m: 101.2,
    value20m: 99.8,
    value60m: 98.4,
    currentPrice: candles.at(-1)?.close ?? null,
    updatedAt: new Date().toISOString(),
    authenticated: false,
    message: "실데이터 인증 전이라 데모 차트로 표시합니다.",
  };
  const lastBullishCross = findLastBullishCross(candles);
  const markers = buildConditionMarkers(candles, executionStrength, strengthThreshold);
  const latest = candles.at(-1) || null;

  return {
    symbol: HYNIX_SYMBOL,
    name: HYNIX_NAME,
    source: "kis",
    basis: "데모 분봉 기준",
    updatedAt: new Date().toISOString(),
    candles,
    latestClose: latest?.close ?? null,
    latestMa5: latest?.ma5 ?? null,
    latestMa20: latest?.ma20 ?? null,
    latestVolumeMa20: latest?.volumeMa20 ?? null,
    executionStrength,
    markers,
    lastBullishCrossTime: lastBullishCross.time,
    lastBullishCrossPrice: lastBullishCross.price,
  };
}
