"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Script from "next/script";
import { isPromotionActive, type Promotion as PromotionRule } from "@/lib/promotions";
import { useReservation } from "@/context/ReservationContext";
import { MapPin, Phone, Mail, Clock, Instagram, Facebook, Globe, ArrowRight, Star, ChefHat, Utensils, Map as MapIcon, ExternalLink, ShieldCheck } from "lucide-react";

// NOTE: This component contains all the logic that was previously in src/app/page.tsx
// It represents the landing page of a SPECIFIC RESTAURANT (Tenant).

// Defaults
const INFO_DEFAULT = {
    nombre: "Pizzeria napolitana",
    slogan: "La tradición de Nápoles en cada porción.",
    telefono: "+34 600 000 000",
    email: "info@mirestaurante.com",
    whatsapp: "+34600000000",
    direccion: "Calle Mayor 123, 30001 Murcia, España",
    logoUrl: "/images/fachada.png",
    fachadaUrl: "/images/fachada.png",
    menuPath: "/menu",
};
const COORDS_DEFAULT = { lat: 37.9861, lng: -1.1303, zoom: 16 };

type Tramo = { abre: string; cierra: string };
type Dia = "lunes" | "martes" | "miercoles" | "jueves" | "viernes" | "sabado" | "domingo";
type Horarios = Record<Dia, Tramo[]>;
const HORARIOS_DEFAULT: Horarios = {
    lunes: [],
    martes: [{ abre: "12:30", cierra: "16:00" }, { abre: "19:00", cierra: "23:30" }],
    miercoles: [{ abre: "12:30", cierra: "16:00" }, { abre: "19:00", cierra: "23:30" }],
    jueves: [{ abre: "12:30", cierra: "16:00" }, { abre: "19:00", cierra: "23:30" }],
    viernes: [{ abre: "12:30", cierra: "16:00" }, { abre: "19:00", cierra: "23:30" }],
    sabado: [{ abre: "12:30", cierra: "16:00" }, { abre: "19:00", cierra: "23:30" }],
    domingo: [{ abre: "12:30", cierra: "16:00" }, { abre: "19:00", cierra: "23:30" }],
};
const DAY_LABEL: Record<Dia, string> = { lunes: "Lunes", martes: "Martes", miercoles: "Miércoles", jueves: "Jueves", viernes: "Viernes", sabado: "Sábado", domingo: "Domingo" };

function diaSemanaES(date = new Date()): Dia {
    const dias: Dia[] = ["domingo", "lunes", "martes", "miercoles", "jueves", "viernes", "sabado"];
    return dias[date.getDay()];
}

function estaAbiertoAhora(date: Date, horarios: Horarios) {
    const tramos = horarios[diaSemanaES(date)] || [];
    if (tramos.length === 0) return false;
    const minutos = date.getHours() * 60 + date.getMinutes();
    return tramos.some((t: any) => {
        const abre = t.abre ?? t.open; const cierra = t.cierra ?? t.close;
        if (!abre || !cierra) return false;
        const [ha, ma] = String(abre).split(":").map(Number);
        const [hc, mc] = String(cierra).split(":").map(Number);
        let start = ha * 60 + ma; let end = hc * 60 + mc;
        let current = minutos;
        if (end <= start) { end += 24 * 60; if (current < start) current += 24 * 60; }
        return current >= start && current <= end;
    });
}

function formatearTramos(tramos: Tramo[]) {
    if (!tramos || tramos.length === 0) return "Cerrado";
    return tramos.map((t: any) => { const a = t.abre ?? t.open; const c = t.cierra ?? t.close; return a && c ? `${a}-${c}` : null; }).filter(Boolean).join(" / ");
}

function jsonLd(info: typeof INFO_DEFAULT, horarios: Horarios, coords: typeof COORDS_DEFAULT) {
    const out: any = {
        "@context": "https://schema.org", "@type": "Restaurant",
        name: info.nombre, telephone: (info as any).telefono, email: (info as any).email,
        url: typeof window !== "undefined" ? window.location.origin : undefined,
        image: info.fachadaUrl,
        openingHoursSpecification: Object.entries(horarios).flatMap(([dia, tr]) => (tr as Tramo[]).map((t) => ({ "@type": "OpeningHoursSpecification", dayOfWeek: dia, opens: t.abre, closes: t.cierra }))),
        geo: { "@type": "GeoCoordinates", latitude: coords.lat, longitude: coords.lng },
    };
    if ((info as any).direccion) out.address = { "@type": "PostalAddress", streetAddress: (info as any).direccion, addressCountry: "ES" };
    return out;
}

