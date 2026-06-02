"use client";

import mixpanel from "mixpanel-browser";

type MixpanelLike = typeof mixpanel;

declare global {
  interface Window {
    mixpanel?: MixpanelLike;
  }
}

const fallbackToken = "3b18770397406dc6cf4e603ad4b35d07";
const consentKey = "siktalk.analyticsConsent";
let mixpanelPromise: Promise<void> | null = null;
let mixpanelReady = false;

export function hasAnalyticsConsent(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(consentKey) === "granted";
}

export function grantAnalyticsConsent(): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(consentKey, "granted");
  void initMixpanel();
}

export function trackMixpanel(eventName: string, properties: Record<string, unknown> = {}): void {
  if (!hasAnalyticsConsent()) return;
  void initMixpanel().then(() => {
    window.mixpanel?.track(eventName, {
      ...properties,
      ...commonProperties(),
    });
  });
}

export function setMixpanelProfile(properties: Record<string, unknown>): void {
  if (!hasAnalyticsConsent()) return;
  void initMixpanel().then(() => {
    window.mixpanel?.people?.set?.(properties);
  });
}

export function initMixpanel(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (!hasAnalyticsConsent()) return Promise.resolve();
  if (mixpanelReady) return Promise.resolve();
  if (mixpanelPromise) return mixpanelPromise;

  mixpanelPromise = new Promise((resolve) => {
    try {
      mixpanel.init(getMixpanelToken(), {
        api_transport: "XHR",
        autocapture: true,
        batch_requests: false,
        debug: process.env.NODE_ENV !== "production",
        persistence: "localStorage",
        track_pageview: false,
      });
      mixpanel.register({
        app: "siktalk",
        environment: process.env.NODE_ENV,
        surface: "web",
      });
      window.mixpanel = mixpanel;
      mixpanelReady = true;
      resolve();
    } catch {
      mixpanelPromise = null;
      resolve();
    }
  });

  return mixpanelPromise;
}

function getMixpanelToken(): string {
  return process.env.NEXT_PUBLIC_MIXPANEL_TOKEN || fallbackToken;
}

function commonProperties(): Record<string, unknown> {
  if (typeof window === "undefined") {
    return {
      app: "siktalk",
      environment: process.env.NODE_ENV,
      surface: "web",
    };
  }
  return {
    app: "siktalk",
    current_path: window.location.pathname,
    current_url: window.location.href,
    environment: process.env.NODE_ENV,
    screen_height: window.screen.height,
    screen_width: window.screen.width,
    surface: "web",
  };
}
