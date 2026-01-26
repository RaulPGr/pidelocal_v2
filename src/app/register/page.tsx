"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter, useSearchParams } from "next/navigation";
import { Check, Loader2, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function RegisterPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const initialPlan = searchParams.get("plan") || "starter";

    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState(1); // 1: User, 2: Business

    // Form State
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [businessName, setBusinessName] = useState("");
    const [slug, setSlug] = useState("");
    const [error, setError] = useState<string | null>(null);

    // Auto-generate slug
    useEffect(() => {
        if (businessName) {
            const s = businessName
                .toLowerCase()
                .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // remove accents
                .replace(/[^a-z0-9]+/g, "-") // replace non-alphanum with hyphens
                .replace(/^-+|-+$/g, ""); // trim hyphens
            setSlug(s);
        }
    }, [businessName]);

    async function handleRegister(e: React.FormEvent) {
        e.preventDefault();
        if (!email || !password || !businessName || !slug) {
            setError("Por favor completa todos los campos campos.");
            return;
        }
        setLoading(true);
        setError(null);

        try {
            // New Flow: Server-Side Registration
            const res = await fetch("/api/onboarding/complete", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email,
                    password, // Send password securely to API
                    businessName,
                    slug,
                    plan: initialPlan
                })
            });

            const j = await res.json();
            if (!res.ok) throw new Error(j.error || "Error al configurar el restaurante.");

            // Success!
            // Since we created the user on server, we are not logged in locally.
            // We redirect to login page with a success message.
            router.push(`/login?registered=true&email=${encodeURIComponent(email)}`);

        } catch (e: any) {
            console.error(e);
            setError(e.message || "Ocurrió un error inesperado.");
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen flex bg-white">
            {/* Left Column - Visuals */}
            <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-orange-600 via-amber-500 to-green-600 relative overflow-hidden items-center justify-center p-12 text-white">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/food.png')] opacity-10 mix-blend-multiply" />
                <div className="relative z-10 max-w-lg space-y-8">
                    <Link href="/" className="inline-flex items-center gap-2 mb-8 text-white/90 hover:text-white font-bold tracking-widest uppercase text-xs transition-colors">
                        <ArrowRight className="w-4 h-4 rotate-180" /> Volver al Inicio
                    </Link>
                    <h1 className="text-5xl font-black leading-tight">Empieza tu imperio gastronómico hoy.</h1>
                    <ul className="space-y-4 text-lg text-white/90">
                        <li className="flex items-center gap-3"><Check className="text-white bg-white/20 rounded-full p-0.5 w-6 h-6" /> Sin comisiones ocultas</li>
                        <li className="flex items-center gap-3"><Check className="text-white bg-white/20 rounded-full p-0.5 w-6 h-6" /> Carta digital instantánea</li>
                        <li className="flex items-center gap-3"><Check className="text-white bg-white/20 rounded-full p-0.5 w-6 h-6" /> Panel de control profesional</li>
                    </ul>
                </div>
            </div>

            {/* Right Column - Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-12 bg-slate-50">
                <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-3xl shadow-xl border border-slate-100">
                    <div className="text-center">
                        <h2 className="text-2xl font-bold text-slate-900">Crear Cuenta</h2>
                        <p className="text-slate-500 mt-2">Plan seleccionado: <span className="font-bold uppercase text-orange-600">{initialPlan}</span></p>
                    </div>

                    {error && (
                        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm text-center">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleRegister} className="space-y-6">

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Nombre de tu Restaurante</label>
                                <input
                                    type="text"
                                    value={businessName}
                                    onChange={e => setBusinessName(e.target.value)}
                                    className="w-full px-4 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                                    placeholder="Ej. Pizzeria Luigi"
                                    required
                                />
                            </div>

                            {slug && (
                                <div className="text-xs text-slate-500 flex items-center gap-1 bg-slate-100 px-3 py-2 rounded-lg">
                                    <span className="shrink-0 text-slate-400">Tu web será:</span>
                                    <span className="font-mono font-bold text-slate-700 truncate">{slug}.pidelocal.es</span>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    className="w-full px-4 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                                    placeholder="tu@email.com"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Contraseña</label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    className="w-full px-4 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                                    placeholder="••••••••"
                                    required
                                    minLength={6}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Crear Restaurante"}
                        </button>

                        <p className="text-center text-xs text-slate-400">
                            Al registrarte aceptas nuestros términos y condiciones.
                        </p>
                        <p className="text-center text-[10px] text-slate-300 font-mono break-all">
                            Debug: {process.env.NEXT_PUBLIC_SUPABASE_URL}
                        </p>
                    </form>

                    <div className="text-center">
                        <Link href="/login" className="text-sm font-medium text-slate-600 hover:text-slate-900">
                            ¿Ya tienes cuenta? Inicia sesión
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
