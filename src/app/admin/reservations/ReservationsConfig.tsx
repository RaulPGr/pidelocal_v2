"use client";

import { useEffect, useState } from "react";
import { Loader2, Save, Plus, Trash2, MapPin, Clock, CalendarDays, Mail, AlertCircle } from "lucide-react";
import clsx from "clsx";

type Zone = {
    id: string;
    name: string;
    capacity: number;
    enabled: boolean;
};

type Shift = {
    id: string;
    name: string;
    start: string;
    end: string;
    days: number[]; // 0=Sun, 1=Mon...
    enabled: boolean;
};

export default function ReservationsConfig() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Global Enabled Toggle
    const [enabled, setEnabled] = useState(false);

    // Zones
    const [zones, setZones] = useState<Zone[]>([]);

    // Shifts
    const [shifts, setShifts] = useState<Shift[]>([]);

    // Auto Confirm & Settings
    const [autoConfirm, setAutoConfirm] = useState(false);
    const [capacity, setCapacity] = useState(0);
    const [interval, setIntervalVal] = useState(30);
    const [duration, setDuration] = useState(90);
    const [email, setEmail] = useState("");
    const [leadHours, setLeadHours] = useState<number | "">("");
    const [maxDays, setMaxDays] = useState<number | "">("");
    const [blockedDates, setBlockedDates] = useState("");

    async function load() {
        setLoading(true);
        try {
            const params = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
            const tenant = params.get("tenant")?.trim();
            const url = tenant ? `/api/admin/business?tenant=${encodeURIComponent(tenant)}` : "/api/admin/business";

            const res = await fetch(url);
            const j = await res.json();
            if (j.ok && j.data) {
                const d = j.data;
                setEnabled(!!d.reservations_enabled);

                if (Array.isArray(d.reservations_zones)) setZones(d.reservations_zones);
                else setZones([
                    { id: "main", name: "Salón Interior", capacity: 20, enabled: true },
                    { id: "terrace", name: "Terraza", capacity: 10, enabled: true }
                ]);

                if (Array.isArray(d.reservations_slots)) setShifts(d.reservations_slots);
                else setShifts([
                    { id: "lunch", name: "Comidas", start: "13:00", end: "16:00", days: [1, 2, 3, 4, 5, 6, 0], enabled: true },
                    { id: "dinner", name: "Cenas", start: "20:00", end: "23:00", days: [4, 5, 6], enabled: true }
                ]);

                setAutoConfirm(!!d.reservations_auto_confirm);
                setCapacity(d.reservations_capacity || 0);
                setIntervalVal(d.reservations_interval || 30);
                setDuration(d.reservations_duration || 90);

                setEmail(d.reservations_email || "");
                setLeadHours(d.reservations_lead_hours ?? "");
                setMaxDays(d.reservations_max_days ?? "");

                if (Array.isArray(d.reservations_blocked_dates)) {
                    setBlockedDates(d.reservations_blocked_dates.filter((x: any) => typeof x === 'string').join(', '));
                } else {
                    setBlockedDates("");
                }
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => { load(); }, []);

    async function save() {
        setSaving(true);
        try {
            const params = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
            const tenant = params.get("tenant")?.trim();
            const url = tenant ? `/api/admin/business?tenant=${encodeURIComponent(tenant)}` : "/api/admin/business";

            const blockedArray = blockedDates.split(',').map(d => d.trim()).filter(d => /^\d{4}-\d{2}-\d{2}$/.test(d));

            const res = await fetch(url, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    reservations_enabled: enabled,
                    reservations_zones: zones,
                    reservations_slots: shifts,
                    reservations_auto_confirm: autoConfirm,
                    reservations_capacity: capacity,
                    reservations_interval: interval,
                    reservations_duration: duration,
                    reservations_email: email || null,
                    reservations_lead_hours: leadHours === "" ? null : Number(leadHours),
                    reservations_max_days: maxDays === "" ? null : Number(maxDays),
                    reservations_blocked_dates: blockedArray
                })
            });

            if (res.ok) alert("Configuración guardada correctamente");
            else alert("Error al guardar");

        } catch (e) {
            alert("Error de conexión");
        } finally {
            setSaving(false);
        }
    }

    function addZone() {
        setZones([...zones, {
            id: Math.random().toString(36).substr(2, 9),
            name: "Nueva Zona",
            capacity: 10,
            enabled: true
        }]);
    }

    function updateZone(id: string, field: keyof Zone, val: any) {
        setZones(zones.map(z => z.id === id ? { ...z, [field]: val } : z));
    }

    function removeZone(id: string) {
        if (confirm("¿Eliminar esta zona?")) setZones(zones.filter(z => z.id !== id));
    }

    function addShift() {
        setShifts([...shifts, {
            id: Math.random().toString(36).substr(2, 9),
            name: "Nuevo Turno",
            start: "13:00",
            end: "16:00",
            days: [1, 2, 3, 4, 5],
            enabled: true
        }]);
    }

    function updateShift(id: string, field: keyof Shift, val: any) {
        setShifts(shifts.map(s => s.id === id ? { ...s, [field]: val } : s));
    }

    function toggleShiftDay(id: string, day: number) {
        setShifts(shifts.map(s => {
            if (s.id !== id) return s;
            const days = s.days.includes(day) ? s.days.filter(d => d !== day) : [...s.days, day];
            return { ...s, days };
        }));
    }

    function removeShift(id: string) {
        if (confirm("¿Eliminar este turno?")) setShifts(shifts.filter(s => s.id !== id));
    }

    if (loading) return <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-slate-400" /></div>;

    return (
        <div className="space-y-8 max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24">

            {/* Main Toggle */}
            <div className="glass-panel p-6 border-l-4 border-l-emerald-500">
                <label className="flex items-center gap-4 cursor-pointer">
                    <div className={clsx(
                        "w-12 h-7 rounded-full p-1 transition-all duration-300",
                        enabled ? "bg-emerald-500 shadow-inner" : "bg-slate-300"
                    )}>
                        <div className={clsx(
                            "w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-300",
                            enabled ? "translate-x-5" : "translate-x-0"
                        )} />
                    </div>
                    <input type="checkbox" className="hidden" checked={enabled} onChange={e => setEnabled(e.target.checked)} />
                    <div>
                        <h3 className="text-lg font-bold text-slate-800">Habilitar Reservas Online</h3>
                        <p className="text-sm text-slate-500">Permite que tus clientes reserven mesa desde la web y carta digital</p>
                    </div>
                </label>
            </div>

            {/* Zones Section */}
            <div className={clsx("transition-opacity duration-300 space-y-8", !enabled && "opacity-60 pointer-events-none grayscale")}>

                <div className="glass-panel p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <MapPin className="w-5 h-5 text-emerald-600" />
                                Zonas y Capacidad
                            </h3>
                            <p className="text-sm text-slate-500">Define las áreas de tu restaurante y cuántas personas caben en cada una.</p>
                        </div>
                        <button onClick={addZone} className="btn-secondary text-xs flex items-center gap-2">
                            <Plus className="w-4 h-4" /> Añadir Zona
                        </button>
                    </div>

                    <div className="grid gap-4">
                        {zones.map((z) => (
                            <div key={z.id} className="flex flex-col sm:flex-row gap-4 items-start sm:items-center bg-slate-50 p-4 rounded-xl border border-slate-100 group hover:border-emerald-200 transition-colors">
                                <div className="flex-1 w-full sm:w-auto">
                                    <label className="text-xs uppercase font-bold text-slate-400 mb-1 block">Nombre zona</label>
                                    <input
                                        type="text"
                                        value={z.name}
                                        onChange={e => updateZone(z.id, 'name', e.target.value)}
                                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-700 font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
                                    />
                                </div>
                                <div className="w-24">
                                    <label className="text-xs uppercase font-bold text-slate-400 mb-1 block">Pax Max</label>
                                    <input
                                        type="number"
                                        value={z.capacity}
                                        onChange={e => updateZone(z.id, 'capacity', Number(e.target.value))}
                                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-700 font-medium text-center focus:ring-2 focus:ring-emerald-500 outline-none"
                                    />
                                </div>
                                <div className="flex items-center gap-4 pt-5">
                                    <label className="flex items-center gap-2 cursor-pointer select-none">
                                        <input
                                            type="checkbox"
                                            checked={z.enabled}
                                            onChange={e => updateZone(z.id, 'enabled', e.target.checked)}
                                            className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 border-gray-300"
                                        />
                                        <span className={clsx("text-sm font-medium", z.enabled ? "text-emerald-700" : "text-slate-400")}>
                                            {z.enabled ? "Abierta" : "Cerrada"}
                                        </span>
                                    </label>
                                    <button onClick={() => removeZone(z.id)} className="text-slate-300 hover:text-rose-500 transition-colors p-2">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Shifts Section */}
                <div className="glass-panel p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <Clock className="w-5 h-5 text-blue-600" />
                                Turnos y Horarios
                            </h3>
                            <p className="text-sm text-slate-500">Define cuándo aceptas reservas (Ej: Comidas de 13:00 a 16:00).</p>
                        </div>
                        <button onClick={addShift} className="btn-secondary text-xs flex items-center gap-2">
                            <Plus className="w-4 h-4" /> Añadir Turno
                        </button>
                    </div>

                    <div className="space-y-4">
                        {shifts.map((s) => (
                            <div key={s.id} className="bg-slate-50 p-4 rounded-xl border border-slate-100 hover:border-blue-200 transition-all">
                                <div className="flex flex-col md:flex-row gap-4 mb-4">
                                    <div className="flex-1">
                                        <label className="text-xs uppercase font-bold text-slate-400 mb-1 block">Nombre Turno</label>
                                        <input
                                            type="text"
                                            value={s.name}
                                            onChange={e => updateShift(s.id, 'name', e.target.value)}
                                            placeholder="Ej: Comidas Fin de Semana"
                                            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-700 font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                                        />
                                    </div>
                                    <div className="flex gap-2">
                                        <div>
                                            <label className="text-xs uppercase font-bold text-slate-400 mb-1 block">Inicio</label>
                                            <input
                                                type="time"
                                                value={s.start}
                                                onChange={e => updateShift(s.id, 'start', e.target.value)}
                                                className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-700 font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                                            />
                                        </div>
                                        <div className="flex items-center pt-6 text-slate-400">-</div>
                                        <div>
                                            <label className="text-xs uppercase font-bold text-slate-400 mb-1 block">Fin</label>
                                            <input
                                                type="time"
                                                value={s.end}
                                                onChange={e => updateShift(s.id, 'end', e.target.value)}
                                                className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-700 font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-wrap items-center gap-2 border-t border-slate-200 pt-4">
                                    <span className="text-xs font-bold text-slate-500 mr-2 uppercase">Días:</span>
                                    {['D', 'L', 'M', 'X', 'J', 'V', 'S'].map((dayLabel, idx) => {
                                        const isSelected = (s.days || []).includes(idx);
                                        return (
                                            <button
                                                key={idx}
                                                onClick={() => toggleShiftDay(s.id, idx)}
                                                className={clsx(
                                                    "w-8 h-8 rounded-full text-xs font-bold transition-all flex items-center justify-center",
                                                    isSelected
                                                        ? "bg-blue-600 text-white shadow-md shadow-blue-200"
                                                        : "bg-white text-slate-400 border border-slate-200 hover:border-blue-300"
                                                )}
                                            >
                                                {dayLabel}
                                            </button>
                                        );
                                    })}
                                    <div className="flex-1"></div>
                                    <button onClick={() => removeShift(s.id)} className="text-slate-400 hover:text-rose-500 transition-colors p-2 text-sm flex items-center gap-1">
                                        <Trash2 className="w-4 h-4" /> Eliminar
                                    </button>
                                </div>
                            </div>
                        ))}
                        {shifts.length === 0 && (
                            <div className="text-center p-8 border-2 border-dashed border-slate-200 rounded-xl text-slate-400">
                                No has definido horarios de apertura. Tus clientes no podrán reservar.
                            </div>
                        )}
                    </div>
                </div>

                {/* Global Settings */}
                <div className="glass-panel p-6">
                    <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <Clock className="w-5 h-5 text-amber-500" />
                        Configuración Avanzada
                    </h3>

                    <div className="grid md:grid-cols-2 gap-6 mb-6">
                        <div>
                            <label className="text-xs uppercase font-bold text-slate-400 mb-1 block">Intervalo (min)</label>
                            <input
                                type="number"
                                min={15}
                                step={15}
                                value={interval}
                                onChange={e => setIntervalVal(Number(e.target.value))}
                                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-700 font-medium focus:ring-2 focus:ring-amber-500 outline-none"
                            />
                            <p className="text-[10px] text-slate-400 mt-1">Frecuencia de horas (13:00, 13:30...)</p>
                        </div>
                        <div>
                            <label className="text-xs uppercase font-bold text-slate-400 mb-1 block">Duración Media (min)</label>
                            <input
                                type="number"
                                min={30}
                                step={15}
                                value={duration}
                                onChange={e => setDuration(Number(e.target.value))}
                                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-700 font-medium focus:ring-2 focus:ring-amber-500 outline-none"
                            />
                            <p className="text-[10px] text-slate-400 mt-1">Tiempo que se bloquea la mesa</p>
                        </div>
                        <div>
                            <label className="text-xs uppercase font-bold text-slate-400 mb-1 block">Antelación Mínima (Horas)</label>
                            <input
                                type="number"
                                min={0}
                                value={leadHours}
                                onChange={e => setLeadHours(e.target.value === "" ? "" : Number(e.target.value))}
                                placeholder="0 = Inmediata"
                                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-700 font-medium focus:ring-2 focus:ring-amber-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="text-xs uppercase font-bold text-slate-400 mb-1 block">Máximo días vista</label>
                            <input
                                type="number"
                                min={0}
                                value={maxDays}
                                onChange={e => setMaxDays(e.target.value === "" ? "" : Number(e.target.value))}
                                placeholder="0 = Sin límite"
                                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-700 font-medium focus:ring-2 focus:ring-amber-500 outline-none"
                            />
                        </div>
                    </div>

                    <div className="mb-6 space-y-2">
                        <label className="text-xs uppercase font-bold text-slate-400 mb-1 flex items-center gap-2">
                            <Mail className="w-3 h-3" /> Email para avisos
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            placeholder="Email por defecto del negocio"
                            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-700 font-medium focus:ring-2 focus:ring-amber-500 outline-none"
                        />
                    </div>

                    <div className="mb-6 space-y-2">
                        <label className="text-xs uppercase font-bold text-slate-400 mb-1 flex items-center gap-2">
                            <CalendarDays className="w-3 h-3" /> Fechas Bloqueadas
                        </label>
                        <input
                            type="text"
                            value={blockedDates}
                            onChange={e => setBlockedDates(e.target.value)}
                            placeholder="YYYY-MM-DD, YYYY-MM-DD"
                            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-700 font-medium focus:ring-2 focus:ring-amber-500 outline-none font-mono text-sm"
                        />
                        <p className="text-[10px] text-slate-400 mt-1">Días específicos donde NO se aceptan reservas (ej: Navidad).</p>
                    </div>

                    <div className="flex items-center gap-4">
                        <label className="flex items-center gap-3 cursor-pointer p-4 bg-slate-50 border border-slate-100 rounded-xl hover:bg-white hover:shadow-sm transition-all flex-1">
                            <input
                                type="checkbox"
                                checked={autoConfirm}
                                onChange={e => setAutoConfirm(e.target.checked)}
                                className="w-5 h-5 text-emerald-600 rounded focus:ring-emerald-500 border-gray-300"
                            />
                            <div>
                                <div className="font-bold text-slate-700">Confirmación Automática</div>
                                <div className="text-xs text-slate-500">Aceptar reservas instantáneamente si hay hueco en la zona.</div>
                            </div>
                        </label>
                    </div>
                </div>
            </div>

            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t border-slate-200 flex justify-end gap-4 z-40 md:pl-72">
                <button
                    onClick={save}
                    disabled={saving}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-3 rounded-full transition-all flex items-center gap-2 shadow-lg shadow-emerald-500/20 hover:scale-105"
                >
                    {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                    Guardar Cambios
                </button>
            </div>

        </div>
    );
}
