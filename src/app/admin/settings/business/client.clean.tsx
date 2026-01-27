"use client";

import { ReactNode, useEffect, useState } from 'react';
import { useAdminAccess } from "@/context/AdminAccessContext";
import { subscriptionAllowsReservations, subscriptionAllowsOrders } from "@/lib/subscription";
import {
  Store,
  MapPin,
  Phone,
  Mail,
  Clock,
  Upload,
  Image as ImageIcon,
  MessageCircle,
  Globe,
  Facebook,
  Instagram,
  Save,
  Loader2,
  CheckCircle2,
  LayoutGrid,
  List
} from "lucide-react";
import clsx from "clsx";

type Biz = {
  id: string;
  slug: string;
  name: string;
  slogan: string | null;
  logo_url: string | null;
  hero_url: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  address_line?: string | null;
  opening_hours?: any | null;
  social?: { instagram?: string | null; facebook?: string | null; tiktok?: string | null; web?: string | null } | null;
  menu_mode?: 'fixed' | 'daily';
  menu_layout?: 'cards' | 'list' | null;
};

// Configuracion general del negocio (datos publicos, notificaciones, redes, etc.).
export default function BusinessSettingsClient({ mode = "full" }: { mode?: "full" | "reservations" }) {
  const { plan } = useAdminAccess();
  const canManageReservations = subscriptionAllowsReservations(plan);
  const canManageOrders = subscriptionAllowsOrders(plan);

  function getTenantFromUrl(): string {
    if (typeof window === 'undefined') return '';
    try {
      return new URLSearchParams(window.location.search).get('tenant') || '';
    } catch {
      return '';
    }
  }

  const [biz, setBiz] = useState<Biz | null>(null);
  const [name, setName] = useState('');
  const [slogan, setSlogan] = useState('');
  const [about, setAbout] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [lat, setLat] = useState<string>('');
  const [lng, setLng] = useState<string>('');
  const [hours, setHours] = useState<any>({});
  const [notifyOrders, setNotifyOrders] = useState(false);
  const [notifyEmail, setNotifyEmail] = useState('');
  const [ordersEnabled, setOrdersEnabled] = useState(true);

  // Reservations State
  const [reservationsEnabled, setReservationsEnabled] = useState(false);
  const [reservationsEmail, setReservationsEmail] = useState('');
  const [reservationsCapacity, setReservationsCapacity] = useState<number>(0);
  const [reservationsSlots, setReservationsSlots] = useState<Array<{ from: string; to: string; capacity?: number }>>([]);
  const [reservationsLeadHours, setReservationsLeadHours] = useState<number | ''>('');
  const [reservationsMaxDays, setReservationsMaxDays] = useState<number | ''>('');
  const [reservationsAutoConfirm, setReservationsAutoConfirm] = useState(false);
  const [reservationsBlockedDates, setReservationsBlockedDates] = useState<string>('');

  // Telegram State
  const [telegramEnabled, setTelegramEnabled] = useState(false);
  const [telegramConfigured, setTelegramConfigured] = useState(false);
  const [telegramResEnabled, setTelegramResEnabled] = useState(false);
  const [telegramResConfigured, setTelegramResConfigured] = useState(false);

  // Social State
  const [instagram, setInstagram] = useState('');
  const [facebook, setFacebook] = useState('');
  const [tiktok, setTiktok] = useState('');
  const [web, setWeb] = useState('');
  const [mapUrl, setMapUrl] = useState('');

  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const [menuMode, setMenuMode] = useState<'fixed' | 'daily'>('fixed');
  const [menuLayout, setMenuLayout] = useState<'cards' | 'list'>('cards');

  function isHHMM(v: string) {
    return /^\d{2}:\d{2}$/.test(v);
  }

  const invalidSlots = reservationsSlots
    .map((s, idx) => (!isHHMM(s.from) || !isHHMM(s.to) ? idx : -1))
    .filter((i) => i >= 0);

  const blockedDatesArray = reservationsBlockedDates
    .split(',')
    .map((d) => d.trim())
    .filter(Boolean);
  const invalidDates = blockedDatesArray.filter((d) => !/^\d{4}-\d{2}-\d{2}$/.test(d));
  const isSlotInvalid = (s: { from: string; to: string }) => !isHHMM(s.from) || !isHHMM(s.to);

  // Carga inicial
  useEffect(() => {
    (async () => {
      const t = getTenantFromUrl();
      const url = t ? `/api/admin/business?tenant=${encodeURIComponent(t)}` : '/api/admin/business';
      const r = await fetch(url, { cache: 'no-store' });
      const j = await r.json();
      if (j?.ok) {
        setBiz(j.data);
        setName(j.data.name || '');
        setSlogan(j.data.slogan || '');
        setPhone(j.data.phone || '');
        setWhatsapp(j.data.whatsapp || '');
        setEmail(j.data.email || '');
        setAddress([j.data.address_line, j.data.postal_code, j.data.city].filter(Boolean).join(', '));
        if (j.data.lat != null) setLat(String(j.data.lat));
        if (j.data.lng != null) setLng(String(j.data.lng));
        setAbout(j.data.description || '');
        try {
          setHours(j.data.opening_hours || {});
        } catch {
          setHours({});
        }
        setNotifyOrders(Boolean(j.data.notify_orders_enabled));
        setOrdersEnabled(j.data.orders_enabled !== false);
        setNotifyEmail(j.data.notify_orders_email || j.data.email || '');

        // Reservations load
        setReservationsEnabled(Boolean(j.data.reservations_enabled));
        setReservationsEmail(j.data.reservations_email || j.data.email || '');
        const cap = Number(j.data.reservations_capacity ?? 0);
        setReservationsCapacity(Number.isFinite(cap) && cap > 0 ? Math.floor(cap) : 0);
        try {
          const slots = Array.isArray(j.data.reservations_slots) ? j.data.reservations_slots : [];
          setReservationsSlots(
            slots.map((s: any) => ({
              from: typeof s?.from === 'string' ? s.from : '',
              to: typeof s?.to === 'string' ? s.to : '',
              capacity: Number.isFinite(s?.capacity) ? Number(s.capacity) : undefined,
            }))
              .filter((s: any) => s.from || s.to)
          );
        } catch {
          setReservationsSlots([]);
        }
        const lead = Number(j.data.reservations_lead_hours ?? '');
        setReservationsLeadHours(Number.isFinite(lead) ? lead : '');
        const maxd = Number(j.data.reservations_max_days ?? '');
        setReservationsMaxDays(Number.isFinite(maxd) ? maxd : '');
        setReservationsAutoConfirm(Boolean(j.data.reservations_auto_confirm));
        if (Array.isArray(j.data.reservations_blocked_dates)) {
          setReservationsBlockedDates(j.data.reservations_blocked_dates.filter((d: any) => typeof d === 'string').join(', '));
        }

        // Telegram
        setTelegramEnabled(Boolean(j.data.telegram_notifications_enabled));
        setTelegramConfigured(Boolean(j.data.telegram_bot_token && j.data.telegram_chat_id));
        setTelegramResEnabled(Boolean(j.data.telegram_reservations_enabled));
        setTelegramResConfigured(Boolean(j.data.telegram_reservations_bot_token && j.data.telegram_reservations_chat_id));

        // Social
        setInstagram(j.data.social?.instagram || '');
        setFacebook(j.data.social?.facebook || '');
        setTiktok(j.data.social?.tiktok || '');
        setWeb(j.data.social?.web || '');
        setMapUrl(j.data.social?.map_url || '');

        // Menu config
        setMenuMode((j.data.menu_mode as 'fixed' | 'daily') || 'fixed');
        setMenuLayout((j.data.menu_layout as 'cards' | 'list') === 'list' ? 'list' : 'cards');
      } else {
        setMsg(j?.error || 'No se pudo cargar la configuración');
      }
    })();
  }, []);

  async function save() {
    if (invalidSlots.length > 0) {
      setMsg('Revisa las franjas: usa formato HH:MM (ej: 09:00).');
      return;
    }
    if (invalidDates.length > 0) {
      setMsg('Revisa las fechas bloqueadas: usa formato YYYY-MM-DD separadas por comas.');
      return;
    }
    setSaving(true);
    setMsg(null);
    try {
      const t = getTenantFromUrl();
      const url = t ? `/api/admin/business?tenant=${encodeURIComponent(t)}` : '/api/admin/business';
      const r = await fetch(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // Base
          name,
          slogan,
          description: about,
          phone,
          whatsapp,
          email,

          // Orders & Notifications
          notify_orders_enabled: notifyOrders,
          notify_orders_email: notifyEmail || null,
          orders_enabled: ordersEnabled,
          telegram_notifications_enabled: telegramEnabled,

          // Reservations
          reservations_enabled: reservationsEnabled,
          reservations_email: reservationsEmail || null,
          reservations_capacity: reservationsCapacity,
          reservations_slots: reservationsSlots,
          reservations_lead_hours: reservationsLeadHours === '' ? null : Number(reservationsLeadHours),
          reservations_max_days: reservationsMaxDays === '' ? null : Number(reservationsMaxDays),
          reservations_auto_confirm: reservationsAutoConfirm,
          reservations_blocked_dates: blockedDatesArray,
          telegram_reservations_enabled: telegramResEnabled,

          // Location & Social
          address_line: address,
          lat: lat !== '' ? Number(lat) : null,
          lng: lng !== '' ? Number(lng) : null,
          social: { instagram, facebook, tiktok, web, map_url: mapUrl },

          // Hours & Menu
          opening_hours: hours && Object.keys(hours).length ? hours : '',
          menu_mode: menuMode,
          menu_layout: menuLayout,
        }),
      });
      const j = await r.json();
      if (!j?.ok) throw new Error(j?.error || 'Error');
      setMsg('Cambios guardados correctamente');
      setTimeout(() => setMsg(null), 3000);
    } catch (e: any) {
      setMsg(e?.message || 'No se pudo guardar');
    } finally {
      setSaving(false);
    }
  }

  async function upload(kind: 'logo' | 'hero', file: File) {
    const fd = new FormData();
    fd.append('type', kind);
    fd.append('file', file);
    const t = getTenantFromUrl();
    const url = t ? `/api/admin/business?tenant=${encodeURIComponent(t)}` : '/api/admin/business';
    const r = await fetch(url, { method: 'POST', body: fd });
    const j = await r.json();
    if (!j?.ok) throw new Error(j?.error || 'Error subiendo imagen');
    setBiz((b) => (b ? ({ ...b, [`${kind}_url`]: j.url } as Biz) : b));
  }

  // --- RENDER HELPERS ---

  if (mode === "reservations") {
    if (!canManageReservations) {
      return (
        <div className="glass-panel p-8 text-center bg-slate-50/50">
          <p className="text-slate-500">Tu plan no incluye gestión de reservas.</p>
        </div>
      )
    }

    return (
      <div className="space-y-6">
        {msg && (
          <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-700 animate-in fade-in slide-in-from-top-2">
            <CheckCircle2 className="w-5 h-5" />
            <span className="text-sm font-medium">{msg}</span>
          </div>
        )}

        <Section title="Configuración de Reservas" icon={Clock}>
          <label className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors">
            <div className={clsx("w-10 h-6 flex items-center rounded-full p-1 transition-colors", reservationsEnabled ? "bg-emerald-500" : "bg-slate-300")}>
              <div className={clsx("bg-white w-4 h-4 rounded-full shadow-sm transition-transform", reservationsEnabled ? "translate-x-4" : "translate-x-0")} />
            </div>
            <input type="checkbox" className="hidden" checked={reservationsEnabled} onChange={e => setReservationsEnabled(e.target.checked)} />
            <span className="text-sm font-medium text-slate-700">Habilitar formulario de reservas en la web</span>
          </label>

          {reservationsEnabled && (
            <div className="space-y-6 pt-4 animate-in fade-in slide-in-from-top-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Email para avisos</label>
                  <input
                    className="glass-input w-full"
                    type="email"
                    value={reservationsEmail}
                    onChange={(e) => setReservationsEmail(e.target.value)}
                    placeholder="reservas@tunegocio.com"
                  />
                  <p className="text-[10px] text-slate-400">Si lo dejas vacío se usará el email principal.</p>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Capacidad por franja</label>
                  <input
                    className="glass-input w-full"
                    type="number" min={0} max={100}
                    value={reservationsCapacity}
                    onChange={(e) => setReservationsCapacity(Math.max(0, Math.floor(Number(e.target.value) || 0)))}
                  />
                  <p className="text-[10px] text-slate-400">0 = Ilimitado. Se calcula por número de comensales.</p>
                </div>
              </div>

              <div className="h-px bg-slate-100" />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Antelación mínima (horas)</label>
                  <input
                    className="glass-input w-full"
                    type="number" min={0}
                    value={reservationsLeadHours}
                    onChange={(e) => setReservationsLeadHours(e.target.value === '' ? '' : Math.max(0, Number(e.target.value)))}
                    placeholder="0 = Sin límite"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Máximo días vista</label>
                  <input
                    className="glass-input w-full"
                    type="number" min={0}
                    value={reservationsMaxDays}
                    onChange={(e) => setReservationsMaxDays(e.target.value === '' ? '' : Math.max(0, Number(e.target.value)))}
                    placeholder="0 = Sin límite"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Franjas Horarias Personalizadas</label>
                {reservationsSlots.map((slot, idx) => (
                  <div key={idx} className="flex flex-wrap items-center gap-2 p-2 rounded-lg bg-slate-50 border border-slate-200">
                    <input
                      type="time"
                      className={clsx("bg-white border text-sm rounded px-2 py-1 w-24", isSlotInvalid(slot) ? "border-rose-400 text-rose-600" : "border-slate-200")}
                      value={slot.from}
                      onChange={e => {
                        const next = [...reservationsSlots];
                        next[idx] = { ...next[idx], from: e.target.value };
                        setReservationsSlots(next);
                      }}
                    />
                    <span className="text-slate-400 text-xs">-</span>
                    <input
                      type="time"
                      className={clsx("bg-white border text-sm rounded px-2 py-1 w-24", isSlotInvalid(slot) ? "border-rose-400 text-rose-600" : "border-slate-200")}
                      value={slot.to}
                      onChange={e => {
                        const next = [...reservationsSlots];
                        next[idx] = { ...next[idx], to: e.target.value };
                        setReservationsSlots(next);
                      }}
                    />
                    <input
                      type="number"
                      placeholder="Cupo"
                      className="bg-white border border-slate-200 text-sm rounded px-2 py-1 w-20"
                      value={slot.capacity ?? ''}
                      onChange={e => {
                        const next = [...reservationsSlots];
                        next[idx] = { ...next[idx], capacity: e.target.value ? Number(e.target.value) : undefined };
                        setReservationsSlots(next);
                      }}
                    />
                    <button type="button" onClick={() => setReservationsSlots(prev => prev.filter((_, i) => i !== idx))} className="ml-auto text-xs text-rose-500 hover:underline">Quitar</button>
                  </div>
                ))}
                <button type="button" onClick={() => setReservationsSlots([...reservationsSlots, { from: '', to: '' }])} className="text-xs font-medium text-emerald-600 hover:underline flex items-center gap-1">
                  <PlusIcon /> Añadir franja
                </button>
                <p className="text-[10px] text-slate-400">Si no defines franjas, se usarán los horarios de apertura.</p>
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input type="checkbox" className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500" checked={reservationsAutoConfirm} onChange={e => setReservationsAutoConfirm(e.target.checked)} />
                  Confirmar reservas automáticamente (si hay cupo)
                </label>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Fechas Bloqueadas</label>
                <input
                  className={clsx(
                    "glass-input w-full font-mono text-sm",
                    invalidDates.length > 0 && "border-rose-300 bg-rose-50"
                  )}
                  placeholder="YYYY-MM-DD, YYYY-MM-DD"
                  value={reservationsBlockedDates}
                  onChange={e => setReservationsBlockedDates(e.target.value)}
                />
                <p className="text-[10px] text-slate-400">Días específicos donde NO se aceptarán reservas (ej: Navidad).</p>
              </div>
            </div>
          )}
        </Section>

        <div className="flex justify-end pt-4">
          <button
            onClick={() => void save()}
            disabled={saving}
            className="btn-primary flex items-center gap-2"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            Guardar Configuración
          </button>
        </div>
      </div>
    );
  }

  // --- FULL MODE (General Business Settings) ---
  return (
    <div className="space-y-6">
      {msg && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-700 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-5 h-5" />
          <span className="text-sm font-medium">{msg}</span>
        </div>
      )}

      {/* 1. Datos Generales */}
      <Section title="Información del Negocio" icon={Store}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="input-label">Nombre Comercial</label>
            <input className="glass-input w-full" value={name} onChange={e => setName(e.target.value)} placeholder="Ej: Pizzería Napoli" />
          </div>
          <div className="space-y-2">
            <label className="input-label">Eslogan</label>
            <input className="glass-input w-full" value={slogan} onChange={e => setSlogan(e.target.value)} placeholder="Ej: Auténtica masa madre" />
          </div>
          <div className="md:col-span-2 space-y-2">
            <label className="input-label">Descripción</label>
            <textarea className="glass-input w-full" rows={3} value={about} onChange={e => setAbout(e.target.value)} placeholder="Cuéntanos sobre tu negocio..." />
          </div>
        </div>
      </Section>

      {/* 2. Menu Config */}
      <Section title="Configuración del Menú" icon={LayoutGrid}>
        <div className="space-y-4">
          <div>
            <p className="input-label mb-2">Modo de Visualización</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setMenuLayout('cards')}
                className={clsx("flex items-start gap-3 p-3 rounded-xl border text-left transition-all", menuLayout === 'cards' ? "border-emerald-500 bg-emerald-50/50" : "border-slate-200 hover:bg-slate-50")}
              >
                <LayoutGrid className="w-5 h-5 text-slate-500 mt-0.5" />
                <div>
                  <span className="block text-sm font-medium text-slate-900">Tarjetas con Imágenes</span>
                  <span className="block text-xs text-slate-500 mt-1">Ideal para comida visualmente atractiva. Muestra fotos grandes.</span>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setMenuLayout('list')}
                className={clsx("flex items-start gap-3 p-3 rounded-xl border text-left transition-all", menuLayout === 'list' ? "border-emerald-500 bg-emerald-50/50" : "border-slate-200 hover:bg-slate-50")}
              >
                <List className="w-5 h-5 text-slate-500 mt-0.5" />
                <div>
                  <span className="block text-sm font-medium text-slate-900">Lista Compacta</span>
                  <span className="block text-xs text-slate-500 mt-1">Mejor para menús extensos o sin fotos. Carga rápida.</span>
                </div>
              </button>
            </div>
          </div>

          <div className="h-px bg-slate-100" />

          <div>
            <p className="input-label mb-2">Lógica del Menú</p>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                <input type="radio" name="menu_mode" value="fixed" checked={menuMode === 'fixed'} onChange={() => setMenuMode('fixed')} className="w-4 h-4 text-emerald-600 focus:ring-emerald-500" />
                Menú Fijo (Siempre igual)
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                <input type="radio" name="menu_mode" value="daily" checked={menuMode === 'daily'} onChange={() => setMenuMode('daily')} className="w-4 h-4 text-emerald-600 focus:ring-emerald-500" />
                Menú del Día (Varía por día de la semana)
              </label>
            </div>
          </div>
        </div>
      </Section>

      {/* 3. Contacto */}
      <Section title="Contacto y Ubicación" icon={MapPin}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="input-label flex items-center gap-2"><Phone className="w-3 h-3" /> Teléfono</label>
            <input className="glass-input w-full" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+34 600..." />
          </div>
          <div className="space-y-2">
            <label className="input-label flex items-center gap-2"><MessageCircle className="w-3 h-3" /> WhatsApp</label>
            <input className="glass-input w-full" value={whatsapp} onChange={e => setWhatsapp(e.target.value)} placeholder="+34 600..." />
          </div>
          <div className="md:col-span-2 space-y-2">
            <label className="input-label flex items-center gap-2"><Mail className="w-3 h-3" /> Email Público</label>
            <input className="glass-input w-full" value={email} onChange={e => setEmail(e.target.value)} placeholder="hola@negocio.com" />
          </div>
          <div className="md:col-span-2 space-y-2">
            <label className="input-label">Dirección Completa</label>
            <input className="glass-input w-full" value={address} onChange={e => setAddress(e.target.value)} placeholder="Calle Ejemplo 123, Ciudad" />
          </div>
        </div>
      </Section>

      {/* 4. Horarios */}
      <Section title="Horarios de Apertura" icon={Clock}>
        <HoursEditor value={hours} onChange={setHours} />
      </Section>

      {/* 5. Imágenes */}
      <Section title="Personalización Visual" icon={ImageIcon}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-3">
            <p className="input-label">Logotipo</p>
            <div className="flex flex-col items-center gap-4 bg-slate-50 p-4 rounded-xl border border-dashed border-slate-300">
              {biz?.logo_url ? (
                <img src={biz.logo_url} className="w-24 h-24 object-contain" alt="Logo" />
              ) : (
                <div className="w-24 h-24 bg-slate-200 rounded-full flex items-center justify-center text-slate-400">Sin logo</div>
              )}
              <label className="cursor-pointer btn-secondary text-xs flex items-center gap-2">
                <Upload className="w-3 h-3" /> Subir Logo
                <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && upload('logo', e.target.files[0])} />
              </label>
            </div>
          </div>

          <div className="space-y-3">
            <p className="input-label">Imagen de Cabecera (Hero)</p>
            <div className="flex flex-col items-center gap-4 bg-slate-50 p-4 rounded-xl border border-dashed border-slate-300">
              {biz?.hero_url ? (
                <img src={biz.hero_url} className="w-full h-24 object-cover rounded-lg" alt="Hero" />
              ) : (
                <div className="w-full h-24 bg-slate-200 rounded-lg flex items-center justify-center text-slate-400">Sin imagen</div>
              )}
              <label className="cursor-pointer btn-secondary text-xs flex items-center gap-2">
                <Upload className="w-3 h-3" /> Subir Portada
                <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && upload('hero', e.target.files[0])} />
              </label>
              <p className="text-[10px] text-slate-400 text-center px-4">
                Recomendado: <strong>1920x1080px</strong>. <br />
                IMPORTANTE: Mantén tu logo o texto importante <strong>centrado</strong> en la imagen para que se vea bien en móviles.
              </p>
            </div>
          </div>
        </div>
      </Section>

      {/* 6. Social */}
      <Section title="Redes Sociales" icon={Globe}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="input-label flex items-center gap-2"><Instagram className="w-3 h-3" /> Instagram</label>
            <input className="glass-input w-full" value={instagram} onChange={e => setInstagram(e.target.value)} placeholder="@usuario" />
          </div>
          <div className="space-y-2">
            <label className="input-label flex items-center gap-2"><Facebook className="w-3 h-3" /> Facebook</label>
            <input className="glass-input w-full" value={facebook} onChange={e => setFacebook(e.target.value)} placeholder="url_perfil" />
          </div>
          <div className="md:col-span-2 space-y-2">
            <label className="input-label flex items-center gap-2"><MapPin className="w-3 h-3" /> Google Maps (URL Embed)</label>
            <input
              className="glass-input w-full"
              value={mapUrl}
              onChange={e => setMapUrl(e.target.value)}
              placeholder="https://www.google.com/maps/embed?pb=..."
            />
            <p className="text-[10px] text-slate-400 leading-relaxed">
              <strong>Cómo obtenerlo:</strong> Ve a Google Maps &gt; Busca tu negocio &gt; Botón "Compartir" &gt; Pestaña "Insertar un mapa" &gt; Copiar HTML.
              Pega aquí el enlace que aparece dentro de <code>src="..."</code> o todo el código iframe (lo limpiaremos automáticamente).
            </p>
          </div>
          <div className="space-y-2">
            <label className="input-label flex items-center gap-2"><Globe className="w-3 h-3" /> Website</label>
            <input className="glass-input w-full" value={web} onChange={e => setWeb(e.target.value)} placeholder="https://..." />
          </div>
        </div>
      </Section>

      <div className="flex justify-end pt-6 pb-20">
        <button
          onClick={() => void save()}
          disabled={saving}
          className="btn-primary flex items-center gap-2 px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Guardar Cambios
        </button>
      </div>
    </div>
  );
}

