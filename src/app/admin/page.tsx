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

export default async function AdminDashboard(props: { searchParams: Promise<{ onboarding?: string }> }) {
  const sp = await props.searchParams;
  const forceOnboarding = sp.onboarding === 'true';

  const business = await getBusinessData();
  const showOnboarding = forceOnboarding || (business && (!business.logo_url || !business.opening_hours));

  const slug = await getTenantSlug();
  const stats = slug ? await getStats(slug) : { sales: 0, orders: 0, reservations: 0, customers: 0 };

  return (
    <div className="space-y-8 relative">
      {/* Onboarding Trigger */}
      {/* {showOnboarding && <OnboardingWizard business={business} />} */}

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
          <div className="flex items-center justify-center h-full text-slate-400 text-sm">
            No hay actividad reciente
          </div>
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
