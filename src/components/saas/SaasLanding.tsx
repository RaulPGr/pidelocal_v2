"use client";

import Link from "next/link";
import { Check, ArrowRight, Smartphone, Globe, Calendar, TrendingUp } from "lucide-react";

export default function SaasLanding() {
    return (
        <main className="min-h-screen bg-white selection:bg-orange-100 selection:text-orange-900 font-sans">

            {/* 1. NAVBAR */}
            <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-green-600 flex items-center justify-center text-white font-bold">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                                <path fillRule="evenodd" d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 00-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 002.682 2.282 16.975 16.975 0 001.145.742zM12 13.5a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-600 to-green-700">PideLocal</span>
                    </div>
                    <div className="hidden md:flex gap-8 text-sm font-medium text-slate-600">
                        <a href="#features" className="hover:text-orange-600 transition-colors">Características</a>
                        <a href="#pricing" className="hover:text-orange-600 transition-colors">Precios</a>
                        <a href="#contact" className="hover:text-orange-600 transition-colors">Contacto</a>
                    </div>
                    <Link href="/login" className="px-5 py-2 bg-slate-900 text-white rounded-full text-sm font-bold hover:bg-slate-800 transition-all">
                        Acceso Clientes
                    </Link>
                </div>
            </nav>

            {/* 2. HERO SECTION */}
            <header className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
                {/* Abstract Background (Gradient) */}
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500 via-amber-500 to-green-600 opacity-10" />
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/food.png')] opacity-20 mix-blend-multiply" />

                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100 text-orange-700 text-xs font-bold uppercase tracking-wider animate-in fade-in slide-in-from-bottom-4">
                        🚀 Digitaliza tu restaurante hoy
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tight leading-tight max-w-4xl mx-auto">
                        Tu Restaurante.<br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-green-600">Tu App. Tus Reglas.</span>
                    </h1>
                    <p className="text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
                        Olvídate de comisiones abusivas. Crea tu propia carta digital, gestiona reservas y recibe pedidos online con PideLocal. Todo en una sola plataforma.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                        <a href="#pricing" className="px-8 py-4 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-full font-bold text-lg shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 hover:scale-105 transition-all flex items-center justify-center gap-2">
                            Ver Precios <ArrowRight className="w-5 h-5" />
                        </a>
                        <a href="#demo" className="px-8 py-4 bg-white text-slate-900 border border-slate-200 rounded-full font-bold text-lg hover:bg-slate-50 transition-all">
                            Ver Demo en Vivo
                        </a>
                    </div>
                </div>
            </header>

            {/* 3. FEATURES */}
            <section id="features" className="py-24 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-black text-slate-900">Una Suite Completa para Hostelería</h2>
                        <p className="text-slate-500 mt-4 text-lg">Todo lo que necesitas para crecer sin depender de terceros.</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        <FeatureCard
                            icon={<Smartphone className="w-8 h-8 text-purple-600" />}
                            title="Carta Digital QR"
                            desc="Tus clientes escanean y piden. Sin PDFs aburridos. Una experiencia interactiva y visualmente impactante."
                            color="bg-purple-50"
                        />
                        <FeatureCard
                            icon={<Calendar className="w-8 h-8 text-teal-600" />}
                            title="Reservas Inteligentes"
                            desc="Gestiona tu sala, evita no-shows y organiza turnos automáticamente. Adiós al libro de papel."
                            color="bg-teal-50"
                        />
                        <FeatureCard
                            icon={<TrendingUp className="w-8 h-8 text-emerald-600" />}
                            title="Pedidos Sin Comisiones"
                            desc="Delivery y Takeaway propio. Fideliza a tus clientes y ahorra ese 30% que se llevan otras apps."
                            color="bg-emerald-50"
                        />
                    </div>
                </div>
            </section>

            {/* 4. PRICING */}
            <section id="pricing" className="py-24 bg-slate-50 border-t border-b border-slate-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-black text-slate-900">Precios Transparentes</h2>
                        <p className="text-slate-500 mt-4 text-lg">Elige el plan que mejor se adapte a tu etapa.</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                        {/* STARTER */}
                        <PricingCard
                            plan="Starter"
                            price="19,90"
                            desc="Para empezar a digitalizarte"
                            features={["Carta Digital QR", "Tu Web Personalizada", "Panel de Control Básico", "Soporte por Email"]}
                        />

                        {/* MEDIUM */}
                        <PricingCard
                            plan="Medium"
                            price="39,90"
                            desc="Para restaurantes con sala"
                            highlight
                            features={["Todo lo de Starter", "Gestión de Reservas", "Plano de Mesas", "Recordatorios WhatsApp (Opcional)"]}
                        />

                        {/* PREMIUM */}
                        <PricingCard
                            plan="Premium"
                            price="69,90"
                            desc="La potencia total"
                            features={["Todo lo de Medium", "Pedidos Online (Delivery)", "Pagos Integrados (Stripe)", "Marketing & Fidelización", "Soporte Prioritario"]}
                        />
                    </div>
                </div>
            </section>

            {/* 5. FOOTER */}
            <footer className="bg-slate-900 text-slate-400 py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold text-white">PideLocal</span>
                    </div>
                    <div className="text-sm">
                        © {new Date().getFullYear()} PideLocal. Todos los derechos reservados.
                    </div>
                    <div className="flex gap-6 text-sm font-medium">
                        <a href="/legal/notice" className="hover:text-white">Legal</a>
                        <a href="/legal/privacy" className="hover:text-white">Privacidad</a>
                        <a href="/legal/cookies" className="hover:text-white">Cookies</a>
                        <a href="/legal/terms" className="hover:text-white">Términos</a>
                    </div>
                </div>
            </footer>
        </main>
    );
}

function FeatureCard({ icon, title, desc, color }: any) {
    return (
        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            <div className={`w-14 h-14 rounded-2xl ${color} flex items-center justify-center mb-6`}>
                {icon}
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">{title}</h3>
            <p className="text-slate-500 leading-relaxed">{desc}</p>
        </div>
    );
}

function PricingCard({ plan, price, desc, features, highlight }: any) {
    return (
        <div className={`relative p-8 rounded-3xl border ${highlight ? 'border-orange-200 bg-white shadow-2xl scale-105 z-10' : 'border-slate-200 bg-white shadow-sm hover:shadow-lg transition-shadow'}`}>
            {highlight && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-orange-500 to-amber-500 text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
                    Más Popular
                </div>
            )}
            <h3 className="text-lg font-bold text-slate-900">{plan}</h3>
            <p className="text-slate-500 text-sm mb-6">{desc}</p>

            <div className="mb-8">
                <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black text-slate-900">{price}€</span>
                    <span className="text-slate-500">/mes</span>
                    <span className="text-xs font-bold text-slate-400 ml-1">+ IVA</span>
                </div>
                <div className="text-sm font-medium text-slate-400">
                    ({(parseFloat(price.replace(',', '.')) * 1.21).toFixed(2).replace('.', ',')}€ IVA incl.)
                </div>
            </div>

            <ul className="space-y-4 mb-8">
                {features.map((f: string, i: number) => (
                    <li key={i} className="flex items-center gap-3 text-sm text-slate-600">
                        <Check className="w-5 h-5 text-green-500 shrink-0" />
                        {f}
                    </li>
                ))}
            </ul>

            <Link
                href={`/register?plan=${plan.toLowerCase()}`}
                className={`block w-full text-center py-3 rounded-xl font-bold transition-all ${highlight ? 'bg-slate-900 text-white hover:bg-slate-800' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
                Comenzar Ahora
            </Link>
        </div>
    );
}
