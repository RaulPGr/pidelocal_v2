"use client";

import { useEffect, useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { X, Calendar, User, Clock, Check, Loader2, ChevronRight, Phone, Mail, MessageSquare, MapPin, CheckCircle2 } from "lucide-react";
import clsx from "clsx";

type Shift = {
    id: string;
    name: string;
    start: string;
    end: string;
    days: number[]; // 0=Sun, 1=Mon...
    enabled: boolean;
};

type Zone = {
    id: string;
    name: string;
    capacity: number;
    enabled: boolean;
};

type ReservationModalProps = {
    isOpen: boolean;
    onClose: () => void;
    businessName: string;
};

// Helpers
function getNextDays(days = 14) {
    const list = [];
    const today = new Date();
    for (let i = 0; i < days; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() + i);
        list.push(d);
    }
    return list;
}

function formatDate(date: Date) {
    return date.toLocaleDateString("es-ES", { weekday: "short", day: "numeric", month: "short" });
}

function generateSlots(start: string, end: string, interval = 30) {
    const slots = [];
    const [startH, startM] = start.split(":").map(Number);
    const [endH, endM] = end.split(":").map(Number);

    let current = startH * 60 + startM;
    const finish = endH * 60 + endM;

    // Safety check to avoid infinite loops if interval is 0 or NaN
    const step = interval > 0 ? interval : 30;

    while (current < finish) {
        const h = Math.floor(current / 60);
        const m = current % 60;
        slots.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
        current += step;
    }
    return slots;
}

