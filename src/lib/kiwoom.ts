type KiwoomTokenCache = {
  token: string;
  expiresAt: number;
};

export type KiwoomExecutionStrength = {
  source: "kiwoom";
  symbol: "000660";
  value: number | null;
  value5m: number | null;
  value20m: number | null;
  value60m: number | null;
  currentPrice: number | null;
  updatedAt: string | null;
  authenticated: boolean;
  message: string;
};

type KiwoomTokenResponse = {
  token?: string;
  expires_dt?: string;
  return_code?: number;
  return_msg?: string;
};

type KiwoomExecutionResponse = {
  cntr_str_tm?: Array<Record<string, string>>;
  return_code?: number;
  return_msg?: string;
};

const KIWOOM_BASE_URL = "https://api.kiwoom.com";
const HYNIX_SYMBOL = "000660";

let tokenCache: KiwoomTokenCache | null = null;
let tokenPromise: Promise<string> | null = null;

function getKiwoomCredentials() {
  return {
    apiKey: (process.env.KIWOOM_API_KEY || "").trim(),
    apiSecret: (process.env.KIWOOM_API_SECRET || "").trim(),
    baseUrl: (process.env.KIWOOM_BASE_URL || KIWOOM_BASE_URL).replace(/\/$/, ""),
  };
}

function parseKiwoomNumber(value: string | undefined) {
  if (!value) return null;
  const parsed = Number(value.replace(/[,+]/g, ""));
  return Number.isFinite(parsed) ? Math.abs(parsed) : null;
}

function parseKiwoomExpiresAt(value: string | undefined) {
  if (!value || value.length < 14) return Date.now() + 12 * 60 * 60_000;
  const year = Number(value.slice(0, 4));
  const month = Number(value.slice(4, 6)) - 1;
  const day = Number(value.slice(6, 8));
  const hour = Number(value.slice(8, 10));
  const minute = Number(value.slice(10, 12));
  const second = Number(value.slice(12, 14));
  return new Date(year, month, day, hour, minute, second).getTime();
}

async function getKiwoomToken() {
  if (tokenCache && tokenCache.expiresAt > Date.now() + 5 * 60_000) {
    return tokenCache.token;
  }
  if (tokenPromise) {
    return tokenPromise;
  }

  const { apiKey, apiSecret, baseUrl } = getKiwoomCredentials();
  if (!apiKey || !apiSecret) {
    throw new Error("Kiwoom credentials missing");
  }

  tokenPromise = (async () => {
    const response = await fetch(`${baseUrl}/oauth2/token`, {
      method: "POST",
      headers: { "Content-Type": "application/json;charset=UTF-8" },
      body: JSON.stringify({
        grant_type: "client_credentials",
        appkey: apiKey,
        secretkey: apiSecret,
      }),
      cache: "no-store",
    });
    const data = (await response.json()) as KiwoomTokenResponse;

    if (!response.ok || !data.token || data.return_code !== 0) {
      throw new Error(data.return_msg || `Kiwoom token failed: HTTP ${response.status}`);
    }

    tokenCache = {
      token: data.token,
      expiresAt: parseKiwoomExpiresAt(data.expires_dt),
    };

    return data.token;
  })();

  try {
    return await tokenPromise;
  } finally {
    tokenPromise = null;
  }
}

export async function fetchKiwoomExecutionStrength(): Promise<KiwoomExecutionStrength> {
  const { baseUrl } = getKiwoomCredentials();

  try {
    const token = await getKiwoomToken();
    const response = await fetch(`${baseUrl}/api/dostk/mrkcond`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json;charset=UTF-8",
        authorization: `Bearer ${token}`,
        "api-id": "ka10046",
        "cont-yn": "N",
        "next-key": "",
      },
      body: JSON.stringify({ stk_cd: HYNIX_SYMBOL }),
      cache: "no-store",
    });
    const data = (await response.json()) as KiwoomExecutionResponse;

    if (!response.ok || data.return_code !== 0) {
      throw new Error(data.return_msg || `Kiwoom execution strength failed: HTTP ${response.status}`);
    }

    const latest = data.cntr_str_tm?.[0] || {};

    return {
      source: "kiwoom",
      symbol: HYNIX_SYMBOL,
      value: parseKiwoomNumber(latest.cntr_str),
      value5m: parseKiwoomNumber(latest.cntr_str_5min),
      value20m: parseKiwoomNumber(latest.cntr_str_20min),
      value60m: parseKiwoomNumber(latest.cntr_str_60min),
      currentPrice: parseKiwoomNumber(latest.cur_prc),
      updatedAt: latest.cntr_tm || null,
      authenticated: true,
      message: "Kiwoom REST 체결강도를 확인했습니다.",
    };
  } catch (error) {
    return {
      source: "kiwoom",
      symbol: HYNIX_SYMBOL,
      value: null,
      value5m: null,
      value20m: null,
      value60m: null,
      currentPrice: null,
      updatedAt: null,
      authenticated: false,
      message: error instanceof Error ? error.message : "Kiwoom REST 체결강도 확인에 실패했습니다.",
    };
  }
}
