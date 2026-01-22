"use client";

import { useEffect, useMemo, useState } from "react";
import { useAdminAccess } from "@/context/AdminAccessContext";
import {
    BarChart3,
    TrendingUp,
    Calendar,
    ShoppingBag,
    CheckCircle2,
    XCircle,
    CreditCard,
    Users,
    Clock,
    ListFilter
} from "lucide-react";
import clsx from "clsx";

type RangeKey = "today" | "7d" | "30d" | "month" | "all";
const RANGES: { key: RangeKey; label: string }[] = [
    { key: "today", label: "Hoy" },
    { key: "7d", label: "7 Días" },
    { key: "30d", label: "30 Días" },
    { key: "month", label: "Este Mes" },
    { key: "all", label: "Histórico" },
];

function startEndForRange(key: RangeKey) {
    const now = new Date();
    let start: Date | null = null;
    const end = new Date(now);

    if (key === "today") start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    else if (key === "7d") { const s = new Date(now); s.setDate(s.getDate() - 6); start = new Date(s.getFullYear(), s.getMonth(), s.getDate(), 0, 0, 0); }
    else if (key === "30d") { const s = new Date(now); s.setDate(s.getDate() - 29); start = new Date(s.getFullYear(), s.getMonth(), s.getDate(), 0, 0, 0); }
    else if (key === "month") start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
    else if (key === "all") start = null;
    return { start, end };
}

