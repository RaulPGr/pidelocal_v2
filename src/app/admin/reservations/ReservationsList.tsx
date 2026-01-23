"use client";

import { useEffect, useMemo, useState } from "react";
import EmptyState from "@/components/admin/EmptyState";
import { useAdminAccess } from "@/context/AdminAccessContext";
import { subscriptionAllowsReservations } from "@/lib/subscription";
import {
  CalendarDays,
  Search,
  RefreshCcw,
  Check,
  X,
  User,
  Phone,
  Mail,
  MessageSquare,
  Clock,
  Users,
  Calendar,
  Filter,
  Loader2,
  Columns,
  List,
  MapPin
} from "lucide-react";
import clsx from "clsx";
import ReservationsKanban from "./ReservationsKanban";

type AdminReservation = {
  id: string;
  customer_name: string;
  customer_email: string | null;
  customer_phone: string;
  party_size: number;
  reserved_at: string;
  timezone_offset_minutes?: number | null;
  notes: string | null;
  status: string;
  created_at: string;
};

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; icon: any }> = {
  pending: { label: "Pendiente", bg: "bg-amber-100", text: "text-amber-700", icon: Clock },
  confirmed: { label: "Confirmada", bg: "bg-emerald-100", text: "text-emerald-700", icon: Check },
  cancelled: { label: "Cancelada", bg: "bg-rose-100", text: "text-rose-700", icon: X },
};

function formatDate(value: string) {
  try {
    const d = new Date(value);
    return d.toLocaleString("es-ES", { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  } catch {
    return value;
  }
}

function toDateKey(value: string) {
  if (!value) return "";
  try {
    const d = new Date(value);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  } catch {
    const [datePart] = value.split("T");
    return datePart || "";
  }
}

function todayKey() {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().slice(0, 10);
}

function parseNote(raw: string | null) {
  if (!raw) return { zone: null, text: null };

  // Extract Zone Tag usually like [ID:terrace] [Zona: Terraza]
  // We can just regex for keys
  let text = raw;
  let zoneName = null;

  // Try to find [Zona: ...]
  const zoneMatch = text.match(/\[Zona:\s*([^\]]+)\]/i);
  if (zoneMatch) {
    zoneName = zoneMatch[1].trim();
    text = text.replace(zoneMatch[0], "");
  }

  // Remove ID tag if present [ID:...]
  text = text.replace(/\[ID:[^\]]+\]/gi, "");

  return {
    zone: zoneName,
    text: text.trim() || null
  };
}