export default function ReservationModal({ isOpen, onClose, businessName }: ReservationModalProps) {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [configLoading, setConfigLoading] = useState(true);
    const [shifts, setShifts] = useState<Shift[]>([]);
    const [zones, setZones] = useState<Zone[]>([]);
    const [autoConfirm, setAutoConfirm] = useState(false);
    const [interval, setIntervalVal] = useState(30);
    const [duration, setDuration] = useState(90);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Form State
    const [date, setDate] = useState<Date | null>(null);
    const [pax, setPax] = useState(2);
    const [selectedShiftId, setSelectedShiftId] = useState<string | null>(null);
    const [selectedZone, setSelectedZone] = useState<string>("");
    const [time, setTime] = useState<string | null>(null);

    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [email, setEmail] = useState("");
    const [notes, setNotes] = useState("");

    // Load Config
    useEffect(() => {
        if (isOpen) {
            setConfigLoading(true);
            // Fetch settings to get shifts
            fetch("/api/settings/home")
                .then(res => res.json())
                .then(j => {
                    if (j.ok && j.data?.reservations) {
                        const r = j.data.reservations;
                        const s = r.slots;
                        if (Array.isArray(s)) {
                            setShifts(s);
                        } else {
                            // Default shifts if not configured
                            setShifts([
                                { id: "lunch", name: "Comidas", start: "13:00", end: "16:00", days: [1, 2, 3, 4, 5, 6, 0], enabled: true },
                                { id: "dinner", name: "Cenas", start: "20:00", end: "23:00", days: [4, 5, 6], enabled: true }
                            ]);
                        }

                        // Load Zones
                        if (Array.isArray(r.zones)) {
                            setZones(r.zones);
                        } else {
                            // Default zones if not configured (should not happen if backend is correct)
                            setZones([]);
                        }

                        setAutoConfirm(!!r.auto_confirm);
                        // Use backend interval/duration or defaults
                        setIntervalVal(Number(r.interval || 30));
                        setDuration(Number(r.duration || 90));

                        // Reset form
                        setStep(1);
                        setDate(null);
                        setTime(null);
                        setSelectedShiftId(null);
                        setSelectedZone("");
                    }
                })
                .finally(() => setConfigLoading(false));
        }
    }, [isOpen]);

    // Active zones logic
    const enabledZones = useMemo(() => zones.filter(z => z.enabled), [zones]);

    // Auto-select zone if only 1
    useEffect(() => {
        if (enabledZones.length === 1 && !selectedZone) {
            setSelectedZone(enabledZones[0].id);
        }
    }, [enabledZones, selectedZone]);

    const days = useMemo(() => getNextDays(), []);

    // Filter shifts based on selected date (day of week)
    const availableShifts = useMemo(() => {
        if (!date) return [];
        const dayIndex = date.getDay(); // 0=Sun
        return shifts.filter(s => s.enabled && s.days.includes(dayIndex));
    }, [date, shifts]);

    const availableSlots = useMemo(() => {
        if (!selectedShiftId) return [];
        const shift = shifts.find(s => s.id === selectedShiftId);
        if (!shift) return [];

        // Pass dynamic interval
        return generateSlots(shift.start, shift.end, interval);
    }, [selectedShiftId, shifts, interval]);

    // Store busy data
    const [busyData, setBusyData] = useState<{ capacity: number, busy: any[] } | null>(null);

    useEffect(() => {
        if (!date || (enabledZones.length > 1 && !selectedZone)) {
            setBusyData(null);
            return;
        }

        const check = async () => {
            try {
                const startStr = date.toISOString().split('T')[0];
                const res = await fetch(`/api/reservations/availability?date=${startStr}&zoneId=${selectedZone}&tenant=${encodeURIComponent(businessName)}`);
                const j = await res.json();
                if (j.ok) {
                    setBusyData(j);
                } else {
                    setBusyData(null);
                }
            } catch (e) {
                console.error(e);
                setBusyData(null);
            }
        };
        check();
    }, [date, selectedZone, businessName, enabledZones.length]);

    // Compute status per slot
    const getSlotStatus = (slotTime: string) => {
        if (!busyData || !date) return 'available';
        const [h, m] = slotTime.split(':').map(Number);

        // Slot Start Time
        const slotStart = new Date(date);
        slotStart.setHours(h, m, 0, 0);
        const slotStartMs = slotStart.getTime();
        const slotEndMs = slotStartMs + (duration * 60000);

        // Check Overlaps
        let occupied = 0;
        for (const b of busyData.busy) {
            // Overlap: StartA < EndB && EndA > StartB
            if (slotStartMs < b.end && slotEndMs > b.start) {
                occupied += b.pax;
            }
        }

        // Check logic: occupied + myPax > capacity?
        if (occupied + pax > busyData.capacity) return 'full';

        return 'available';
    };

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch("/api/reservations", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    date: date?.toISOString().split('T')[0],
                    time,
                    name,
                    phone,
                    email,
                    people: pax,
                    notes,
                    zoneId: selectedZone, // Send zone
                    tzOffsetMinutes: new Date().getTimezoneOffset()
                    // duration is handled by backend usually, but could send if needed
                })
            });
            const j = await res.json();
            if (!res.ok) throw new Error(j.message || j.error || "Error al reservar");

            setStep(4); // Success
        } catch (error: any) {
            alert(error.message || "No se pudo completar la reserva. Inténtalo de nuevo.");
        } finally {
            setLoading(false);
        }
    }

    if (!isOpen || !mounted) return null;

    // Simplified step logic:
    // Step 1: Date & Pax
    // Step 1.5: Zone (only if >1 zones and none selected)
    // Step 2: Shift/Time
    // Step 3: Contact Details
    // Step 4: Success

    const showZoneSelection = enabledZones.length > 1;

    // Handlers for step progression
    const goNext = () => {
        if (step === 1) {
            if (showZoneSelection) setStep(1.5);
            else setStep(2);
        } else if (step === 1.5) {
            setStep(2);
        } else if (step === 2) {
            setStep(3);
        }
    };

    const goBack = () => {
        if (step === 3) setStep(2);
        else if (step === 2) {
            if (showZoneSelection) setStep(1.5);
            else setStep(1);
        } else if (step === 1.5) {
            setStep(1);
        }
    };

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />

            {/* Modal */}
            <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="bg-slate-900 text-white p-4 flex items-center justify-between shrink-0">
                    <div>
                        <h2 className="font-bold text-lg text-white">Reservar Mesa</h2>
                        <p className="text-xs text-slate-300">{businessName}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">

                    {configLoading ? (
                        <div className="flex flex-col items-center justify-center py-10 gap-3 text-slate-400">
                            <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
                            <span className="text-sm">Cargando disponibilidad...</span>
                        </div>
                    ) : (
                        <>
                            {/* Step 1: Date & Pax */}
                            {step === 1 && (
                                <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                                    <div className="space-y-3">
                                        <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                            <User className="w-4 h-4 text-emerald-600" /> ¿Cuántos sois?
                                        </label>
                                        <div className="flex flex-wrap gap-2">
                                            {[1, 2, 3, 4, 5, 6, 8, 10].map(n => (
                                                <button
                                                    key={n}
                                                    onClick={() => setPax(n)}
                                                    className={clsx(
                                                        "w-10 h-10 rounded-full font-bold text-sm transition-all border",
                                                        pax === n
                                                            ? "bg-slate-900 text-white border-slate-900 shadow-md transform scale-110"
                                                            : "bg-white text-slate-600 border-slate-200 hover:border-emerald-500"
                                                    )}
                                                >
                                                    {n}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                            <Calendar className="w-4 h-4 text-emerald-600" /> Elige fecha
                                        </label>
                                        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none snap-x">
                                            {days.map((d, i) => {
                                                const isSelected = date?.toDateString() === d.toDateString();
                                                return (
                                                    <button
                                                        key={i}
                                                        onClick={() => { setDate(d); setSelectedShiftId(null); setTime(null); }}
                                                        className={clsx(
                                                            "flex-shrink-0 w-16 h-20 rounded-xl flex flex-col items-center justify-center border transition-all snap-start",
                                                            isSelected
                                                                ? "bg-emerald-600 text-white border-emerald-600 shadow-lg ring-2 ring-emerald-100"
                                                                : "bg-slate-50 text-slate-500 border-slate-100 hover:bg-white hover:border-emerald-300"
                                                        )}
                                                    >
                                                        <span className="text-xs font-medium uppercase">{d.toLocaleDateString('es-ES', { weekday: 'short' })}</span>
                                                        <span className="text-xl font-black">{d.getDate()}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    <div className="pt-4">
                                        <button
                                            disabled={!date}
                                            onClick={goNext}
                                            className="w-full btn-primary py-3 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Continuar <ChevronRight className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Step 1.5: Zone Selection */}
                            {step === 1.5 && (
                                <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                                    <div className="flex items-center justify-between">
                                        <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                            <MapPin className="w-5 h-5 text-emerald-600" />
                                            ¿Dónde prefieres?
                                        </h3>
                                        <button onClick={goBack} className="text-xs text-emerald-600 font-medium hover:underline">Volver</button>
                                    </div>

                                    <div className="grid grid-cols-1 gap-3">
                                        {enabledZones.map(zone => (
                                            <button
                                                key={zone.id}
                                                onClick={() => setSelectedZone(zone.id)}
                                                className={clsx(
                                                    "flex items-center justify-between p-4 rounded-xl border transition-all text-left",
                                                    selectedZone === zone.id
                                                        ? "border-emerald-500 bg-emerald-50 ring-1 ring-emerald-500"
                                                        : "border-slate-200 hover:border-emerald-200 hover:bg-slate-50"
                                                )}
                                            >
                                                <div>
                                                    <div className={clsx("font-bold text-sm", selectedZone === zone.id ? "text-emerald-900" : "text-slate-700")}>
                                                        {zone.name}
                                                    </div>
                                                    <div className="text-xs text-slate-500">
                                                        Aforo Máx: {zone.capacity} pax
                                                    </div>
                                                </div>
                                                {selectedZone === zone.id && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
                                            </button>
                                        ))}
                                    </div>

                                    <div className="pt-4">
                                        <button
                                            disabled={!selectedZone}
                                            onClick={goNext}
                                            className="w-full btn-primary py-3 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Continuar <ChevronRight className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Step 2: Time */}
                            {step === 2 && (
                                <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                                    <div className="flex items-center justify-between">
                                        <h3 className="font-bold text-slate-900">{formatDate(date!)}</h3>
                                        <button onClick={goBack} className="text-xs text-emerald-600 font-medium hover:underline">Cambiar</button>
                                    </div>

                                    {availableShifts.length === 0 ? (
                                        <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                            <p className="text-slate-500 text-sm">No hay turnos disponibles para este día.</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            <div className="flex gap-2 bg-slate-100 p-1 rounded-lg">
                                                {availableShifts.map(s => (
                                                    <button
                                                        key={s.id}
                                                        onClick={() => { setSelectedShiftId(s.id); setTime(null); }}
                                                        className={clsx(
                                                            "flex-1 py-2 text-sm font-bold rounded-md transition-all",
                                                            selectedShiftId === s.id
                                                                ? "bg-white text-slate-900 shadow-sm"
                                                                : "text-slate-500 hover:text-slate-700"
                                                        )}
                                                    >
                                                        {s.name}
                                                    </button>
                                                ))}
                                            </div>

                                            {selectedShiftId && (
                                                <div className="grid grid-cols-4 gap-2 pt-2 animate-in fade-in slide-in-from-top-2">
                                                    {availableSlots.map(slot => {
                                                        const status = getSlotStatus(slot);
                                                        const isFull = status === 'full';

                                                        return (
                                                            <button
                                                                key={slot}
                                                                disabled={isFull}
                                                                onClick={() => setTime(slot)}
                                                                className={clsx(
                                                                    "py-2 text-sm font-medium rounded-lg border transition-all relative overflow-hidden",
                                                                    time === slot
                                                                        ? "bg-emerald-600 text-white border-emerald-600 shadow-md"
                                                                        : isFull
                                                                            ? "bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed"
                                                                            : "bg-white text-slate-600 border-slate-200 hover:border-emerald-400 hover:text-emerald-700"
                                                                )}
                                                            >
                                                                {slot}
                                                                {isFull && <div className="absolute inset-0 flex items-center justify-center bg-slate-50/80 text-[10px] font-bold text-rose-400 uppercase tracking-wider">Lleno</div>}
                                                            </button>
                                                        )
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <div className="pt-4">
                                        <button
                                            disabled={!time}
                                            onClick={goNext}
                                            className="w-full btn-primary py-3 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Continuar <ChevronRight className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Step 3: Details */}
                            {step === 3 && (
                                <div className="space-y-5 animate-in slide-in-from-right-4 duration-300">
                                    <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-lg flex flex-col gap-2">
                                        <div className="flex gap-3 items-center">
                                            <div className="p-2 bg-white rounded-full shadow-sm text-emerald-600">
                                                <Calendar className="w-4 h-4" />
                                            </div>
                                            <div className="text-sm">
                                                <div className="font-bold text-slate-800">{formatDate(date!)} a las {time}</div>
                                                <div className="text-emerald-700">{pax} personas</div>
                                            </div>
                                        </div>
                                        {selectedZone && (
                                            <div className="flex gap-3 items-center pl-1">
                                                <div className="w-8 flex justify-center text-emerald-600"><MapPin className="w-3 h-3" /></div>
                                                <div className="text-xs font-medium text-slate-600">
                                                    {zones.find(z => z.id === selectedZone)?.name}
                                                </div>
                                            </div>
                                        )}
                                        <button onClick={goBack} className="text-xs text-emerald-600 font-medium hover:underline text-right">Editar</button>
                                    </div>

                                    <form onSubmit={handleSubmit} className="space-y-4">
                                        <div>
                                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1 block">Nombre</label>
                                            <div className="relative">
                                                <User className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                                                <input
                                                    type="text"
                                                    required
                                                    value={name}
                                                    onChange={e => setName(e.target.value)}
                                                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                                                    placeholder="Tu nombre completo"
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1 block">Teléfono</label>
                                                <div className="relative">
                                                    <Phone className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                                                    <input
                                                        type="tel"
                                                        required
                                                        value={phone}
                                                        onChange={e => setPhone(e.target.value)}
                                                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                                                        placeholder="600 000 000"
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1 block">Email (Opcional)</label>
                                                <div className="relative">
                                                    <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                                                    <input
                                                        type="email"
                                                        value={email}
                                                        onChange={e => setEmail(e.target.value)}
                                                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                                                        placeholder="hola@ejemplo.com"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1 block">Notas</label>
                                            <div className="relative">
                                                <MessageSquare className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                                                <textarea
                                                    value={notes}
                                                    onChange={e => setNotes(e.target.value)}
                                                    rows={2}
                                                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                                                    placeholder="Alergias, trona, terraza..."
                                                />
                                            </div>
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="w-full btn-primary py-3 flex items-center justify-center gap-2 mt-4 shadow-lg shadow-emerald-500/20"
                                        >
                                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Confirmar Reserva"}
                                        </button>
                                    </form>
                                </div>
                            )}

                            {/* Step 4: Success */}
                            {step === 4 && (
                                <div className="text-center py-10 animate-in zoom-in-95 duration-500">
                                    <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <Check className="w-10 h-10" />
                                    </div>
                                    <h2 className="text-2xl font-bold text-slate-800 mb-2">¡Reserva Solicitada!</h2>
                                    <p className="text-slate-500 mb-8 max-w-xs mx-auto">
                                        Hemos recibido tu solicitud.{autoConfirm ? ' Te hemos enviado la confirmación por email.' : ' Te confirmaremos lo antes posible.'}
                                    </p>
                                    <button onClick={onClose} className="btn-secondary w-full">
                                        Volver a la Carta
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
}
