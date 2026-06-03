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

export type ChartInterval = "1m" | "15m" | "1d";

export type HynixChartCandle = BaseCandle;

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
  interval: ChartInterval;
  updatedAt: string | null;
  candles: HynixChartCandle[];
  markers: HynixConditionMarker[];
  executionStrength: KiwoomExecutionStrength;
  latestClose: number | null;
  nextCursorDate: string | null;
  nextCursorTime: string | null;
  hasMoreHistory: boolean;
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

type FetchChartOptions = {
  interval: ChartInterval;
  count: number;
  beforeDate?: string | null;
  beforeTime?: string | null;
  includeExecutionStrength?: boolean;
};

type FetchRawResult = {
  candles: BaseCandle[];
  nextCursorDate: string | null;
  nextCursorTime: string | null;
  hasMoreHistory: boolean;
  basis: string;
};

const MINUTE_ENDPOINT = "/uapi/domestic-stock/v1/quotations/inquire-time-dailychartprice";
const MINUTE_TR_ID = "FHKST03010230";
const DAILY_ENDPOINT = "/uapi/domestic-stock/v1/quotations/inquire-daily-itemchartprice";
const DAILY_TR_ID = "FHKST03010100";
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

function subtractBusinessDays(dateText: string, days: number) {
  const cursor = new Date(`${dateText.slice(0, 4)}-${dateText.slice(4, 6)}-${dateText.slice(6, 8)}T12:00:00+09:00`);
  let remaining = days;
  while (remaining > 0) {
    cursor.setDate(cursor.getDate() - 1);
    if (cursor.getDay() === 0 || cursor.getDay() === 6) {
      continue;
    }
    remaining -= 1;
  }
  return kstDateParts(cursor).date;
}

