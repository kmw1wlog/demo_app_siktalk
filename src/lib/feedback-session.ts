"use client";

import { trackEvent } from "./mixpanel";

type FeedbackContext = {
  rid: string | null;
  pre_sid: string | null;
  source: string;
  campaign: string;
  session_id: string;
  last_screen: string;
  time_spent_sec: number;
  strategy_clicked: boolean;
  chart_render_clicked: boolean;
  export_clicked: boolean;
};

type FeedbackSignal = "strategy_clicked" | "chart_render_clicked" | "export_clicked";

const keys = {
  campaign: "siktalk_feedback_campaign",
  completed: "siktalk_feedback_completed",
  dismissed: "siktalk_feedback_dismissed",
  exportClicked: "siktalk_feedback_export_clicked",
  firstSeenAt: "siktalk_feedback_first_seen_at",
  lastScreen: "siktalk_feedback_last_screen",
  preSurveyId: "siktalk_feedback_pre_sid",
  rid: "siktalk_feedback_rid",
  sessionId: "siktalk_feedback_session_id",
  source: "siktalk_feedback_source",
  strategyClicked: "siktalk_feedback_strategy_clicked",
  chartRenderClicked: "siktalk_feedback_chart_render_clicked",
};

const signalEventName: Record<FeedbackSignal, string> = {
  strategy_clicked: "Strategy Card Clicked",
  chart_render_clicked: "Chart Render Clicked",
  export_clicked: "TradingView Export Clicked",
};

export function ensureFeedbackSession(): FeedbackContext | null {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  setFromParam(params, "rid", keys.rid);
  setFromParam(params, "pre_sid", keys.preSurveyId);
  setFromParam(params, "session_id", keys.sessionId);
  setFromParam(params, "source", keys.source);
  setFromParam(params, "campaign", keys.campaign);

  if (!window.localStorage.getItem(keys.sessionId)) {
    window.localStorage.setItem(keys.sessionId, createSessionId());
  }
  if (!window.localStorage.getItem(keys.firstSeenAt)) {
    window.localStorage.setItem(keys.firstSeenAt, String(Date.now()));
  }
  setFeedbackLastScreen(window.location.pathname);
  return getFeedbackContext();
}

export function getFeedbackContext(): FeedbackContext | null {
  if (typeof window === "undefined") return null;
  const firstSeenAt = Number(window.localStorage.getItem(keys.firstSeenAt) || Date.now());
  const sessionId = window.localStorage.getItem(keys.sessionId) || createSessionId();
  window.localStorage.setItem(keys.sessionId, sessionId);

  return {
    rid: window.localStorage.getItem(keys.rid),
    pre_sid: window.localStorage.getItem(keys.preSurveyId),
    source: window.localStorage.getItem(keys.source) || "direct",
    campaign: window.localStorage.getItem(keys.campaign) || "none",
    session_id: sessionId,
    last_screen: window.localStorage.getItem(keys.lastScreen) || window.location.pathname,
    time_spent_sec: Math.max(0, Math.round((Date.now() - firstSeenAt) / 1000)),
    strategy_clicked: window.localStorage.getItem(keys.strategyClicked) === "true",
    chart_render_clicked: window.localStorage.getItem(keys.chartRenderClicked) === "true",
    export_clicked: window.localStorage.getItem(keys.exportClicked) === "true",
  };
}

export function markFeedbackSignal(signal: FeedbackSignal, lastScreen?: string): void {
  if (typeof window === "undefined") return;
  ensureFeedbackSession();
  const key = signal === "strategy_clicked"
    ? keys.strategyClicked
    : signal === "chart_render_clicked"
      ? keys.chartRenderClicked
      : keys.exportClicked;
  window.localStorage.setItem(key, "true");
  if (lastScreen) setFeedbackLastScreen(lastScreen);
  recordFeedbackEvent(signalEventName[signal], { signal });
  window.dispatchEvent(new CustomEvent("siktalk:feedback-signal", { detail: { signal } }));
}

export function setFeedbackLastScreen(screen: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(keys.lastScreen, screen);
}

export function hasFeedbackCompleted(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(keys.completed) === "true";
}

export function markFeedbackCompleted(): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(keys.completed, "true");
}

export function isFeedbackDismissedForSession(): boolean {
  if (typeof window === "undefined") return false;
  return window.sessionStorage.getItem(keys.dismissed) === "true";
}

export function dismissFeedbackForSession(): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(keys.dismissed, "true");
}

export function recordFeedbackEvent(eventName: string, properties: Record<string, unknown> = {}): void {
  const context = getFeedbackContext();
  if (!context) return;
  void trackEvent(eventName, { ...context, ...properties });
}

function setFromParam(params: URLSearchParams, param: string, key: string): void {
  const value = params.get(param);
  if (value) window.localStorage.setItem(key, value);
}

function createSessionId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `session_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}
