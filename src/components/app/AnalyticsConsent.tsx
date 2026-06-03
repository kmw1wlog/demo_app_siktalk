"use client";

import { useEffect, useState } from "react";
import { grantAnalyticsConsent, hasAnalyticsConsent, initMixpanel, trackEvent } from "@/lib/mixpanel";

export function AnalyticsConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consented = hasAnalyticsConsent();
    setVisible(!consented);
    if (consented) {
      void initMixpanel();
    }
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed right-5 top-24 z-40 hidden max-w-sm rounded-2xl border border-slate-200 bg-white p-3 shadow-xl md:block">
      <p className="text-xs leading-5 text-slate-600">
        제품 개선을 위해 익명 행동 데이터를 수집합니다. 실제 투자 정보나 주문 데이터는 수집하지 않습니다.
      </p>
      <div className="mt-2 flex gap-2">
        <button
          type="button"
          className="rounded-full bg-slate-950 px-3 py-2 text-xs font-bold text-white"
          onClick={() => {
            grantAnalyticsConsent();
            void trackEvent("Analytics Consent Granted", { placement: "floating_banner" });
            setVisible(false);
          }}
        >
          분석 허용
        </button>
        <button
          type="button"
          className="rounded-full px-3 py-2 text-xs font-bold text-slate-500"
          onClick={() => setVisible(false)}
        >
          나중에
        </button>
      </div>
    </div>
  );
}
