"use client";

type MixpanelLike = {
  init: (token: string, config?: Record<string, unknown>) => void;
  track: (eventName: string, properties?: Record<string, unknown>) => void;
  register: (properties: Record<string, unknown>) => void;
};

declare global {
  interface Window {
    mixpanel?: MixpanelLike;
    __siktalkMixpanelLoading?: boolean;
  }
}

const token = "3b18770397406dc6cf4e603ad4b35d07";
const consentKey = "siktalk.analyticsConsent";
const scriptId = "mixpanel-sdk";

export function hasAnalyticsConsent(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(consentKey) === "granted";
}

export function grantAnalyticsConsent(): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(consentKey, "granted");
  void ensureMixpanel();
}

export function trackMixpanel(eventName: string, properties: Record<string, unknown> = {}): void {
  if (!hasAnalyticsConsent()) return;
  void ensureMixpanel().then(() => {
    window.mixpanel?.track(eventName, {
      ...properties,
      app: "siktalk",
      environment: process.env.NODE_ENV,
    });
  });
}

function ensureMixpanel(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.mixpanel) return Promise.resolve();
  if (window.__siktalkMixpanelLoading) {
    return new Promise((resolve) => window.setTimeout(resolve, 300));
  }

  window.__siktalkMixpanelLoading = true;
  return new Promise((resolve) => {
    const existing = document.getElementById(scriptId);
    if (existing) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.id = scriptId;
    script.async = true;
    script.src = "https://cdn.mxpnl.com/libs/mixpanel-2-latest.min.js";
    script.onload = () => {
      window.mixpanel?.init(token, {
        debug: process.env.NODE_ENV !== "production",
        persistence: "localStorage",
      });
      window.mixpanel?.register({ app: "siktalk", surface: "web" });
      window.__siktalkMixpanelLoading = false;
      resolve();
    };
    script.onerror = () => {
      window.__siktalkMixpanelLoading = false;
      resolve();
    };
    document.head.appendChild(script);
  });
}
