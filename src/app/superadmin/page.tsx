import { getBusinessesList, getGlobalStats } from "./actions";
import PlanSelector from "./PlanSelector";
import {
    LayoutDashboard,
    TrendingUp,
    Users,
    CreditCard,
    Search,
    ExternalLink,
    Settings,
    MoreHorizontal,
    Store
} from "lucide-react";
import Link from "next/link";
import DeleteBusinessButton from "./DeleteBusinessButton";

export const dynamic = "force-dynamic";

export default async function SuperAdminPage() {
    const [stats, businesses] = await Promise.all([
        getGlobalStats(),
        getBusinessesList()
    ]);

    const formatCurrency = (cents: number) => {
        return new Intl.NumberFormat('es-ES', {
            style: 'currency',
            currency: 'EUR',
            maximumFractionDigits: 0
        }).format(cents / 100);
    };

    return (
        <div className="min-h-screen bg-slate-50/50 pb-20">
            {/* Top Bar / Header */}
            <div className="bg-white border-b border-slate-200 sticky top-0 z-10 px-6 py-4 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-900 text-white rounded-lg">
                        <LayoutDashboard className="w-5 h-5" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 leading-none">SuperAdmin</h1>
                        <p className="text-xs text-slate-500 mt-1">Panel de Control Global</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-xs font-medium px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-100 flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        Sistema Operativo
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">

                {/* Global Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard
                        title="Ingresos Totales (Est.)"
                        value={formatCurrency(stats.totalRevenueCents)}
                        icon={TrendingUp}
                        trend="+12% vs mes anterior"
                        color="emerald"
                    />
                    <StatCard
                        title="Negocios Registrados"
                        value={stats.totalBusinesses.toString()}
                        icon={Store}
                        trend="Total histórico"
                        color="blue"
                    />
                    <StatCard
                        title="Pedidos Totales"
                        value={stats.totalOrders.toString()}
                        icon={CreditCard}
                        trend="Procesados correctamente"
                        color="violet"
                    />
                    <StatCard
                        title="Suscripciones Premium"
                        value={stats.activeSubscriptions.toString()} // Placeholder logic
                        icon={Users}
                        trend="Planes de pago activos"
                        color="amber"
                    />
                </div>

                {/* Main Content Area */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                    <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <h2 className="text-lg font-bold text-slate-800">Listado de Comercios</h2>
                            <p className="text-sm text-slate-500">Gestión y acceso a cuentas de clientes</p>
                        </div>
                        <div className="relative">
                            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Buscar negocio..."
                                className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-slate-200"
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-100">
                            <thead className="bg-slate-50/50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Negocio</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Plan</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Uso Mes</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Ventas (30d)</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {businesses.map((biz) => (
                                    <tr key={biz.id} className="hover:bg-slate-50/80 transition-colors group">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <Link href={`/superadmin/business/${biz.id}`} className="flex items-center group/link">
                                                <div className="h-10 w-10 flex-shrink-0 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden relative">
                                                    {biz.image_url ? (
                                                        <img src={biz.image_url} alt="" className="h-full w-full object-cover" />
                                                    ) : (
                                                        <div className="h-full w-full flex items-center justify-center text-slate-400">
                                                            <Store className="w-5 h-5" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-slate-900 group-hover/link:text-emerald-600 transition-colors">
                                                        {biz.name}
                                                    </div>
                                                    <div className="text-xs text-slate-500">{biz.email}</div>
                                                    <div className="text-xs text-indigo-500/80 font-mono mt-0.5">{biz.slug}.pidelocal.es</div>
                                                </div>
                                            </Link>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <PlanSelector
                                                businessId={biz.id}
                                                currentPlan={biz.subscription_plan}
                                            />
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                                            {(() => {
                                                const plan = (biz.subscription_plan || "").toLowerCase();
                                                const isStarter = plan.includes('starter') || plan.includes('piloto');
                                                const currentOptions = biz.orders_current_month || 0;

                                                if (isStarter) {
                                                    const limit = 30;
                                                    const percent = Math.min(100, (currentOptions / limit) * 100);
                                                    let color = "bg-emerald-500";
                                                    if (currentOptions >= limit) color = "bg-red-500";
                                                    else if (currentOptions >= 25) color = "bg-orange-500";

                                                    return (
                                                        <div className="flex flex-col gap-1 w-24">
                                                            <div className="flex justify-between text-xs font-bold text-slate-700">
                                                                <span>{currentOptions}</span>
                                                                <span className="text-slate-400">/ {limit}</span>
                                                            </div>
                                                            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                                                <div className={`h-full ${color}`} style={{ width: `${percent}%` }} />
                                                            </div>
                                                        </div>
                                                    );
                                                }
                                                return <span className="text-slate-400 text-xs">Ilimitado ({currentOptions})</span>;
                                            })()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 font-medium">
                                            {formatCurrency(biz.revenue_30d_cents)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex justify-end items-center gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                                <a
                                                    href={`/?tenant=${biz.slug}`}
                                                    target="_blank"
                                                    className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                                                    title="Ver Web Pública"
                                                >
                                                    <ExternalLink className="w-4 h-4" />
                                                </a>
                                                <span className="hidden lg:inline text-xs font-bold">Gestionar</span>
                                                <DeleteBusinessButton
                                                    businessId={biz.id}
                                                    businessName={biz.name}
                                                />
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {businesses.length === 0 && (
                        <div className="p-12 text-center text-slate-500">
                            No hay negocios registrados.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function StatCard({ title, value, icon: Icon, trend, color }: any) {
    const colors: any = {
        emerald: "text-emerald-600 bg-emerald-50 border-emerald-100",
        blue: "text-blue-600 bg-blue-50 border-blue-100",
        violet: "text-violet-600 bg-violet-50 border-violet-100",
        amber: "text-amber-600 bg-amber-50 border-amber-100",
    };
    const c = colors[color] || colors.blue;

    return (
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
                <div className={`p-2.5 rounded-lg ${c}`}>
                    <Icon className="w-5 h-5" />
                </div>
                {/* <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">+4.5%</span> */}
            </div>
            <div>
                <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
                <h3 className="text-2xl font-bold text-slate-900">{value}</h3>
                <p className="text-xs text-slate-400 mt-2">{trend}</p>
            </div>
        </div>
    );
}
