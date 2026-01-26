export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import DashboardCard from "@/components/admin/DashboardCard";
import { ShoppingBag, Users, Calendar, TrendingUp } from "lucide-react";
import Link from "next/link";
import { headers, cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import OnboardingWizard from "@/components/onboarding/OnboardingWizard";

async function getTenantSlug() {
  const cookieStore = await cookies();
  const tenant = cookieStore.get('x-tenant-slug')?.value;
  if (tenant) return tenant;

  const hdrs = await headers();
  const host = hdrs.get('host') || '';
  const parts = host.split('.');
  if (parts.length >= 3) return parts[0];
  return '';
}

async function getBusinessData() {
  const slug = await getTenantSlug();
  if (!slug) return null;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!; // Secure in Server Component
  const adminClient = createClient(url, key);

  const { data } = await adminClient
    .from('businesses')
    .select('*')
    .eq('slug', slug)
    .single();

  return data;
}

// Helper to get start/end of day in a robust way could be needed, but for now we rely on server time or simple truncated strings matching UI logic
async function getStats(slug: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const supabase = createClient(url, key);

  // 1. Get Business ID & Plan
  const { data: business } = await supabase
    .from('businesses')
    .select('id, theme_config')
    .eq('slug', slug)
    .single();

  if (!business) return { sales: 0, orders: 0, reservations: 0, customers: 0, monthlyOrders: 0, plan: 'starter' };

  const todayStr = new Date().toISOString().split('T')[0];
  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

  // 2. Counts
  const { count: ordersCount } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .eq('business_id', business.id)
    .gte('created_at', `${todayStr}T00:00:00`)
    .lt('created_at', `${todayStr}T23:59:59`)
    .neq('status', 'cancelled');

  // Monthly Orders (for limit)
  const { count: monthlyOrders } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .eq('business_id', business.id)
    .gte('created_at', startOfMonth);

  const { count: reservationsCount } = await supabase
    .from('reservations')
    .select('*', { count: 'exact', head: true })
    .eq('business_id', business.id)
    .gte('reserved_at', `${todayStr}T00:00:00`)
    .lt('reserved_at', `${todayStr}T23:59:59`)
    .in('status', ['pending', 'confirmed']);

  let plan = 'starter';
  try {
    const t = typeof business.theme_config === 'string' ? JSON.parse(business.theme_config) : business.theme_config;
    plan = t?.subscription || 'starter';
  } catch { }

  return {
    sales: 0,
    orders: ordersCount || 0,
    reservations: reservationsCount || 0,
    customers: 0,
    monthlyOrders: monthlyOrders || 0,
    plan: plan.toLowerCase().trim()
  };
}

async function getActivity(slug: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const supabase = createClient(url, key);

  const { data: business } = await supabase
    .from('businesses')
    .select('id')
    .eq('slug', slug)
    .single();

  if (!business) return [];

  // Fetch recent orders
  const { data: orders } = await supabase
    .from('orders')
    .select('id, created_at, customer_name, total')
    .eq('business_id', business.id)
    .order('created_at', { ascending: false })
    .limit(5);

  // Fetch recent reservations
  const { data: reservations } = await supabase
    .from('reservations')
    .select('id, created_at, customer_name, party_size')
    .eq('business_id', business.id)
    .order('created_at', { ascending: false })
    .limit(5);

  // Unite and Sort
  const combined = [
    ...(orders || []).map(o => ({ type: 'order', date: o.created_at, ...o })),
    ...(reservations || []).map(r => ({ type: 'reservation', date: r.created_at, ...r }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  return combined;
}

export default async function AdminDashboard(props: { searchParams: Promise<{ onboarding?: string }> }) {
  const sp = await props.searchParams;
  const forceOnboarding = sp.onboarding === 'true';

  const business = await getBusinessData();
  const showOnboarding = forceOnboarding || (business && (!business.logo_url || !business.opening_hours));

  const slug = await getTenantSlug();
  // Ensure fallback matches the return type of getStats
  const stats = slug ? await getStats(slug) : { sales: 0, orders: 0, reservations: 0, customers: 0, monthlyOrders: 0, plan: 'starter' };
  const activity = slug ? await getActivity(slug) : [];

  return (
    <div className="space-y-8 relative">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Panel de Control</h1>
        <p className="text-slate-500 mt-1">Visión general de tu negocio hoy.</p>
      </div>

      {/* FREEMIUM LIMIT WIDGET */}
      {(stats.plan === 'starter' || stats.plan === 'starter (piloto)') && (
        <div className="bg-slate-900 rounded-2xl p-6 text-white overflow-hidden relative shadow-xl">
          <div className="absolute right-0 top-0 w-64 h-64 bg-orange-500 rounded-full blur-[80px] opacity-20 -translate-y-1/2 translate-x-1/3 pointer-events-none" />
          <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start justify-between gap-4">
            <div className="flex-1 w-full">
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide">Plan Piloto (Gratis)</span>
              </div>
              <h3 className="text-lg font-bold mb-1">Tu progreso mensual</h3>
              <p className="text-slate-400 text-sm mb-4">Tienes un límite de 30 pedidos gratuitos al mes.</p>

              <div className="flex items-end gap-2 mb-2">
                <span className="text-3xl font-black">{stats.monthlyOrders}</span>
                <span className="text-sm text-slate-400 mb-1.5">/ 30 pedidos</span>
              </div>

              <div className="h-2 bg-slate-800 rounded-full overflow-hidden w-full max-w-sm">
                <div
                  className={`h-full rounded-full transition-all ${stats.monthlyOrders >= 30 ? 'bg-red-500' : 'bg-gradient-to-r from-orange-500 to-amber-500'}`}
                  style={{ width: `${Math.min(100, (stats.monthlyOrders / 30) * 100)}%` }}
                />
              </div>
              {stats.monthlyOrders >= 30 && (
                <p className="text-red-400 text-xs font-bold mt-2 flex items-center gap-1">
                  ⚠️ Límite alcanzado. Tus clientes no pueden pedir.
                </p>
              )}
            </div>
            <Link href="/admin/settings?tab=billing" className="w-full sm:w-auto text-center bg-white text-slate-900 px-4 py-2 rounded-lg font-bold text-sm hover:bg-orange-50 transition-colors shadow-lg">
              Mejorar Plan 🚀
            </Link>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <DashboardCard
          title="Ventas Hoy"
          value="-- €"
          icon={TrendingUp}
          trend="+12%"
        />
        <DashboardCard
          title="Pedidos Activos"
          value={String(stats.orders)}
          icon={ShoppingBag}
        />
        <DashboardCard
          title="Reservas"
          value={String(stats.reservations)}
          icon={Calendar}
        />
        <DashboardCard
          title="Clientes Nuevos"
          value="0"
          icon={Users}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="glass-panel p-6 rounded-2xl min-h-[300px]">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Actividad Reciente</h3>
          {activity.length === 0 ? (
            <div className="flex items-center justify-center h-full text-slate-400 text-sm">
              No hay actividad reciente
            </div>
          ) : (
            <div className="space-y-4">
              {activity.map((item: any) => (
                <div key={item.id + item.type} className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                  <div className={`p-2 rounded-lg ${item.type === 'order' ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'}`}>
                    {item.type === 'order' ? <ShoppingBag className="w-5 h-5" /> : <Calendar className="w-5 h-5" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-slate-800">
                      {item.type === 'order' ? `Nuevo Pedido (${item.total} €)` : `Nueva Reserva (${item.party_size} pax)`}
                    </p>
                    <p className="text-xs text-slate-500">
                      {item.customer_name || 'Cliente'} • {new Date(item.date).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <span className="text-xs font-medium text-slate-400">
                    {new Date(item.date).toLocaleDateString('es-ES') === new Date().toLocaleDateString('es-ES') ? 'Hoy' : new Date(item.date).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="glass-panel p-6 rounded-2xl min-h-[300px]">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Accesos Rápidos</h3>
          <div className="grid grid-cols-2 gap-4">
            <Link href="/admin/products?action=new" className="p-4 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 transition-all text-left group">
              <span className="block font-semibold text-slate-700 group-hover:text-emerald-700 mb-1">Añadir Producto</span>
              <span className="text-xs text-slate-500">Crear un nuevo plato en el menú</span>
            </Link>
            <button className="p-4 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 transition-all text-left group opacity-50 cursor-not-allowed" disabled title="Próximamente">
              <span className="block font-semibold text-slate-700 group-hover:text-emerald-700 mb-1">Cerrar Negocio</span>
              <span className="text-xs text-slate-500">Pausar pedidos temporalmente</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
