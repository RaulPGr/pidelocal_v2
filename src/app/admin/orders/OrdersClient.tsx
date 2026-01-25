"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAdminAccess } from "@/context/AdminAccessContext";
import { subscriptionAllowsOrders } from "@/lib/subscription";
import { Search, Filter, RefreshCw, Clock, MapPin, Phone, User, CreditCard, ChevronDown, ChevronUp, AlertCircle, Volume2, VolumeX } from "lucide-react";
import clsx from "clsx";

type OrderStatus = "pending" | "confirmed" | "preparing" | "ready" | "delivered" | "cancelled";

type OrderRow = {
  id: string;
  code: string | null;
  customer_name: string;
  customer_phone: string | null;
  notes?: string | null;
  pickup_at: string | null;
  status: OrderStatus;
  total_cents: number;
  discount_cents?: number;
  payment_method: string | null;
  payment_status: string | null;
  created_at: string;
};

type OrderItemOption = {
  name: string;
  groupName?: string | null;
  priceDelta?: number | null;
};

type OrderItem = {
  id: string;
  product_id: number | null;
  name: string;
  unit_price_cents: number;
  quantity: number;
  line_total_cents: number;
  options?: OrderItemOption[];
};

type OrderDetailResponse = {
  ok: boolean;
  data?: { order: OrderRow; items: OrderItem[] };
  message?: string;
};

type ListResponse = { ok: boolean; data?: OrderRow[]; message?: string };

const estadoEtiqueta: Record<OrderStatus, string> = {
  pending: "Pendiente",
  confirmed: "Confirmado",
  preparing: "Preparando",
  ready: "Listo",
  delivered: "Entregado",
  cancelled: "Cancelado",
};

const pagarEtiqueta: Record<string, string> = { cash: "Efectivo", card: "Tarjeta", stripe: "Tarjeta Online" };

function eur(cents: number) {
  return (cents / 100).toLocaleString("es-ES", { style: "currency", currency: "EUR" });
}

function eurFloat(value: number) {
  return value.toLocaleString("es-ES", { style: "currency", currency: "EUR" });
}

function formatOptionLine(opt: OrderItemOption) {
  const namePart = opt.groupName ? `${opt.groupName}: ${opt.name}` : opt.name;
  if (opt.priceDelta && opt.priceDelta !== 0) {
    const signed = `${opt.priceDelta > 0 ? "+" : "-"}${eurFloat(Math.abs(opt.priceDelta))}`;
    return `${namePart} (${signed})`;
  }
  return namePart;
}

const NEW_WINDOW_MS = 120000; // 2 minutos para considerar "reciente"

