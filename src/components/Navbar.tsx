// src/components/Navbar.tsx
"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { useEffect, useState } from "react";
import { getCount, subscribe } from "@/lib/cart-storage";
import { useSubscriptionPlan } from "@/context/SubscriptionPlanContext";
import { useOrdersEnabled } from "@/context/OrdersEnabledContext";
import { subscriptionAllowsOrders, subscriptionAllowsReservations } from "@/lib/subscription";
// Admin entry removed from navbar

import { useCart } from "@/context/CartContext";
import { useReservation } from "@/context/ReservationContext";

export default function NavBar() {
  const plan = useSubscriptionPlan();
  const ordersEnabled = useOrdersEnabled();
  const allowOrdering = subscriptionAllowsOrders(plan) && ordersEnabled;
  const allowReservations = subscriptionAllowsReservations(plan);
  const { openDrawer } = useCart() as any;
  const { openReservationModal } = useReservation();
  const [count, setCount] = useState(0);
  const [reservationsEnabled, setReservationsEnabled] = useState(false);
  const [hasPromotions, setHasPromotions] = useState(false);
  const [tenantSlug, setTenantSlug] = useState<string | null>(null);

  const resolveTenantFromLocation = () => {
    if (typeof window === "undefined") return null;
    try {
      const params = new URLSearchParams(window.location.search);
      const fromQuery = params.get("tenant");
      if (fromQuery) return fromQuery;
      const host = window.location.hostname.split(".");
      if (host.length >= 3) return host[0];
      return null;
    } catch {
      return null;
    }
  };

  useEffect(() => {
    if (!allowOrdering) {
      setCount(0);
      return;
    }
    const unsub = subscribe(() => setCount(getCount()));
    return () => unsub();
  }, [allowOrdering]);

  useEffect(() => {
    let active = true;
    const resolveTenant = () => {
      if (typeof window === "undefined") return "";
      const params = new URLSearchParams(window.location.search);
      const fromQuery = params.get("tenant")?.trim();
      if (fromQuery) return fromQuery;
      const cookie = document.cookie.split(";").find((c) => c.trim().startsWith("x-tenant-slug="));
      if (cookie) return cookie.split("=")[1];
      const host = window.location.hostname;
      const parts = host.split(".");
      if (parts.length >= 3) return parts[0];
      return "";
    };
    const load = async () => {
      try {
        const slug = resolveTenant();
        const url = slug ? `/api/settings/home?tenant=${encodeURIComponent(slug)}` : "/api/settings/home";
        const resp = await fetch(url, { cache: "no-store" });
        const j = await resp.json();
        if (!active) return;
        setReservationsEnabled(Boolean(j?.data?.reservations?.enabled));
        setTenantSlug(slug);
      } catch {
        if (active) setReservationsEnabled(false);
      }
    };
    if (allowReservations) load();
    else setReservationsEnabled(false);
    return () => {
      active = false;
    };
  }, [allowReservations]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const slug = tenantSlug || resolveTenantFromLocation();
        const url = slug ? `/api/promotions?tenant=${encodeURIComponent(slug)}` : "/api/promotions";
        const resp = await fetch(url, { cache: "no-store" });
        const j = await resp.json().catch(() => ({}));
        if (!active) return;
        setHasPromotions(resp.ok && Array.isArray(j?.promotions) && j.promotions.length > 0);
      } catch {
        if (active) setHasPromotions(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [tenantSlug]);

  const Item = ({ href, children }: { href: string; children: React.ReactNode }) => (
    <Link
      href={href}
      className="rounded-full px-3 py-1.5 text-xs font-medium text-white/90 transition hover:bg-white/10 hover:text-white sm:px-4 sm:py-2 sm:text-sm"
    >
      {children}
    </Link>
  );

  // Helper to append tenant param if it exists (for dev/localhost)
  const [tenantQueryParam, setTenantQueryParam] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const p = new URLSearchParams(window.location.search);
      const t = p.get("tenant");
      if (t) setTenantQueryParam(t);
    }
  }, []);

  const makeLink = (path: string) => {
    if (!tenantQueryParam) return path;
    const separator = path.includes("?") ? "&" : "?";
    return `${path}${separator}tenant=${tenantQueryParam}`;
  };

  return (
    <header className="text-white">
      <nav className="mx-auto flex w-full max-w-6xl items-center gap-2 px-3 py-3 sm:h-16 sm:gap-3 sm:px-4 sm:py-0">
        <div className="flex flex-1 items-center gap-1 rounded-full bg-white/5 px-2 py-1.5 sm:gap-3 sm:px-3 sm:py-2">
          <Item href={makeLink("/")}>Inicio</Item>
          <Item href={makeLink("/menu")}>Carta</Item>

          {allowReservations && reservationsEnabled && (
            <button
              onClick={openReservationModal}
              className="rounded-full px-3 py-1.5 text-xs font-medium text-white/90 transition hover:bg-white/10 hover:text-white sm:px-4 sm:py-2 sm:text-sm"
            >
              Reserva tu mesa
            </button>
          )}
          {/* Admin link intentionally removed */}
        </div>
        {allowOrdering && (
          <button
            onClick={openDrawer}
            className="group relative ml-2 flex items-center justify-center rounded-full bg-white/10 p-2 text-white/90 backdrop-blur-md transition-all hover:bg-white/20 hover:scale-105 hover:text-white active:scale-95 sm:ml-4 sm:p-2.5 shadow-sm border border-white/5"
            aria-label="Ver carrito"
          >
            <ShoppingBag className="h-5 w-5 sm:h-5 sm:w-5" />
            {count > 0 && (
              <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-md ring-2 ring-black/10">
                {count}
              </span>
            )}
          </button>
        )}
      </nav>
    </header>
  );
}
