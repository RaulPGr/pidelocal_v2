// /src/app/cart/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CartItem, subscribe, setQty, removeItem, clearCart } from "@/lib/cart-storage";
import { useSubscriptionPlan } from "@/context/SubscriptionPlanContext";
import { useOrdersEnabled } from "@/context/OrdersEnabledContext";
import { subscriptionAllowsOrders, type SubscriptionPlan } from "@/lib/subscription";
import ConfirmSubmitButton from "@/components/ConfirmSubmitButton";
import { persistTenantSlugClient, resolveTenantSlugClient } from "@/lib/tenant-client";
import { applyBestPromotion, type Promotion as PromotionRule } from "@/lib/promotions";
import { ArrowLeft } from "lucide-react";

type PaymentMethod = "cash" | "card";

function todayISO(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

// Pantalla del carrito: gestiona artículos, promociones y envío del pedido.
function CartPageContent() {
  const router = useRouter();
  // Carrito
  const [items, setItems] = useState<CartItem[]>([]);
  // Suscripción a los cambios del carrito (storage/local events).
  // Carga promociones disponibles para poder aplicar el mejor descuento.
  useEffect(() => {
    const unsub = subscribe((next) => setItems(next));
    return () => unsub();
  }, []);
  const [promotions, setPromotions] = useState<PromotionRule[]>([]);
  const [promotionsLoading, setPromotionsLoading] = useState(false);
  const [promotionsError, setPromotionsError] = useState<string | null>(null);
  const promoResult = useMemo(() => applyBestPromotion(items, promotions), [items, promotions]);
  const subtotal = promoResult.subtotal;
  const discount = promoResult.discount;
  const total = promoResult.total;
  const appliedPromotion = promoResult.promotion;

  // Formulario
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [date, setDate] = useState(todayISO());
  const [time, setTime] = useState("");
  const [payment, setPayment] = useState<PaymentMethod>("cash");
  const [methods, setMethods] = useState<{ cash: boolean; card: boolean }>({ cash: true, card: true });
  const [sending, setSending] = useState(false);
  // Horario de pedidos (ordering_hours || opening_hours)
  const [schedule, setSchedule] = useState<any | null>(null);
  const [timeError, setTimeError] = useState<string | null>(null);
  // Estado actual: ¿aceptamos pedidos ahora?
  const [ordersOpenNow, setOrdersOpenNow] = useState<boolean | null>(null);
  // Delivery state
  const [deliveryConfig, setDeliveryConfig] = useState<{ enabled: boolean; min: number; fee: number; pay_on_delivery_enabled?: boolean } | null>(null);
  const [deliveryMode, setDeliveryMode] = useState<'pickup' | 'delivery'>('pickup');
  const [address, setAddress] = useState({ street: '', number: '', floor: '', city: '', zip: '' });

  // Force Card payment if Delivery selected and pay_on_delivery disabled
  useEffect(() => {
    if (deliveryMode === 'delivery' && deliveryConfig && deliveryConfig.pay_on_delivery_enabled === false) {
      if (methods.card) setPayment('card');
    }
  }, [deliveryMode, deliveryConfig, methods]);

  // Calculation with Delivery Fee
  const deliveryFee = deliveryMode === 'delivery' && deliveryConfig ? deliveryConfig.fee : 0;
  const finalTotal = total + deliveryFee;
  const minOrderMet = deliveryMode === 'delivery' && deliveryConfig ? subtotal >= deliveryConfig.min : true;

  // Cargar métodos de pago y delivery settings
  // Carga métodos de pago disponibles para el negocio actual.
  useEffect(() => {
    const slug = resolveTenantSlugClient();
    if (slug) {
      persistTenantSlugClient(slug);
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const slug = resolveTenantSlugClient();
        if (slug) persistTenantSlugClient(slug);
        const endpoint = slug ? `/api/settings/payments?tenant=${encodeURIComponent(slug)}` : "/api/settings/payments";
        const res = await fetch(endpoint, { cache: "no-store" });
        const j = await res.json();
        if (j?.ok && j?.data) {
          setMethods({ cash: !!j.data.cash, card: !!j.data.card });
          setPayment((prev) => {
            if (prev === 'cash' && j.data.cash) return 'cash';
            if (prev === 'card' && j.data.card) return 'card';
            return j.data.cash ? 'cash' : 'card';
          });
        }
      } catch { }
    })();

    // Load Delivery Settings
    (async () => {
      try {
        const slug = resolveTenantSlugClient();
        if (slug) persistTenantSlugClient(slug);
        const endpoint = slug ? `/api/settings/home?tenant=${encodeURIComponent(slug)}` : "/api/settings/home"; // Use home to get social settings
        const res = await fetch(endpoint, { cache: "no-store" });
        const j = await res.json();
        if (j?.ok && j?.data?.social) {
          const s = j.data.social;
          if (s.delivery_enabled) {
            setDeliveryConfig({
              enabled: true,
              min: Number(s.delivery_min || 0),
              fee: Number(s.delivery_fee || 0),
              pay_on_delivery_enabled: s.delivery_pay_on_delivery_enabled !== false // Default true if not set
            });
          }
        }
      } catch { }
    })();
  }, []);

  // Obtener horario de pedidos para validar fecha/hora de recogida.
  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      try {
        setPromotionsLoading(true);
        setPromotionsError(null);
        const slug = resolveTenantSlugClient();
        if (slug) persistTenantSlugClient(slug);
        const endpoint = slug ? `/api/promotions?tenant=${encodeURIComponent(slug)}` : "/api/promotions";
        const res = await fetch(endpoint, { cache: "no-store", signal: controller.signal });
        const j = await res.json().catch(() => ({}));
        if (!res.ok || !j?.ok) throw new Error(j?.error || "No se pudieron cargar las promociones");
        const normalized = Array.isArray(j.promotions)
          ? (j.promotions as any[]).map((p) => ({
            ...p,
            value: Number(p.value ?? 0),
            min_amount: p.min_amount != null ? Number(p.min_amount) : null,
            weekdays: Array.isArray(p.weekdays) ? p.weekdays.map((n: any) => Number(n)).filter((d: number) => Number.isFinite(d)) : undefined,
          }))
          : [];
        setPromotions(normalized);
      } catch (e: any) {
        if (e?.name === "AbortError") return;
        setPromotionsError(e?.message || "No se pudieron cargar las promociones");
      } finally {
        setPromotionsLoading(false);
      }
    })();
    return () => controller.abort();
  }, []);

  // Cargar horario de pedidos
  useEffect(() => {
    (async () => {
      try {
        const slug = resolveTenantSlugClient();
        if (slug) persistTenantSlugClient(slug);
        const endpoint = slug ? `/api/settings/schedule?tenant=${encodeURIComponent(slug)}` : "/api/settings/schedule";
        const res = await fetch(endpoint, { cache: "no-store" });
        const j = await res.json();
        if (j?.ok) setSchedule(j.data || null);
      } catch { }
    })();
  }, []);

  // Helpers de validación
  function isDateInSchedule(date: Date, sched: any | null): boolean {
    try {
      if (!sched) return true;
      const dayKey = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][date.getDay()];
      const list: Array<{ abre?: string; cierra?: string; open?: string; close?: string }> = sched?.[dayKey] || [];
      if (!Array.isArray(list) || list.length === 0) return false;
      const mins = date.getHours() * 60 + date.getMinutes();
      return list.some((t) => {
        const a = (t.abre ?? t.open) as string | undefined;
        const c = (t.cierra ?? t.close) as string | undefined;
        if (!a || !c) return false;
        const [ha, ma] = String(a).split(':').map(Number);
        const [hc, mc] = String(c).split(':').map(Number);
        const from = ha * 60 + ma;
        const to = hc * 60 + mc;
        return mins >= from && mins < to;
      });
    } catch {
      return true;
    }
  }
  function isTimeInSchedule(dateISO: string, timeHHMM: string, sched: any | null): boolean {
    try {
      if (!sched) return true; // sin restricciones
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dateISO) || !/^\d{2}:\d{2}$/.test(timeHHMM)) return true;
      const [y, m, d] = dateISO.split('-').map(Number);
      const [hh, mi] = timeHHMM.split(':').map(Number);
      const dt = new Date(y, (m || 1) - 1, d || 1, hh || 0, mi || 0);
      const dayKey = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][dt.getDay()];
      const list: Array<{ abre?: string; cierra?: string; open?: string; close?: string }> = sched?.[dayKey] || [];
      if (!Array.isArray(list) || list.length === 0) return false;
      const mins = hh * 60 + mi;
      return list.some((t) => {
        const a = (t.abre ?? t.open) as string | undefined;
        const c = (t.cierra ?? t.close) as string | undefined;
        if (!a || !c) return false;
        const [ha, ma] = String(a).split(':').map(Number);
        const [hc, mc] = String(c).split(':').map(Number);
        const from = ha * 60 + ma;
        const to = hc * 60 + mc;
        return mins >= from && mins < to;
      });
    } catch {
      return true;
    }
  }

  // Helpers adicionales: mínimos y validación contra pasado
  function pad2(n: number) { return String(n).padStart(2, '0'); }
  function roundUpTo5Minutes(d: Date): string {
    const stepMs = 5 * 60 * 1000;
    const up = new Date(Math.ceil(d.getTime() / stepMs) * stepMs);
    return `${pad2(up.getHours())}:${pad2(up.getMinutes())}`;
  }
  function minTimeFor(dateISO: string): string {
    try { if (dateISO === todayISO()) return roundUpTo5Minutes(new Date()); } catch { }
    return '00:00';
  }
  function isSelectedInPast(dateISO: string, timeHHMM: string): boolean {
    try {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dateISO) || !/^\d{2}:\d{2}$/.test(timeHHMM)) return false;
      const [y, m, d] = dateISO.split('-').map(Number);
      const [hh, mi] = timeHHMM.split(':').map(Number);
      const when = new Date(y, (m || 1) - 1, d || 1, hh || 0, mi || 0);
      return when.getTime() < Date.now();
    } catch { return false; }
  }

  // Sugerencias (UI) en saltos de 5 min, según horario si existe
  function dayWindowsMinutes(dateISO: string, sched: any | null): Array<[number, number]> | null {
    try {
      if (!sched) return null;
      const [y, m, d] = dateISO.split('-').map(Number);
      const dt = new Date(y, (m || 1) - 1, d || 1);
      const key = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][dt.getDay()];
      const list: Array<{ abre?: string; cierra?: string; open?: string; close?: string }> = sched?.[key] || [];
      if (!Array.isArray(list) || list.length === 0) return null;
      const out: Array<[number, number]> = [];
      for (const t of list) {
        const a = String((t.abre ?? t.open) ?? '00:00');
        const c = String((t.cierra ?? t.close) ?? '23:59');
        const [ha, ma] = a.split(':').map(Number);
        const [hc, mc] = c.split(':').map(Number);
        out.push([ha * 60 + ma, hc * 60 + mc]);
      }
      return out;
    } catch { return null; }
  }

  // Genera un listado de horas posibles (salto de 5 min) dentro del horario configurado.
  const timeSuggestions: string[] = useMemo(() => {
    const minsStart = (() => {
      if (date === todayISO()) {
        const [hh, mm] = minTimeFor(date).split(':').map(Number);
        return hh * 60 + mm;
      }
      return 0;
    })();
    const windows = dayWindowsMinutes(date, schedule);
    const result: string[] = [];
    const addRange = (fromMin: number, toMin: number) => {
      let m = Math.max(minsStart, fromMin);
      m = Math.ceil(m / 5) * 5;
      for (; m < toMin; m += 5) {
        const hh = Math.floor(m / 60); const mi = m % 60;
        result.push(`${pad2(hh)}:${pad2(mi)}`);
      }
    };
    if (windows && windows.length > 0) {
      windows.forEach(([a, b]) => addRange(a, b));
    } else {
      // Si no hay horario definido, asumimos abierto 24h para permitir pruebas/pedidos
      addRange(0, 1440);
    }
    return result.slice(0, 288);
  }, [date, schedule]);

  function formatDaySchedule(dateISO: string, sched: any | null): string {
    try {
      if (!sched) return 'Sin restricciones específicas.';
      const [y, m, d] = dateISO.split('-').map(Number);
      const dt = new Date(y, (m || 1) - 1, d || 1);
      const dayKey = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][dt.getDay()];
      const list: Array<{ abre?: string; cierra?: string; open?: string; close?: string }> = sched?.[dayKey] || [];
      if (!Array.isArray(list) || list.length === 0) return 'Cerrado';
      return list.map((t) => `${t.abre ?? t.open}–${t.cierra ?? t.close}`).join(', ');
    } catch {
      return '';
    }
  }

  // Validar cada cambio de fecha/hora
  useEffect(() => {
    // No permitir fechas anteriores a hoy
    if (date && date < todayISO()) setDate(todayISO());
    // Ajustar hora mínima para hoy
    if (date === todayISO()) {
      const minT = minTimeFor(date);
      if (time && time < minT) setTime(minT);
    }
    if (!time) { setTimeError(null); return; }
    const ok = isTimeInSchedule(date, time, schedule);
    // Allow outside hours in Development
    if (!ok && process.env.NODE_ENV !== 'development') { setTimeError('Fuera del horario de pedidos'); return; }
    if (isSelectedInPast(date, time)) { setTimeError('No puedes seleccionar una hora pasada'); return; }
    setTimeError(null);
  }, [date, time, schedule]);

  // Calcular si AHORA se aceptan pedidos; refrescar cada minuto
  useEffect(() => {
    function tick() {
      // Always open in Development
      setOrdersOpenNow(isDateInSchedule(new Date(), schedule) || process.env.NODE_ENV === 'development');
    }
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, [schedule]);

  const submitReason = (() => {
    if (deliveryMode === 'delivery' && !minOrderMet)
      return `El pedido mínimo para domicilio es ${deliveryConfig?.min.toFixed(2)}€ (Subtotal: ${subtotal.toFixed(2)}€)`;
    if (deliveryMode === 'delivery') {
      if (!address.street.trim()) return 'Introduce la calle';
      if (!address.number.trim()) return 'Introduce el número';
      if (!address.city.trim()) return 'Introduce la ciudad';
    }
    if (items.length === 0) return 'Añade algún producto al carrito';
    if (name.trim().length === 0) return 'Introduce tu nombre';
    if (phone.trim().length === 0) return 'Introduce un teléfono de contacto';
    if (date.trim().length === 0) return 'Selecciona fecha de recogida/entrega';
    if (time.trim().length === 0) return 'Selecciona hora de recogida/entrega';
    if (isSelectedInPast(date, time)) return 'No puedes seleccionar una hora pasada';
    if (timeError) return timeError;
    if (sending) return 'Enviando…';
    return null;
  })();

  const canSubmit = submitReason === null;

  // Envío
  // Envía el pedido al backend (validando campos y horarios).
  async function onConfirm() {
    if (!canSubmit) return;

    // Validación fecha/hora
    const timeOk = /^\d{2}:\d{2}$/.test(time);
    if (!timeOk) {
      alert("Introduce una hora válida (HH:MM).");
      return;
    }
    const [y, m, d] = date.split("-").map(Number);
    const [hh, mi] = time.split(":").map(Number);
    const pickup = new Date(y, (m || 1) - 1, d || 1, hh || 0, mi || 0);
    if (isNaN(pickup.getTime())) {
      alert("La fecha y hora no son válidas.");
      return;
    }

    if (pickup.getTime() < Date.now()) {
      alert('No puedes seleccionar una hora pasada.');
      return;
    }

    const payload = {
      customer: { name: name.trim(), phone: phone.trim(), email: email.trim() || undefined },
      notes: notes.trim() || undefined,
      pickupAt: pickup.toISOString(),
      paymentMethod: payment,
      items: items.map((it) => ({
        productId: it.id as number,
        quantity: it.qty,
        unitPrice: it.price,
        options: it.options?.map((opt) => ({
          optionId: opt.optionId,
          name: opt.name,
          groupName: opt.groupName,
          price_delta: opt.price_delta ?? 0,
        })),
      })),
      pricing: {
        subtotal,
        discount,
        total: finalTotal,
        promotionId: appliedPromotion?.id || null,
        promotionName: appliedPromotion?.name || null,
        deliveryFee: deliveryFee > 0 ? deliveryFee : undefined,
      },
      delivery: deliveryMode === 'delivery' ? {
        type: 'delivery',
        address: `${address.street}, ${address.number}, ${address.floor} ${address.city} ${address.zip}`.trim()
      } : { type: 'pickup' },
    } as const;

    try {
      setSending(true);
      const tenantSlug = resolveTenantSlugClient();
      if (tenantSlug) persistTenantSlugClient(tenantSlug);
      const endpoint = tenantSlug ? `/api/orders?tenant=${encodeURIComponent(tenantSlug)}` : "/api/orders";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || `HTTP ${res.status}`);
      }
      const j = (await res.json().catch(() => ({}))) as any;
      clearCart();

      if (j?.checkoutUrl) {
        window.location.href = j.checkoutUrl;
        return;
      }

      if (j?.orderId) {
        router.replace(`/order/${j.orderId}`);
      } else {
        alert("Pedido creado correctamente");
      }
    } catch (e: any) {
      console.error(e);
      alert(`No se pudo crear el pedido. ${e?.message ?? ""}`);
    } finally {
      setSending(false);
    }
  }

  // UI
  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      {/* Header Simple */}
      <div className="bg-white border-b border-slate-100 px-4 py-4 mb-8 sticky top-0 z-30">
        <div className="mx-auto max-w-6xl flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 -ml-2 rounded-full hover:bg-slate-100 text-slate-500 transition-colors"
            aria-label="Volver"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900">Finalizar Pedido</h1>
        </div>
      </div>

      <main className="mx-auto max-w-6xl px-4 grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* SECCIÓN IZQUIERDA: FORMULARIO */}
        <section className="lg:col-span-7 space-y-6">

          {/* Card Datos Cliente */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8 animate-in slide-in-from-bottom-2 duration-500">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-900 text-white text-xs">1</span>
                Datos de Contacto
              </h2>
              {ordersOpenNow === false ? (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-bold text-red-700">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  Cerrado ahora
                </span>
              ) : ordersOpenNow === true ? (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Abierto
                </span>
              ) : null}
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Nombre completo</label>
                <input
                  className="w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-2.5 text-sm transition-all focus:border-slate-400 focus:bg-white focus:ring-4 focus:ring-slate-100"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej: Juan Pérez"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Teléfono</label>
                <input
                  className="w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-2.5 text-sm transition-all focus:border-slate-400 focus:bg-white focus:ring-4 focus:ring-slate-100"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D+/g, "").slice(0, 9))}
                  placeholder="600 000 000"
                  inputMode="tel"
                  maxLength={9}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Email <span className="text-slate-400 font-normal">(Opcional)</span></label>
                <input
                  className="w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-2.5 text-sm transition-all focus:border-slate-400 focus:bg-white focus:ring-4 focus:ring-slate-100"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="juan@ejemplo.com"
                  type="email"
                />
              </div>
              <div className="md:col-span-2">
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Notas para el pedido <span className="text-slate-400 font-normal">(Opcional)</span></label>
                <textarea
                  className="w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-2.5 text-sm transition-all focus:border-slate-400 focus:bg-white focus:ring-4 focus:ring-slate-100 min-h-[80px]"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ej: Sin cebolla, alérgico a los frutos secos, llamar al llegar..."
                />
              </div>
            </div>
          </div>



          {/* Card Entrega/Recogida */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8 animate-in slide-in-from-bottom-2 duration-500 delay-100">
            <h2 className="mb-6 text-lg font-bold text-slate-800 flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-900 text-white text-xs">2</span>
              Método de Entrega
            </h2>

            {deliveryConfig?.enabled && (
              <div className="flex gap-4 mb-6">
                <button onClick={() => setDeliveryMode('pickup')} className={`flex-1 py-3 px-4 rounded-xl border font-medium transition-all flex flex-col items-center gap-1 ${deliveryMode === 'pickup' ? 'border-emerald-600 bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600' : 'border-slate-200 hover:bg-slate-50 text-slate-600'}`}>
                  <span className="text-xl">🛍️</span>
                  <span>Para llevar</span>
                </button>
                <button onClick={() => setDeliveryMode('delivery')} className={`flex-1 py-3 px-4 rounded-xl border font-medium transition-all flex flex-col items-center gap-1 ${deliveryMode === 'delivery' ? 'border-rose-600 bg-rose-50 text-rose-700 ring-1 ring-rose-600' : 'border-slate-200 hover:bg-slate-50 text-slate-600'}`}>
                  <span className="text-xl">🛵</span>
                  <span>A Domicilio</span>
                </button>
              </div>
            )}

            {deliveryMode === 'delivery' && (
              <div className="space-y-4 mb-6 p-4 bg-slate-50 rounded-xl border border-slate-200">
                <h3 className="font-semibold text-slate-800 text-sm">Dirección de Entrega</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 sm:col-span-1">
                    <input className="w-full rounded-lg border-slate-300 px-3 py-2 text-sm" placeholder="Calle / Plaza" value={address.street} onChange={e => setAddress(p => ({ ...p, street: e.target.value }))} />
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <input className="w-full rounded-lg border-slate-300 px-3 py-2 text-sm" placeholder="Número" value={address.number} onChange={e => setAddress(p => ({ ...p, number: e.target.value }))} />
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <input className="w-full rounded-lg border-slate-300 px-3 py-2 text-sm" placeholder="Piso / Puerta (Opcional)" value={address.floor} onChange={e => setAddress(p => ({ ...p, floor: e.target.value }))} />
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <input className="w-full rounded-lg border-slate-300 px-3 py-2 text-sm" placeholder="Ciudad" value={address.city} onChange={e => setAddress(p => ({ ...p, city: e.target.value }))} />
                  </div>
                  <div className="col-span-2">
                    <input className="w-full rounded-lg border-slate-300 px-3 py-2 text-sm" placeholder="Código Postal (Opcional)" value={address.zip} onChange={e => setAddress(p => ({ ...p, zip: e.target.value }))} />
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Fecha</label>
                <div className="relative">
                  <input
                    type="date"
                    min={todayISO()}
                    className="w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-2.5 text-sm transition-all focus:border-slate-400 focus:bg-white focus:ring-4 focus:ring-slate-100"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Hora estimada</label>
                <select
                  className="w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-2.5 text-sm transition-all focus:border-slate-400 focus:bg-white focus:ring-4 focus:ring-slate-100 appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2220%22%20height%3D%2220%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22none%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M5%207.5L10%2012.5L15%207.5%22%20stroke%3D%22%236B7280%22%20stroke-width%3D%221.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[right_1rem_center]"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  disabled={timeSuggestions.length === 0}
                >
                  <option value="" disabled>--:--</option>
                  {timeSuggestions.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
                {time && timeError ? (
                  <p className="mt-2 text-xs font-medium text-rose-600 flex items-center gap-1">
                    ⚠️ {timeError}
                  </p>
                ) : (
                  <p className="mt-2 text-xs text-slate-500">
                    Horario hoy: <span className="font-medium text-slate-700">{formatDaySchedule(date, schedule)}</span>
                  </p>
                )}
              </div>
            </div>
            {ordersOpenNow === false && !timeError && time && (
              <div className="mt-4 p-3 bg-amber-50 border border-amber-100 rounded-xl text-xs text-amber-800 flex gap-2 items-start">
                <span className="text-xl">💡</span>
                <p className="mt-0.5">El local está cerrado ahora mismo, pero puedes dejar programado tu pedido para la hora seleccionada.</p>
              </div>
            )}
          </div>

          {/* Card Pago */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8 animate-in slide-in-from-bottom-2 duration-500 delay-200">
            <h2 className="mb-6 text-lg font-bold text-slate-800 flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-900 text-white text-xs">3</span>
              Método de Pago
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {methods.cash && (!(deliveryMode === 'delivery' && deliveryConfig && deliveryConfig.pay_on_delivery_enabled === false)) && (
                <label className={`relative flex cursor-pointer items-center justify-between rounded-xl border p-4 transition-all ${payment === "cash" ? "border-emerald-600 bg-emerald-50 ring-1 ring-emerald-600" : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"}`}>
                  <div className="flex items-center gap-3">
                    <input type="radio" name="payment" className="h-4 w-4 text-emerald-600 focus:ring-emerald-500" checked={payment === "cash"} onChange={() => setPayment("cash")} />
                    <div className="flex flex-col">
                      <span className="font-medium text-slate-900">
                        {deliveryMode === 'delivery' ? 'Pagar al recibir' : 'Pagar en el local'}
                      </span>
                      {deliveryMode === 'delivery' && (
                        <span className="text-xs text-slate-500">Efectivo o Datáfono</span>
                      )}
                    </div>
                  </div>
                  <span className="text-xl">💶</span>
                </label>
              )}
              {methods.card && (
                <label className={`relative flex cursor-pointer items-center justify-between rounded-xl border p-4 transition-all ${payment === "card" ? "border-emerald-600 bg-emerald-50 ring-1 ring-emerald-600" : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"}`}>
                  <div className="flex items-center gap-3">
                    <input type="radio" name="payment" className="h-4 w-4 text-emerald-600 focus:ring-emerald-500" checked={payment === "card"} onChange={() => setPayment("card")} />
                    <span className="font-medium text-slate-900">Tarjeta ahora</span>
                  </div>
                  <span className="text-xl">💳</span>
                </label>
              )}
            </div>
            <p className="mt-4 text-xs text-slate-500 text-center">
              Transacciones seguras y encriptadas. No almacenamos datos de tu tarjeta.
            </p>
          </div>

        </section>

        {/* SECCIÓN DERECHA: RESUMEN (Sticky) */}
        <section className="lg:col-span-5">
          <div className="sticky top-8 space-y-6">
            <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
              <div className="bg-slate-900 px-6 py-4 flex items-center justify-between">
                <h2 className="text-white font-semibold">Resumen del Pedido</h2>
                <span className="bg-white/20 text-white text-xs font-bold px-2 py-1 rounded-md">{items.length} ítems</span>
              </div>

              <div className="max-h-[40vh] overflow-y-auto p-0">
                {items.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 italic">Tu carrito está vacío.</div>
                ) : (
                  <ul className="divide-y divide-slate-100">
                    {items.map((it) => (
                      <li key={`${String(it.id)}-${it.variantKey || "base"}`} className="p-4 hover:bg-slate-50 transition-colors group">
                        <div className="flex gap-4">
                          <div className="h-16 w-16 flex-shrink-0 rounded-lg border border-slate-100 bg-slate-50 overflow-hidden">
                            {it.image ? (
                              <img src={it.image} alt={it.name} className="h-full w-full object-cover" />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-xs text-slate-300">Sin foto</div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start mb-1">
                              <p className="font-semibold text-slate-900 truncate pr-2">{it.name}</p>
                              <p className="font-bold text-slate-900 whitespace-nowrap">{it.price.toFixed(2)} €</p>
                            </div>

                            {it.options && it.options.length > 0 && (
                              <ul className="mb-2 space-y-0.5">
                                {it.options.map((opt, idx) => (
                                  <li key={idx} className="text-xs text-slate-500 flex justify-between">
                                    <span>+ {opt.name}</span>
                                    {opt.price_delta ? <span>+{opt.price_delta.toFixed(2)} €</span> : null}
                                  </li>
                                ))}
                              </ul>
                            )}

                            <div className="flex items-center gap-3 mt-2">
                              <div className="flex items-center bg-white border border-slate-200 rounded-lg shadow-sm">
                                <button onClick={() => setQty(it.id, Math.max(1, it.qty - 1), it.variantKey || undefined)} className="px-2 py-0.5 text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-colors">-</button>
                                <span className="px-2 text-xs font-semibold text-slate-700">{it.qty}</span>
                                <button onClick={() => setQty(it.id, it.qty + 1, it.variantKey || undefined)} className="px-2 py-0.5 text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-colors">+</button>
                              </div>
                              <button onClick={() => removeItem(it.id, it.variantKey || undefined)} className="text-xs text-slate-400 hover:text-red-500 transition-colors underline decoration-dotted">
                                Eliminar
                              </button>
                            </div>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="bg-slate-50 p-6 space-y-3 border-t border-slate-100">
                <div className="flex justify-between text-sm text-slate-600">
                  <span>Subtotal</span>
                  <span>{subtotal.toFixed(2)} €</span>
                </div>
                {discount > 0 && appliedPromotion && (
                  <div className="flex justify-between text-sm text-emerald-600 font-medium">
                    <span>Promo ({appliedPromotion.name})</span>
                    <span>-{discount.toFixed(2)} €</span>
                  </div>
                )}
                {deliveryMode === 'delivery' && deliveryConfig && (
                  <div className="flex justify-between text-sm text-slate-600">
                    <span>Envío a domicilio</span>
                    <span>{deliveryFee === 0 ? 'Gratis' : `${deliveryFee.toFixed(2)} €`}</span>
                  </div>
                )}
                <div className="pt-3 border-t border-slate-200 flex justify-between items-end">
                  <span className="text-base font-bold text-slate-700">Total a pagar</span>
                  <span className="text-2xl font-bold text-slate-900">{finalTotal.toFixed(2)} €</span>
                </div>
              </div>

              <div className="p-6 bg-white border-t border-slate-100">
                <ConfirmSubmitButton
                  onClick={onConfirm}
                  disabled={!canSubmit}
                  title={submitReason || undefined}
                  className="w-full py-4 text-base rounded-xl shadow-lg shadow-emerald-500/20"
                />

                {(!canSubmit && submitReason) && (
                  <div className="mt-3 p-3 bg-red-50 border border-red-100 rounded-lg flex gap-2 items-center text-xs text-red-700">
                    <span className="font-bold">Error:</span> {submitReason}
                  </div>
                )}

                <button
                  onClick={() => clearCart()}
                  disabled={items.length === 0}
                  className="mt-3 w-full py-2 text-xs font-semibold text-slate-400 hover:text-slate-600 transition-colors"
                  type="button"
                >
                  Vaciar todo el carrito
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div >
  );
}

function CartDisabledNotice({ plan, ordersEnabled }: { plan: SubscriptionPlan; ordersEnabled: boolean }) {
  let label = "";
  if (!subscriptionAllowsOrders(plan)) {
    label = plan === "starter" ? "Starter" : "Medium";
  } else if (!ordersEnabled) {
    label = "Premium (pedidos desactivados)";
  }
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="rounded border border-amber-200 bg-amber-50 p-6 text-amber-800 shadow-sm">
        <h1 className="mb-2 text-xl font-semibold">Pedidos online desactivados</h1>
        <p className="text-sm">
          Este comercio usa el plan {label}, por lo que el carrito y la recepcion de pedidos no esta disponible en esta web.
        </p>
      </div>
    </div>
  );
}




export default function CartPage() {
  const plan = useSubscriptionPlan();
  const ordersEnabled = useOrdersEnabled();
  if (!subscriptionAllowsOrders(plan) || !ordersEnabled) {
    return <CartDisabledNotice plan={plan} ordersEnabled={ordersEnabled} />;
  }
  return <CartPageContent />;
}
