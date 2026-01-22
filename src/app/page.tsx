"use client";

import { useEffect, useState } from "react";
import TenantLanding from "@/components/tenant/TenantLanding";
import SaasLanding from "@/components/saas/SaasLanding";

export default function EntryPage() {
  const [viewState, setViewState] = useState<"loading" | "tenant" | "saas">("loading");
  const [debugLog, setDebugLog] = useState<string>("Iniciando componente...");

  useEffect(() => {
    // Run checks after mount
    const check = () => {
      try {
        // Using vanilla JS to avoid Next.js hook complexities
        const params = new URLSearchParams(window.location.search);
        const pTenant = params.get("tenant");
        const host = window.location.hostname;

        // Check subdomain logic
        const parts = host.split('.');
        let isSub = false;

        // localhost vs production detection
        if (host.includes('localhost')) {
          isSub = parts.length > 1 && parts[0] !== 'www';
        } else {
          isSub = parts.length > 2 && parts[0] !== 'www';
        }

        const isTenant = !!pTenant || isSub;

        setDebugLog(`Detectado: ${host} | Subdominio: ${isSub} | Tenant: ${pTenant}`);
        setViewState(isTenant ? "tenant" : "saas");
      } catch (e: any) {
        setDebugLog(`Error: ${e.message}`);
        setViewState("saas"); // Fallback to SaaS landing on error
      }
    };

    // Execute immediately
    check();
  }, []);

  if (viewState === "loading") {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center flex-col gap-6">
        <div className="w-12 h-12 border-4 border-slate-200 border-t-emerald-600 rounded-full animate-spin" />

        <div className="text-center space-y-2">
          <h2 className="text-slate-800 font-bold">Cargando PideLocal...</h2>
          <p className="text-xs text-slate-400 font-mono bg-slate-100 px-3 py-1 rounded max-w-md mx-auto">
            {debugLog}
          </p>
        </div>

        <button
          onClick={() => window.location.reload()}
          className="text-xs text-slate-500 underline hover:text-slate-800"
        >
          Si tarda mucho, pulsa aquí para recargar
        </button>
      </div>
    );
  }

  return viewState === "tenant" ? <TenantLanding /> : <SaasLanding />;
}
