// src/app/menu/page.tsx
export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { redirect } from 'next/navigation';
import { headers, cookies } from 'next/headers';
import AddToCartWithOptions from '@/components/AddToCartWithOptions';
import CartQtyActions from '@/components/CartQtyActions';
import { getSubscriptionForSlug, type SubscriptionInfo } from '@/lib/subscription-server';
import { subscriptionAllowsOrders } from '@/lib/subscription';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { findPromotionForProduct, type Promotion as PromotionRule } from '@/lib/promotions';
import ImageLightbox from '@/components/ImageLightbox';
import { Suspense } from 'react';
import { MapPin, Clock, Phone, Star, ArrowDown, Search, ArrowRight, Instagram } from 'lucide-react';
import { ALLERGENS } from '@/lib/allergens';
import ReservationTrigger from '@/components/ReservationTrigger';
import CategoryNav from '@/components/CategoryNav';

type PageProps = { searchParams: Promise<{ [key: string]: string | string[] | undefined }> };

// --- Helpers Logic (Kept Original) ---

function jsToIso(jsDay: number) { return ((jsDay + 6) % 7) + 1; }

function todayIsoTZ(tz?: string) {
  try {
    const zone = tz || process.env.NEXT_PUBLIC_TIMEZONE || 'Europe/Madrid';
    const wd = new Intl.DateTimeFormat('en-GB', { timeZone: zone, weekday: 'short' }).format(new Date());
    const map: Record<string, number> = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 };
    return map[wd] || jsToIso(new Date().getDay());
  } catch {
    return jsToIso(new Date().getDay());
  }
}

function formatPrice(n: number) {
  try { return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(n); }
  catch { return n.toFixed(2) + ' EUR'; }
}

async function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  const timer = new Promise<T>((resolve) => { setTimeout(() => resolve(fallback), ms); });
  return Promise.race([promise, timer]);
}

function normalizeDays(arr: any): number[] {
  if (!Array.isArray(arr)) return [];
  return arr.map((x) => Number((x && typeof x === 'object') ? (x as any).day : x)).filter((n) => Number.isFinite(n) && n >= 1 && n <= 7);
}

// --- Main Page Component ---

export default function MenuPage(props: PageProps) {
  return (
    <Suspense fallback={<LoadingScreen />}>
      {/* @ts-ignore */}
      <MenuContent searchParams={props.searchParams} />
    </Suspense>
  );
}

function LoadingScreen() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-4 animate-in fade-in zoom-in-95 duration-500">
        <div className="w-16 h-16 rounded-full border-4 border-emerald-100 border-t-emerald-500 animate-spin" />
        <span className="text-slate-400 font-medium tracking-wide">Cargando experiencia...</span>
      </div>
    </div>
  );
}