async function fetchChartPage(endpoint: string, trId: string, params: Record<string, string>) {
  const { appkey, appsecret, baseUrl } = getKisCredentials();
  const token = await getKisAccessToken();
  const url = new URL(`${baseUrl}${endpoint}`);

  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  const response = await fetch(url, {
    headers: {
      authorization: `Bearer ${token}`,
      appkey,
      appsecret,
      tr_id: trId,
      custtype: "P",
    },
    cache: "no-store",
  });

  const data = (await response.json()) as KisChartResponse;
  if (!response.ok || (data.rt_cd && data.rt_cd !== "0")) {
    throw new Error(data.msg1 || `KIS chart failed: HTTP ${response.status}`);
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

function dailyRowToCandle(row: Record<string, string>): BaseCandle | null {
  const dateText = row.stck_bsop_date;
  const close = Number(row.stck_clpr || row.stck_prpr || 0);

  if (!dateText || !Number.isFinite(close) || close <= 0) {
    return null;
  }

  const iso = `${dateText.slice(0, 4)}-${dateText.slice(4, 6)}-${dateText.slice(6, 8)}T00:00:00+09:00`;

  return {
    time: Math.floor(new Date(iso).getTime() / 1000),
    open: Number(row.stck_oprc || close),
    high: Number(row.stck_hgpr || close),
    low: Number(row.stck_lwpr || close),
    close,
    volume: Number(row.acml_vol || 0),
  };
}

function uniqueCandles(candles: BaseCandle[]) {
  const seen = new Set<number>();
  return candles.filter((candle) => {
    if (seen.has(candle.time)) {
      return false;
    }
    seen.add(candle.time);
    return true;
  });
}

function floorToQuarterHour(epochSeconds: number) {
  const date = new Date(epochSeconds * 1000);
  const minute = date.getMinutes();
  const flooredMinute = minute - (minute % 15);
  date.setMinutes(flooredMinute, 0, 0);
  return Math.floor(date.getTime() / 1000);
}

function aggregateTo15Minute(candles: BaseCandle[]) {
  const grouped = new Map<number, BaseCandle>();

  for (const candle of candles) {
    const bucket = floorToQuarterHour(candle.time);
    const current = grouped.get(bucket);

    if (!current) {
      grouped.set(bucket, {
        time: bucket,
        open: candle.open,
        high: candle.high,
        low: candle.low,
        close: candle.close,
        volume: candle.volume,
      });
      continue;
    }

    current.high = Math.max(current.high, candle.high);
    current.low = Math.min(current.low, candle.low);
    current.close = candle.close;
    current.volume += candle.volume;
  }

  return Array.from(grouped.values()).sort((left, right) => left.time - right.time);
}

function movingAverage(candles: BaseCandle[], index: number, length: number) {
  if (index < length - 1) {
    return null;
  }

  let sum = 0;
  for (let cursor = index - length + 1; cursor <= index; cursor += 1) {
    sum += candles[cursor].close;
  }

  return sum / length;
}

function volumeAverage(candles: BaseCandle[], index: number, length: number) {
  if (index < length - 1) {
    return null;
  }

  let sum = 0;
  for (let cursor = index - length + 1; cursor <= index; cursor += 1) {
    sum += candles[cursor].volume;
  }

  return sum / length;
}

function hasVolumeRecovery(candles: BaseCandle[], index: number) {
  const volumeMa20 = volumeAverage(candles, index, 20);
  if (!volumeMa20) {
    return false;
  }

  const previousWindow = candles.slice(Math.max(0, index - 10), index);
  const compressed = previousWindow.some((_, windowIndex) => {
    const targetIndex = Math.max(0, index - 10) + windowIndex;
    const avg = volumeAverage(candles, targetIndex, 20);
    return avg !== null && candles[targetIndex].volume < avg * 0.8;
  });

  return compressed && candles[index].volume >= volumeMa20;
}

function buildConditionMarkers(candles: BaseCandle[]) {
  const markers: HynixConditionMarker[] = [];

  for (let index = 1; index < candles.length; index += 1) {
    const prevMa5 = movingAverage(candles, index - 1, 5);
    const prevMa20 = movingAverage(candles, index - 1, 20);
    const currentMa5 = movingAverage(candles, index, 5);
    const currentMa20 = movingAverage(candles, index, 20);

    if (prevMa5 === null || prevMa20 === null || currentMa5 === null || currentMa20 === null) {
      continue;
    }

    const bullishCross = prevMa5 <= prevMa20 && currentMa5 > currentMa20;
    const bearishCross = prevMa5 >= prevMa20 && currentMa5 < currentMa20;

    if (bullishCross && hasVolumeRecovery(candles, index) && candles[index].close >= candles[index].open) {
      markers.push({
        time: candles[index].time,
        price: candles[index].low,
        type: "start",
        label: "진입",
      });
    }

    if (bearishCross || candles[index].close < currentMa20) {
      markers.push({
        time: candles[index].time,
        price: candles[index].high,
        type: "end",
        label: "종료",
      });
    }
  }

  return markers;
}

async function fetchMinuteCandlesChunk(targetCount: number, beforeDate?: string | null, beforeTime?: string | null): Promise<FetchRawResult> {
  const anchor = beforeDate && beforeTime
    ? { date: beforeDate, hourMinuteSecond: beforeTime }
    : kstDateParts(clampMinuteAnchorCursor());

  let anchorParts = anchor;
  const rows: BaseCandle[] = [];
  const seen = new Set<string>();
  let emptyPages = 0;

  while (rows.length < targetCount) {
    const pageRows = await fetchChartPage(MINUTE_ENDPOINT, MINUTE_TR_ID, {
      FID_COND_MRKT_DIV_CODE: "J",
      FID_INPUT_ISCD: HYNIX_SYMBOL,
      FID_INPUT_HOUR_1: anchorParts.hourMinuteSecond,
      FID_INPUT_DATE_1: anchorParts.date,
      FID_PW_DATA_INCU_YN: "Y",
      FID_FAKE_TICK_INCU_YN: "N",
    });

    if (!pageRows.length) {
      emptyPages += 1;
      if (emptyPages >= 2) {
        break;
      }

      const previous = previousBusinessDay(new Date(`${anchorParts.date.slice(0, 4)}-${anchorParts.date.slice(4, 6)}-${anchorParts.date.slice(6, 8)}T12:00:00+09:00`));
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

    if (rows.length >= targetCount) {
      break;
    }

    const last = pageRows[pageRows.length - 1];
    if (!last?.stck_cntg_hour || !last?.stck_bsop_date) {
      break;
    }

    anchorParts = subtractOneMinute(last.stck_bsop_date, String(last.stck_cntg_hour).padStart(6, "0"));
  }

  const sorted = uniqueCandles(rows).sort((left, right) => left.time - right.time);
  const trimmed = sorted.slice(-targetCount);
  const oldest = trimmed[0];
  const nextCursor = oldest ? subtractOneMinute(epochToKstDate(oldest.time), epochToKstTime(oldest.time)) : null;

  return {
    candles: trimmed,
    nextCursorDate: nextCursor?.date ?? null,
    nextCursorTime: nextCursor?.hourMinuteSecond ?? null,
    hasMoreHistory: Boolean(nextCursor),
    basis: "KIS 실데이터 기준",
  };
}

async function fetchDailyCandlesChunk(targetCount: number, beforeDate?: string | null): Promise<FetchRawResult> {
  const endDate = beforeDate ? subtractBusinessDays(beforeDate, 1) : kstDateParts(nowKst()).date;
  const startDate = subtractBusinessDays(endDate, Math.max(targetCount * 3, 120));

  const pageRows = await fetchChartPage(DAILY_ENDPOINT, DAILY_TR_ID, {
    FID_COND_MRKT_DIV_CODE: "J",
    FID_INPUT_ISCD: HYNIX_SYMBOL,
    FID_INPUT_DATE_1: startDate,
    FID_INPUT_DATE_2: endDate,
    FID_PERIOD_DIV_CODE: "D",
    FID_ORG_ADJ_PRC: "1",
  });

  const rows = pageRows.map(dailyRowToCandle).filter((candle): candle is BaseCandle => Boolean(candle)).reverse();
  const trimmed = rows.slice(-targetCount);
  const oldest = trimmed[0];
  const nextCursorDate = oldest ? subtractBusinessDays(epochToKstDate(oldest.time), 1) : null;

  return {
    candles: trimmed,
    nextCursorDate,
    nextCursorTime: null,
    hasMoreHistory: rows.length >= targetCount && Boolean(nextCursorDate),
    basis: "KIS 실데이터 기준",
  };
}

function epochToKstDate(epochSeconds: number) {
  const date = new Date(epochSeconds * 1000);
  return kstDateParts(new Date(date.toLocaleString("en-US", { timeZone: "Asia/Seoul" }))).date;
}

function epochToKstTime(epochSeconds: number) {
  const date = new Date(epochSeconds * 1000);
  return kstDateParts(new Date(date.toLocaleString("en-US", { timeZone: "Asia/Seoul" }))).hourMinuteSecond;
}

function buildCacheKey(options: FetchChartOptions) {
  return [
    options.interval,
    options.count,
    options.beforeDate || "",
    options.beforeTime || "",
    options.includeExecutionStrength ? "1" : "0",
  ].join(":");
}

function buildFallbackCandles(interval: ChartInterval, count: number) {
  const stepSeconds = interval === "1d" ? 86_400 : interval === "15m" ? 900 : 60;
  return Array.from({ length: count }, (_, index) => {
    const wave = Math.sin(index / 7) * 1800;
    const trend = index * (interval === "1d" ? 110 : 45);
    const open = Math.round(185000 + trend + wave);
    const close = Math.round(open + Math.cos(index / 3) * 900 + (index % 4 === 0 ? 600 : -200));
    const high = Math.max(open, close) + 1100;
    const low = Math.min(open, close) - 1000;
    const volume = Math.round(90000 + index * 2500 + Math.abs(Math.sin(index / 5) * 45000));
    return {
      time: Math.floor(Date.now() / 1000) - (count - index) * stepSeconds,
      open,
      high,
      low,
      close,
      volume,
    };
  });
}

export async function fetchHynixChartSnapshot(options: FetchChartOptions): Promise<HynixChartSnapshot> {
  const count = Math.max(30, Math.min(options.count, 500));
  const cacheKey = buildCacheKey({ ...options, count });
  const cached = chartCache.get(cacheKey);

  if (cached && cached.expiresAt > Date.now()) {
    return cached.snapshot;
  }

  try {
    const includeExecutionStrength = options.includeExecutionStrength ?? true;
    let rawResult: FetchRawResult;

    if (options.interval === "1d") {
      rawResult = await fetchDailyCandlesChunk(count, options.beforeDate);
    } else if (options.interval === "15m") {
      const minuteResult = await fetchMinuteCandlesChunk(count * 15, options.beforeDate, options.beforeTime);
      rawResult = {
        ...minuteResult,
        candles: aggregateTo15Minute(minuteResult.candles).slice(-count),
      };
    } else {
      rawResult = await fetchMinuteCandlesChunk(count, options.beforeDate, options.beforeTime);
    }

    const candles = rawResult.candles;
    const markers = buildConditionMarkers(candles);
    const executionStrength = includeExecutionStrength
      ? await fetchKiwoomExecutionStrength()
      : {
          source: "kiwoom" as const,
          symbol: "000660" as const,
          value: null,
          value5m: null,
          value20m: null,
          value60m: null,
          currentPrice: null,
          updatedAt: null,
          authenticated: false,
          message: "추가 로딩 구간은 체결강도를 다시 조회하지 않습니다.",
        };

    const snapshot: HynixChartSnapshot = {
      symbol: HYNIX_SYMBOL,
      name: HYNIX_NAME,
      source: "kis",
      basis: rawResult.basis,
      interval: options.interval,
      updatedAt: new Date().toISOString(),
      candles,
      markers,
      executionStrength,
      latestClose: candles.at(-1)?.close ?? null,
      nextCursorDate: rawResult.nextCursorDate,
      nextCursorTime: rawResult.nextCursorTime,
      hasMoreHistory: rawResult.hasMoreHistory,
    };

    chartCache.set(cacheKey, {
      snapshot,
      expiresAt: Date.now() + (options.interval === "1d" ? 5 * 60_000 : 45_000),
    });

    return snapshot;
  } catch {
    const candles = buildFallbackCandles(options.interval, count);
    return {
      symbol: HYNIX_SYMBOL,
      name: HYNIX_NAME,
      source: "kis",
      basis: "데모 차트 기준",
      interval: options.interval,
      updatedAt: new Date().toISOString(),
      candles,
      markers: buildConditionMarkers(candles),
      executionStrength: {
        source: "kiwoom",
        symbol: "000660" as const,
        value: null,
        value5m: null,
        value20m: null,
        value60m: null,
        currentPrice: candles.at(-1)?.close ?? null,
        updatedAt: new Date().toISOString(),
        authenticated: false,
        message: "실데이터 연결에 실패해 데모 차트로 표시합니다.",
      },
      latestClose: candles.at(-1)?.close ?? null,
      nextCursorDate: null,
      nextCursorTime: null,
      hasMoreHistory: false,
    };
  }
}
