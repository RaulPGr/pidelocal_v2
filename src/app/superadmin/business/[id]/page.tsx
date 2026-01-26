import { getBusinessMembers } from "../../actions";
import MembersManager from "./MembersManager";

// ... existing imports

// function removed

export const dynamic = "force-dynamic";

async function getBusinessDetails(id: string) {
    // 1. Basic Info
    const { data: biz, error } = await supabaseAdmin
        .from("businesses")
        .select("*")
        .eq("id", id)
        .single();

    if (error || !biz) return null;

    // 2. Orders Stats
    const { data: orders } = await supabaseAdmin
        .from("orders")
        .select("id, total_cents, created_at, customer_email, status")
        .eq("business_id", id)
        .order("created_at", { ascending: false });

    const totalOrders = orders?.length || 0;
    const totalRevenue = orders?.filter(o => ["confirmed", "delivered", "ready", "preparing"].includes(o.status))
        .reduce((sum, o) => sum + (o.total_cents || 0), 0) || 0;

    // Unique Customers logic
    const uniqueEmails = new Set(orders?.map(o => o.customer_email).filter(Boolean));
    const totalCustomers = uniqueEmails.size;

    // 3. Reservations
    const { count: totalReservations } = await supabaseAdmin
        .from("reservations")
        .select("*", { count: "exact", head: true })
        .eq("business_id", id);

    // 4. Page Visits (from our new table)
    const { count: totalVisits } = await supabaseAdmin
        .from("business_page_visits")
        .select("*", { count: "exact", head: true })
        .eq("business_id", id);

    return {
        biz,
        stats: {
            totalOrders,
            totalRevenue,
            totalCustomers,
            totalReservations: totalReservations || 0,
            totalVisits: totalVisits || 0
        },
        recentOrders: orders?.slice(0, 10) || []
    };
}

export default async function BusinessDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const data = await getBusinessDetails(id);

    if (!data) return <div className="p-8">Negocio no encontrado</div>;

    const { biz, stats, recentOrders } = data;
    const formatCurrency = (cents: number) =>
        new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(cents / 100);

    return (
        <div className="min-h-screen bg-slate-50/50 pb-20">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 sticky top-0 z-10 px-6 py-4 shadow-sm">
                <div className="max-w-7xl mx-auto flex items-center gap-4">
                    <Link href="/superadmin" className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                        <ArrowLeft className="w-5 h-5 text-slate-600" />
                    </Link>
                    <div>
                        <h1 className="text-xl font-bold text-slate-900">{biz.name}</h1>
                        <p className="text-xs text-slate-500 font-mono">{biz.id}</p>
                    </div>
                    <div className="ml-auto flex items-center gap-2">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide border bg-slate-100 text-slate-600 border-slate-200`}>
                            {JSON.parse(JSON.stringify(biz.theme_config))?.subscription || "starter"}
                        </span>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">

                {/* KPI Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card title="Ingresos Totales" value={formatCurrency(stats.totalRevenue)} icon={CreditCard} color="emerald" />
                    <Card title="Pedidos Históricos" value={stats.totalOrders} icon={ShoppingBag} color="blue" />
                    <Card title="Visitas Página" value={stats.totalVisits} icon={Eye} color="violet" />
                    <Card title="Clientes Únicos" value={stats.totalCustomers} icon={Users} color="amber" />
                    <Card title="Reservas" value={stats.totalReservations} icon={Calendar} color="rose" />
                </div>

                {/* Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Orders (Takes 2/3) */}
                    <div className="lg:col-span-2 space-y-8">
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="p-5 border-b border-slate-100">
                                <h2 className="font-bold text-slate-800">Últimos Pedidos</h2>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-slate-100">
                                    <thead className="bg-slate-50/50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Fecha</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Cliente</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Total</th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Estado</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {recentOrders.map((o: any) => (
                                            <tr key={o.id}>
                                                <td className="px-6 py-3 text-sm text-slate-500">
                                                    {new Date(o.created_at).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-3 text-sm text-slate-900 font-medium">
                                                    {o.customer_email}
                                                </td>
                                                <td className="px-6 py-3 text-sm text-slate-600">
                                                    {formatCurrency(o.total_cents)}
                                                </td>
                                                <td className="px-6 py-3 text-right">
                                                    <span className="text-xs px-2 py-1 rounded bg-slate-100 text-slate-600">
                                                        {o.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Members (Takes 1/3) */}
                    <div className="space-y-8">
                        <MembersManager businessId={biz.id} initialMembers={data.members || []} />
                    </div>
                </div>
            </div>
        </div>
    );
}

function Card({ title, value, icon: Icon, color }: any) {
    const colors: any = {
        emerald: "bg-emerald-50 text-emerald-600",
        blue: "bg-blue-50 text-blue-600",
        violet: "bg-violet-50 text-violet-600",
        amber: "bg-amber-50 text-amber-600",
        rose: "bg-rose-50 text-rose-600",
    };
    return (
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-start mb-4">
                <div className={`p-2 rounded-lg ${colors[color] || colors.blue}`}>
                    <Icon className="w-5 h-5" />
                </div>
            </div>
            <h3 className="text-2xl font-bold text-slate-900">{value}</h3>
            <p className="text-sm text-slate-500">{title}</p>
        </div>
    );
}
