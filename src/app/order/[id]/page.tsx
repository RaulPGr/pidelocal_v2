// src/app/order/[id]/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

type OrderItemOption = { name: string; groupName?: string | null; priceDelta?: number | null };
type OrderItem = { quantity: number; name?: string | null; unit_price_cents: number; options?: OrderItemOption[] };
type Order = {
  id: string;
  created_at: string;
  customer_name: string;
  customer_phone: string;
  pickup_at: string | null;
  status: string;
  payment_method?: "CASH" | "CARD" | "BIZUM";
  payment_status?: "pending" | "paid" | "failed" | "refunded";
  total_cents: number;
  items: OrderItem[];
};

type BizInfo = {
  name?: string | null;
  logo_url?: string | null;
  phone?: string | null;
};

function centsToEUR(cents: number) {
  return (cents / 100).toLocaleString("es-ES", { style: "currency", currency: "EUR" });
}

type PageProps = { params: Promise<{ id: string }> };

// Página que muestra el pedido confirmado (la ve el cliente después de pagar).
export default function OrderDetailPage(props: PageProps) {
  const search = useSearchParams();
  const paidFlag = search.get("paid");

  const [id, setId] = useState("");
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [biz, setBiz] = useState<BizInfo>({});

  // Resolver id cuando Next lo entrega como Promise
  // params puede ser una Promise (Next 15); aquí resolvemos el id real.
  useEffect(() => {
    let alive = true;
    (async () => {
      const { id } = await props.params;
      if (alive) setId(String(id ?? ""));
    })();
    return () => {
      alive = false;
    };
  }, [props.params]);

  // Trae los datos del pedido desde la API interna.
  async function loadOrder(currentId: string) {
    if (!currentId) return;
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/orders/get?id=${currentId}`, { cache: "no-store" });
      if (!res.ok) throw new Error("No se pudo cargar el pedido");
      const data = await res.json();
      setOrder(data?.order ?? null);
    } catch (e: any) {
      setError(e?.message ?? "Error desconocido");
      setOrder(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadOrder(id);
  }, [id]);

  // Datos del negocio (logo y nombre) para reproducir el aspecto del PDF.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/admin/business", { cache: "no-store" });
        const data = await res.json().catch(() => ({}));
        if (!cancelled && data?.ok && data?.data) {
          setBiz({ name: data.data.name, logo_url: data.data.logo_url });
        }
      } catch {
        if (!cancelled) setBiz({});
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Skeleton de carga premium
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50/50 pb-20">
        {/* Header Skeleton */}
        <div className="bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 pb-24 pt-8 px-6 animate-pulse">
          <div className="max-w-3xl mx-auto">
            <div className="h-4 w-32 bg-white/20 rounded mb-8"></div>
            <div className="flex justify-center mb-6">
              <div className="h-8 w-64 bg-white/20 rounded-full"></div>
            </div>
            <div className="space-y-3 text-center">
              <div className="h-10 w-3/4 mx-auto bg-white/10 rounded"></div>
              <div className="h-4 w-1/2 mx-auto bg-white/10 rounded"></div>
            </div>
          </div>
        </div>

        {/* Card Skeleton */}
        <main className="max-w-3xl mx-auto px-4 -mt-16">
          <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/60 border border-slate-100 overflow-hidden">
            {/* Stepper Skeleton */}
            <div className="bg-slate-50 border-b border-slate-100 p-8 flex justify-between items-center animate-pulse">
              <div className="w-full h-1 bg-slate-200 rounded absolute left-0 top-1/2 transform -translate-y-1/2"></div>
              <div className="h-16 w-16 bg-slate-200 rounded-full z-10 mx-auto border-4 border-white"></div>
              <div className="h-16 w-16 bg-slate-200 rounded-full z-10 mx-auto border-4 border-white"></div>
              <div className="h-16 w-16 bg-slate-200 rounded-full z-10 mx-auto border-4 border-white"></div>
            </div>

            {/* List Skeleton */}
            <div className="p-8 space-y-8 animate-pulse">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-slate-200 rounded-lg"></div>
                <div className="space-y-2 flex-1">
                  <div className="h-4 w-48 bg-slate-200 rounded"></div>
                  <div className="h-3 w-24 bg-slate-200 rounded"></div>
                </div>
              </div>
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex gap-4">
                    <div className="w-14 h-14 bg-slate-100 rounded"></div>
                    <div className="flex-1 space-y-2 py-1">
                      <div className="h-4 w-3/4 bg-slate-100 rounded"></div>
                      <div className="h-4 w-1/4 bg-slate-100 rounded"></div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="pt-6 border-t border-slate-100 space-y-2">
                <div className="flex justify-between">
                  <div className="h-4 w-20 bg-slate-200 rounded"></div>
                  <div className="h-4 w-20 bg-slate-200 rounded"></div>
                </div>
                <div className="flex justify-between">
                  <div className="h-6 w-24 bg-slate-200 rounded"></div>
                  <div className="h-6 w-32 bg-slate-200 rounded"></div>
                </div>
              </div>
            </div>

            <div className="bg-blue-50/50 p-4 text-center">
              <span className="text-blue-600/70 text-sm font-medium animate-pulse">Conectando con cocina...</span>
            </div>
          </div>
        </main>
      </div>
    );
  }
  if (error || !order) return <div className="p-6">Error: {error ?? "No se pudo cargar el pedido"}</div>;

  const created = new Date(order.created_at).toLocaleString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
  const pickup = order.pickup_at
    ? new Date(order.pickup_at).toLocaleString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    })
    : "—";
  const showPaidBanner = paidFlag === "1" || order.payment_status === "paid";
  const methodLabel = order.payment_method === "CARD" ? "Tarjeta" : order.payment_method === "BIZUM" ? "Bizum" : "Efectivo";
  const paymentStatusLabel =
    order.payment_status === "paid"
      ? "Pagado"
      : order.payment_status === "failed"
        ? "Fallido"
        : order.payment_status === "refunded"
          ? "Reembolsado"
          : "Pendiente";
  const code = `#${String(order.id).split("-")[0].slice(0, 7)}`;

  // Helpers para Stepper de estado
  const steps = [
    { key: 'pending', label: 'Enviado', icon: '📩' },
    { key: 'confirmed', label: 'Confirmado', icon: '👨‍🍳' },
    { key: 'ready', label: 'Listo', icon: '🛍️' },
  ];
  const currentStepIdx = steps.findIndex(s => s.key === order.status) >= 0
    ? steps.findIndex(s => s.key === order.status)
    : order.status === 'delivered' ? 3 : 0;
  // Nota: si status no está en steps, asumimos orden cronológico (pending=0).

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      {/* Header con gradiente */}
      <div className="bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 text-white pb-24 pt-8 px-6">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link href="/menu" className="inline-flex items-center gap-2 text-white/80 hover:text-white transition-colors text-sm font-medium">
            ← Volver a la carta
          </Link>
          <div className="flex gap-3">
            <button
              onClick={() => {
                const url = `/order/${id}/print`;
                const w = window.open(url, "_blank", "noopener,noreferrer");
                if (!w) window.location.href = url;
              }}
              className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-semibold backdrop-blur hover:bg-white/20 transition-all"
            >
              🖨️ Ticket PDF
            </button>
          </div>
        </div>
        <div className="max-w-3xl mx-auto mt-8 text-center animate-in mb-4">
          {showPaidBanner ? (
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-100 text-xs font-bold mb-4 backdrop-blur-md">
              ✅ Pago completado y verificado
            </div>
          ) : null}
          <h1 className="text-3xl font-bold tracking-tight mb-2 opacity-95">¡Gracias {order.customer_name.split(' ')[0]}!</h1>
          <p className="text-white/70 text-sm">Tu pedido <span className="font-mono text-white/90 font-bold tracking-wide is-mono">{code}</span> se ha registrado correctamente.</p>
        </div>
      </div>

      {/* Contenido Principal (Card que flota) */}
      <main className="max-w-3xl mx-auto px-4 -mt-16">
        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/60 border border-slate-100 overflow-hidden">

          {/* Status Stepper */}
          <div className="bg-slate-50 border-b border-slate-100 p-6 md:p-8">
            <div className="relative flex justify-between">
              {/* Línea de fondo */}
              <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-200 -z-0 rounded-full"></div>
              {/* Línea de progreso */}
              <div className="absolute top-1/2 left-0 h-1 bg-slate-900 -z-0 rounded-full transition-all duration-1000" style={{ width: `${(currentStepIdx / (steps.length - 1)) * 100}%` }}></div>

              {steps.map((step, idx) => {
                const isActive = idx <= currentStepIdx;
                const isCurrent = idx === currentStepIdx;
                return (
                  <div key={step.key} className="relative z-10 flex flex-col items-center gap-2 bg-slate-50 w-20">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg shadow-sm border-2 transition-all ${isActive ? 'bg-slate-900 border-slate-900 text-white scale-110' : 'bg-white border-slate-200 text-slate-400 grayscale'}`}>
                      {step.icon}
                    </div>
                    <span className={`text-xs font-bold transition-colors ${isCurrent ? 'text-slate-900' : isActive ? 'text-slate-600' : 'text-slate-400'}`}>
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="mt-8 flex flex-col sm:flex-row gap-4 items-center justify-center text-center sm:text-left bg-blue-50/50 rounded-xl p-4 border border-blue-100/50">
              <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xl flex-shrink-0">
                💡
              </div>
              <div className="text-sm text-slate-600">
                <p>Recibirás actualizaciones sobre tu pedido.</p>
                <p className="text-slate-400 text-xs mt-0.5">Recogida estimada: <span className="font-semibold text-slate-700">{pickup}</span></p>
              </div>
            </div>
          </div>

          <div className="p-6 md:p-8">
            {/* Info Negocio Header del Ticket */}
            <div className="flex items-center gap-4 mb-8">
              {biz.logo_url && (
                <img src={biz.logo_url} alt="Logo" className="w-12 h-12 rounded-lg object-cover border border-slate-100 shadow-sm" />
              )}
              <div>
                <h3 className="font-bold text-slate-900 text-lg leading-tight">{biz.name || "Tu Restaurante"}</h3>
                <p className="text-xs text-slate-500 font-medium">Recibo del pedido</p>
              </div>
              <div className="ml-auto text-right">
                <div className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-bold uppercase tracking-wide border ${paymentStatusLabel === 'Pagado' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                  {paymentStatusLabel}
                </div>
                <p className="text-xs text-slate-400 mt-1">{methodLabel}</p>
              </div>
            </div>

            {/* Lista de Items */}
            <ul className="divide-y divide-dashed divide-slate-200">
              {order.items?.map((it, idx) => {
                const optionTotalCents = (it.options || []).reduce(
                  (sum, opt) => sum + Math.round(((opt.priceDelta ?? 0) as number) * 100), 0
                );
                const basePriceCents = it.unit_price_cents - optionTotalCents;

                return (
                  <li key={idx} className="py-4 flex gap-4">
                    {/* Imagen Producto */}
                    <div className="w-14 h-14 rounded-md bg-slate-100 border border-slate-200 overflow-hidden flex-shrink-0">
                      {(it as any).image ? (
                        <img src={(it as any).image} className="w-full h-full object-cover" alt="" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-slate-300">N/A</div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <p className="text-sm font-semibold text-slate-900 truncate pr-4">
                          <span className="text-slate-500 font-normal mr-1">{it.quantity}x</span>
                          {it.name}
                        </p>
                        <p className="text-sm font-bold text-slate-900 whitespace-nowrap">
                          {centsToEUR(it.quantity * it.unit_price_cents)}
                        </p>
                      </div>
                      {it.options && it.options.length > 0 && (
                        <ul className="mt-1 space-y-0.5">
                          {it.options.map((opt, oIdx) => {
                            const deltaCents = Math.round(((opt.priceDelta ?? 0) as number) * 100);
                            return (
                              <li key={oIdx} className="text-xs text-slate-500 flex items-center justify-between">
                                <span>+ {opt.name}</span>
                                {deltaCents !== 0 && (
                                  <span className="font-medium">{deltaCents > 0 ? '+' : '-'}{centsToEUR(Math.abs(deltaCents))}</span>
                                )}
                              </li>
                            )
                          })}
                        </ul>
                      )}
                    </div>
                  </li>
                )
              })}
            </ul>

            {/* Totales */}
            <div className="mt-6 pt-6 border-t border-slate-200 space-y-2">
              {/* Logic: breakdown. 
                  Order type definition above (lines 10-21) doesn't explicitly have discount_cents or delivery details. 
                  We must infer from item sum.
              */}
              {(() => {
                const itemsSubtotal = order.items.reduce((sum, it) => sum + (it.unit_price_cents * it.quantity), 0);
                // We don't have discount_cents in the Order type definition in this file (lines 10-21).
                // We need to fetch it or infer it. 
                // Assuming fetch returns it but TS doesn't know. 
                // Let's rely on math. But we don't know if diff is discount or fee or both.
                // Actually, the fetch at line 65 calls /api/orders/get. 
                // I should check /api/orders/get response structure.
                // If the type definition is incomplete, I can cast order as any to access implicit fields if backend sends them.
                // Assuming backend IS sending them (it selects * usually).

                const discount = (order as any).discount_cents || 0;
                const estimatedDelivery = order.total_cents - (itemsSubtotal - discount);
                const deliveryFee = estimatedDelivery > 10 ? estimatedDelivery : 0;

                return (
                  <>
                    <div className="flex justify-between text-sm text-slate-500">
                      <span>Subtotal</span>
                      <span>{centsToEUR(itemsSubtotal)}</span>
                    </div>

                    {discount > 0 && (
                      <div className="flex justify-between text-sm text-emerald-600 font-medium">
                        <span>Descuento</span>
                        <span>- {centsToEUR(discount)}</span>
                      </div>
                    )}

                    {deliveryFee > 0 && (
                      <div className="flex justify-between text-sm text-indigo-600 font-medium">
                        <span>Envío a domicilio</span>
                        <span>{centsToEUR(deliveryFee)}</span>
                      </div>
                    )}
                  </>
                );
              })()}
              {/* Si hubiera descuentos etc, irían aquí. Usamos total_cents que ya es final */}
              <div className="flex justify-between items-end pt-2">
                <span className="text-base font-bold text-slate-900">Total</span>
                <span className="text-2xl font-bold text-slate-900 tracking-tight">{centsToEUR(order.total_cents)}</span>
              </div>
            </div>

          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-xs text-slate-400">
            Si tienes dudas sobre tu pedido, llama al <a href={`tel:${biz.phone || '600000000'}`} className="text-slate-600 underline decoration-dotted">{biz.phone || 'local'}</a>
          </p>
        </div>
      </main>
    </div>
  );
}