// Pantalla principal de gestión de pedidos en el panel.
export default function OrdersClient() {
  const { plan, isSuper } = useAdminAccess();
  const limited = !subscriptionAllowsOrders(plan) && !isSuper;

  if (limited) {
    return (
      <div className="glass-panel p-8 text-center border-l-4 border-amber-400">
        <h3 className="text-xl font-bold text-slate-800 mb-2">Función Premium</h3>
        <p className="text-slate-600 mb-4">Tu suscripción actual no incluye la gestión de pedidos online.</p>
        <button className="btn-primary">Actualizar a Premium</button>
      </div>
    );
  }

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | OrderStatus>("all");
  const [activeSort, setActiveSort] = useState<"pickup" | "created">("pickup");

  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(false);

  const [openDetailId, setOpenDetailId] = useState<string | null>(null);
  const [detailCache, setDetailCache] = useState<Record<string, OrderItem[]>>({});
  const [detailLoading, setDetailLoading] = useState<Record<string, boolean>>({});
  const [highlights, setHighlights] = useState<Record<string, boolean>>({});
  const [seen, setSeen] = useState<Record<string, boolean>>({});

  useEffect(() => {
    // Load seen from localStorage
    try {
      const raw = localStorage.getItem('orders-seen');
      if (raw) {
        setSeen(JSON.parse(raw));
      }
    } catch { }

    void reload();
  }, []);

  // Realtime Subscription (Data Sync)
  useEffect(() => {
    const channel = supabase
      .channel("orders-admin")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "orders" }, (payload: any) => {
        // We rely on the global NewOrderSound component component to handle the sound/notification.
        // But we still want to reload the list locally.
        setTimeout(() => void reload(), 500);
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "orders" }, () => {
        setTimeout(() => void reload(), 500);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  // Listen for Global "New Order" Event (dispatched by NewOrderSound or manual trigger)
  // This is purely for UI Highlighting / Reloading when the event occurs.
  useEffect(() => {
    const onNew = (ev: CustomEvent) => {
      const id = ev.detail?.id;
      if (id) {
        setHighlights(prev => ({ ...prev, [id]: true }));
        // Ensure list is fresh
        void reload();
      } else {
        void reload();
      }
    };
    window.addEventListener('pl:new-order', onNew as any);
    return () => window.removeEventListener('pl:new-order', onNew as any);
  }, []);

  async function reload() {
    setLoading(true);
    try {
      const url = new URL("/api/orders/list", window.location.origin);
      if (query.trim()) url.searchParams.set("q", query.trim());
      if (statusFilter !== "all") url.searchParams.set("status", statusFilter);

      const r = await fetch(url.toString(), { cache: "no-store" });
      const json: ListResponse = await r.json();

      if (json.ok && json.data) {
        setOrders(json.data);
      } else {
        setOrders([]);
      }
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }

  const { activos, historico } = useMemo(() => {
    const a: OrderRow[] = [];
    const h: OrderRow[] = [];
    for (const o of orders) {
      (o.status === "delivered" || o.status === "cancelled") ? h.push(o) : a.push(o);
    }
    const toMs = (iso: string | null) => (iso ? new Date(iso).getTime() : Number.POSITIVE_INFINITY);
    if (activeSort === "pickup") {
      a.sort((x, y) => {
        const ax = toMs(x.pickup_at) !== Infinity ? toMs(x.pickup_at) : (new Date(x.created_at).getTime() + 9e12);
        const ay = toMs(y.pickup_at) !== Infinity ? toMs(y.pickup_at) : (new Date(y.created_at).getTime() + 9e12);
        return ax - ay;
      });
    } else {
      a.sort((x, y) => y.created_at.localeCompare(x.created_at));
    }
    h.sort((x, y) => y.created_at.localeCompare(x.created_at));
    return { activos: a, historico: h };
  }, [orders, activeSort]);

  async function changeStatus(order: OrderRow, next: OrderStatus) {
    if (order.status === next) return;
    setOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, status: next } : o)));
    try {
      const r = await fetch(`/api/orders/${order.id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      const json = await r.json();
      if (!r.ok || !json?.ok) throw new Error(json?.message || "No se pudo actualizar el estado");
    } catch {
      setOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, status: order.status } : o)));
      alert("No se pudo actualizar el estado del pedido");
    }
  }

  async function toggleDetail(order: OrderRow) {
    const id = order.id;
    const opening = id !== openDetailId;
    setOpenDetailId(opening ? id : null);
    if (opening) {
      setHighlights((prev) => (prev[id] ? { ...prev, [id]: false } : prev));
      const nextSeen = { ...seen, [id]: true };
      setSeen(nextSeen);
      localStorage.setItem('orders-seen', JSON.stringify(nextSeen));
    }
    if (!opening) return;
    if (detailCache[id]) return;
    setDetailLoading((s) => ({ ...s, [id]: true }));
    try {
      const r = await fetch(`/api/orders/${id}`);
      const json: OrderDetailResponse = await r.json();
      if (!json.ok || !json.data) throw new Error(json.message || "No se pudo cargar el detalle");
      setDetailCache((c) => ({ ...c, [id]: json.data!.items }));
    } catch {
      alert("No se pudo cargar el detalle del pedido");
    } finally {
      setDetailLoading((s) => ({ ...s, [id]: false }));
    }
  }

  const getStatusColor = (s: OrderStatus) => {
    switch (s) {
      case 'pending': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'confirmed': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'preparing': return 'bg-indigo-100 text-indigo-700 border-indigo-200';
      case 'ready': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'delivered': return 'bg-slate-100 text-slate-600 border-slate-200';
      case 'cancelled': return 'bg-rose-100 text-rose-700 border-rose-200';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Filtros */}
      <div className="glass-panel p-4 rounded-2xl flex flex-col lg:flex-row gap-4 items-center justify-between">
        <div className="text-sm font-medium text-slate-500 pl-2">
          {loading ? "Sincronizando..." : `Mostrando ${orders.length} pedidos`}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
          {/* Sound Toggle */}
          {/* Sound Toggle handled globally by AdminLayout */}

          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={query} onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar pedido..."
              className="glass-input w-full pl-10 pr-4 py-2 rounded-xl text-sm"
            />
          </div>

          <select
            value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)}
            className="glass-input px-4 py-2 rounded-xl text-sm"
          >
            <option value="all">Todos los estados</option>
            <option value="pending">Pendientes</option>
            <option value="confirmed">Confirmados</option>
            <option value="preparing">En cocina</option>
            <option value="ready">Listos</option>
          </select>

          <select
            value={activeSort} onChange={(e) => setActiveSort(e.target.value as any)}
            className="glass-input px-4 py-2 rounded-xl text-sm"
          >
            <option value="pickup">Por hora recogida</option>
            <option value="created">Por fecha pedido</option>
          </select>

          <button onClick={() => void reload()} className="p-2 rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/20">
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={async () => {
              setLoading(true);
              try {
                const res = await fetch('/api/orders/sync-stripe', { method: 'POST' });
                const json = await res.json();
                if (json.ok) {
                  if (json.restored > 0) alert(json.message);
                  void reload();
                } else {
                  alert('Error: ' + json.message);
                }
              } catch (e) { alert('Error al sincronizar'); }
              setLoading(false);
            }}
            className="p-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-600/20"
            title="Sincronizar Pagos Online (Stripe)"
          >
            <CreditCard className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Activos Grid */}
      <div className="grid grid-cols-1 gap-4">
        {activos.map((o) => (
          <div
            key={o.id}
            className={clsx(
              'glass-panel overflow-hidden transition-all duration-300',
              highlights[o.id] ? 'ring-2 ring-emerald-500 shadow-emerald-500/10' : 'hover:shadow-lg'
            )}
          >
            {/* Header Card */}
            <div className="p-5 border-b border-white/20 bg-slate-50/30 flex flex-wrap gap-4 justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="px-3 py-1 rounded-lg bg-slate-200/50 text-slate-700 font-mono font-bold text-sm">
                  #{(o.code ?? o.id).slice(-4).toUpperCase()}
                </div>
                {highlights[o.id] || (!seen[o.id] && (Date.now() - new Date(o.created_at).getTime()) < NEW_WINDOW_MS) ? (
                  <span className="animate-pulse px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-bold uppercase tracking-wider shadow-sm">NUEVO</span>
                ) : seen[o.id] ? (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 text-[10px] font-bold uppercase tracking-wider">Visto</span>
                ) : null}

                <div className="text-xs text-slate-400 font-medium ml-2">
                  {new Date(o.created_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {o.pickup_at && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-100 text-amber-700 text-xs font-bold">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{new Date(o.pickup_at).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}</span>
                  </div>
                )}
                {/* Delivery Badge */}
                {o.notes?.includes('[ENTREGA DOMICILIO]') && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-bold animate-in zoom-in duration-300">
                    <span className="text-sm">🛵</span>
                    <span>Domicilio</span>
                  </div>
                )}
                <span className={clsx("px-3 py-1.5 rounded-full text-xs font-bold uppercase border", getStatusColor(o.status))}>
                  {estadoEtiqueta[o.status]}
                </span>
              </div>
            </div>

            <div className="p-5">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                <div>
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1"><User className="w-3 h-3" /> Cliente</div>
                  <div className="font-semibold text-slate-800">{o.customer_name}</div>
                  {o.customer_phone && <div className="text-sm text-slate-500 flex items-center gap-1 mt-1"><Phone className="w-3 h-3" /> {o.customer_phone}</div>}
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1"><CreditCard className="w-3 h-3" /> Pago</div>
                  <div className="text-sm text-slate-700 font-medium capitalize">{pagarEtiqueta[o.payment_method || "cash"] || o.payment_method}</div>
                  <div className={clsx("text-xs font-bold mt-1", o.payment_status === "paid" ? "text-emerald-600" : "text-amber-600")}>
                    {o.payment_status === "paid" ? "PAGADO" : "PENDIENTE PAGO"}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total</div>
                  <div className="text-xl font-bold text-slate-900">{eur(o.total_cents)}</div>
                </div>
                <div className="flex flex-col justify-center">
                  <button onClick={() => void toggleDetail(o)} className="w-full py-2 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-sm font-medium text-slate-600 transition-colors flex items-center justify-center gap-2">
                    {openDetailId === o.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    {openDetailId === o.id ? "Ocultar detalles" : "Ver detalles"}
                  </button>
                </div>
              </div>

              {/* Smart Actions based on Status */}
              <div className="flex flex-wrap gap-3 pt-4 border-t border-slate-100">
                {o.status === 'pending' && (
                  <>
                    <button
                      onClick={() => void changeStatus(o, 'confirmed')}
                      className="flex-1 bg-slate-900 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg shadow-slate-900/20 hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
                    >
                      ✅ Aceptar Pedido
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('¿Seguro que quieres cancelar este pedido?')) void changeStatus(o, 'cancelled');
                      }}
                      className="bg-white text-rose-600 border border-slate-200 px-4 py-2 rounded-xl text-sm font-bold hover:bg-rose-50 hover:border-rose-200 transition-all"
                    >
                      rechazar
                    </button>
                  </>
                )}

                {(o.status === 'confirmed' || o.status === 'preparing') && (
                  <button
                    onClick={() => void changeStatus(o, 'ready')}
                    className="flex-1 bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition-all flex items-center justify-center gap-2"
                  >
                    🔔 Marcar como LISTO
                  </button>
                )}

                {o.status === 'ready' && (
                  <button
                    onClick={() => void changeStatus(o, 'delivered')}
                    className="flex-1 bg-slate-100 text-slate-700 border border-slate-200 px-4 py-2 rounded-xl text-sm font-bold hover:bg-slate-200 transition-all flex items-center justify-center gap-2"
                  >
                    🤝 Marcar como ENTREGADO
                  </button>
                )}

                {(o.status === 'delivered' || o.status === 'cancelled') && (
                  <div className="text-xs text-slate-400 font-medium italic w-full text-center">
                    Pedido finalizado.
                  </div>
                )}
              </div>

              {/* Details Section */}
              {openDetailId === o.id && (
                <div className="mt-6 bg-slate-50/50 rounded-xl border border-slate-100 overflow-hidden animate-in slide-in-from-top-2 duration-200">
                  {o.notes && (
                    <div className="bg-amber-50 px-4 py-3 border-b border-amber-100 flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="text-xs font-bold text-amber-700 uppercase block mb-0.5">Nota del cliente</span>
                        <p className="text-sm text-amber-800 italic">{o.notes}</p>
                      </div>
                    </div>
                  )}

                  <div className="overflow-x-auto max-w-full">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-100 text-slate-500 font-semibold text-xs uppercase">
                        <tr>
                          <th className="px-4 py-3 w-16 text-center">Cant.</th>
                          <th className="px-4 py-3">Producto</th>
                          <th className="px-4 py-3 text-right">Precio</th>
                          <th className="px-4 py-3 text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {detailLoading[o.id] ? (
                          <tr><td colSpan={4} className="p-8 text-center text-slate-400"><RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />Cargando items...</td></tr>
                        ) : (detailCache[o.id] || []).map((it) => (
                          <tr key={it.id} className="hover:bg-white transition-colors">
                            <td className="px-4 py-3 text-center font-bold text-slate-700">{it.quantity}</td>
                            <td className="px-4 py-3">
                              <div className="font-medium text-slate-900">{it.name}</div>
                              {it.options && it.options.length > 0 && (
                                <ul className="mt-1 space-y-0.5">
                                  {it.options.map((opt, idx) => (
                                    <li key={idx} className="text-xs text-slate-500 flex items-center gap-1">
                                      <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                      {formatOptionLine(opt)}
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </td>
                            <td className="px-4 py-3 text-right text-slate-500">{eur(it.unit_price_cents)}</td>
                            <td className="px-4 py-3 text-right font-medium text-slate-900">{eur(it.line_total_cents)}</td>
                          </tr>
                        ))}
                        {/* Breakdown Logic appended to body to share column widths easily or modify structure */}
                        {!detailLoading[o.id] && detailCache[o.id] && (
                          <>
                            {/* Calculated Breakdown */}
                            {(() => {
                              const itemsSubtotal = (detailCache[o.id] || []).reduce((acc, it) => acc + it.line_total_cents, 0);
                              const discount = o.discount_cents || 0;
                              const estimatedDelivery = o.total_cents - (itemsSubtotal - discount);
                              const deliveryFee = estimatedDelivery > 10 ? estimatedDelivery : 0; // >10 cents to avoid rounding noise

                              return (
                                <>
                                  <tr><td colSpan={4} className="h-px bg-slate-100 p-0"></td></tr>

                                  {/* Subtotal */}
                                  {(discount > 0 || deliveryFee > 0) && (
                                    <tr className="text-slate-600">
                                      <td colSpan={3} className="px-4 py-2 text-right text-xs uppercase font-bold tracking-wider">Subtotal</td>
                                      <td className="px-4 py-2 text-right font-medium">{eur(itemsSubtotal)}</td>
                                    </tr>
                                  )}

                                  {/* Discount */}
                                  {discount > 0 && (
                                    <tr className="text-emerald-600 bg-emerald-50">
                                      <td colSpan={3} className="px-4 py-2 text-right text-xs uppercase font-bold tracking-wider">Descuento</td>
                                      <td className="px-4 py-2 text-right font-bold">- {eur(discount)}</td>
                                    </tr>
                                  )}

                                  {/* Delivery */}
                                  {deliveryFee > 0 && (
                                    <tr className="text-indigo-600 bg-indigo-50">
                                      <td colSpan={3} className="px-4 py-2 text-right text-xs uppercase font-bold tracking-wider flex items-center justify-end gap-1">
                                        <span>🛵 Envío</span>
                                      </td>
                                      <td className="px-4 py-2 text-right font-bold">{eur(deliveryFee)}</td>
                                    </tr>
                                  )}

                                  {/* Total explicitly shown again for clarity if needed, or just rely on header */}
                                  {/* <tr className="bg-slate-50 font-bold text-slate-900 border-t border-slate-200">
                                        <td colSpan={3} className="px-4 py-3 text-right">TOTAL</td>
                                        <td className="px-4 py-3 text-right">{eur(o.total_cents)}</td>
                                     </tr> */}
                                </>
                              );
                            })()}
                          </>
                        )}
                      </tbody>
                      <tfoot className="bg-white border-t border-slate-200">
                        <tr>
                          <td colSpan={3} className="px-4 py-3 text-right font-bold text-slate-600 uppercase text-xs">Total Pedido</td>
                          <td className="px-4 py-3 text-right font-bold text-lg text-emerald-600">{eur(o.total_cents)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Historico - Accordion Style */}
      {historico.length > 0 && (
        <details className="group glass-panel rounded-2xl overflow-hidden open:ring-2 open:ring-slate-200 transition-all">
          <summary className="flex items-center justify-between p-5 cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors list-none select-none">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-slate-400" />
              <span className="font-bold text-slate-700">Historial de Pedidos</span>
              <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-600 text-xs font-bold">{historico.length}</span>
            </div>
            <ChevronDown className="w-5 h-5 text-slate-400 group-open:rotate-180 transition-transform" />
          </summary>
          <div className="p-5 border-t border-slate-200 space-y-3">
            {historico.map(o => (
              <div key={o.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-xl border border-slate-100 bg-white hover:border-slate-200 transition-all">
                <div className="flex items-center gap-4">
                  <div className={clsx("w-2 h-12 rounded-full", getStatusColor(o.status).split(' ')[0])}></div>
                  <div>
                    <div className="font-bold text-slate-900 flex items-center gap-2">
                      #{(o.code ?? o.id).slice(-4).toUpperCase()}
                      <span className={clsx("text-[10px] px-2 py-0.5 rounded-full uppercase border", getStatusColor(o.status))}>{estadoEtiqueta[o.status]}</span>
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">{new Date(o.created_at).toLocaleString()} · {o.customer_name}</div>
                  </div>
                </div>
                <div className="mt-3 sm:mt-0 flex items-center gap-4">
                  <div className="font-bold text-slate-900 text-right">{eur(o.total_cents)}</div>
                  <button onClick={() => toggleDetail(o)} className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 hover:underline">
                    {openDetailId === o.id ? "Cerrar" : "Ver"}
                  </button>
                </div>
                {openDetailId === o.id && (
                  <div className="w-full mt-4 pt-4 border-t border-slate-100 sm:col-span-2">
                    {/* Minimal detail for history to save space */}
                    <div className="text-sm text-slate-600">
                      {(detailCache[o.id] || []).map(i => (
                        <div key={i.id} className="flex justify-between py-1 border-b border-dashed border-slate-100 last:border-0">
                          <span>{i.quantity}x {i.name}</span>
                          <span>{eur(i.line_total_cents)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
