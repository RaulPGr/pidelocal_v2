"use client";

import { useEffect, useState } from 'react';
import { CreditCard, Banknote, Loader2, Save } from 'lucide-react';
import clsx from 'clsx';

type Config = { cash: boolean; card: boolean };

export default function SettingsClient() {
  const [cfg, setCfg] = useState<Config>({ cash: true, card: true });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/settings/payments', { cache: 'no-store' });
        const j = await res.json();
        if (j?.ok && j?.data) setCfg({ cash: !!j.data.cash, card: !!j.data.card });
      } catch { }
    })();
  }, []);

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/settings/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cfg),
      });
      const j = await res.json();
      if (!res.ok || !j?.ok) throw new Error(j?.message || 'Error guardando');
      // Success feedback wrapped in UI, no alert
    } catch (e: any) {
      setError(e?.message || 'No se pudo guardar');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="glass-panel p-6 space-y-6">
      <div className="flex items-center gap-3 mb-4 pb-4 border-b border-slate-100">
        <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
          <CreditCard className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-800">Métodos de Pago</h2>
          <p className="text-sm text-slate-500">Elige qué opciones de pago ofreces a tus clientes.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <PaymentMethodCard
          title="Pago en Efectivo / Tienda"
          description="El cliente paga al recoger o recibir su pedido."
          icon={Banknote}
          active={cfg.cash}
          onToggle={() => setCfg(c => ({ ...c, cash: !c.cash }))}
        />
        <PaymentMethodCard
          title="Pago con Tarjeta"
          description="Habilita la pasarela de pago online (Stripe)."
          icon={CreditCard}
          active={cfg.card}
          onToggle={() => setCfg(c => ({ ...c, card: !c.card }))}
        />
      </div>

      {error && <div className="text-xs text-rose-600 bg-rose-50 p-2 rounded border border-rose-200">{error}</div>}

      <div className="flex justify-end pt-4">
        <button
          onClick={() => void save()}
          disabled={saving}
          className="btn-primary flex items-center gap-2"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Guardar Cambios
        </button>
      </div>
    </div>
  );
}

function PaymentMethodCard({ title, description, icon: Icon, active, onToggle }: any) {
  return (
    <label className={clsx("flex items-start gap-4 p-4 rounded-xl border cursor-pointer transition-all", active ? "border-emerald-500 bg-emerald-50/30 ring-1 ring-emerald-500" : "border-slate-200 hover:bg-slate-50")}>
      <div className={clsx("w-5 h-5 mt-1 border rounded-full flex items-center justify-center transition-colors", active ? "bg-emerald-500 border-emerald-500" : "bg-white border-slate-300")}>
        {active && <div className="w-2 h-2 bg-white rounded-full" />}
      </div>
      <input type="checkbox" className="hidden" checked={active} onChange={onToggle} />

      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <Icon className="w-4 h-4 text-slate-500" />
          <span className="font-semibold text-slate-800 text-sm">{title}</span>
        </div>
        <p className="text-xs text-slate-500">{description}</p>
      </div>
    </label>
  );
}
