export type KisCredentialCheck = {
  configured: boolean;
  authenticated: boolean;
  baseUrl: string;
  message: string;
};

type KisCredentials = {
  appkey: string;
  appsecret: string;
  baseUrl: string;
};

type KisTokenResponse = {
  access_token?: string;
  error_code?: string;
  error_description?: string;
  rt_cd?: string;
  msg1?: string;
  access_token_token_expired?: string;
};

const DEFAULT_KIS_BASE_URL = "https://openapivts.koreainvestment.com:29443";
const KIS_CREDENTIAL_CACHE_MS = 23 * 60 * 60 * 1000;

let cachedCredentialCheck: { value: KisCredentialCheck; expiresAt: number } | null = null;
let cachedAccessToken: { token: string; expiresAt: number } | null = null;
let tokenPromise: Promise<string> | null = null;

export function getKisCredentials(): KisCredentials {
  const appkey = process.env.KIS_API_KEY || process.env.KIS_APP_KEY || "";
  const appsecret = process.env.KIS_API_SECRET || process.env.KIS_APP_SECRET || "";
  const baseUrl = process.env.KIS_API_BASE_URL || process.env.KIS_BASE_URL || DEFAULT_KIS_BASE_URL;
  return {
    appkey: appkey.trim(),
    appsecret: appsecret.trim(),
    baseUrl,
  };
}

export async function getKisAccessToken(): Promise<string> {
  if (cachedAccessToken && cachedAccessToken.expiresAt > Date.now() + 5 * 60_000) {
    return cachedAccessToken.token;
  }
  if (tokenPromise) {
    return tokenPromise;
  }

  const { appkey, appsecret, baseUrl } = getKisCredentials();
  if (!appkey || !appsecret) {
    throw new Error("KIS credentials missing");
  }

  tokenPromise = (async () => {
    const response = await fetch(`${baseUrl}/oauth2/tokenP`, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({
        grant_type: "client_credentials",
        appkey,
        appsecret,
      }),
    });
    const data = (await response.json().catch(() => ({}))) as KisTokenResponse;

    if (!response.ok || !data.access_token) {
      throw new Error(data.error_description || data.msg1 || data.error_code || "KIS token request failed");
    }

    const expiresAt = data.access_token_token_expired
      ? new Date(data.access_token_token_expired.replace(" ", "T") + "+09:00").getTime()
      : Date.now() + 12 * 60 * 60_000;

    cachedAccessToken = {
      token: data.access_token,
      expiresAt,
    };

    return data.access_token;
  })();

  try {
    return await tokenPromise;
  } finally {
    tokenPromise = null;
  }
}

export async function verifyKisCredentials(): Promise<KisCredentialCheck> {
  const { appkey, appsecret, baseUrl } = getKisCredentials();

  if (!appkey || !appsecret) {
    return {
      configured: false,
      authenticated: false,
      baseUrl,
      message: "KIS API 키가 설정되지 않아 paper 모드 가상 데이터로만 확인합니다.",
    };
  }

  if (cachedCredentialCheck && cachedCredentialCheck.expiresAt > Date.now()) {
    return cachedCredentialCheck.value;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10_000);

  try {
    await Promise.race([
      getKisAccessToken(),
      new Promise((_, reject) => {
        controller.signal.addEventListener("abort", () => reject(new Error("KIS API 인증 확인 시간 초과")), { once: true });
      }),
    ]);
    const result = {
      configured: true,
      authenticated: true,
      baseUrl,
      message: "KIS API 인증을 확인했습니다. 차트와 알림은 실데이터 기준으로 확인합니다.",
    };
    cachedCredentialCheck = {
      value: result,
      expiresAt: Date.now() + KIS_CREDENTIAL_CACHE_MS,
    };
    return result;
  } catch (error) {
    return {
      configured: true,
      authenticated: false,
      baseUrl,
      message: error instanceof Error ? `KIS API 인증 확인 실패: ${error.message}` : "KIS API 인증 확인에 실패했습니다.",
    };
  } finally {
    clearTimeout(timer);
  }
}
