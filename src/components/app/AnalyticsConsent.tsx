"use client";

import { useEffect } from "react";
import { grantAnalyticsConsent, hasAnalyticsConsent, initMixpanel, trackEvent } from "@/lib/mixpanel";

export function AnalyticsConsent() {
  useEffect(() => {
    const consented = hasAnalyticsConsent();
    if (consented) {
      void initMixpanel();
      return;
    }
    grantAnalyticsConsent();
    void trackEvent("Analytics Consent Granted", { placement: "auto" });
  }, []);

  return null;
}
