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

            {/* 3.5. MOBILE APP SECTION */}
            <section className="py-20 bg-slate-900 overflow-hidden relative">
                {/* Background Pattern */}
                <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-emerald-900/20 to-transparent pointer-events-none" />
                <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-orange-500 rounded-full blur-[128px] opacity-20" />

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="flex flex-col lg:flex-row items-center gap-16">
                        <div className="lg:w-1/2 text-left space-y-8">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold uppercase tracking-wider border border-emerald-500/20">
                                <Smartphone className="w-3 h-3" /> Nuevo
                            </div>
                            <h2 className="text-4xl md:text-5xl font-black text-white leading-tight">
                                Lleva tu restaurante<br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-400">en el bolsillo.</span>
                            </h2>
                            <p className="text-lg text-slate-400 leading-relaxed">
                                No necesitas un ordenador. Gestiona pedidos, cierra turnos de reserva y modifica tu carta desde nuestra App para Gerentes.
                            </p>

                            <ul className="space-y-4">
                                <li className="flex items-center gap-3 text-slate-300">
                                    <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-emerald-400">
                                        <Check className="w-5 h-5" />
                                    </div>
                                    <span>Notificaciones push de nuevos pedidos</span>
                                </li>
                                <li className="flex items-center gap-3 text-slate-300">
                                    <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-emerald-400">
                                        <Check className="w-5 h-5" />
                                    </div>
                                    <span>Pausa productos agotados en 1 clic</span>
                                </li>
                                <li className="flex items-center gap-3 text-slate-300">
                                    <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-emerald-400">
                                        <Check className="w-5 h-5" />
                                    </div>
                                    <span>Gestiona reservas en tiempo real</span>
                                </li>
                            </ul>

                            <div className="flex gap-4 pt-4">
                                <button className="px-6 py-3 bg-white text-slate-900 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-100 transition-colors">
                                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path d="M17.65 1.5c-1.37 0-2.8.5-3.9 1.1A4.5 4.5 0 0 0 11.22 0c-1.8 0-3.17 1.35-3.17 3.5 0 2.2 1.6 4.05 3.5 4.05 1.45 0 2.7-.6 3.8-1.2.65-.35 1.1-.6 1.1-.6.6.9 1.45 2.15 1.45 3.75 0 3.3-2.65 5.95-6.55 5.95-1.9 0-3.35-.95-4.45-2.05-.2-.2-.55-.2-.75 0-.2.2-.2.55 0 .75 1.25 1.25 3 2.3 5.2 2.3 4.5 0 8.05-3.4 8.05-7.45 0-1.8-.8-3.3-2.1-4.45l-.15-.15c1.1.25 2.2.4 3.3.4 2.8 0 5.25-1.5 6.6-3.8-.5.2-1.05.35-1.65.35-2.15 0-3.95-1.45-3.95-3.65 0-.95.35-1.85.9-2.55-1.4-1.35-3.3-2.2-5.4-2.2zM6.9 20.15c2.3 0 4.15 1.85 4.15 4.15 0 2.3-1.85 4.15-4.15 4.15S2.75 26.6 2.75 24.3c0-2.3 1.85-4.15 4.15-4.15z" /></svg>
                                    App Store
                                </button>
                                <button className="px-6 py-3 bg-slate-800 text-white border border-slate-700 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-700 transition-colors">
                                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path d="M3.609 1.814L13.792 12 3.61 22.186a.912.912 0 01-1.246 0l-.305-.306a.91.91 0 010-1.267l8.47-8.613-8.47-8.613a.91.91 0 010-1.267l.305-.306a.912.912 0 011.245 0zM15.42 12l4.805 4.804c.732.732.732 1.92 0 2.652l-.305.305a1.868 1.868 0 01-2.652 0l-1.848-1.848L15.42 12zm0 0L20.07 7.35a1.868 1.868 0 012.652 0l.305.305c.732.732.732 1.92 0 2.652L15.42 12z" /></svg>
                                    Google Play
                                </button>
                            </div>
                        </div>

                        {/* Phone Mockup */}
                        <div className="lg:w-1/2 relative">
                            <div className="relative mx-auto border-gray-800 bg-gray-800 border-[14px] rounded-[2.5rem] h-[600px] w-[300px] shadow-2xl">
                                <div className="h-[32px] w-[3px] bg-gray-800 absolute -left-[17px] top-[72px] rounded-l-lg"></div>
                                <div className="h-[46px] w-[3px] bg-gray-800 absolute -left-[17px] top-[124px] rounded-l-lg"></div>
                                <div className="h-[46px] w-[3px] bg-gray-800 absolute -left-[17px] top-[178px] rounded-l-lg"></div>
                                <div className="h-[64px] w-[3px] bg-gray-800 absolute -right-[17px] top-[142px] rounded-r-lg"></div>
                                <div className="rounded-[2rem] overflow-hidden w-[272px] h-[572px] bg-white relative">
                                    {/* Screen Content Mockup */}
                                    <div className="bg-slate-50 w-full h-full p-4 space-y-4">
                                        <div className="flex justify-between items-center bg-white p-3 rounded-xl shadow-sm">
                                            <span className="font-bold text-slate-800">Pedidos Activos</span>
                                            <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full animate-pulse">3 nuevos</span>
                                        </div>
                                        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                                            <div className="flex justify-between mb-2">
                                                <span className="font-bold text-slate-900">Mesa 4</span>
                                                <span className="text-orange-500 font-bold">45,50 €</span>
                                            </div>
                                            <div className="space-y-1 text-sm text-slate-500">
                                                <p>2x Hamburguesa Trufada</p>
                                                <p>1x Patatas Bravas</p>
                                                <p>2x Coca-Cola Zero</p>
                                            </div>
                                            <button className="w-full mt-3 py-2 bg-emerald-500 text-white rounded-lg font-bold text-sm">Aceptar Pedido</button>
                                        </div>
                                        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 opacity-50">
                                            <div className="flex justify-between mb-2">
                                                <span className="font-bold text-slate-900">Delivery #892</span>
                                                <span className="text-slate-400 font-bold">22,00 €</span>
                                            </div>
                                            <div className="space-y-1 text-sm text-slate-500">
                                                <p>1x Pizza Carbonara</p>
                                            </div>
                                            <div className="w-full mt-3 text-center text-xs text-green-600 font-bold uppercase">Entregado</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
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
                            plan="Starter (Piloto)"
                            price="0"
                            desc="Para validar tu idea sin coste"
                            features={["Carta Digital QR", "Tu Web Personalizada", "Max. 30 pedidos/mes", "Marca de agua PideLocal"]}
                        />

                        {/* MEDIUM */}
                        <PricingCard
                            plan="Medium"
                            price="29,90"
                            desc="Para negocios que arrancan"
                            highlight
                            features={["Todo lo de Starter", "Pedidos Ilimitados", "Sin marca de agua", "Gestión de Reservas"]}
                        />

                        {/* PREMIUM */}
                        <PricingCard
                            plan="Premium"
                            price="49,90"
                            desc="La potencia total"
                            features={["Todo lo de Medium", "Pagos Online (Stripe)", "Marketing Automático", "Soporte Prioritario", "Estadísticas Avanzadas"]}
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