export default function TenantLanding() {
    const [cfg, setCfg] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [highlightPromotion, setHighlightPromotion] = useState<PromotionRule | null>(null);
    const { openReservationModal } = useReservation();

    useEffect(() => {
        (async () => {
            try {
                const tenant = new URLSearchParams(window.location.search).get("tenant");
                const url = tenant ? `/api/settings/home?tenant=${encodeURIComponent(tenant)}` : "/api/settings/home";
                const r = await fetch(url, { cache: "no-store" });
                const j = await r.json();
                if (j?.ok && j?.data) setCfg(j.data);
            } catch (e) { console.error(e); } finally { setLoading(false); }
        })();
    }, []);

    useEffect(() => {
        (async () => {
            try {
                const tenant = new URLSearchParams(window.location.search).get("tenant");
                const url = tenant ? `/api/promotions?tenant=${encodeURIComponent(tenant)}` : "/api/promotions";
                const res = await fetch(url, { cache: "no-store" });
                const j = await res.json().catch(() => ({}));
                if (res.ok && Array.isArray(j?.promotions)) {
                    const now = new Date();
                    const promos = (j.promotions as PromotionRule[]).filter((p) => isPromotionActive(p, now));
                    setHighlightPromotion(promos[0] || null);
                } else { setHighlightPromotion(null); }
            } catch { setHighlightPromotion(null); }
        })();
    }, []);

    const [menuUrl, setMenuUrl] = useState(INFO_DEFAULT.menuPath);
    useEffect(() => {
        if (typeof window !== "undefined") {
            const t = new URLSearchParams(window.location.search).get("tenant");
            if (t) setMenuUrl(`${INFO_DEFAULT.menuPath}?tenant=${t}`);
        }
    }, []);

    const INFO = useMemo(() => ({
        nombre: cfg?.business?.name || INFO_DEFAULT.nombre,
        slogan: cfg?.business?.slogan || INFO_DEFAULT.slogan,
        telefono: cfg?.contact?.phone || INFO_DEFAULT.telefono,
        email: cfg?.contact?.email || null,
        whatsapp: cfg?.contact?.whatsapp || null,
        direccion: cfg?.contact?.address || null,
        logoUrl: cfg?.images?.logo || INFO_DEFAULT.logoUrl,
        fachadaUrl: cfg?.images?.hero || INFO_DEFAULT.fachadaUrl,
        menuPath: cfg?.slug ? `${INFO_DEFAULT.menuPath}?tenant=${cfg.slug}` : menuUrl,
    }), [cfg, menuUrl]);

    const HORARIOS_USED: Horarios = useMemo(() => {
        const h = cfg?.hours as any;
        if (!h) return HORARIOS_DEFAULT;
        const norm = (arr: any[]) => (Array.isArray(arr) ? arr : []).map((r) => ({ abre: r.abre ?? r.open, cierra: r.cierra ?? r.close })).filter((r) => r.abre && r.cierra);
        return {
            lunes: norm(h.monday), martes: norm(h.tuesday), miercoles: norm(h.wednesday), jueves: norm(h.thursday), viernes: norm(h.friday), sabado: norm(h.saturday), domingo: norm(h.sunday),
        } as Horarios;
    }, [cfg]);

    const abierto = useMemo(() => estaAbiertoAhora(new Date(), HORARIOS_USED), [HORARIOS_USED]);

    const COORDS_USED = useMemo(() => {
        const c = (cfg as any)?.coords;
        if (c && typeof c.lat === "number" && typeof c.lng === "number") return { lat: Number(c.lat), lng: Number(c.lng), zoom: COORDS_DEFAULT.zoom };
        return COORDS_DEFAULT;
    }, [cfg?.coords]);

    const mapaSrc = useMemo(() => {
        if (cfg?.mapUrl) return String(cfg.mapUrl);
        return `https://maps.google.com/maps?q=${COORDS_USED.lat},${COORDS_USED.lng}&z=${COORDS_USED.zoom}&output=embed`;
    }, [cfg?.mapUrl, COORDS_USED]);

    const ldData = useMemo(() => jsonLd(INFO, HORARIOS_USED, COORDS_USED), [INFO, HORARIOS_USED, COORDS_USED]);

    if (loading) {
        return (
            <div className="fixed inset-0 bg-white flex items-center justify-center z-50">
                <div className="flex flex-col items-center gap-4 animate-in fade-in zoom-in-95 duration-500">
                    <div className="w-16 h-16 rounded-full border-4 border-slate-100 border-t-slate-800 animate-spin" />
                </div>
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-slate-50 relative selection:bg-rose-100 selection:text-rose-900">
            {ldData && <Script id="ld-localbusiness" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ldData) }} />}

            {/* --- HERO SECTION --- */}
            <section className="relative h-[50vh] md:h-[85vh] min-h-[400px] md:min-h-[600px] w-full flex items-center justify-center overflow-hidden bg-slate-900">
                {/* 1. Blurred Background Layer (Mobile Only Fills) */}
                <div className="absolute inset-0 z-0 md:hidden">
                    <img
                        src={INFO.fachadaUrl}
                        alt="Ambient Background"
                        className="w-full h-full object-cover blur-3xl opacity-60 scale-125"
                    />
                </div>

                {/* 2. Main Background Layer */}
                <div className="absolute inset-0 z-0">
                    <img
                        src={INFO.fachadaUrl}
                        alt="Hero Background"
                        className="w-full h-full object-contain md:object-cover object-center scale-100 md:scale-105 animate-in fade-in duration-1000"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent opacity-90" />
                </div>

                {/* Content Layer */}
                {/* Content Layer */}
                <div className="relative z-10 flex flex-col items-center text-center px-4 max-w-4xl mx-auto space-y-8 animate-in slide-in-from-bottom-8 fade-in duration-1000">

                    <div className="space-y-4">
                        <h1 className="text-4xl md:text-6xl font-black text-white leading-tight tracking-tight drop-shadow-lg">
                            {INFO.nombre}
                        </h1>
                        <p className="text-lg md:text-2xl text-slate-200 font-light tracking-wide max-w-2xl mx-auto border-t border-white/10 pt-4">
                            {INFO.slogan}
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 pt-4">
                        <Link href={INFO.menuPath} className="group relative px-8 py-4 bg-white text-slate-900 rounded-full font-bold text-lg shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 flex items-center gap-2">
                            Ver Carta
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </Link>
                        {cfg?.reservations?.enabled && (
                            <button onClick={openReservationModal} className="px-8 py-4 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-full font-bold text-lg hover:bg-white/20 transition-all duration-300">
                                Reserva
                            </button>
                        )}
                    </div>

                    {/* Status Pill */}
                    <div className={`mt-8 inline-flex items-center gap-2 px-4 py-1.5 rounded-full backdrop-blur-md border border-white/10 ${abierto ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'}`}>
                        <div className={`w-2 h-2 rounded-full ${abierto ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
                        <span className="text-sm font-medium uppercase tracking-widest">{abierto ? "Abierto Ahora" : "Cerrado"}</span>
                    </div>
                </div>
            </section>

            {/* --- PROMOTION BANNER --- */}
            {highlightPromotion && (
                <div className="bg-amber-400 text-amber-950 px-4 py-3 text-center font-medium relative z-20 shadow-lg">
                    <span className="inline-block animate-bounce mr-2">🔥</span>
                    <span>¡Hoy: <strong>{highlightPromotion.name}</strong>!</span>
                    <span className="opacity-80 mx-2 text-sm hidden sm:inline">{highlightPromotion.description}</span>
                    <Link href={INFO.menuPath} className="underline hover:no-underline ml-2 text-sm uppercase font-bold tracking-wide">Ver Promoción</Link>
                </div>
            )}

            {/* --- INFO BENTO GRID --- */}
            <section id="bento-grid" className="py-20 px-4 bg-white border-t border-slate-100">
                <div className="max-w-6xl mx-auto space-y-12">
                    <div className="text-center space-y-2">
                        <h2 className="text-3xl font-black text-slate-900">Información & Visita</h2>
                        <p className="text-slate-500">Todo lo que necesitas para encontrarnos.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 h-auto md:h-[600px]">

                        {/* 1. Map Card (Large) */}
                        <div className="md:col-span-2 md:row-span-2 rounded-3xl overflow-hidden shadow-sm dark-border relative group">
                            <iframe
                                title="Map"
                                src={mapaSrc}
                                className="w-full h-full grayscale-[0.3] group-hover:grayscale-0 transition-all duration-700"
                                loading="lazy"
                            />
                        </div>

                        {/* 2. Hours Card */}
                        <div className="md:col-span-1 md:row-span-2 bg-slate-900 rounded-3xl p-6 text-white flex flex-col shadow-xl">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-white/10 rounded-xl"><Clock className="w-6 h-6 text-emerald-400" /></div>
                                <h3 className="font-bold text-xl text-white">Horarios</h3>
                            </div>

                            <div className="flex-1 space-y-3 overflow-y-auto custom-scrollbar pr-2">
                                {(Object.keys(HORARIOS_USED) as Dia[]).map((d) => {
                                    const isToday = diaSemanaES() === d;
                                    return (
                                        <div key={d} className={`flex justify-between items-start py-2 border-b border-white/10 ${isToday ? 'bg-white/5 -mx-2 px-2 rounded-lg' : ''}`}>
                                            <span className={`text-sm ${isToday ? 'font-bold text-white' : 'text-slate-400'}`}>{DAY_LABEL[d]}</span>
                                            <div className="flex flex-col items-end gap-0.5">
                                                {formatearTramos(HORARIOS_USED[d]).split(' / ').map((tramo, idx) => (
                                                    <span key={idx} className={`text-xs font-mono whitespace-nowrap ${isToday ? 'text-emerald-400' : 'text-slate-200'}`}>
                                                        {tramo}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            <div className="mt-6 pt-4 border-t border-white/10 text-center">
                                <div className={`text-sm font-bold ${abierto ? 'text-emerald-400' : 'text-rose-400'}`}>
                                    ● {abierto ? 'ESTAMOS ABIERTOS' : 'AHORA CERRADO'}
                                </div>
                            </div>
                        </div>

                        {/* 3. Contact Card */}
                        <div className="md:col-span-1 rounded-3xl bg-emerald-50 p-6 flex flex-col justify-center gap-4 hover:shadow-md transition-shadow">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <Phone className="w-5 h-5 text-emerald-600" /> Contacto
                            </h3>
                            <div className="space-y-3">
                                {INFO.telefono && (
                                    <a href={`tel:${INFO.telefono}`} className="flex items-center gap-3 p-3 bg-white rounded-xl shadow-sm hover:scale-105 transition-transform">
                                        <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold">T</div>
                                        <span className="font-medium text-slate-700">{INFO.telefono}</span>
                                    </a>
                                )}
                                {INFO.whatsapp && (
                                    <a href={`https://wa.me/${INFO.whatsapp.replace(/[^0-9]/g, '')}`} className="flex items-center gap-3 p-3 bg-white rounded-xl shadow-sm hover:scale-105 transition-transform">
                                        <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-bold">W</div>
                                        <span className="font-medium text-slate-700">WhatsApp</span>
                                    </a>
                                )}
                            </div>
                        </div>

                        {/* 4. Social Card */}
                        <div className="md:col-span-1 rounded-3xl bg-slate-100 p-6 flex flex-col justify-between hover:shadow-md transition-shadow">
                            <div>
                                <h3 className="font-bold text-slate-900 mb-1">Síguenos</h3>
                                <p className="text-xs text-slate-500">No te pierdas nuestras novedades.</p>
                            </div>
                            <div className="flex gap-2 mt-4">
                                {cfg?.social?.instagram && (
                                    <a href={cfg.social.instagram} target="_blank" className="flex-1 bg-white p-3 rounded-xl flex items-center justify-center shadow-sm hover:text-pink-600 transition-colors">
                                        <Instagram className="w-6 h-6" />
                                    </a>
                                )}
                                {cfg?.social?.facebook && (
                                    <a href={cfg.social.facebook} target="_blank" className="flex-1 bg-white p-3 rounded-xl flex items-center justify-center shadow-sm hover:text-blue-600 transition-colors">
                                        <Facebook className="w-6 h-6" />
                                    </a>
                                )}
                                {cfg?.social?.web && (
                                    <a href={cfg.social.web} target="_blank" className="flex-1 bg-white p-3 rounded-xl flex items-center justify-center shadow-sm hover:text-emerald-600 transition-colors">
                                        <Globe className="w-6 h-6" />
                                    </a>
                                )}
                            </div>
                        </div>

                    </div>
                </div>
            </section>

            {/* --- STORY SECTION --- */}
            <section className="py-20 md:py-32 px-4 max-w-4xl mx-auto text-center">
                <div className="space-y-8">
                    <div className="flex justify-center">
                        <div className="inline-flex items-center gap-2 text-emerald-600 font-bold uppercase tracking-widest text-xs bg-emerald-50 px-3 py-1 rounded-full">
                            <ChefHat className="w-4 h-4" />
                            Nuestra Historia
                        </div>
                    </div>

                    <h2 className="text-4xl md:text-5xl font-black text-slate-900 leading-tight">
                        Más que comida,<br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500">una experiencia.</span>
                    </h2>

                    <div className="space-y-4 text-slate-600 text-lg leading-relaxed max-w-2xl mx-auto">
                        <p>
                            {cfg?.business?.description || (
                                <>En <strong>{INFO.nombre}</strong> no solo cocinamos, revivimos tradiciones. Cada plato es un tributo a la autenticidad, preparado con ingredientes seleccionados y pasión artesanal.</>
                            )}
                        </p>
                        <p>
                            Desde nuestro horno hasta tu mesa, buscamos la excelencia en cada detalle. Ven a descubrir por qué no somos solo un restaurante, somos tu próximo lugar favorito.
                        </p>
                    </div>

                    <div className="pt-4 flex items-center justify-center gap-8 text-slate-500">
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-slate-100 rounded-full"><Star className="w-5 h-5 text-amber-500 fill-amber-500" /></div>
                            <span className="text-sm font-medium">Calidad Premium</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-slate-100 rounded-full"><Utensils className="w-5 h-5 text-slate-700" /></div>
                            <span className="text-sm font-medium">Sabor Auténtico</span>
                        </div>
                    </div>
                </div>
            </section>
        </main>
    );
}
