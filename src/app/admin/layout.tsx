// src/app/admin/layout.tsx
import AdminSidebar from "@/components/admin/AdminSidebar";
import { headers, cookies } from "next/headers";
import { redirect } from "next/navigation";
import { adminEmails } from "@/utils/plan";
import { AdminAccessProvider } from "@/context/AdminAccessContext";
import { getSubscriptionForSlug } from "@/lib/subscription-server";
import { subscriptionAllowsOrders, type SubscriptionPlan } from "@/lib/subscription";
import WizardWrapper from "@/components/admin/WizardWrapper";
import NewOrderSound from "@/components/NewOrderSound";
import { createClient } from '@supabase/supabase-js';

type AdminAccessState = {
  allowed: boolean;
  isSuper: boolean;
  plan: SubscriptionPlan;
  businessId?: string;
  isTrial?: boolean;
  trialEndsAt?: string;
  slug?: string;
};

async function getAdminAccess(): Promise<AdminAccessState> {
  const h = await headers();
  const proto = h.get("x-forwarded-proto") ?? "https";
  const host = h.get("host");
  const baseUrl = host ? `${proto}://${host}` : (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000");
  const cookie = h.get("cookie") ?? "";

  let email = "";
  let isMember = false;
  try {
    const res = await fetch(`${baseUrl}/api/whoami`, { cache: "no-store", headers: { cookie } });
    if (res.ok) {
      const j = await res.json();
      email = String(j?.email || "").toLowerCase();
      isMember = !!j?.isMember;
    }
  } catch { }

  const admins = adminEmails();
  const isSuper = admins.length === 0 ? !!email : admins.includes(email);
  const allowed = isSuper || isMember;

  let plan: SubscriptionPlan = "premium";
  let businessId: string | undefined;
  let isTrial = false;
  let trialEndsAt: string | undefined;
  let slug: string | undefined;

  try {
    const cookieStore = await cookies();
    slug = cookieStore.get("x-tenant-slug")?.value || "";
    if (slug) {
      const info = await getSubscriptionForSlug(slug);
      plan = info.plan;
      businessId = info.businessId;
      isTrial = !!info.isTrial;
      trialEndsAt = info.trialEndsAt;
    }
  } catch { }

  return { allowed, isSuper, plan, businessId, isTrial, trialEndsAt, slug };
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const access = await getAdminAccess();
  if (!access.allowed) redirect("/login");
  const ordersRestricted = !subscriptionAllowsOrders(access.plan) && !access.isSuper;

  return (
    <AdminAccessProvider
      plan={access.plan}
      isSuper={access.isSuper}
      isTrial={access.isTrial}
      trialEndsAt={access.trialEndsAt}
      slug={access.slug}
    >
      <div className="flex min-h-screen bg-slate-50">
        <AdminSidebar />

        {/* Global Alert System */}
        {access.businessId && <NewOrderSound businessId={access.businessId} />}

        {/* Main Content Area */}
        <main className="flex-1 w-full max-w-[100vw] lg:ml-64 transition-all duration-300 overflow-x-hidden">
          <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
            {/* Botón flotante para activar sonido de nuevos pedidos */}
            {/* <WizardWrapper isCompleted={await (async () => {
              if (!access.slug) return false;
              // Quick fetch for onboarding status
              const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
              const service = process.env.SUPABASE_SERVICE_ROLE_KEY!;
              const supa = createClient(url, service, { auth: { persistSession: false } });
              const { data } = await supa.from('businesses').select('social').eq('slug', access.slug).single();
              return !!(data?.social as any)?.onboarding_completed;
            })()} /> */}
            {children}
          </div>
        </main>
      </div>
    </AdminAccessProvider>
  );
}
