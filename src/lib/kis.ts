export type KisCredentialCheck = {
  configured: boolean;
  authenticated: boolean;
  baseUrl: string;
  message: string;
};

type KisTokenResponse = {
  access_token?: string;
  error_code?: string;
  error_description?: string;
  rt_cd?: string;
  msg1?: string;
};

const DEFAULT_KIS_BASE_URL = "https://openapivts.koreainvestment.com:29443";
const KIS_CREDENTIAL_CACHE_MS = 23 * 60 * 60 * 1000;

let cachedCredentialCheck: { value: KisCredentialCheck; expiresAt: number } | null = null;

export async function verifyKisCredentials(): Promise<KisCredentialCheck> {
  const appkey = process.env.KIS_APP_KEY;
  const appsecret = process.env.KIS_APP_SECRET;
  const baseUrl = process.env.KIS_API_BASE_URL || DEFAULT_KIS_BASE_URL;

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
    const response = await fetch(`${baseUrl}/oauth2/tokenP`, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({
        grant_type: "client_credentials",
        appkey,
        appsecret,
      }),
      signal: controller.signal,
    });
    const data = (await response.json().catch(() => ({}))) as KisTokenResponse;

    if (response.ok && data.access_token) {
      const result = {
        configured: true,
        authenticated: true,
        baseUrl,
        message: "KIS API 인증을 확인했습니다. 차트와 알림은 데모용 paper 데이터로 표시합니다.",
      };
      cachedCredentialCheck = {
        value: result,
        expiresAt: Date.now() + KIS_CREDENTIAL_CACHE_MS,
      };
      return result;
    }

    return {
      configured: true,
      authenticated: false,
      baseUrl,
      message: data.error_description || data.msg1 || data.error_code || "KIS API 인증 확인에 실패했습니다.",
    };
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