function Section({ title, icon: Icon, children }: { title: string; icon?: any; children: ReactNode }) {
  return (
    <div className="glass-panel p-6">
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
        {Icon && <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600"><Icon className="w-5 h-5" /></div>}
        <h3 className="text-lg font-bold text-slate-800">{title}</h3>
      </div>
      <div className="space-y-6">
        {children}
      </div>
    </div>
  );
}

function PlusIcon() {
  return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>;
}

function HoursEditor({ value, onChange }: { value: any; onChange: (v: any) => void }) {
  const days = [
    { key: 'monday', label: 'Lunes' },
    { key: 'tuesday', label: 'Martes' },
    { key: 'wednesday', label: 'Miércoles' },
    { key: 'thursday', label: 'Jueves' },
    { key: 'friday', label: 'Viernes' },
    { key: 'saturday', label: 'Sábado' },
    { key: 'sunday', label: 'Domingo' },
  ];

  function updateDay(key: string, tramos: Array<{ abre: string; cierra: string }>) {
    const next = { ...(value || {}) } as any;
    next[key] = tramos;
    onChange(next);
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3">
        {days.map((d) => {
          const tramos: Array<{ abre: string; cierra: string }> = Array.isArray(value?.[d.key]) ? value[d.key] : [];

          return (
            <div key={d.key} className="flex flex-col sm:flex-row sm:items-center gap-4 p-3 rounded-lg bg-slate-50/50 border border-slate-100">
              <div className="w-24 text-sm font-semibold text-slate-700">{d.label}</div>

              <div className="flex-1 flex flex-wrap gap-2 items-center">
                {tramos.length === 0 && <span className="text-xs text-slate-400 italic px-2">Cerrado</span>}
                {tramos.map((t, i) => (
                  <div key={i} className="flex items-center gap-1 bg-white border border-slate-200 rounded px-2 py-1 shadow-sm">
                    <input type="time" className="text-xs border-none p-0 outline-none w-16 text-center" value={t.abre} onChange={e => {
                      const arr = [...tramos]; arr[i] = { ...arr[i], abre: e.target.value }; updateDay(d.key, arr);
                    }} />
                    <span className="text-slate-300">-</span>
                    <input type="time" className="text-xs border-none p-0 outline-none w-16 text-center" value={t.cierra} onChange={e => {
                      const arr = [...tramos]; arr[i] = { ...arr[i], cierra: e.target.value }; updateDay(d.key, arr);
                    }} />
                    <button onClick={() => updateDay(d.key, tramos.filter((_, idx) => idx !== i))} className="ml-1 text-slate-400 hover:text-rose-500"><XIcon /></button>
                  </div>
                ))}

                {tramos.length < 2 && (
                  <button onClick={() => updateDay(d.key, [...tramos, { abre: '', cierra: '' }])} className="text-xs text-emerald-600 font-medium hover:bg-emerald-50 px-2 py-1 rounded transition-colors">
                    + Añadir Horario
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function XIcon() {
  return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>;
}
