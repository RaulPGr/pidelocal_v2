"use client";

import { useEffect, useState } from 'react';
import { Clock, Save, Loader2, X, CreditCard } from 'lucide-react';
import clsx from 'clsx';

type DayKey = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
type Tramo = { abre: string; cierra: string };
type OrderingHours = Partial<Record<DayKey, Tramo[]>>;

export default function OrdersHoursSettingsClient() {
  function getTenantFromUrl(): string {
    if (typeof window === 'undefined') return '';
    try { return new URLSearchParams(window.location.search).get('tenant') || ''; } catch { return ''; }
  }
  const [value, setValue] = useState<OrderingHours>({});
  const [delivery, setDelivery] = useState({ enabled: false, min: 0, fee: 0, pay_on_delivery_enabled: true, datafono_enabled: true });
  const [payments, setPayments] = useState({ cash: true, card: true });
  const [stripeConnectedId, setStripeConnectedId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  // Check URL params for callback status
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search);
      if (p.get('success') === 'stripe_connected') {
        setMsg('Cuenta de Stripe conectada correctamente 🎉');
        // Clean URL
        window.history.replaceState({}, '', window.location.pathname + window.location.search.replace(/[?&]success=[^&]+/, '').replace(/[?&]error=[^&]+/, ''));
      } else if (p.get('error')) {
        setMsg(`Error conectando Stripe: ${p.get('error')}`);
      }
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const t = getTenantFromUrl();
        const urlBusiness = t ? `/api/admin/business?tenant=${encodeURIComponent(t)}` : '/api/admin/business';
        const urlPayments = t ? `/api/settings/payments?tenant=${encodeURIComponent(t)}` : '/api/settings/payments';

        const [rBus, rPay] = await Promise.all([
          fetch(urlBusiness, { cache: 'no-store' }),
          fetch(urlPayments, { cache: 'no-store' })
        ]);

        const jBus = await rBus.json();
        if (jBus?.ok) {
          const raw = jBus.data?.ordering_hours;
          setValue((() => { try { return raw || {}; } catch { return {}; } })());
          // Load delivery settings from social
          if (jBus.data?.social) {
            setDelivery({
              enabled: !!jBus.data.social.delivery_enabled,
              min: Number(jBus.data.social.delivery_min || 0),
              fee: Number(jBus.data.social.delivery_fee || 0),
              pay_on_delivery_enabled: jBus.data.social.delivery_pay_on_delivery_enabled !== false,
              datafono_enabled: jBus.data.social.delivery_datafono_enabled !== false,
            });
          }
          // Check Stripe ID
          if (jBus.data?.social?.stripe_account_id) {
            setStripeConnectedId(jBus.data.social.stripe_account_id);
          }
        }

        const jPay = await rPay.json();
        if (jPay?.ok && jPay?.data) {
          setPayments({ cash: !!jPay.data.cash, card: !!jPay.data.card });
        }
      } catch { }
    })();
  }, []);

  async function save() {
    try {
      setSaving(true);
      setMsg(null);
      const t = getTenantFromUrl();
      const urlBusiness = t ? `/api/admin/business?tenant=${encodeURIComponent(t)}` : '/api/admin/business';
      const urlPayments = t ? `/api/settings/payments?tenant=${encodeURIComponent(t)}` : '/api/settings/payments';

      // Save Both
      const [rBus, rPay] = await Promise.all([
        fetch(urlBusiness, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ordering_hours: value && Object.keys(value).length ? value : '',
            social: {
              delivery_enabled: delivery.enabled,
              delivery_min: delivery.min,
              delivery_fee: delivery.fee,
              delivery_pay_on_delivery_enabled: delivery.pay_on_delivery_enabled,
              delivery_datafono_enabled: delivery.datafono_enabled
            }
          }),
        }),
        fetch(urlPayments, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payments),
        })
      ]);

      const jBus = await rBus.json();
      const jPay = await rPay.json();

      if (!jBus?.ok || !jPay?.ok) throw new Error(jBus?.error || jPay?.message || 'Error');

      setMsg('Guardado correctamente');
      setTimeout(() => setMsg(null), 3000);
    } catch (e: any) {
      setMsg(e?.message || 'No se pudo guardar');
    } finally {
      setSaving(false);
    }
  }

  async function connectStripe() {
    try {
      const t = getTenantFromUrl();
      const url = t ? `/api/stripe/connect?tenant=${encodeURIComponent(t)}` : '/api/stripe/connect';
      const res = await fetch(url);
      const json = await res.json();
      if (json.ok && json.url) {
        window.location.href = json.url;
      } else {
        alert("Error iniciando conexión con Stripe: " + (json.message || "Desconocido"));
      }
    } catch (e) {
      alert("Error: " + e);
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">

      {/* Payment Methods Section */}
      <div className="glass-panel p-6">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
          <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800">Métodos de Pago</h2>
            <p className="text-sm text-slate-500">Elige qué métodos de pago aceptas para pedidos online.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className={clsx(
            "cursor-pointer relative flex flex-col p-4 rounded-xl border transition-all",
            payments.cash ? "border-emerald-500 bg-emerald-50/50 ring-1 ring-emerald-500" : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
          )}>
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-slate-700 flex items-center gap-2">
                <span className="text-xl">💶</span> Pago en Local
              </span>
              <input type="checkbox" className="w-5 h-5 rounded text-emerald-600 focus:ring-emerald-500 border-gray-300"
                checked={payments.cash}
                onChange={e => setPayments(prev => ({ ...prev, cash: e.target.checked }))}
              />
            </div>
            <p className="text-xs text-slate-500">
              El cliente paga al recoger (Efectivo o Tarjeta física). No requiere configuración extra.
            </p>
          </label>

          <div className={clsx(
            "relative flex flex-col p-4 rounded-xl border transition-all",
            payments.card ? "border-indigo-500 bg-indigo-50/50 ring-1 ring-indigo-500" : "border-slate-200 bg-slate-50"
          )}>
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-slate-700 flex items-center gap-2">
                <span className="text-xl">💳</span> Pago Online (Stripe)
              </span>
              <div className="flex items-center gap-3">
                {/* Toggle Enabled */}
                <label className="flex items-center cursor-pointer">
                  <input type="checkbox" className="w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500 border-gray-300"
                    checked={payments.card}
                    onChange={e => setPayments(prev => ({ ...prev, card: e.target.checked }))}
                  />
                </label>
              </div>
            </div>

            {/* Stripe Connect State */}
            <div className="mt-3 pt-3 border-t border-slate-200/50">
              {stripeConnectedId ? (
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 text-emerald-700 font-medium">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    Cuenta Conectada
                  </span>
                  <span className="font-mono text-slate-400">{stripeConnectedId}</span>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs text-rose-600 font-medium flex items-center gap-1">
                    ⚠️ Requiere conexión
                  </span>
                  <button onClick={connectStripe} className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm font-medium">
                    Conectar Stripe
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Delivery Settings Section */}
      <div className="glass-panel p-6">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
          <div className="p-2 bg-rose-50 rounded-lg text-rose-600">
            <span className="text-xl">🛵</span>
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800">Reparto a Domicilio (Propio)</h2>
            <p className="text-sm text-slate-500">Configura si ofreces reparto con tus propios repartidores.</p>
          </div>
          <div className="ml-auto">
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" checked={delivery.enabled} onChange={e => setDelivery(p => ({ ...p, enabled: e.target.checked }))} />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-rose-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-600"></div>
            </label>
          </div>
        </div>

        {delivery.enabled && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-top-2">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Pedido Mínimo (€)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">€</span>
                <input type="number" min="0" step="0.5" className="w-full pl-8 rounded-lg border-slate-200 focus:ring-rose-500 focus:border-rose-500"
                  value={delivery.min}
                  onChange={e => setDelivery(p => ({ ...p, min: parseFloat(e.target.value) || 0 }))}
                />
              </div>
              <p className="text-xs text-slate-500 mt-1">El cliente no podrá pedir si no llega a este importe (subtotal).</p>
              {/* Delivery Fee */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Coste de Envío (EUR)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">€</span>
                  <input
                    type="number"
                    step="0.50"
                    value={delivery.fee}
                    onChange={(e) => setDelivery(p => ({ ...p, fee: parseFloat(e.target.value) || 0 }))}
                    className="w-full pl-8 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition-all"
                    placeholder="2.50"
                  />
                </div>
              </div>

              {/* Pay on Delivery Option */}
              <div className="col-span-1 md:col-span-2 mt-2 pt-4 border-t border-slate-100">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setDelivery(p => ({ ...p, pay_on_delivery_enabled: !p.pay_on_delivery_enabled }))}
                    className={`relative w-11 h-6 transition flex items-center rounded-full ${delivery.pay_on_delivery_enabled !== false ? 'bg-slate-900' : 'bg-slate-200'}`}
                  >
                    <span className={`inline-block w-4 h-4 transform transition bg-white rounded-full ml-1 ${delivery.pay_on_delivery_enabled !== false ? 'translate-x-5' : ''}`} />
                  </button>
                  <div>
                    <span className="text-sm font-medium text-slate-700">Permitir pago al recibir</span>
                    <p className="text-xs text-slate-500">Si lo desactivas, los pedidos a domicilio deberán pagarse obligatoriamente con tarjeta en la web.</p>
                  </div>
                </div>

                {/* Datafono Toggle (Only if Pay on Delivery is enabled) */}
                {delivery.pay_on_delivery_enabled !== false && (
                  <div className="flex items-center gap-3 mt-4 ml-14 animate-in slide-in-from-top-1">
                    <input
                      type="checkbox"
                      checked={delivery.datafono_enabled !== false}
                      onChange={(e) => setDelivery(p => ({ ...p, datafono_enabled: e.target.checked }))}
                      className="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                      id="datafono_check"
                    />
                    <label htmlFor="datafono_check" className="text-sm text-slate-600 select-none cursor-pointer">
                      El repartidor lleva datáfono (Permitir tarjeta en domicilio)
                    </label>
                  </div>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-1">Se sumará al total del pedido automáticamente.</p>
            </div>
          </div>
        )}
      </div>

      {/* Existing Hours Section */}
      <div className="glass-panel p-6">
        <div className="flex items-center gap-3 mb-4 pb-4 border-b border-slate-100">
          <div className="p-2 bg-amber-50 rounded-lg text-amber-600">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800">Horario de Pedidos</h2>
            <p className="text-sm text-slate-500">
              Define cuando se aceptan pedidos en la web. Si está vacío, se usarán los horarios de apertura generales.
            </p>
          </div>
        </div>

        <HoursEditor value={value} onChange={setValue} />
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t border-slate-200 flex justify-end lg:relative lg:bg-transparent lg:border-0 lg:p-0">
        <div className="flex items-center gap-4">
          {msg && <span className="text-emerald-600 font-medium bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100 animate-in fade-in slide-in-from-bottom-2">{msg}</span>}
          <button
            onClick={() => void save()}
            disabled={saving}
            className="btn-primary flex items-center gap-2 shadow-xl shadow-indigo-500/20"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Guardar Cambios
          </button>
        </div>
      </div>
    </div >
  );
}

function HoursEditor({ value, onChange }: { value: OrderingHours; onChange: (v: OrderingHours) => void }) {
  const days = [
    { key: 'monday', label: 'Lunes' },
    { key: 'tuesday', label: 'Martes' },
    { key: 'wednesday', label: 'Miércoles' },
    { key: 'thursday', label: 'Jueves' },
    { key: 'friday', label: 'Viernes' },
    { key: 'saturday', label: 'Sábado' },
    { key: 'sunday', label: 'Domingo' },
  ] as { key: DayKey; label: string }[];

  function updateDay(key: DayKey, tramos: Tramo[]) {
    const next: OrderingHours = { ...(value || {}) };
    if (!tramos || tramos.length === 0) {
      delete (next as any)[key];
    } else {
      (next as any)[key] = tramos;
    }
    onChange(next);
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3">
        {days.map((d) => {
          const tramos: Tramo[] = Array.isArray((value as any)?.[d.key]) ? (value as any)[d.key] : [];

          return (
            <div key={d.key} className="flex flex-col sm:flex-row sm:items-center gap-4 p-3 rounded-lg bg-slate-50/50 border border-slate-100">
              <div className="w-24 text-sm font-semibold text-slate-700">{d.label}</div>

              <div className="flex-1 flex flex-wrap gap-2 items-center">
                {tramos.length === 0 && <span className="text-xs text-slate-400 italic px-2">Igual al de apertura / Cerrado</span>}
                {tramos.map((t, i) => (
                  <div key={i} className="flex items-center gap-1 bg-white border border-slate-200 rounded px-2 py-1 shadow-sm">
                    <input type="time" className="text-xs border-none p-0 outline-none w-16 text-center" value={t.abre} onChange={e => {
                      const arr = [...tramos]; arr[i] = { ...arr[i], abre: e.target.value }; updateDay(d.key, arr);
                    }} />
                    <span className="text-slate-300">-</span>
                    <input type="time" className="text-xs border-none p-0 outline-none w-16 text-center" value={t.cierra} onChange={e => {
                      const arr = [...tramos]; arr[i] = { ...arr[i], cierra: e.target.value }; updateDay(d.key, arr);
                    }} />
                    <button onClick={() => updateDay(d.key, tramos.filter((_, idx) => idx !== i))} className="ml-1 text-slate-400 hover:text-rose-500"><X className="w-3 h-3" /></button>
                  </div>
                ))}

                {tramos.length < 2 && (
                  <button onClick={() => updateDay(d.key, [...tramos, { abre: '', cierra: '' }])} className="text-xs text-emerald-600 font-medium hover:bg-emerald-50 px-2 py-1 rounded transition-colors">
                    + Añadir
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
