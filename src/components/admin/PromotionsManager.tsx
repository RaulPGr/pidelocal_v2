"use client";

import EmptyState from "@/components/admin/EmptyState";
import WeekdaySelector from "./WeekdaySelector";
import { useEffect, useMemo, useState } from "react";
import {
  Tag,
  Calendar,
  Percent,
  Euro,
  ShoppingBag,
  Layers,
  Check,
  X,
  Plus,
  Trash2,
  Edit2,
  Search,
  AlertCircle,
  Loader2,
  Upload
} from "lucide-react";
import clsx from "clsx";
import { toast } from "sonner";

type Promotion = {
  id: string;
  name: string;
  description?: string | null;
  type: "percent" | "fixed";
  value: number;
  scope: "order" | "category" | "product";
  target_category_id?: number | null;
  target_product_id?: number | null;
  target_product_ids?: number[] | null;
  min_amount?: number | null;
  start_date?: string | null;
  end_date?: string | null;
  weekdays?: number[] | null;
  active?: boolean;
};

type Option = { id: number; name: string; active?: boolean };

const ALL_WEEKDAYS = [1, 2, 3, 4, 5, 6, 7];

type FormState = {
  name: string;
  description: string;
  type: "percent" | "fixed";
  value: string;
  scope: "order" | "category" | "product";
  target_category_id: string;
  target_product_ids: string[];
  min_amount: string;
  start_date: string;
  end_date: string;
  weekdays: number[];
  active: boolean;
};

const DEFAULT_FORM: FormState = {
  name: "",
  description: "",
  type: "percent",
  value: "10",
  scope: "order",
  target_category_id: "",
  target_product_ids: [],
  min_amount: "",
  start_date: "",
  end_date: "",
  weekdays: [...ALL_WEEKDAYS],
  active: true,
};

function formatDateLabel(value?: string | null) {
  if (!value) return null;
  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return value;
  }
}

function formatScope(promo: Promotion, categories: Option[], products: Option[]) {
  if (promo.scope === "order") return <span className="inline-flex items-center gap-1.5"><ShoppingBag className="w-3.5 h-3.5" /> Todo el pedido</span>;
  if (promo.scope === "category") {
    const name = categories.find((c) => c.id === promo.target_category_id)?.name;
    return <span className="inline-flex items-center gap-1.5"><Layers className="w-3.5 h-3.5" /> {name || "Categoría"}</span>;
  }
  if (promo.scope === "product") {
    const ids = (promo.target_product_ids && promo.target_product_ids.length > 0)
      ? promo.target_product_ids
      : (promo.target_product_id ? [promo.target_product_id] : []);

    if (!ids.length) return <span className="inline-flex items-center gap-1.5"><Tag className="w-3.5 h-3.5" /> Producto</span>;

    // Si son muchos, mostramos cantidad
    if (ids.length > 1) return <span className="inline-flex items-center gap-1.5"><Tag className="w-3.5 h-3.5" /> {ids.length} productos</span>;

    const names = ids
      .map((id) => products.find((p) => p.id === id)?.name)
      .filter(Boolean) as string[];

    return <span className="inline-flex items-center gap-1.5"><Tag className="w-3.5 h-3.5" /> {names[0] || "Producto"}</span>;
  }
  return promo.scope;
}