function formatEur(cents: number) {
    try { return (cents / 100).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' }); }
    catch { return `${(cents / 100).toFixed(2)} €`; }
}

type Dataset = {
    ordersCount: number;
    deliveredCount: number;
    cancelledCount: number;
    revenueCents: number;
    aovCents: number;
    topProducts: Array<{ key: string; name: string; qty: number; cents: number }>;
    worstProducts: Array<{ key: string; name: string; qty: number; cents: number }>;
    byWeekday: Array<{ weekday: number; cents: number; count: number }>;
    byHour: Array<{ hour: number; cents: number; count: number }>;
    customers: Array<{ key: string; name: string; count: number; cents: number; avgCents: number }>;
    newVsReturning: { newCount: number; returningCount: number };
    monthly: Array<{ ym: string; cents: number; count: number }>;
    byCategory: Array<{ id: number | 'nocat'; name: string; cents: number; qty: number }>;
};

export default function StatsClient() {
    const { plan, isSuper } = useAdminAccess();

    // Premium Check handled by UpgradeGate in page.tsx, but safe double-check
    const limited = plan !== "premium" && !isSuper;
    if (limited) return null;

    const [range, setRange] = useState<RangeKey>('7d');
    const [{ start, end }, setDates] = useState(() => startEndForRange('7d'));
    const [data, setData] = useState<Dataset | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => { setDates(startEndForRange(range)); }, [range]);

    async function fetchData() {
        setLoading(true);
        try {
            const url = new URL('/api/admin/stats', window.location.origin);
            if (start) url.searchParams.set('from', start.toISOString());
            if (end) url.searchParams.set('to', end.toISOString());

            const host = window.location.hostname;
            const parts = host.split('.');
            if (parts.length >= 3) {
                url.searchParams.set('tenant', parts[0].toLowerCase());
            }

            const r = await fetch(url.toString(), { cache: 'no-store' });
            const j = await r.json();
            if (!j?.ok) throw new Error(j?.message || 'Error');
            setData(j.data as Dataset);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => { void fetchData(); }, [start?.toISOString(), end?.toISOString()]);

    const kpis = useMemo(() => ({
        totalOrders: data?.ordersCount || 0,
        delivered: data?.deliveredCount || 0,
        cancelled: data?.cancelledCount || 0,
        revenueCents: data?.revenueCents || 0,
        aovCents: data?.aovCents || 0,
    }), [data]);

    const donut = useMemo(() => {
        const d = kpis.delivered, c = kpis.cancelled, p = Math.max(0, (kpis.totalOrders - d - c));
        const total = kpis.totalOrders || 1;
        return {
            delivered: d, processing: p, cancelled: c,
            pDelivered: (d / total) * 100, pProcessing: (p / total) * 100, pCancelled: (c / total) * 100
        };
    }, [kpis]);

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                        Estadísticas y Analítica
                    </h2>
                    <p className="text-slate-500 text-sm">Visualiza el rendimiento de tu negocio.</p>
                </div>

                <div className="flex bg-white p-1 rounded-xl shadow-sm border border-slate-200">
                    {RANGES.map((r) => (
                        <button
                            key={r.key}
                            onClick={() => setRange(r.key)}
                            className={clsx(
                                "px-3 py-1.5 text-xs font-bold rounded-lg transition-all",
                                r.key === range
                                    ? "bg-slate-900 text-white shadow-md shadow-slate-900/20"
                                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                            )}
                        >
                            {r.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* KPIs */}
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <KpiCard
                    title="Ingresos Totales"
                    value={formatEur(kpis.revenueCents)}
                    icon={CreditCard}
                    trend={`Ticket medio: ${formatEur(kpis.aovCents)}`}
                    color="emerald"
                />
                <KpiCard
                    title="Pedidos Totales"
                    value={kpis.totalOrders.toString()}
                    icon={ShoppingBag}
                    color="blue"
                />
                <KpiCard
                    title="Entregados"
                    value={kpis.delivered.toString()}
                    icon={CheckCircle2}
                    color="emerald"
                />
                <KpiCard
                    title="Cancelados"
                    value={kpis.cancelled.toString()}
                    icon={XCircle}
                    color="rose"
                />
            </section>

            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Ingresos Chart */}
                <div className="lg:col-span-2 glass-panel p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                            <BarChart3 className="w-5 h-5" />
                        </div>
                        <h3 className="font-bold text-slate-800">Evolución de Ingresos</h3>
                    </div>
                    {loading ? <Skeleton /> : (
                        <div className="h-64 flex items-end justify-between gap-2">
                            {data?.monthly.map((m) => {
                                const max = Math.max(...(data?.monthly.map(x => x.cents) || []), 1);
                                const h = Math.round((m.cents / max) * 100);
                                return (
                                    <div key={m.ym} className="flex-1 flex flex-col items-center justify-end h-full group relative">
                                        <div
                                            className="w-full max-w-[40px] bg-gradient-to-t from-emerald-500 to-emerald-400 rounded-t-lg transition-all group-hover:to-emerald-300 relative"
                                            style={{ height: `${h}%`, minHeight: '4px' }}
                                        >
                                            <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] py-1 px-2 rounded whitespace-nowrap z-10 pointer-events-none">
                                                {formatEur(m.cents)}
                                            </div>
                                        </div>
                                        <div className="text-[10px] text-slate-400 mt-2 font-medium bg-slate-50 px-1 rounded">
                                            {m.ym.split('-')[1]}/{m.ym.split('-')[0].slice(2)}
                                        </div>
                                    </div>
                                )
                            })}
                            {(data?.monthly || []).length === 0 && (
                                <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm">
                                    No hay datos en este periodo
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Donut Chart */}
                <div className="glass-panel p-6 flex flex-col">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                            <TrendingUp className="w-5 h-5" />
                        </div>
                        <h3 className="font-bold text-slate-800">Estado de Pedidos</h3>
                    </div>
                    {loading ? <Skeleton /> : (
                        <div className="flex-1 flex flex-col items-center justify-center">
                            <DonutState
                                delivered={donut.delivered}
                                processing={donut.processing}
                                cancelled={donut.cancelled}
                                pDelivered={donut.pDelivered}
                                pProcessing={donut.pProcessing}
                                pCancelled={donut.pCancelled}
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Rankings Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <GlassCard title="Productos Top Ventas" icon={ShoppingBag}>
                    {loading ? <Skeleton /> : <BarH data={(data?.topProducts || []).map(p => ({ label: p.name, value: p.qty }))} suffix=" uds" color="emerald" />}
                </GlassCard>

                <GlassCard title="Productos Menos Vendidos" icon={ListFilter}>
                    {loading ? <Skeleton /> : <BarH data={(data?.worstProducts || []).map(p => ({ label: p.name, value: p.qty }))} suffix=" uds" color="amber" />}
                </GlassCard>

                <GlassCard title="Ventas por Día" icon={Calendar}>
                    {loading ? <Skeleton /> : <BarH data={(data?.byWeekday || []).map(w => ({ label: ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'][w.weekday], value: w.cents / 100 }))} prefix="€ " color="indigo" />}
                </GlassCard>

                <GlassCard title="Hora Punta" icon={Clock}>
                    {loading ? <Skeleton /> : <BarH data={(data?.byHour || []).map(h => ({ label: `${String(h.hour).padStart(2, '0')}:00`, value: h.count }))} suffix=" pedidos" color="pink" />}
                </GlassCard>
            </div>

            {/* Clients & Categories */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 glass-panel p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-violet-50 rounded-lg text-violet-600">
                            <Users className="w-5 h-5" />
                        </div>
                        <h3 className="font-bold text-slate-800">Clientes VIP</h3>
                    </div>
                    {loading ? <Skeleton /> : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-slate-400 uppercase bg-slate-50/50">
                                    <tr>
                                        <th className="px-4 py-2 font-medium">Cliente</th>
                                        <th className="px-4 py-2 font-medium text-right">Pedidos</th>
                                        <th className="px-4 py-2 font-medium text-right">Total Gastado</th>
                                        <th className="px-4 py-2 font-medium text-right">Ticket Medio</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {data?.customers.slice(0, 5).map((c) => (
                                        <tr key={c.key} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-4 py-3 font-medium text-slate-900">{c.name}</td>
                                            <td className="px-4 py-3 text-right text-slate-600">{c.count}</td>
                                            <td className="px-4 py-3 text-right font-bold text-emerald-600">{formatEur(c.cents)}</td>
                                            <td className="px-4 py-3 text-right text-slate-500">{formatEur(c.avgCents)}</td>
                                        </tr>
                                    ))}
                                    {(!data?.customers || data.customers.length === 0) && (
                                        <tr><td colSpan={4} className="p-4 text-center text-slate-400 italic">No hay datos de clientes</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                <div className="space-y-6">
                    <GlassCard title="Fidelización" icon={Users}>
                        {loading ? <Skeleton /> : (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                                    <span className="text-emerald-800 font-medium">Nuevos</span>
                                    <span className="text-xl font-bold text-emerald-700">{data?.newVsReturning.newCount ?? 0}</span>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-xl border border-blue-100">
                                    <span className="text-blue-800 font-medium">Recurrentes</span>
                                    <span className="text-xl font-bold text-blue-700">{data?.newVsReturning.returningCount ?? 0}</span>
                                </div>
                            </div>
                        )}
                    </GlassCard>

                    <GlassCard title="Por Categoría" icon={ListFilter}>
                        {loading ? <Skeleton /> : <BarH data={(data?.byCategory || []).slice(0, 5).map(c => ({ label: c.name, value: c.cents / 100 }))} prefix="€ " color="orange" />}
                    </GlassCard>
                </div>
            </div>

        </div>
    );
}

// --- Components ---

function GlassCard({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) {
    return (
        <div className="glass-panel p-6 flex flex-col h-full">
            <div className="flex items-center gap-3 mb-4 pb-2 border-b border-slate-50">
                <div className="p-2 bg-slate-100 rounded-lg text-slate-600">
                    <Icon className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wide">{title}</h3>
            </div>
            <div className="flex-1">{children}</div>
        </div>
    );
}

function KpiCard({ title, value, icon: Icon, trend, color = 'blue' }: { title: string; value: string; icon: any; trend?: string; color?: 'blue' | 'emerald' | 'rose' | 'amber' }) {
    const colors = {
        blue: "text-blue-600 bg-blue-50",
        emerald: "text-emerald-600 bg-emerald-50",
        rose: "text-rose-600 bg-rose-50",
        amber: "text-amber-600 bg-amber-50",
    };

    return (
        <div className="glass-panel p-5 relative overflow-hidden group">
            <div className="flex justify-between items-start mb-2">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{title}</p>
                <div className={clsx("p-2 rounded-lg transition-colors", colors[color])}>
                    <Icon className="w-5 h-5" />
                </div>
            </div>
            <div className="text-3xl font-bold text-slate-900 tracking-tight">{value}</div>
            {trend && <div className="text-xs font-medium text-emerald-600 mt-2 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> {trend}
            </div>}
        </div>
    );
}

function Skeleton() {
    return <div className="w-full h-32 animate-pulse bg-slate-100 rounded-xl" />;
}

function DonutState({ delivered, processing, cancelled, pDelivered, pProcessing, pCancelled }: any) {
    // Pure CSS Conic Gradient for performance
    const grad = `conic-gradient(
        #10b981 0% ${pDelivered}%, 
        #3b82f6 0 ${pDelivered + pProcessing}%, 
        #f43f5e 0 ${Math.min(100, pDelivered + pProcessing + pCancelled)}%
    )`;

    return (
        <div className="flex flex-col sm:flex-row items-center gap-8">
            <div className="relative w-40 h-40 rounded-full flex items-center justify-center shadow-inner" style={{ background: grad }}>
                <div className="w-28 h-28 bg-white rounded-full shadow-sm flex flex-col items-center justify-center">
                    <span className="text-xs text-slate-400 font-bold uppercase">Total</span>
                    <span className="text-2xl font-bold text-slate-900">{delivered + processing + cancelled}</span>
                </div>
            </div>
            <div className="space-y-3 w-full max-w-[200px]">
                <Legend color="bg-emerald-500" label="Entregados" value={delivered} pct={pDelivered} />
                <Legend color="bg-blue-500" label="En proceso" value={processing} pct={pProcessing} />
                <Legend color="bg-rose-500" label="Cancelados" value={cancelled} pct={pCancelled} />
            </div>
        </div>
    );
}

function Legend({ color, label, value, pct }: { color: string; label: string; value: number; pct: number }) {
    return (
        <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
                <span className={`w-3 h-3 rounded-full ${color}`} />
                <span className="text-slate-600 font-medium">{label}</span>
            </div>
            <div className="text-right">
                <span className="font-bold text-slate-900">{value}</span>
                <span className="text-xs text-slate-400 ml-1">({Math.round(pct)}%)</span>
            </div>
        </div>
    );
}

function BarH({ data, prefix = "", suffix = "", color = "emerald" }: { data: { label: string; value: number }[]; prefix?: string; suffix?: string; color?: string }) {
    const max = Math.max(...data.map((d) => d.value), 1);
    const colorClasses: Record<string, string> = {
        emerald: "bg-emerald-500",
        blue: "bg-blue-500",
        indigo: "bg-indigo-500",
        rose: "bg-rose-500",
        amber: "bg-amber-500",
        pink: "bg-pink-500",
        orange: "bg-orange-500",
    };
    const barColor = colorClasses[color] || "bg-slate-500";

    if (data.length === 0) return <div className="text-sm text-slate-400 italic py-4">No hay datos suficientes.</div>;

    return (
        <div className="space-y-3">
            {data.map((d, i) => (
                <div key={i} className="group">
                    <div className="flex justify-between text-xs font-bold text-slate-500 mb-1">
                        <span className="truncate max-w-[70%]">{d.label}</span>
                        <span>{prefix}{typeof d.value === 'number' ? (Math.round(d.value * 100) / 100).toLocaleString('es-ES') : d.value}{suffix}</span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                            style={{ width: `${Math.round((d.value / max) * 100)}%` }}
                        />
                    </div>
                </div>
            ))}
        </div>
    );
}

