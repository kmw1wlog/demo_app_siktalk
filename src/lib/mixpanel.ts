"use client";

type MixpanelLike = typeof import("mixpanel-browser").default;

declare global {
  interface Window {
    mixpanel?: MixpanelLike;
  }
}

type EventProperties = Record<string, unknown>;

type AnalyticsPayload = {
  eventName: string;
  properties: EventProperties;
};

const consentKey = "siktalk.analyticsConsent";
const internalKey = "siktalk_is_internal";
const leadIdKey = "siktalk_feedback_rid";
const preSurveyIdKey = "siktalk_feedback_pre_sid";
const sessionIdKey = "siktalk_feedback_session_id";
const sourceKey = "siktalk_feedback_source";
const campaignKey = "siktalk_feedback_campaign";

let mixpanelPromise: Promise<void> | null = null;
let mixpanelReady = false;

function canUseWindow(): boolean {
  return typeof window !== "undefined";
}

export function hasAnalyticsConsent(): boolean {
  if (!canUseWindow()) return false;
  return window.localStorage.getItem(consentKey) === "granted";
}

export function grantAnalyticsConsent(): void {
  if (!canUseWindow()) return;
  window.localStorage.setItem(consentKey, "granted");
  void initMixpanel();
}

export function getAppEnv(): "production" | "staging" {
  return process.env.NEXT_PUBLIC_APP_ENV === "production" ? "production" : "staging";
}

export function initMixpanel(): Promise<void> {
  if (!canUseWindow()) return Promise.resolve();
  applyInternalOverrideFromUrl();
  if (!hasAnalyticsConsent()) return Promise.resolve();
  if (mixpanelReady) {
    refreshSuperProperties();
    return Promise.resolve();
  }
  if (mixpanelPromise) return mixpanelPromise;

  mixpanelPromise = new Promise((resolve) => {
    try {
      void import("mixpanel-browser")
        .then(({ default: mixpanel }) => {
          mixpanel.init(getMixpanelToken(), {
            api_transport: "XHR",
            autocapture: false,
            batch_requests: false,
            debug: getAppEnv() !== "production",
            persistence: "localStorage",
            track_pageview: false,
          });
          window.mixpanel = mixpanel;
          mixpanelReady = true;
          refreshSuperProperties();
          resolve();
        })
        .catch(() => {
          mixpanelPromise = null;
          resolve();
        });
    } catch {
      mixpanelPromise = null;
      resolve();
    }
  });

  return mixpanelPromise;
}

export function identifyLead(leadId: string): void {
  if (!canUseWindow() || !leadId) return;
  window.localStorage.setItem(leadIdKey, leadId);
  if (!hasAnalyticsConsent()) return;
  void initMixpanel().then(() => {
    window.mixpanel?.identify(leadId);
    refreshSuperProperties();
  });
}

export function getAnalyticsContext() {
  if (!canUseWindow()) {
    return {
      app_env: getAppEnv(),
      campaign: null,
      is_internal: true,
      lead_id: null,
      pre_sid: null,
      session_id: null,
      source: null,
      user_role: "internal" as const,
    };
  }

  applyInternalOverrideFromUrl();
  const leadId = window.localStorage.getItem(leadIdKey) || getQueryParam("rid");
  const preSurveyId = window.localStorage.getItem(preSurveyIdKey) || getQueryParam("pre_sid");
  const sessionId = ensureSessionId();
  const source = window.localStorage.getItem(sourceKey) || getQueryParam("source") || "direct";
  const campaign = window.localStorage.getItem(campaignKey) || getQueryParam("campaign") || "none";
  const isInternal = computeIsInternalUser();

  return {
    app_env: getAppEnv(),
    campaign,
    is_internal: isInternal,
    lead_id: leadId,
    pre_sid: preSurveyId,
    session_id: sessionId,
    source,
    user_role: isInternal ? "internal" : "user",
  };
}

export async function trackEvent(
  eventName: string,
  properties: EventProperties = {},
): Promise<void> {
  const context = getAnalyticsContext();
  const payload: AnalyticsPayload = {
    eventName,
    properties: {
      ...context,
      ...properties,
      current_path: canUseWindow() ? window.location.pathname : null,
      current_url: canUseWindow() ? window.location.href : null,
      pre_sid: context.pre_sid,
      screen_height: canUseWindow() ? window.screen.height : null,
      screen_width: canUseWindow() ? window.screen.width : null,
      surface: "web",
    },
  };

  if (!(context.is_internal && eventName.startsWith("Admin "))) {
    if (hasAnalyticsConsent()) {
      await initMixpanel();
      window.mixpanel?.track(payload.eventName, payload.properties);
    }
  }

  try {
    await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch {
    // Supabase logging is best-effort only.
  }
}

function refreshSuperProperties(): void {
  if (!canUseWindow() || !window.mixpanel) return;
  const context = getAnalyticsContext();
  window.mixpanel.register({
    app: "siktalk",
    app_env: context.app_env,
    campaign: context.campaign,
    is_internal: context.is_internal,
    lead_id: context.lead_id,
    pre_sid: context.pre_sid,
    session_id: context.session_id,
    source: context.source,
    surface: "web",
    user_role: context.user_role,
  });
  if (context.lead_id) {
    window.mixpanel.identify(context.lead_id);
  }
}

function getMixpanelToken(): string {
  if (getAppEnv() === "production") {
    return process.env.NEXT_PUBLIC_MIXPANEL_TOKEN_PROD || "";
  }
  return process.env.NEXT_PUBLIC_MIXPANEL_TOKEN_STAGING || "";
}

function applyInternalOverrideFromUrl(): void {
  if (!canUseWindow()) return;
  const value = new URLSearchParams(window.location.search).get("internal");
  if (value === "1") {
    window.localStorage.setItem(internalKey, "true");
  }
  if (value === "0") {
    window.localStorage.removeItem(internalKey);
  }
}

function computeIsInternalUser(): boolean {
  if (!canUseWindow()) return true;
  if (window.localStorage.getItem(internalKey) === "true") {
    return true;
  }

  const hostname = window.location.hostname.toLowerCase();
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "0.0.0.0" ||
    hostname.includes("staging") ||
    hostname.endsWith(".vercel.app")
  );
}

function getQueryParam(name: string): string | null {
  if (!canUseWindow()) return null;
  return new URLSearchParams(window.location.search).get(name);
}

function ensureSessionId(): string {
  if (!canUseWindow()) return "server_session";
  const existing = window.localStorage.getItem(sessionIdKey) || getQueryParam("session_id");
  if (existing) {
    window.localStorage.setItem(sessionIdKey, existing);
    return existing;
  }
  const next =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `session_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  window.localStorage.setItem(sessionIdKey, next);
  return next;
}
