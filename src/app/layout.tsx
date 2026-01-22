// src/app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";
import { Toaster } from "sonner";
import { CartProvider } from "@/context/CartContext";
import Navbar from "@/components/Navbar";
import DayTabsClientAdjust from "@/components/DayTabsClientAdjust";
import { cookies, headers } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import AuthHashRedirect from '@/components/AuthHashRedirect';
import Analytics from "@/components/Analytics";

import Script from 'next/script';
import { SubscriptionPlanProvider } from "@/context/SubscriptionPlanContext";
import { OrdersEnabledProvider } from "@/context/OrdersEnabledContext";
import { normalizeSubscriptionPlan, type SubscriptionPlan } from "@/lib/subscription";
import CartDrawer from "@/components/CartDrawer";
import { ShieldCheck } from "lucide-react";
import { ReservationProvider } from "@/context/ReservationContext";
import CookieBanner from "@/components/CookieBanner";

const BASE_TITLE = "Comida para llevar";

export async function generateMetadata(): Promise<Metadata> {
  const cookieStore = await cookies();
  const slug = cookieStore.get('x-tenant-slug')?.value || '';

  const baseMetadata = {
    manifest: '/manifest.json',
    appleWebApp: {
      capable: true,
      statusBarStyle: "black-translucent" as const,
      title: "PideLocal"
    }
  };

  if (!slug) return { ...baseMetadata, title: BASE_TITLE, description: "Pedidos online" };
  try {
    const { data } = await supabaseAdmin
      .from('businesses')
      .select('name')
      .eq('slug', slug)
      .maybeSingle();
    const name = (data as any)?.name;
    if (!name) return { ...baseMetadata, title: BASE_TITLE, description: "Pedidos online" };
    return { ...baseMetadata, title: name, description: "Pedidos online" };
  } catch {
    return { ...baseMetadata, title: BASE_TITLE, description: "Pedidos online" };
  }
}

type ThemeConfig = {
  colors?: Record<string, string | undefined>;
  fonts?: Record<string, string | undefined>;
  home?: { heroOverlay?: boolean };
  subscription?: SubscriptionPlan;
};

