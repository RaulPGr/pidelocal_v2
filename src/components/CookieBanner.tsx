"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Cookie, X } from "lucide-react";

export default function CookieBanner() {
    const [show, setShow] = useState(false);

    useEffect(() => {
        // Check if consent is already stored
        const consent = localStorage.getItem("cookie_consent");
        if (!consent) {
            // Delay showing slightly for better UX
            const t = setTimeout(() => setShow(true), 1000);
            return () => clearTimeout(t);
        }
    }, []);

    const accept = () => {
        localStorage.setItem("cookie_consent", "granted");
        // Trigger a custom event so other components can react immediately
        window.dispatchEvent(new Event("cookie_consent_updated"));
        setShow(false);
    };

    const reject = () => {
        localStorage.setItem("cookie_consent", "denied");
        window.dispatchEvent(new Event("cookie_consent_updated"));
        setShow(false);
    };

    if (!show) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 z-[100] p-4 animate-in slide-in-from-bottom-4 fade-in duration-700">
            <div className="max-w-4xl mx-auto bg-white/95 backdrop-blur-md text-slate-900 rounded-2xl p-6 shadow-[0_0_50px_-12px_rgb(0,0,0,0.25)] border border-slate-200 md:flex md:items-center md:gap-8">
                <div className="flex-1 mb-6 md:mb-0">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-orange-100 rounded-lg">
                            <Cookie className="w-5 h-5 text-orange-600" />
                        </div>
                        <h3 className="font-bold text-lg tracking-tight text-slate-900">Uso de Cookies</h3>
                    </div>
                    <p className="text-slate-600 text-sm leading-relaxed">
                        Usamos cookies propias y de terceros para analizar el tráfico y mejorar tu experiencia.
                        Puedes configurar tus preferencias o aceptar todas. Consulta nuestra{" "}
                        <Link href="/legal/cookies" className="text-emerald-600 hover:text-emerald-700 font-medium underline underline-offset-2">
                            Política de Cookies
                        </Link>.
                    </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 min-w-fit">
                    <button
                        onClick={reject}
                        className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all text-sm font-semibold shadow-sm"
                    >
                        Rechazar
                    </button>
                    <button
                        onClick={accept}
                        className="px-6 py-2.5 rounded-xl bg-slate-900 text-white font-bold shadow-lg shadow-slate-900/20 hover:bg-slate-800 hover:shadow-slate-900/30 hover:scale-[1.02] transition-all text-sm"
                    >
                        Aceptar
                    </button>
                </div>
            </div>
        </div>
    );
}
