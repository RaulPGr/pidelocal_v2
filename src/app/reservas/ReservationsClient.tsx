"use client";

import { useEffect, useMemo, useState } from "react";
import { persistTenantSlugClient, resolveTenantSlugClient } from "@/lib/tenant-client";
import { Loader2, MapPin, Calendar as CalendarIcon, Clock, Users, User, CheckCircle2 } from "lucide-react";

type OpeningHours = Record<string, Array<{ abre?: string; cierra?: string; open?: string; close?: string }>>;

type Config = {
  enabled: boolean;
  businessName: string;
  businessAddress: string | null;
  businessLogo: string | null;
  hours: OpeningHours | null;
  slots: Array<{ from: string; to: string; capacity?: number }> | null;
  zones: Array<{ id: string; name: string; capacity: number; enabled: boolean }> | null;
  blockedDates: string[];
  leadHours: number | null;
  maxDays: number | null;
  interval: number;
  duration: number;
};

const DAY_LABELS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const DAY_KEYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"] as const;

function parseTramos(list: any): Array<{ start: number; end: number }> {
  if (!Array.isArray(list)) return [];
  const out: Array<{ start: number; end: number }> = [];
  for (const tramo of list) {
    const open = (tramo?.abre ?? tramo?.open ?? "").split(":");
    const close = (tramo?.cierra ?? tramo?.close ?? "").split(":");
    if (open.length === 2 && close.length === 2) {
      const start = Number(open[0]) * 60 + Number(open[1]);
      const end = Number(close[0]) * 60 + Number(close[1]);
      if (!Number.isNaN(start) && !Number.isNaN(end) && end > start) {
        out.push({ start, end });
      }
    }
  }
  return out;
}