async function MenuContent({ searchParams }: PageProps) {
  // ... (Data Fetching Logic - Kept exactly as is) ...
  const sp = await searchParams;
  const rawDay = sp?.day; const rawCat = sp?.cat;
  const rawTenant = sp?.tenant; // Support manual tenant param
  const selectedCat = (Array.isArray(rawCat) ? rawCat[0] : rawCat) || '';
  const selectedDay = Number(Array.isArray(rawDay) ? rawDay[0] : rawDay);

  if (!(selectedDay >= 0 && selectedDay <= 7) || Number.isNaN(selectedDay)) {
    const today = todayIsoTZ();
    const qp = new URLSearchParams(); qp.set('day', String(today));
    if (selectedCat) qp.set('cat', selectedCat);
    if (rawTenant) qp.set('tenant', String(rawTenant));
    redirect(`/menu?${qp.toString()}`);
  }

  const selectedDaySafe = selectedDay;

  const hdrs = await headers();
  const proto = (hdrs.get('x-forwarded-proto') || 'https').split(',')[0].trim();
  const host = (hdrs.get('host') || '').trim();
  const origin = host ? `${proto}://${host}` : '';
  const cookieStore = await cookies();
  let slug = '';
  try { slug = cookieStore.get('x-tenant-slug')?.value || ''; } catch { }

  // 1. Try manual tenant param first (highest priority for debugging)
  if (rawTenant) {
    slug = Array.isArray(rawTenant) ? rawTenant[0] : rawTenant;
  }
  // 2. Fallback to subdomain
  else if (!slug && host) {
    const parts = host.split('.');
    if (parts.length >= 3) slug = parts[0].toLowerCase();
  }

  const { plan, ordersEnabled } = await withTimeout<SubscriptionInfo>(
    getSubscriptionForSlug(slug),
    3000,
    { plan: 'premium', ordersEnabled: true }
  );
  const allowOrdering = subscriptionAllowsOrders(plan) && ordersEnabled;

  let businessLogo: string | null = null;
  let businessName: string = "Restaurante";
  let themeColor: string = "#10b981";
  let heroImage: string | null = null;

  if (slug) {
    try {
      const themeQuery = supabaseAdmin.from("businesses").select("name, theme_config, logo_url").eq("slug", slug).maybeSingle();
      const { data: themeRow } = await themeQuery;
      businessLogo = (themeRow as any)?.logo_url ?? null;
      businessName = (themeRow as any)?.name ?? "Restaurante";
      themeColor = (themeRow as any)?.theme_config?.color ?? "#10b981";
      // We could add a hero_image field later, for now let's use a nice pattern or gradient
      // heroImage = (themeRow as any)?.theme_config?.hero_image ?? null; 
    } catch { }
  }

  const qps = new URLSearchParams();
  qps.set('day', String(selectedDaySafe));
  let tenantParam = '';
  if (slug) {
    tenantParam = slug;
    qps.set('tenant', slug);
  } else if (host) {
    const parts = host.split('.');
    if (parts.length >= 3) {
      tenantParam = parts[0];
      qps.set('tenant', tenantParam);
    }
  }
  const apiUrl = origin ? `${origin}/api/products?${qps.toString()}` : `/api/products?${qps.toString()}`;

  let products: any[] = [];
  let categories: any[] = [];
  let menuMode: 'fixed' | 'daily' = 'fixed';
  let payload: any = null;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    const resp = await fetch(apiUrl, { cache: 'no-store', signal: controller.signal });
    clearTimeout(timer);
    try { payload = await resp.json(); } catch { }
    products = Array.isArray(payload?.products) ? payload.products : [];
    categories = Array.isArray(payload?.categories) ? payload.categories : [];
    menuMode = (payload?.menu_mode === 'daily') ? 'daily' : 'fixed';
  } catch (e: any) { }

  let promotions: PromotionRule[] = [];
  try {
    const promoParams = new URLSearchParams();
    if (tenantParam) promoParams.set('tenant', tenantParam);
    const promoQuery = promoParams.toString();
    const promoUrl = origin ? `${origin}/api/promotions${promoQuery ? `?${promoQuery}` : ''}` : `/api/promotions${promoQuery ? `?${promoQuery}` : ''}`;
    const resp = await fetch(promoUrl, { cache: 'no-store' });
    const pj = await resp.json().catch(() => ({}));
    if (resp.ok && Array.isArray(pj?.promotions)) { promotions = pj.promotions as PromotionRule[]; }
  } catch { }

  const viewProducts = (menuMode === 'daily')
    ? (products || []).filter((p: any) => {
      const pDays = normalizeDays(p?.product_weekdays);
      if (selectedDaySafe === 0) return pDays.length === 0 || pDays.length === 7;
      if (pDays.length === 0) return true;
      return pDays.length === 7 || pDays.includes(selectedDaySafe);
    })
    : (products || []);

  const groups = new Map<number | 'nocat', any[]>();
  for (const p of viewProducts) {
    const cidNum = Number(p?.category_id);
    const key: number | 'nocat' = Number.isFinite(cidNum) ? cidNum : 'nocat';
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(p);
  }

  const orderedSections: Array<{ id: number | 'nocat'; name: string; sort_order?: number }>
    = [...(categories || []), ...(groups.has('nocat') ? [{ id: 'nocat' as const, name: 'Otros', sort_order: 9999 }] : [])];

  const visibleSections = orderedSections.filter((s) => {
    if (!selectedCat) return true;
    if (selectedCat === 'nocat') return s.id === 'nocat';
    return String(s.id) === selectedCat;
  });

  const dayNames = ['', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
  const currentIsoDay = ((new Date().getDay() + 6) % 7) + 1;
  const promotionCache = new Map<string, PromotionRule | null>();

  function getProductPromotion(p: any) {
    if (!promotions.length) return null;
    const key = `${p.id}-${p.category_id ?? 'nocat'}-${p.price ?? ''}`;
    if (promotionCache.has(key)) return promotionCache.get(key) || null;
    const promo = findPromotionForProduct({ id: p.id, price: Number(p.price || 0), category_id: p.category_id ?? null }, promotions);
    promotionCache.set(key, promo);
    return promo;
  }

  function getEffectivePrice(price: number, promo: PromotionRule | null) {
    if (!promo) return price;
    const value = Number(promo.value || 0);
    if (!Number.isFinite(value) || value <= 0) return price;
    if (promo.type === "percent") { const pct = Math.min(Math.max(value, 0), 100); return Math.max(0, price - (price * pct) / 100); }
    return Math.max(0, price - value);
  }

  function availabilityFor(p: any) {
    if (p.available === false) return { out: true, disabledLabel: "Agotado" };
    if (menuMode !== "daily") return { out: false, disabledLabel: undefined };
    const pDays = normalizeDays(p?.product_weekdays);
    if (!pDays.length || pDays.length === 7) return { out: false, disabledLabel: undefined };
    const targetDay = selectedDaySafe >= 1 && selectedDaySafe <= 7 ? selectedDaySafe : currentIsoDay;
    const canAdd = pDays.includes(targetDay);
    let disabledLabel: string | undefined;
    if (!canAdd) {
      const sorted = [...pDays].sort((a, b) => a - b);
      disabledLabel = sorted.length === 1 ? `Solo ${dayNames[sorted[0]]}` : `Solo: ${sorted.map((d) => dayNames[d]).join(", ")}`;
    }
    return { out: !canAdd, disabledLabel };
  }

  // --- UI COMPONENTS ---



  // ... (imports remain)

  // ... (MenuPage component)

  const Hero = () => (
    <div className="relative w-full h-[50vh] min-h-[400px] flex items-center justify-center overflow-hidden">
      {/* Background with overlay */}
      <div className="absolute inset-0 bg-slate-900">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 opacity-90" />
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-40 mix-blend-overlay" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent" />
      </div>

      <div className="relative z-10 text-center px-4 flex flex-col items-center gap-6 animate-in slide-in-from-bottom-10 fade-in duration-700">
        {/* Logo Glass */}
        <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl flex items-center justify-center p-4 mb-2 ring-1 ring-white/10">
          {businessLogo ? (
            <img src={businessLogo} alt="Logo" className="w-full h-full object-contain drop-shadow-lg" />
          ) : (
            <span className="text-4xl font-bold text-white/80">{businessName[0]}</span>
          )}
        </div>

        {/* Text */}
        <div className="space-y-2 max-w-2xl">
          <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight drop-shadow-lg leading-tight">
            {businessName}
          </h1>
          <p className="text-white/80 text-lg md:text-xl font-medium flex items-center justify-center gap-2">
            <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> Centro</span>
            <span className="w-1 h-1 rounded-full bg-white/40" />
            <span className="flex items-center gap-1 text-emerald-400"><Clock className="w-4 h-4" /> Abierto ahora</span>
          </p>
        </div>

        {/* Action */}
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Link
            href="#menu-content"
            className="group flex items-center gap-2 bg-white/10 hover:bg-white/20 hover:text-white backdrop-blur-md border border-white/10 px-8 py-3 rounded-full text-white/90 font-semibold transition-all hover:scale-105"
          >
            Ver Carta <ArrowDown className="w-4 h-4 group-hover:translate-y-1 transition-transform" />
          </Link>

          <ReservationTrigger businessName={businessName}>
            <button className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-3 rounded-full font-bold shadow-lg shadow-emerald-900/20 transition-all hover:scale-105 hover:shadow-emerald-500/30">
              <Clock className="w-4 h-4" /> Reservar Mesa
            </button>
          </ReservationTrigger>
        </div>
      </div>
    </div>
  );

  const StickyNav = () => (
    <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-y border-slate-200/50 shadow-sm">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-4 py-3 gap-4">
        {/* Scrollable Categories */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar mask-gradient-right flex-1">
          {(() => {
            const params = new URLSearchParams();
            params.set('day', String(selectedDaySafe));
            if (tenantParam) params.set('tenant', tenantParam);
            return (
              <Link
                href={`/menu?${params.toString()}`}
                className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-bold transition-all ${!selectedCat ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20' : 'bg-slate-100/50 text-slate-600 hover:bg-white hover:shadow'}`}
              >
                Todo
              </Link>
            );
          })()}

          {orderedSections.map((s) => {
            const params = new URLSearchParams();
            params.set('day', String(selectedDaySafe));
            if (tenantParam) params.set('tenant', tenantParam);
            if (s.id === 'nocat') params.set('cat', 'nocat'); else params.set('cat', String(s.id));
            const isActive = selectedCat === (s.id === 'nocat' ? 'nocat' : String(s.id));
            return (
              <Link
                key={String(s.id)}
                href={`/menu?${params.toString()}`}
                className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-bold transition-all ${isActive ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20' : 'bg-slate-100/50 text-slate-600 hover:bg-white hover:shadow'}`}
              >
                {s.name}
              </Link>
            );
          })}
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          <ReservationTrigger businessName={businessName}>
            <button className="hidden md:flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-2 rounded-full text-sm font-bold hover:bg-emerald-100 transition-colors">
              <Clock className="w-4 h-4" /> Reservar
            </button>
          </ReservationTrigger>
          <button className="p-2 rounded-full hover:bg-slate-100 text-slate-400">
            <Search className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );

  const ProductCard = ({ p }: { p: any }) => {
    const { out, disabledLabel } = availabilityFor(p);
    const promo = getProductPromotion(p);
    const priceValue = Number(p.price || 0);
    const effectivePrice = getEffectivePrice(priceValue, promo);
    const showPrice = Number.isFinite(priceValue) && priceValue > 0;

    return (
      <div className={`group relative bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-500 ${out ? 'opacity-60 grayscale-[0.5]' : ''}`}>

        {/* Image Area */}
        <div className="relative h-48 overflow-hidden bg-slate-100">
          {p.image_url ? (
            <img
              src={p.image_url}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-slate-50 text-slate-300">
              <span className="text-xs font-medium uppercase tracking-widest">Sin foto</span>
            </div>
          )}

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-1">
            {promo && <span className="bg-rose-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-lg backdrop-blur-md">PROMO</span>}
            {p.available === false && <span className="bg-slate-800 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-lg">AGOTADO</span>}
          </div>

          {/* Quick Action Button (Desktop Hover) */}
          {allowOrdering && !out && (
            <div className="absolute bottom-3 right-3 translate-y-12 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
              <div className="bg-white rounded-full shadow-lg p-1">
                {/* Reusing existing logic but styled minmally just for visual cue */}
                <div className="w-8 h-8 flex items-center justify-center rounded-full bg-emerald-500 text-white">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Content Area */}
        <div className="p-5 flex flex-col h-[calc(100%-12rem)]">
          <div className="flex-1">
            <div className="flex justify-between items-start gap-2 mb-2">
              <h3 className="text-lg font-bold text-slate-900 leading-tight group-hover:text-emerald-700 transition-colors line-clamp-2">
                {p.name}
              </h3>
            </div>
            {p.description && (
              <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed mb-4">
                {p.description}
              </p>
            )}

            {/* ALLERGENS DISPLAY */}
            {Array.isArray(p.allergens) && p.allergens.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {p.allergens.map((algId: string) => {
                  const alg = ALLERGENS.find(a => a.id === algId);
                  if (!alg) return null;
                  const Icon = alg.icon;
                  return (
                    <div key={algId} title={alg.label} className="flex items-center justify-center w-6 h-6 bg-slate-50 rounded-full text-slate-500 border border-slate-100">
                      {/* @ts-ignore */}
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer Price & Add */}
          <div className="flex items-center justify-between pt-4 mt-auto border-t border-slate-50">
            <div className="flex flex-col">
              {promo ? (
                <>
                  <span className="text-xs text-slate-400 line-through font-medium">{formatPrice(priceValue)}</span>
                  <span className="text-lg font-black text-rose-500">{formatPrice(effectivePrice)}</span>
                </>
              ) : (
                <span className={`text-lg font-black ${out ? 'text-slate-400' : 'text-slate-900'}`}>{formatPrice(priceValue)}</span>
              )}
            </div>

            {allowOrdering && (
              <div className="scale-90 origin-right">
                <AddToCartWithOptions
                  product={{
                    id: p.id,
                    name: p.name,
                    price: Number(p.price || 0),
                    category_id: p.category_id ?? null,
                    option_groups: Array.isArray(p.option_groups) ? p.option_groups : [],
                    image_url: p.image_url || undefined,
                    allergens: p.allergens,
                  }}
                  disabled={out}
                  disabledLabel={disabledLabel}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // --- RENDER ---

  const isEmpty = !orderedSections.some(s => {
    const list = s.id === 'nocat' ? groups.get('nocat') : groups.get(Number(s.id));
    return list && list.length > 0;
  });

  return (
    <div className="min-h-screen bg-slate-50 pb-20 font-sans selection:bg-emerald-100 selection:text-emerald-900">

      {/* 1. Hero */}
      <Hero />

      {/* 2. Sticky Nav (Replaced) */}
      <CategoryNav sections={orderedSections} />

      {/* 3. Main Content */}
      <div id="menu-content" className="max-w-7xl mx-auto px-4 py-12 scroll-mt-24">

        {menuMode === 'daily' && (
          <div className="mb-8">
            <h3 className="text-center text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Carta del Día</h3>
            <div className="flex justify-center">
              <DayTabs selectedDay={selectedDaySafe} hasAllDays={true} availableDays={(Array.isArray((payload as any)?.available_days) ? (payload as any).available_days : undefined) as any} tenantParam={tenantParam} />
            </div>
          </div>
        )}

        {isEmpty && (
          <div className="text-center py-20 animate-in fade-in zoom-in-95">
            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
              <Search className="w-10 h-10 text-slate-300" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">¡Vaya! No hemos encontrado nada</h2>
            <p className="text-slate-500 mt-2">Prueba a seleccionar otra categoría o día de la semana.</p>
            <Link href="/menu" className="btn-primary mt-6 inline-flex">Ver Todo</Link>
          </div>
        )}

        <div className="space-y-24">
          {orderedSections.map((section) => {
            const list = section.id === 'nocat' ? groups.get('nocat') || [] : groups.get(Number(section.id)) || [];
            if (!list || list.length === 0) return null;

            return (
              <section key={String(section.id)} id={`cat-${section.id}`} className="scroll-mt-40 transition-all duration-500">
                <div className="flex items-center gap-4 mb-8">
                  <h2 className="text-3xl font-black text-slate-900 tracking-tight pl-2 border-l-4 border-emerald-500">{section.name}</h2>
                  <div className="h-px flex-1 bg-slate-100" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
                  {list.map(p => <ProductCard key={p.id} p={p} />)}
                </div>
              </section>
            );
          })}
        </div>

      </div>





      <ImageLightbox />
    </div >
  );
}

// Keep helper components
function DayTabs({ selectedDay, hasAllDays, availableDays, tenantParam }: { selectedDay?: number; hasAllDays: boolean; availableDays?: number[]; tenantParam?: string }) {
  const js = new Date().getDay(); const today = jsToIso(js);
  const current = (typeof selectedDay === 'number' && !Number.isNaN(selectedDay) && selectedDay >= 0 && selectedDay <= 7) ? selectedDay : today;
  const baseDays = hasAllDays
    ? [{ d: 0, label: 'Todos' }, { d: 1, label: 'Lunes' }, { d: 2, label: 'Martes' }, { d: 3, label: 'Miércoles' }, { d: 4, label: 'Jueves' }, { d: 5, label: 'Viernes' }, { d: 6, label: 'Sábado' }, { d: 7, label: 'Domingo' }]
    : [{ d: 1, label: 'Lunes' }, { d: 2, label: 'Martes' }, { d: 3, label: 'Miércoles' }, { d: 4, label: 'Jueves' }, { d: 5, label: 'Viernes' }, { d: 6, label: 'Sábado' }, { d: 7, label: 'Domingo' }];
  const daysToShow = (Array.isArray(availableDays) && availableDays.length > 0)
    ? baseDays.filter((x) => x.d !== 0 && (availableDays as number[]).includes(x.d))
    : baseDays;
  return (
    <div className="inline-flex bg-white p-1 rounded-full border border-slate-200 shadow-sm">
      {daysToShow.map(({ d, label }) => {
        const q = new URLSearchParams();
        q.set('day', String(d));
        if (tenantParam) q.set('tenant', tenantParam);
        return (
          <Link key={d} href={`/menu?${q.toString()}`} className={['px-4 py-2 rounded-full text-sm font-bold transition-all', d === current ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'].join(' ')}>
            {label}
          </Link>
        );
      })}
    </div>
  );
}
