"use client";

import { Lock, Sparkles } from "lucide-react";
import Link from "next/link";
import type { SubscriptionPlan } from "@/lib/subscription";

interface UpgradeGateProps {
    plan: SubscriptionPlan;
    requiredPlan: SubscriptionPlan;
    featureName: string;
    description?: string;
    benefits?: string[];
}

export default function UpgradeGate({ plan, requiredPlan, featureName, description, benefits }: UpgradeGateProps) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8 max-w-2xl mx-auto animate-in fade-in zoom-in-95 duration-500">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6 relative">
                <Lock className="w-10 h-10 text-slate-400" />
                <div className="absolute -top-2 -right-2 bg-amber-400 text-white p-2 rounded-full shadow-lg animate-bounce">
                    <Sparkles className="w-5 h-5 fill-white" />
                </div>
            </div>

            <h2 className="text-3xl font-black text-slate-900 mb-4">
                Desbloquea {featureName}
            </h2>

            <p className="text-lg text-slate-500 mb-8 max-w-lg">
                {description || `Esta funcionalidad es exclusiva del plan <span class="font-bold capitalize">${requiredPlan}</span>. Actualiza tu suscripción para acceder a ella y potenciar tu negocio.`}
            </p>

            {benefits && benefits.length > 0 && (
                <div className="bg-white border boundary-slate-200 rounded-2xl p-6 mb-8 w-full shadow-sm text-left">
                    <h3 className="font-bold text-slate-900 mb-4 text-sm uppercase tracking-wider">Beneficios del Plan {requiredPlan}:</h3>
                    <ul className="space-y-3">
                        {benefits.map((b, i) => (
                            <li key={i} className="flex items-start gap-3 text-slate-600">
                                <span className="text-emerald-500 font-bold">✓</span> {b}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
                <Link
                    href="/admin/settings?tab=subscription"
                    className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold py-3 px-8 rounded-xl shadow-lg shadow-emerald-500/20 hover:scale-105 hover:shadow-emerald-500/40 transition-all"
                >
                    Mejorar mi Plan
                </Link>
                <Link
                    href="/admin"
                    className="py-3 px-8 rounded-xl text-slate-500 hover:bg-slate-100 font-medium transition-colors"
                >
                    Volver al Inicio
                </Link>
            </div>
        </div>
    );
}