export default function PromotionsManager() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [list, setList] = useState<Promotion[]>([]);
  const [categories, setCategories] = useState<Option[]>([]);
  const [products, setProducts] = useState<Option[]>([]);

  // Drawer State
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const resp = await fetch("/api/admin/promotions", { cache: "no-store" });
      const j = await resp.json();
      if (!resp.ok || !j?.ok) throw new Error(j?.error || "No se pudieron cargar las promociones");
      setList(Array.isArray(j.promotions) ? j.promotions : []);
      setCategories(Array.isArray(j.categories) ? j.categories : []);
      setProducts(Array.isArray(j.products) ? j.products : []);
    } catch (e: any) {
      toast.error(e?.message || "Error cargando promociones");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  function handleCreateNew() {
    setForm(DEFAULT_FORM);
    setEditingId(null);
    setIsCreateOpen(true);
  }

  function startEdit(promo: Promotion) {
    setEditingId(promo.id);
    setForm({
      name: promo.name || "",
      description: promo.description || "",
      type: promo.type,
      value: String(promo.value ?? ""),
      scope: promo.scope,
      target_category_id: promo.target_category_id ? String(promo.target_category_id) : "",
      target_product_ids: promo.target_product_ids && promo.target_product_ids.length > 0
        ? promo.target_product_ids.map((id) => String(id))
        : (promo.target_product_id ? [String(promo.target_product_id)] : []),
      min_amount: promo.min_amount != null ? String(promo.min_amount) : "",
      start_date: promo.start_date ? promo.start_date.split('T')[0] : "",
      end_date: promo.end_date ? promo.end_date.split('T')[0] : "",
      weekdays: promo.weekdays && promo.weekdays.length > 0 ? promo.weekdays : [...ALL_WEEKDAYS],
      active: promo.active !== false,
    });
    setIsCreateOpen(true);
  }

  function toggleProductSelection(id: string) {
    setForm((prev) => {
      const exists = prev.target_product_ids.includes(id);
      return {
        ...prev,
        target_product_ids: exists
          ? prev.target_product_ids.filter((val) => val !== id)
          : [...prev.target_product_ids, id],
      };
    });
  }

  async function save() {
    if (!form.name.trim()) return toast.error("El nombre es obligatorio");
    try {
      setSaving(true);
      const payload = {
        ...form,
        value: Number(form.value),
        min_amount: form.min_amount ? Number(form.min_amount) : undefined,
        weekdays: form.weekdays.length > 0 ? form.weekdays : [...ALL_WEEKDAYS],
        target_category_id: form.scope === "category" ? Number(form.target_category_id) || null : null,
        target_product_id:
          form.scope === "product" && form.target_product_ids.length > 0
            ? Number(form.target_product_ids[0]) || null
            : null,
        target_product_ids:
          form.scope === "product"
            ? form.target_product_ids.map((id) => Number(id)).filter((id) => Number.isFinite(id))
            : null,
      };

      const method = editingId ? "PATCH" : "POST";
      const body = editingId ? { id: editingId, ...payload } : payload;

      const resp = await fetch("/api/admin/promotions", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const j = await resp.json().catch(() => ({}));
      if (!resp.ok || !j?.ok) throw new Error(j?.error || "No se pudo guardar");

      toast.success(editingId ? "Promoción actualizada" : "Promoción creada");
      setIsCreateOpen(false);
      await load();

    } catch (e: any) {
      toast.error(e?.message || "Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    if (!window.confirm("¿Seguro que quieres eliminar esta promoción?")) return;
    try {
      setLoading(true); // Small local load or toast loading? Better blocking to avoid double click.
      const resp = await fetch(`/api/admin/promotions?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      const j = await resp.json().catch(() => ({}));
      if (!resp.ok || !j?.ok) throw new Error(j?.error || "No se pudo eliminar");
      toast.success("Promoción eliminada");
      await load();
    } catch (e: any) {
      toast.error(e?.message || "Error al eliminar");
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Promociones</h2>
          <p className="text-slate-500 text-sm mt-1">Ofertas automáticas para aumentar tu ticket medio.</p>
        </div>
        <button
          onClick={handleCreateNew}
          className="btn-primary flex items-center gap-2 shadow-lg shadow-emerald-600/20 hover:shadow-emerald-600/30 px-5 py-2.5"
        >
          <Plus className="w-5 h-5" />
          Nueva Promoción
        </button>
      </div>

      {loading ? (
        <div className="glass-panel h-64 flex flex-col items-center justify-center text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin mb-3 text-emerald-500" />
          <p className="text-sm font-medium">Cargando...</p>
        </div>
      ) : list.length === 0 ? (
        <EmptyState
          icon={Tag}
          title="No hay promociones activas"
          description="Crea descuentos especiales y verás cómo tus clientes repiten."
          action={
            <button onClick={handleCreateNew} className="text-emerald-600 font-bold hover:underline">
              Crear mi primera promoción
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {list.map(promo => {
            const startDate = formatDateLabel(promo.start_date);
            const endDate = formatDateLabel(promo.end_date);
            const hasDates = startDate || endDate;

            return (
              <div key={promo.id} className="glass-panel p-5 flex flex-col md:flex-row gap-5 items-start md:items-center group hover:border-emerald-500/30 transition-all hover:shadow-md">
                {/* Icon / Status */}
                <div className={clsx(
                  "w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border",
                  promo.active
                    ? "bg-emerald-50 border-emerald-100 text-emerald-600"
                    : "bg-slate-50 border-slate-100 text-slate-400 grayscale"
                )}>
                  {promo.type === 'percent' ? <Percent className="w-7 h-7" /> : <Euro className="w-7 h-7" />}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-bold text-slate-800 truncate">{promo.name}</h3>
                    {!promo.active && <span className="bg-slate-100 text-slate-500 text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wide border border-slate-200">Pausada</span>}
                  </div>

                  <p className="text-sm text-slate-500 line-clamp-1">{promo.description || "Sin descripción adicional."}</p>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 font-medium pt-1">
                    <span className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200/60">
                      {formatScope(promo, categories, products)}
                    </span>
                    {hasDates && (
                      <span className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200/60">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {startDate || 'Inicio'} &rarr; {endDate || 'Siempre'}
                      </span>
                    )}
                    {promo.min_amount && (
                      <span className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200/60">
                        Min. {Number(promo.min_amount).toFixed(2)}€
                      </span>
                    )}
                  </div>
                </div>

                {/* Value */}
                <div className="flex flex-row md:flex-col items-center md:items-end gap-3 pl-0 md:pl-6 md:border-l border-slate-100 shrink-0 min-w-[120px]">
                  <div className="text-2xl font-black text-emerald-600 tracking-tight">
                    {promo.type === 'percent' ? `-${promo.value}%` : `-${Number(promo.value).toFixed(2)}€`}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 pl-0 md:pl-2">
                  <button
                    onClick={() => startEdit(promo)}
                    className="p-2.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors"
                    title="Editar"
                  >
                    <Edit2 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => void remove(promo.id)}
                    className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                    title="Eliminar"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* --- DRAWER FORM --- */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex justify-end isolate">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity animate-in fade-in"
            onClick={() => setIsCreateOpen(false)}
          />

          {/* Drawer Panel */}
          <div className="relative w-full max-w-lg bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">

            {/* Header */}
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-white z-10">
              <div>
                <h2 className="text-xl font-bold text-slate-900">{editingId ? 'Editar Promoción' : 'Nueva Promoción'}</h2>
                <p className="text-sm text-slate-500">Configura tu oferta irresistible.</p>
              </div>
              <button onClick={() => setIsCreateOpen(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8">

              {/* 1. Basics */}
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nombre</label>
                  <input
                    className="glass-input w-full px-4 py-2.5 text-base"
                    placeholder="Ej: Happy Hour, 2x1..."
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    autoFocus
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Descripción (Opcional)</label>
                  <input
                    className="glass-input w-full px-4 py-2.5 text-sm"
                    placeholder="Ej: Solo válida para llevar"
                    value={form.description}
                    onChange={e => setForm({ ...form, description: e.target.value })}
                  />
                </div>
              </div>

              <hr className="border-slate-100" />

              {/* 2. Discount Rule */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Percent className="w-4 h-4 text-emerald-500" /> Reglas del Descuento
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  {/* Type Toggle */}
                  <div className="bg-slate-100 p-1 rounded-xl flex">
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, type: 'percent' })}
                      className={clsx("flex-1 text-sm font-medium py-2 rounded-lg transition-all", form.type === 'percent' ? "bg-white text-emerald-700 shadow-sm" : "text-slate-500 hover:text-slate-700")}
                    >
                      % Porcentaje
                    </button>
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, type: 'fixed' })}
                      className={clsx("flex-1 text-sm font-medium py-2 rounded-lg transition-all", form.type === 'fixed' ? "bg-white text-emerald-700 shadow-sm" : "text-slate-500 hover:text-slate-700")}
                    >
                      € Fijo
                    </button>
                  </div>

                  {/* Value Input */}
                  <div className="relative">
                    <input
                      type="number" min="0" step="0.01"
                      className="glass-input w-full px-4 py-2.5 font-bold text-slate-800"
                      placeholder="0"
                      value={form.value}
                      onChange={e => setForm({ ...form, value: e.target.value })}
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold pointer-events-none">
                      {form.type === 'percent' ? '%' : '€'}
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Importe Mínimo (Opcional)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">€</span>
                    <input
                      type="number" min="0" step="1"
                      className="glass-input w-full pl-8 py-2.5 text-sm"
                      placeholder="Ej: 20 (Para aplicar descuento)"
                      value={form.min_amount}
                      onChange={e => setForm({ ...form, min_amount: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <hr className="border-slate-100" />

              {/* 3. Scope */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-emerald-500" /> Aplicar a...
                </h3>

                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'order', label: 'Todo', icon: ShoppingBag },
                    { id: 'category', label: 'Categoría', icon: Layers },
                    { id: 'product', label: 'Productos', icon: Tag },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setForm({ ...form, scope: opt.id as any })}
                      className={clsx(
                        "flex flex-col items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all",
                        form.scope === opt.id
                          ? "border-emerald-500 bg-emerald-50/50 text-emerald-700"
                          : "border-slate-100 bg-white text-slate-500 hover:border-slate-200 hover:bg-slate-50"
                      )}
                    >
                      <opt.icon className="w-5 h-5" />
                      <span className="text-xs font-bold">{opt.label}</span>
                    </button>
                  ))}
                </div>

                {/* Dynamic Inputs based on Scope */}
                {form.scope === 'category' && (
                  <div className="animate-in fade-in slide-in-from-top-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Elige la categoría</label>
                    <select
                      className="glass-input w-full px-4 py-2.5"
                      value={form.target_category_id}
                      onChange={e => setForm({ ...form, target_category_id: e.target.value })}
                    >
                      <option value="">-- Seleccionar --</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                )}

                {form.scope === 'product' && (
                  <div className="animate-in fade-in slide-in-from-top-2 bg-slate-50 rounded-xl p-3 border border-slate-100 max-h-48 overflow-y-auto">
                    <p className="text-xs font-bold text-slate-400 uppercase mb-2 tracking-wider">Selecciona productos:</p>
                    <div className="space-y-1">
                      {products.map(p => (
                        <label key={p.id} className="flex items-center gap-3 p-2 hover:bg-white rounded-lg cursor-pointer transition-colors">
                          <input
                            type="checkbox"
                            className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                            checked={form.target_product_ids.includes(String(p.id))}
                            onChange={() => toggleProductSelection(String(p.id))}
                          />
                          <span className="text-sm text-slate-700">{p.name}</span>
                        </label>
                      ))}
                      {products.length === 0 && <span className="text-xs text-slate-400">No hay productos.</span>}
                    </div>
                  </div>
                )}
              </div>

              <hr className="border-slate-100" />

              {/* 4. Validity */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-emerald-500" /> Fechas y Días
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Desde</label>
                    <input type="date" className="glass-input w-full px-3 py-2 text-sm" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Hasta (Opcional)</label>
                    <input type="date" className="glass-input w-full px-3 py-2 text-sm" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Días de la semana</label>
                  <WeekdaySelector value={form.weekdays} onChange={v => setForm({ ...form, weekdays: v })} />
                  <p className="text-xs text-slate-400 mt-2">
                    {form.weekdays.length === 7 ? "Válido todos los días." : form.weekdays.length === 0 ? "Selecciona al menos un día." : "Válido solo los días marcados."}
                  </p>
                </div>
              </div>

              {/* 5. Active Toggle */}
              <div className="bg-slate-50 rounded-xl p-4 flex items-center justify-between border border-slate-100">
                <span className="text-sm font-medium text-slate-700">Promoción Activa</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={form.active} onChange={e => setForm({ ...form, active: e.target.checked })} />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                </label>
              </div>

            </div>

            {/* Footer Actions */}
            <div className="p-6 border-t border-slate-100 bg-white flex justify-end gap-3 z-10 sticky bottom-0">
              <button
                onClick={() => setIsCreateOpen(false)}
                className="px-6 py-2.5 rounded-xl text-slate-500 font-medium hover:bg-slate-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => void save()}
                disabled={saving || !form.name.trim()}
                className="btn-primary px-8 py-2.5 rounded-xl shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {editingId ? "Guardar" : "Crear"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
