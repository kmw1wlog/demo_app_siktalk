"use client";

import { useEffect, useMemo, useState } from "react";
import { trackEvent } from "@/lib/mixpanel";
import { openFeedback } from "@/lib/ui-signals";

type NoticeState = {
  title: string;
  message: string;
};

function getTrackLabel(node: HTMLElement): string {
  const dataLabel = node.dataset.trackLabel?.trim();
  if (dataLabel) return dataLabel;

  const ariaLabel = node.getAttribute("aria-label")?.trim();
  if (ariaLabel) return ariaLabel;

  const text = node.textContent?.replace(/\s+/g, " ").trim();
  if (text) return text.slice(0, 120);

  return node.tagName.toLowerCase();
}

export function UiEventBridge() {
  const [notice, setNotice] = useState<NoticeState | null>(null);
  const [noticeKey, setNoticeKey] = useState(0);

  const dismissNotice = useMemo(
    () => () => {
      setNotice(null);
    },
    [],
  );

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      const target = event.target instanceof HTMLElement ? event.target : null;
      if (!target) return;

      const clickable = target.closest<HTMLElement>("button, a[href]");
      if (!clickable) return;

      const label = getTrackLabel(clickable);
      const href = clickable instanceof HTMLAnchorElement ? clickable.href : null;
      void trackEvent("UI Button Clicked", {
        ui_href: href,
        ui_kind: clickable.tagName.toLowerCase(),
        ui_label: label,
      });

      const feedbackMode = clickable.dataset.feedbackOpen as "card" | "survey" | undefined;
      if (feedbackMode) {
        if (clickable.dataset.feedbackOnly === "true") {
          event.preventDefault();
        }
        openFeedback(feedbackMode, clickable.dataset.feedbackTrigger || label);
      }

      const noticeTitle = clickable.dataset.demoNoticeTitle;
      const noticeMessage = clickable.dataset.demoNoticeMessage;
      if (noticeTitle && noticeMessage) {
        setNotice({ title: noticeTitle, message: noticeMessage });
        setNoticeKey((current) => current + 1);
      }
    }

    function handleDemoNotice(event: Event) {
      const detail = (event as CustomEvent<NoticeState>).detail;
      if (!detail?.title || !detail?.message) return;
      setNotice(detail);
      setNoticeKey((current) => current + 1);
    }

    document.addEventListener("click", handleClick, true);
    window.addEventListener("siktalk:demo-notice", handleDemoNotice);
    return () => {
      document.removeEventListener("click", handleClick, true);
      window.removeEventListener("siktalk:demo-notice", handleDemoNotice);
    };
  }, []);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), 3600);
    return () => window.clearTimeout(timer);
  }, [notice, noticeKey]);

  if (!notice) return null;

  return (
    <div className="pointer-events-none fixed bottom-6 left-1/2 z-50 w-[calc(100vw-2rem)] max-w-xl -translate-x-1/2">
      <div className="pointer-events-auto rounded-2xl border border-emerald-200 bg-white p-4 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-black text-emerald-700">{notice.title}</p>
            <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{notice.message}</p>
          </div>
          <button
            type="button"
            aria-label="데모 안내 닫기"
            className="rounded-full border border-slate-200 px-2 py-1 text-xs font-black text-slate-500"
            onClick={dismissNotice}
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
