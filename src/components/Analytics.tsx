"use client";
import { useEffect, useState } from "react";
import Script from "next/script";

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID;

export default function Analytics() {
  const [consent, setConsent] = useState<"granted" | "denied" | null>(null);

  useEffect(() => {
    // 1. Initial check
    const stored = localStorage.getItem("cookie_consent");
    if (stored) setConsent(stored as "granted" | "denied");

    // 2. Listen for updates (from CookieBanner)
    const handleUpdate = () => {
      const updated = localStorage.getItem("cookie_consent");
      if (updated) setConsent(updated as "granted" | "denied");
    };

    window.dispatchEvent(new Event("cookie_consent_check")); // Optional: Trigger check
    window.addEventListener("cookie_consent_updated", handleUpdate);
    return () => window.removeEventListener("cookie_consent_updated", handleUpdate);
  }, []);

  // Only render if ID exists AND consent is explicitly granted
  if (!GA_MEASUREMENT_ID || consent !== "granted") return null;

  return (
    <>
      {/* Carga del script de GA4 */}
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />

      {/* Inicialización de GA4 */}
      <Script id="ga4-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_MEASUREMENT_ID}', {
            anonymize_ip: true
          });
        `}
      </Script>
    </>
  );
}
