"use client";

import { useEffect, useState } from "react";
import { Loader2, Save, Plus, Trash2, MapPin, Clock } from "lucide-react";
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

    // Zones
    const [zones, setZones] = useState<Zone[]>([]);

    // Shifts
    const [shifts, setShifts] = useState<Shift[]>([]);

    // Auto Confirm & Settings
    const [autoConfirm, setAutoConfirm] = useState(false);
    const [capacity, setCapacity] = useState(0);
    const [interval, setIntervalVal] = useState(30);
    const [duration, setDuration] = useState(90);

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

            const res = await fetch(url, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    reservations_zones: zones,
                    reservations_slots: shifts,
                    reservations_auto_confirm: autoConfirm,
                    reservations_capacity: capacity,
                    reservations_interval: interval,
                    reservations_duration: duration
                })
            });

            if (res.ok) alert("Guardado correctamente");
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
        <div className="space-y-8 max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* Zones Section */}
            <div className="glass-panel p-6">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                            <MapPin className="w-5 h-5 text-emerald-600" />
                            Zonas y Capacidad
                        </h3>
                        <p className="text-sm text-slate-500">Define las áreas de tu restaurante y cuántas personas caben en cada una.</p>
                    </div>
                    <button onClick={addZone} className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium px-4 py-2 rounded-lg transition-colors text-xs flex items-center gap-2">
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
                    <button onClick={addShift} className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium px-4 py-2 rounded-lg transition-colors text-xs flex items-center gap-2">
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
                    Configuración General
                </h3>

                <div className="grid md:grid-cols-2 gap-6 mb-6">
                    <div>
                        <label className="text-xs uppercase font-bold text-slate-400 mb-1 block">Intervalo entre reservas (min)</label>
                        <p className="text-xs text-slate-500 mb-2">Cada cuánto se muestran horas (Ej: 30 = 13:00, 13:30...)</p>
                        <input
                            type="number"
                            min={15}
                            step={15}
                            value={interval}
                            onChange={e => setIntervalVal(Number(e.target.value))}
                            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-700 font-medium focus:ring-2 focus:ring-amber-500 outline-none"
                        />
                    </div>
                    <div>
                        <label className="text-xs uppercase font-bold text-slate-400 mb-1 block">Duración media (min)</label>
                        <p className="text-xs text-slate-500 mb-2">Tiempo estimado de ocupación de mesa.</p>
                        <input
                            type="number"
                            min={30}
                            step={15}
                            value={duration}
                            onChange={e => setDuration(Number(e.target.value))}
                            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-700 font-medium focus:ring-2 focus:ring-amber-500 outline-none"
                        />
                    </div>
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
                            <div className="text-xs text-slate-500">Aceptar reservas instantáneamente si hay hueco.</div>
                        </div>
                    </label>
                </div>
            </div>

            <div className="flex justify-end pt-4 pb-20">
                <button
                    onClick={save}
                    disabled={saving}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-4 py-2 rounded-lg transition-colors flex items-center gap-2 shadow-lg shadow-emerald-500/20"
                >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Guardar Configuración
                </button>
            </div>

        </div>
    );
}