function buildSlots(tramos: Array<{ start: number; end: number }>, interval: number, minDate?: Date) {
  const slots: string[] = [];
  const step = interval > 0 ? interval : 30;
  const minMinutes = minDate ? minDate.getHours() * 60 + minDate.getMinutes() : null;

  for (const tramo of tramos) {
    for (let minutes = tramo.start; minutes < tramo.end; minutes += step) {
      // Basic check: start time must be before closing
      if (minMinutes !== null && minutes < minMinutes) continue;

      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      slots.push(`${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`);
    }
  }
  return slots;
}

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function formatDateInput(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function hhmmToMinutes(v: string) {
  const [h, m] = v.split(":").map(Number);
  return (Number.isFinite(h) ? h : 0) * 60 + (Number.isFinite(m) ? m : 0);
}

function buildSlotsFromShifts(
  shifts: Array<{ from: string; to: string }>,
  interval: number,
  selectedDate: string,
  leadHours: number | null
) {
  const tramos: Array<{ start: number; end: number }> = [];
  for (const s of shifts) {
    if (!/^\d{2}:\d{2}$/.test(s.from) || !/^\d{2}:\d{2}$/.test(s.to)) continue;
    const start = hhmmToMinutes(s.from);
    const end = hhmmToMinutes(s.to);
    if (end > start) tramos.push({ start, end });
  }

  const today = new Date();
  const selDate = new Date(selectedDate + "T00:00:00");
  const isToday = sameDay(today, selDate);

  let minDate: Date | undefined = undefined;

  if (isToday) {
    minDate = new Date();
    if (leadHours && leadHours > 0) {
      minDate.setHours(minDate.getHours() + leadHours);
    } else {
      // Strict past check buffer
      minDate.setMinutes(minDate.getMinutes() + 15);
    }
  }

  return buildSlots(tramos, interval, minDate);
}

export default function ReservationsClient() {
  const [config, setConfig] = useState<Config | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedZone, setSelectedZone] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [people, setPeople] = useState(2);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [uiHint, setUiHint] = useState<string | null>(null);
  const [datesWithStatus, setDatesWithStatus] = useState<Array<{ date: string; blocked: boolean }>>([]);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const tenant = resolveTenantSlugClient();
        if (tenant) persistTenantSlugClient(tenant);
        const url = tenant ? `/api/settings/home?tenant=${encodeURIComponent(tenant)}` : "/api/settings/home";
        const resp = await fetch(url, { cache: "no-store" });
        const j = await resp.json();
        if (!active) return;
        if (!resp.ok || !j?.data) {
          setError(j?.error || "No se pudo cargar la configuración");
          return;
        }
        const cfg = j.data;
        const zones = Array.isArray(cfg.reservations?.zones) ? cfg.reservations.zones : null;

        setConfig({
          enabled: !!cfg.reservations?.enabled,
          businessName: cfg.business?.name || "Nuestro restaurante",
          businessAddress: cfg.contact?.address || null,
          businessLogo: cfg.images?.logo || null,
          hours: cfg.hours || null,
          slots: Array.isArray(cfg.reservations?.slots) ? cfg.reservations.slots : null,
          zones: zones,
          blockedDates: Array.isArray(cfg.reservations?.blocked_dates)
            ? cfg.reservations.blocked_dates.filter((d: any) => typeof d === "string")
            : [],
          leadHours: Number.isFinite(cfg.reservations?.lead_hours) ? Number(cfg.reservations.lead_hours) : null,
          maxDays: Number.isFinite(cfg.reservations?.max_days) ? Number(cfg.reservations.max_days) : null,
          interval: Number(cfg.reservations?.interval || 30),
          duration: Number(cfg.reservations?.duration || 90),
        });

        if (Array.isArray(zones) && zones.length > 0) {
          const enabledZones = zones.filter((z: any) => z.enabled);
          if (enabledZones.length === 1) setSelectedZone(enabledZones[0].id);
        }

      } catch (e: any) {
        if (active) setError(e?.message || "No se pudo cargar la configuración");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const availableDates = useMemo(() => {
    if (!config?.enabled) return [];
    const dates: Array<{ date: string; blocked: boolean }> = [];
    const today = new Date();
    const maxDays = config?.maxDays && config.maxDays > 0 ? config.maxDays : 30;
    const blockedSet = new Set((config?.blockedDates || []).map((d) => d.trim()));

    for (let i = 0; i < maxDays; i += 1) {
      const d = new Date();
      d.setDate(today.getDate() + i);
      const formatted = formatDateInput(d);
      const isBlocked = blockedSet.has(formatted);
      dates.push({ date: formatted, blocked: isBlocked });
    }
    return dates;
  }, [config?.blockedDates, config?.enabled, config?.maxDays]);

  const timesForSelectedDate = useMemo(() => {
    if (!selectedDate || !config?.enabled) return [];

    if (config?.slots && config.slots.length > 0) {
      return buildSlotsFromShifts(config.slots, config.interval, selectedDate, config.leadHours ?? null);
    }

    return [];
  }, [selectedDate, config?.slots, config?.interval, config?.enabled, config?.leadHours]);

  useEffect(() => {
    setDatesWithStatus(availableDates);
  }, [availableDates]);

  useEffect(() => {
    if (!selectedDate && datesWithStatus.length > 0) {
      const firstAllowed = datesWithStatus.find((d) => !d.blocked)?.date || datesWithStatus[0].date;
      setSelectedDate(firstAllowed);
    }
  }, [datesWithStatus, selectedDate]);

  useEffect(() => {
    if (timesForSelectedDate.length > 0) {
      if (!timesForSelectedDate.includes(selectedTime)) {
        setSelectedTime(timesForSelectedDate[0]);
      }
      setUiHint(null);
    } else {
      setSelectedTime("");
      if (selectedDate) {
        setUiHint("No hay horarios disponibles para esta fecha.");
      }
    }
  }, [timesForSelectedDate, selectedDate, selectedTime]);

  async function submitReservation(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedDate || !selectedTime) return setMessage("Selecciona fecha y hora.");

    const enabledZones = config?.zones?.filter(z => z.enabled) || [];
    if (enabledZones.length > 0 && !selectedZone) {
      return setMessage("Por favor, selecciona una zona.");
    }

    if (!customerName || !customerPhone) return setMessage("Faltan tus datos de contacto.");

    setSubmitting(true);
    setMessage(null);
    try {
      const tenantSlug = resolveTenantSlugClient();
      if (tenantSlug) persistTenantSlugClient(tenantSlug);
      const endpoint = tenantSlug ? `/api/reservations?tenant=${encodeURIComponent(tenantSlug)}` : "/api/reservations";
      const resp = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: selectedDate,
          time: selectedTime,
          name: customerName,
          phone: customerPhone,
          email: customerEmail,
          people,
          notes,
          zoneId: selectedZone,
          tzOffsetMinutes: new Date().getTimezoneOffset(),
        }),
      });
      const j = await resp.json();
      if (!resp.ok || !j?.ok) {
        throw new Error(j?.message || "No se pudo registrar la reserva");
      }
      setSuccess(true);
    } catch (err: any) {
      setMessage(err?.message || "No se pudo enviar la reserva");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="animate-spin text-slate-400" />
      </main>
    );
  }

  if (error || !config?.enabled) {
    return (
      <main className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="max-w-md rounded-xl border bg-white p-8 text-center shadow-sm">
          <CalendarIcon className="w-10 h-10 text-slate-300 mx-auto mb-4" />
          <h1 className="text-xl font-semibold mb-2 text-slate-900">Reservas no disponibles</h1>
          <p className="text-sm text-slate-500">{error || "El restaurante no acepta reservas online en este momento."}</p>
        </div>
      </main>
    );
  }

  if (success) {
    return (
      <main className="max-w-md mx-auto px-4 py-20 text-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-emerald-100">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">¡Reserva Solicitada!</h1>
          <p className="text-slate-600 mb-6">
            Hemos recibido tu solicitud para el <strong>{new Date(selectedDate).toLocaleDateString()}</strong> a las <strong>{selectedTime}</strong>.
            <br />Te confirmaremos por email en breve.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="text-emerald-600 font-medium hover:underline"
          >
            Realizar otra reserva
          </button>
        </div>
      </main>
    )
  }

  const enabledZones = config.zones?.filter(z => z.enabled) || [];

  return (
    <main className="max-w-5xl mx-auto px-4 py-8 md:py-12">
      <header className="mb-10 text-center space-y-3">
        {config.businessLogo && <img src={config.businessLogo} alt={config.businessName} className="mx-auto h-20 w-auto object-contain" />}
        <h1 className="text-3xl md:text-4xl font-bold text-slate-900">{config.businessName}</h1>
        <p className="text-base text-slate-500">Reserva tu mesa online</p>
      </header>

      <form onSubmit={submitReservation} className="grid lg:grid-cols-[1fr,400px] gap-8">

        {/* Left Column: Selection */}
        <div className="space-y-6">

          {/* Zone Selection */}
          {enabledZones.length > 1 && (
            <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-emerald-600" />
                ¿Dónde quieres sentarte?
              </h2>
              <div className="grid sm:grid-cols-2 gap-3">
                {enabledZones.map(zone => (
                  <label
                    key={zone.id}
                    className={`cursor-pointer border rounded-xl p-4 transition-all flex items-center justify-between group
                                    ${selectedZone === zone.id
                        ? 'border-emerald-500 bg-emerald-50 ring-1 ring-emerald-500'
                        : 'border-slate-200 hover:border-emerald-200 hover:bg-slate-50'
                      }`}
                  >
                    <input
                      type="radio"
                      name="zone"
                      value={zone.id}
                      checked={selectedZone === zone.id}
                      onChange={() => setSelectedZone(zone.id)}
                      className="sr-only"
                    />
                    <div>
                      <span className={`block font-semibold ${selectedZone === zone.id ? 'text-emerald-900' : 'text-slate-700'}`}>
                        {zone.name}
                      </span>
                      <span className="text-xs text-slate-500">Capacidad: {zone.capacity} pax</span>
                    </div>
                    {selectedZone === zone.id && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
                  </label>
                ))}
              </div>
            </section>
          )}

          {/* Date & Time */}
          <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-emerald-600" />
              ¿Cuándo?
            </h2>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-slate-700 mb-2">Fecha</label>
              <div className="relative">
                <select
                  className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-700 font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                >
                  {datesWithStatus.length === 0 && <option>No hay fechas disponibles</option>}
                  {datesWithStatus.map(({ date, blocked }) => {
                    const dt = new Date(date + "T00:00:00");
                    return (
                      <option key={date} value={date} disabled={blocked}>
                        {DAY_LABELS[dt.getDay()]} {dt.toLocaleDateString("es-ES")}
                        {blocked ? " (Completo/Cerrado)" : ""}
                      </option>
                    );
                  })}
                </select>
                <CalendarIcon className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Hora</label>
              {timesForSelectedDate.length > 0 ? (
                <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2">
                  {timesForSelectedDate.map((time) => (
                    <button
                      type="button"
                      key={time}
                      onClick={() => setSelectedTime(time)}
                      className={`py-2 px-1 rounded-lg text-sm font-semibold transition-all
                                        ${selectedTime === time
                          ? 'bg-emerald-600 text-white shadow-md shadow-emerald-200'
                          : 'bg-white border border-slate-200 text-slate-600 hover:border-emerald-300 hover:text-emerald-700'
                        }`}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center p-6 bg-slate-50 rounded-xl text-slate-500 text-sm">
                  {uiHint || "No hay horarios disponibles para este día."}
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Right Column: Details */}
        <div className="space-y-6">
          <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 sticky top-6">
            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-emerald-600" />
              Tus Datos
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-xs uppercase font-bold text-slate-400 mb-1">Nombre</label>
                <input
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  required
                  placeholder="Ej: Juan Pérez"
                />
              </div>
              <div>
                <label className="block text-xs uppercase font-bold text-slate-400 mb-1">Teléfono</label>
                <input
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  required
                  placeholder="Ej: 600 000 000"
                />
              </div>
              <div>
                <label className="block text-xs uppercase font-bold text-slate-400 mb-1">Email <span className="text-slate-300 font-normal normal-case">(Opcional)</span></label>
                <input
                  type="email"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="Para recibir confirmación"
                />
              </div>

              <div className="pt-2">
                <label className="block text-xs uppercase font-bold text-slate-400 mb-1">Comensales</label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={1}
                    max={20}
                    value={people}
                    onChange={(e) => setPeople(Number(e.target.value))}
                    className="flex-1 accent-emerald-600 h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="w-12 h-10 flex items-center justify-center bg-emerald-50 text-emerald-700 font-bold rounded-lg border border-emerald-100">
                    {people}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase font-bold text-slate-400 mb-1">Notas</label>
                <textarea
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-sm"
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Alergias, trona, etc."
                />
              </div>
            </div>

            <div className="pt-6 mt-6 border-t border-slate-100">
              <button
                type="submit"
                disabled={submitting || !selectedTime}
                className="w-full bg-emerald-600 text-white font-bold py-3.5 rounded-xl hover:bg-emerald-700 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/30"
              >
                {submitting ? "Enviando..." : "Confirmar Reserva"}
              </button>
              {message && <p className="mt-3 text-sm text-center text-rose-500 font-medium animate-in fade-in">{message}</p>}
            </div>

          </section>
        </div>
      </form>
    </main>
  );
}
