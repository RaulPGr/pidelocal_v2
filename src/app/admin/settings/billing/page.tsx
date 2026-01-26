"use client";

import { useAdminAccess } from "@/context/AdminAccessContext";
import { Check, CreditCard, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { loadStripe } from '@stripe/stripe-js';

// We assume we have the key, or we fetch URL from API
const PLANS = [
    { id: "starter", name: "Starter", price: "0€", features: ["Carta QR", "Web", "Max. 30 pedidos"] },
    { id: "medium", name: "Medium", price: "29,90€", features: ["Pedidos Ilimitados", "Reservas", "Sin marca de agua"] },
    { id: "premium", name: "Premium", price: "49,90€", features: ["Todo lo de Medium", "Pagos Online", "Marketing", "Fidelización"] },
];

export default function BillingPage() {
    const { plan: currentPlan, isTrial, trialEndsAt } = useAdminAccess();
    console.log('[DEBUG-PAGE] CurrentPlan:', currentPlan, 'IsTrial:', isTrial, 'TrialEnds:', trialEndsAt);
    const [loading, setLoading] = useState<string | null>(null);

    async function handleSubscribe(planId: string) {
        setLoading(planId);
        try {
            const res = await fetch("/api/billing/checkout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ plan: planId }),
            });
            const j = await res.json();
            if (j.error) {
                alert("Error: " + j.error);
                return;
            }
            if (j.url) {
                window.location.href = j.url;
            }
        } catch (e) {
            alert("Error de conexión");
        } finally {
            setLoading(null);
        }
    }

    // Calculate days
    const daysLeft = trialEndsAt
        ? Math.ceil((new Date(trialEndsAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
        : 0;

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Facturación y Planes</h1>
                <p className="text-slate-500">Gestiona tu suscripción y métodos de pago.</p>
            </div>

            {isTrial && (
                <div className="bg-orange-50 border border-orange-200 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div>
                        <h3 className="text-lg font-bold text-orange-800 flex items-center gap-2">
                            <ShieldCheck className="w-5 h-5" /> Periodo de Prueba Activo
                        </h3>
                        <p className="text-orange-700">Estas disfrutando del plan <strong>{currentPlan.toUpperCase()}</strong> gratis.</p>
                    </div>
                    <div className="text-center md:text-right">
                        <div className="text-3xl font-black text-orange-900">{daysLeft} días</div>
                        <div className="text-xs uppercase font-bold text-orange-600 tracking-wider">Restantes</div>
                    </div>
                </div>
            )}

            <div className="grid md:grid-cols-3 gap-6">
                {PLANS.map((p) => {
                    const isCurrent = currentPlan === p.id; // Simple logic (in trial current is what they selected)
                    return (
                        <div key={p.id} className={`bg-white rounded-2xl p-6 border ${isCurrent ? 'border-emerald-500 ring-2 ring-emerald-500/10' : 'border-slate-200'}`}>
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="font-bold text-lg">{p.name}</h3>
                                    <div className="text-2xl font-black">
                                        {p.price}
                                        <span className="text-sm font-normal text-slate-400">/mes</span>
                                        <span className="text-xs font-bold text-slate-400 ml-1">+ IVA</span>
                                    </div>
                                    <div className="text-xs font-medium text-slate-400 mt-1">
                                        ({(parseFloat(p.price.replace('€', '').replace(',', '.')) * 1.21).toFixed(2).replace('.', ',')}€ IVA incl.)
                                    </div>
                                </div>
                                {isCurrent && <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-2 py-1 rounded-full">ACTIVO</span>}
                            </div>

                            <ul className="space-y-2 mb-6 text-sm text-slate-600">
                                {p.features.map(f => (
                                    <li key={f} className="flex gap-2"><Check className="w-4 h-4 text-emerald-500" /> {f}</li>
                                ))}
                            </ul>

                            <button
                                onClick={() => handleSubscribe(p.id)}
                                disabled={loading !== null}
                                className={`w-full py-2.5 rounded-xl font-bold text-sm transition-all ${isCurrent ? 'bg-slate-100 text-slate-400 cursor-default' : 'bg-slate-900 text-white hover:bg-slate-800'}`}
                            >
                                {loading === p.id ? "Procesando..." : (isCurrent ? "Plan Actual" : `Cambiar a ${p.name}`)}
                            </button>
                        </div>
                    )
                })}
            </div>

            {/* Invoice History Placeholder */}
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
                <div className="p-6 border-b border-slate-100">
                    <h3 className="font-bold text-slate-900">Historial de Facturas</h3>
                </div>
                <div className="p-12 text-center text-slate-400">
                    No hay facturas disponibles todavía.
                </div>
            </div>
        </div>
    );
}