export default function ReservationsList() {
  const { plan, isSuper } = useAdminAccess();
  const reservationsBlocked = !subscriptionAllowsReservations(plan) && !isSuper;
  const [items, setItems] = useState<AdminReservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(() => todayKey());
  const [viewMode, setViewMode] = useState<'list' | 'board'>('board');

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
      const tenant = params.get("tenant")?.trim();
      const url = tenant ? `/api/admin/reservations?tenant=${encodeURIComponent(tenant)}` : "/api/admin/reservations";
      const resp = await fetch(url, { cache: "no-store" });
      const j = await resp.json();
      if (!resp.ok || !j?.ok) throw new Error(j?.error || "No se pudieron cargar las reservas");
      setItems(Array.isArray(j.reservations) ? j.reservations : []);
    } catch (e: any) {
      setError(e?.message || "Error al cargar reservas");
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(id: string, status: string) {
    setUpdating(id);
    try {
      const params = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
      const tenant = params.get("tenant")?.trim();
      const url = tenant ? `/api/admin/reservations?tenant=${encodeURIComponent(tenant)}` : "/api/admin/reservations";
      const resp = await fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      const j = await resp.json();
      if (!resp.ok || !j?.ok) throw new Error(j?.error || "No se pudo actualizar");
      setItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, status: j.reservation?.status ?? status } : item))
      );
    } catch (e: any) {
      alert(e?.message || "No se pudo actualizar");
    } finally {
      setUpdating(null);
    }
  }

  useEffect(() => {
    if (reservationsBlocked) {
      setLoading(false);
      setItems([]);
      return;
    }
    load().catch(() => { });
  }, [reservationsBlocked]);

  const filteredItems = useMemo(() => {
    if (!selectedDate) return items;
    return items.filter((item) => toDateKey(item.reserved_at) === selectedDate);
  }, [items, selectedDate]);

  if (reservationsBlocked) return null; // Handled by parent

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Controls Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center bg-slate-100 p-1 rounded-lg self-start">
          <button
            onClick={() => setViewMode('list')}
            className={clsx(
              "px-3 py-1.5 rounded-md transition-all flex items-center gap-2 text-sm font-medium",
              viewMode === 'list' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
            )}
          >
            <List className="w-4 h-4" />
            Lista
          </button>
          <button
            onClick={() => setViewMode('board')}
            className={clsx(
              "px-3 py-1.5 rounded-md transition-all flex items-center gap-2 text-sm font-medium",
              viewMode === 'board' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
            )}
          >
            <Columns className="w-4 h-4" />
            Tablero
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3 bg-white p-1.5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Fecha:</span>
            <input
              type="date"
              className="bg-transparent text-sm font-medium text-slate-700 outline-none p-0 border-none focus:ring-0"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>

          <button
            onClick={() => setSelectedDate(todayKey())}
            className="px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
          >
            Hoy
          </button>

          <div className="w-px h-6 bg-slate-200" />

          <button
            onClick={() => load().catch(() => { })}
            disabled={loading}
            className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
            title="Actualizar lista"
          >
            <RefreshCcw className={clsx("w-4 h-4", loading && "animate-spin")} />
          </button>
        </div>
      </div>

      {error && (
        <div className="glass-panel border-l-4 border-l-rose-500 p-4 flex items-start gap-3 bg-rose-50/50">
          <div className="p-1 bg-white rounded-full shadow-sm"><X className="w-4 h-4 text-rose-500" /></div>
          <p className="text-sm text-rose-700 font-medium">{error}</p>
        </div>
      )}

      {/* Content */}
      <div className="min-h-[400px]">
        {viewMode === 'board' ? (
          <ReservationsKanban
            items={filteredItems}
            onStatusChange={updateStatus}
            loading={loading}
          />
        ) : (
          filteredItems.length === 0 && !loading ? (
            <EmptyState
              icon={Calendar}
              title="No hay reservas para este día"
              description={
                selectedDate === todayKey()
                  ? "Hoy parece un día tranquilo. ¡Comparte tu enlace de reservas en redes sociales!"
                  : "No se han encontrado reservas para la fecha seleccionada."
              }
              action={
                selectedDate !== todayKey() ? (
                  <button onClick={() => setSelectedDate(todayKey())} className="mt-2 text-emerald-600 font-medium hover:underline">
                    Ver reservas de hoy
                  </button>
                ) : undefined
              }
            />
          ) : (
            <div className="glass-panel overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-500 font-medium">
                      <th className="px-6 py-4">Hora / Fecha</th>
                      <th className="px-6 py-4">Cliente</th>
                      <th className="px-6 py-4 text-center">Personas</th>
                      <th className="px-6 py-4">Estado</th>
                      <th className="px-6 py-4">Zona / Notas</th>
                      <th className="px-6 py-4 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredItems.map((res) => {
                      const status = STATUS_CONFIG[res.status] || { label: res.status, bg: 'bg-slate-100', text: 'text-slate-600', icon: null };
                      const StatusIcon = status.icon;
                      const { zone, text: cleanNote } = parseNote(res.notes);

                      return (
                        <tr key={res.id} className="group hover:bg-slate-50/80 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs ring-1 ring-emerald-100">
                                {new Date(res.reserved_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                              </div>
                              <div className="text-xs text-slate-500 font-medium">
                                {new Date(res.reserved_at).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })}
                              </div>
                            </div>
                          </td>

                          <td className="px-6 py-4">
                            <div className="flex items-start gap-3">
                              <div className="mt-1">
                                <User className="w-4 h-4 text-slate-400" />
                              </div>
                              <div>
                                <div className="font-semibold text-slate-800">{res.customer_name}</div>
                                <div className="flex flex-col gap-0.5 mt-1">
                                  <a href={`tel:${res.customer_phone}`} className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-emerald-600 transition-colors">
                                    <Phone className="w-3 h-3" /> {res.customer_phone}
                                  </a>
                                  {res.customer_email && (
                                    <a href={`mailto:${res.customer_email}`} className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-emerald-600 transition-colors">
                                      <Mail className="w-3 h-3" /> {res.customer_email}
                                    </a>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="px-6 py-4 text-center">
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700 font-semibold text-xs">
                              <Users className="w-3.5 h-3.5 text-slate-400" />
                              {res.party_size}
                            </div>
                          </td>

                          <td className="px-6 py-4">
                            <span className={clsx(
                              "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ring-1 ring-inset",
                              status.bg, status.text, status.bg.replace('bg-', 'ring-').replace('100', '200')
                            )}>
                              {StatusIcon && <StatusIcon className="w-3 h-3" />}
                              {status.label}
                            </span>
                          </td>

                          <td className="px-6 py-4 max-w-xs">
                            <div className="space-y-2">
                              {zone && (
                                <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-white border border-emerald-100 rounded-md shadow-sm text-xs font-medium text-emerald-800">
                                  <MapPin className="w-3 h-3 text-emerald-500" />
                                  {zone}
                                </div>
                              )}
                              {cleanNote ? (
                                <div className="flex items-start gap-2 bg-amber-50 p-2 rounded-lg border border-amber-100 text-amber-800 text-xs">
                                  <MessageSquare className="w-3 h-3 shrink-0 mt-0.5" />
                                  <span className="line-clamp-2" title={cleanNote}>{cleanNote}</span>
                                </div>
                              ) : (
                                !zone && <span className="text-slate-300 text-xs italic">Sin notas</span>
                              )}
                            </div>
                          </td>

                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end items-center gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                              {updating === res.id ? (
                                <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
                              ) : (
                                <>
                                  {res.status !== 'confirmed' && res.status !== 'cancelled' && (
                                    <button
                                      onClick={() => updateStatus(res.id, 'confirmed')}
                                      className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-lg transition-colors border border-emerald-200"
                                      title="Confirmar Reserva"
                                    >
                                      <Check className="w-4 h-4" />
                                    </button>
                                  )}

                                  {res.status === 'confirmed' && (
                                    <button
                                      onClick={() => updateStatus(res.id, 'pending')}
                                      className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg transition-colors border border-slate-200"
                                      title="Marcar como Pendiente"
                                    >
                                      <Clock className="w-4 h-4" />
                                    </button>
                                  )}

                                  {res.status !== 'cancelled' && (
                                    <button
                                      onClick={() => updateStatus(res.id, 'cancelled')}
                                      className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition-colors border border-rose-200"
                                      title="Cancelar Reserva"
                                    >
                                      <X className="w-4 h-4" />
                                    </button>
                                  )}
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}
