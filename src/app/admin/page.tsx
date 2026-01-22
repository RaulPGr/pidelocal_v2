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

  // 1. Get Business ID
  const { data: business } = await supabase
    .from('businesses')
    .select('id')
    .eq('slug', slug)
    .single();

  if (!business) return { sales: 0, orders: 0, reservations: 0, customers: 0 };

  const todayStr = new Date().toISOString().split('T')[0]; // "YYYY-MM-DD"

  // 2. Counts
  // Active Orders (Pending/Accepted/Cooking/Ready) created today
  const { count: ordersCount } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .eq('business_id', business.id)
    .gte('created_at', `${todayStr}T00:00:00`)
    .lt('created_at', `${todayStr}T23:59:59`)
    .neq('status', 'cancelled')
    .neq('status', 'completed'); // "Active" implies not finished

  // Reservations Today (Pending/Confirmed)
  // We match the 'reserved_at' date part. Note: This assumes UTC or simplified matching.
  // Ideally we filter by range. 
  const { count: reservationsCount } = await supabase
    .from('reservations')
    .select('*', { count: 'exact', head: true })
    .eq('business_id', business.id)
    .gte('reserved_at', `${todayStr}T00:00:00`)
    .lt('reserved_at', `${todayStr}T23:59:59`)
    .in('status', ['pending', 'confirmed']);

  return {
    sales: 0, // TODO: Calc sales
    orders: ordersCount || 0,
    reservations: reservationsCount || 0,
    customers: 0 // Keep 0 for now
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
  const stats = slug ? await getStats(slug) : { sales: 0, orders: 0, reservations: 0, customers: 0 };
  const activity = slug ? await getActivity(slug) : [];

  return (
    <div className="space-y-8 relative">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Panel de Control</h1>
        <p className="text-slate-500 mt-1">Visión general de tu negocio hoy.</p>
      </div>

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