function primaryFontName(stack?: string): string | null {
  if (!stack) return null;
  const first = stack.split(',')[0]?.trim() || '';
  const unquoted = first.replace(/^\"|\"$/g, '').replace(/^'|'$/g, '');
  return unquoted || null;
}

function googleFontHrefFor(name: string): string | null {
  const n = name.toLowerCase();
  const weights = 'wght@400;500;600;700';
  if (n === 'inter') return `https://fonts.googleapis.com/css2?family=Inter:${weights}&display=swap`;
  if (n === 'poppins') return `https://fonts.googleapis.com/css2?family=Poppins:${weights}&display=swap`;
  if (n === 'montserrat') return `https://fonts.googleapis.com/css2?family=Montserrat:${weights}&display=swap`;
  if (n === 'roboto') return `https://fonts.googleapis.com/css2?family=Roboto:${weights}&display=swap`;
  if (n === 'open sans') return `https://fonts.googleapis.com/css2?family=Open+Sans:${weights}&display=swap`;
  if (n === 'lato') return `https://fonts.googleapis.com/css2?family=Lato:${weights}&display=swap`;
  return null;
}

async function getThemeAssets(): Promise<{ css: string; fontHrefs: string[]; subscription: SubscriptionPlan; ordersEnabled: boolean }> {
  try {
    const cookieStore = await cookies();
    const slug = cookieStore.get('x-tenant-slug')?.value || '';
    if (!slug) return { css: '', fontHrefs: [], subscription: "premium", ordersEnabled: true };
    const { data } = await supabaseAdmin
      .from('businesses')
      .select('theme_config, social')
      .eq('slug', slug)
      .maybeSingle();
    const theme = (data as any)?.theme_config as ThemeConfig | null;
    const social = (data as any)?.social || {};
    if (!theme) return { css: '', fontHrefs: [], subscription: "premium", ordersEnabled: social?.orders_enabled !== false };
    const colors = theme.colors || {};
    const fonts = theme.fonts || {};
    const vars: Record<string, string | undefined> = {
      '--brand-chalk-bg': colors.background,
      '--brand-ink': colors.text,
      '--brand-muted': colors.muted,
      '--brand-accent': colors.accent,
      '--brand-accent-700': colors.accentHover,
      '--brand-green': colors.topbarEnd || colors.secondary,
      '--brand-green-700': colors.secondaryHover,
      '--brand-orange': colors.topbarStart || colors.accent,
      '--font-body': fonts.body,
      '--font-headings': fonts.headings,
    };
    const cssVars = Object.entries(vars)
      .filter(([, v]) => typeof v === 'string' && v)
      .map(([k, v]) => `${k}: ${v};`)
      .join(' ');
    const fBody = primaryFontName(fonts.body);
    const fHead = primaryFontName(fonts.headings);
    const hrefs = [fBody, fHead]
      .filter((v, i, arr): v is string => !!v && arr.indexOf(v) === i)
      .map((n) => googleFontHrefFor(n))
      .filter((x): x is string => !!x);
    const subscription = normalizeSubscriptionPlan(theme.subscription);
    const ordersEnabled = social?.orders_enabled !== false;
    const gradientVars = [
      colors.topbarStart || colors.accent || "#2f2536",
      colors.topbarEnd || colors.secondary || "#6f1d75",
    ];
    const gradientCss = `
      body .app-navbar-bg {
        background: linear-gradient(90deg, ${gradientVars[0]}, ${gradientVars[1]});
      }
    `;
    return { css: `${cssVars ? `:root{${cssVars}}` : ''} ${gradientCss}`, fontHrefs: hrefs, subscription, ordersEnabled };
  } catch {
    return { css: '', fontHrefs: [], subscription: "premium", ordersEnabled: true };
  }
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") || "";
  const isAdmin = pathname.startsWith("/admin") || pathname.startsWith("/superadmin");
  const themeAssets = await getThemeAssets();

  return (
    <html lang="es">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        {themeAssets.fontHrefs.length > 0 && (
          <>
            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
            {themeAssets.fontHrefs.map((href) => (
              <link key={href} href={href} rel="stylesheet" />
            ))}
          </>
        )}
      </head>
      <body className="bg-brand-chalk">

        {/* Redirige tokens/hash de Supabase a /auth/reset si llegan a la raíz u otras rutas */}
        <AuthHashRedirect />

        {/* Fija cookie x-tenant-slug a partir de ?tenant= en previews (cliente) */}
        <Script id="set-tenant-cookie" strategy="afterInteractive">
          {`
            (function(){
              try {
                var params = new URLSearchParams(window.location.search);
                var t = (params.get('tenant') || '').trim().toLowerCase();
                var hasCookie = document.cookie.indexOf('x-tenant-slug=') !== -1;
                if (t && /^[a-z0-9-_.]{1,120}$/.test(t)) {
                  document.cookie = 'x-tenant-slug=' + t + '; path=/; max-age=31536000; samesite=lax';
                  try { localStorage.setItem('xTenant', t); } catch {}
                } else if (!hasCookie) {
                  try {
                    var saved = (localStorage.getItem('xTenant') || '').trim().toLowerCase();
                    if (saved && /^[a-z0-9-_.]{1,120}$/.test(saved)) {
                      document.cookie = 'x-tenant-slug=' + saved + '; path=/; max-age=31536000; samesite=lax';
                      if (!params.get('reloaded')) {
                        params.set('reloaded', '1');
                        var href = window.location.pathname + '?' + params.toString() + window.location.hash;
                        window.location.replace(href);
                      }
                    }
                  } catch {}
                }
              } catch {}
            })();
          `}
        </Script>
        {themeAssets.css && <style suppressHydrationWarning>{themeAssets.css}</style>}
        <SubscriptionPlanProvider plan={themeAssets.subscription}>
          <OrdersEnabledProvider value={themeAssets.ordersEnabled}>
            <ReservationProvider>
              <CartProvider>
                <CartDrawer />
                <CookieBanner />

                {isAdmin ? (
                  /* Layout para Admin/Superadmin: Sin Navbar/Footer públicos */
                  <>{children}</>
                ) : (
                  /* Layout para Clientes: Navbar + Footer + Padding */
                  <>
                    <div className="fixed top-0 left-0 right-0 z-50 app-navbar-bg text-white shadow-lg shadow-black/10">
                      <Navbar />
                    </div>

                    <main className="min-h-screen pt-[64px] md:pt-[72px]">
                      <DayTabsClientAdjust />
                      <div className="pt-0 md:pt-0">
                        {children}
                      </div>
                      <footer className="mt-10 border-t border-slate-200 bg-white/60">
                        <div className="mx-auto max-w-6xl p-4 md:p-6 flex flex-col items-center justify-between gap-4 text-xs text-slate-500">
                          {/* Trust Badge */}
                          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-full border border-slate-100 shadow-sm">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="font-medium">Pagos 100% seguros con <span className="text-[#635BFF] font-bold">stripe</span></span>
                          </div>

                          <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-3">
                            <div className="inline-flex items-center gap-2">
                              <span>Web creada con</span>
                              <a href="https://pidelocal.es" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-medium text-slate-600 hover:text-emerald-700">
                                <img src="/images/pidelocal.png" alt="PideLocal" className="h-4 w-4" />
                                <span>PideLocal</span>
                              </a>
                            </div>
                            <div className="inline-flex items-center gap-4">
                              <a href="/legal/notice" className="hover:underline">Aviso Legal</a>
                              <a href="/legal/privacy" className="hover:underline">Privacidad</a>
                              <a href="/legal/cookies" className="hover:underline">Cookies</a>
                              <a href="/legal/terms" className="hover:underline">Términos</a>
                            </div>
                          </div>
                        </div>
                      </footer>
                    </main>
                  </>
                )}
              </CartProvider>
            </ReservationProvider>
          </OrdersEnabledProvider>
        </SubscriptionPlanProvider>

        <Analytics />
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
