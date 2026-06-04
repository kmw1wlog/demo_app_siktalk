"use client";

type FeedbackOpenMode = "card" | "survey";

export function showDemoNotice(title: string, message: string): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("siktalk:demo-notice", { detail: { title, message } }));
}

export function openFeedback(mode: FeedbackOpenMode, trigger: string): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("siktalk:feedback-open", { detail: { mode, trigger } }));
}

export function nudgeFeedback(trigger: string): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("siktalk:feedback-signal", { detail: { signal: trigger } }));
}
