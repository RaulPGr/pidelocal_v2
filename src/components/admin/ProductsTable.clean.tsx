"use client";

import React, { useMemo, useRef, useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Plus, Search, Filter, Trash2, Edit2, Image as ImageIcon,
  Check, X, Upload, ZoomIn, Move, ArrowUpDown, ShoppingBag
} from "lucide-react";
import ReorderableProductList from "./ReorderableProductList";
import EmptyState from "@/components/admin/EmptyState";

type Category = { id: number; name: string; sort_order?: number | null };
type Product = {
  id: number;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  available: boolean;
  category_id: number | null;
  sort_order?: number | null;
  weekdays?: number[];
};

type Props = {
  initialProducts: Product[];
  categories: Category[];
  initialWeekdays?: Record<number, number[]>;
};

// Selector de días para los modos de carta "daily".
function WeekdaySelector({ value, onChange, compact }: { value: number[]; onChange: (v: number[]) => void; compact?: boolean }) {
  const days = [
    { d: 1, label: 'L' }, { d: 2, label: 'M' }, { d: 3, label: 'X' },
    { d: 4, label: 'J' }, { d: 5, label: 'V' }, { d: 6, label: 'S' }, { d: 7, label: 'D' },
  ];
  function toggle(day: number, checked: boolean) {
    const set = new Set(value);
    if (checked) set.add(day); else set.delete(day);
    const arr = Array.from(set).sort((a, b) => a - b);
    onChange(arr);
  }
  return (
    <div className={compact ? 'flex gap-2' : 'flex flex-wrap gap-2'}>
      {days.map(({ d, label }) => (
        <label key={d} className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold transition-colors cursor-pointer border ${value.includes(d) ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'}`}>
          <input type="checkbox" className="hidden" checked={value.includes(d)} onChange={(e) => toggle(d, e.target.checked)} />
          <span>{label}</span>
        </label>
      ))}
    </div>
  );
}

export default function ProductsTable({ initialProducts, categories, initialWeekdays }: Props) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [loading, setLoading] = useState(false);
  const [weekdays, setWeekdays] = useState<Record<number, number[]>>(initialWeekdays || {});
  const [menuMode, setMenuMode] = useState<'fixed' | 'daily'>('fixed');
  const [cats, setCats] = useState<Category[]>(categories);
  const [reorderMode, setReorderMode] = useState(false); // NEW STATE for reordering

  const searchParams = useSearchParams();
  const router = useRouter();

  // URL Action Handling (Quick Actions)
  useEffect(() => {
    if (searchParams.get('action') === 'new') {
      const form = document.getElementById('create-product-form');
      if (form) {
        form.scrollIntoView({ behavior: 'smooth' });
        router.replace('/admin/products', { scroll: false });
      }
    }
  }, [searchParams, router]);

  async function compressImage(file: File, maxW = 1400, maxH = 1400, quality = 0.84): Promise<File> {
    try {
      if (!file || !(file instanceof File)) return file;
      if (file.size <= 3 * 1024 * 1024) return file; // ya es razonable
      const url = URL.createObjectURL(file);
      const img = new Image();
      await new Promise<void>((res, rej) => { img.onload = () => res(); img.onerror = () => rej(); img.src = url; });
      const iw = img.naturalWidth || img.width;
      const ih = img.naturalHeight || img.height;
      let w = iw, h = ih;
      const scale = Math.min(maxW / iw, maxH / ih, 1);
      w = Math.max(1, Math.round(iw * scale));
      h = Math.max(1, Math.round(ih * scale));
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) return file;
      ctx.drawImage(img, 0, 0, w, h);
      const blob: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));
      URL.revokeObjectURL(url);
      if (!blob) return file;
      const name = (file.name || 'image').replace(/\.[^.]+$/, '.jpg');
      return new File([blob], name, { type: 'image/jpeg' });
    } catch {
      return file;
    }
  }

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch('/api/admin/business', { cache: 'no-store' });
        const j = await r.json();
        if (j?.ok && (j.data?.menu_mode === 'daily' || j.data?.menu_mode === 'fixed')) setMenuMode(j.data.menu_mode);
      } catch { }
    })();
  }, []);

  // Filtros
  const [filterCat, setFilterCat] = useState<number | "">("");
  const [filterName, setFilterName] = useState("");
  const [filterAvail, setFilterAvail] = useState<"all" | "yes" | "no">("all");
  const [priceMin, setPriceMin] = useState<number | "">("");
  const [priceMax, setPriceMax] = useState<number | "">("");

  // Form crear
  const [newName, setNewName] = useState("");
  const [newPrice, setNewPrice] = useState<number | "">("");
  const [newCat, setNewCat] = useState<number | "">("");
  const [newDesc, setNewDesc] = useState("");
  const [newAvail, setNewAvail] = useState(true);
  const [newFile, setNewFile] = useState<File | null>(null);
  const [newFilePreview, setNewFilePreview] = useState<string | null>(null);
  const [newDays, setNewDays] = useState<number[]>([]);
  const ALL_DAYS = [1, 2, 3, 4, 5, 6, 7];

  useEffect(() => {
    if (!newFile) { setNewFilePreview(null); return; }
    try { const url = URL.createObjectURL(newFile); setNewFilePreview(url); return () => URL.revokeObjectURL(url); } catch { }
  }, [newFile]);

  // Edición
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editRow, setEditRow] = useState<Partial<Product>>({});
  const [editDays, setEditDays] = useState<number[]>([]);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editFile, setEditFile] = useState<File | null>(null);
  const [editFilePreview, setEditFilePreview] = useState<string | null>(null);
  const [editZoom, setEditZoom] = useState(1);
  const [editOffsetX, setEditOffsetX] = useState(0);
  const [editOffsetY, setEditOffsetY] = useState(0);

  // Subida de imagen
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploadTargetId, setUploadTargetId] = useState<number | null>(null);

  const catById = useMemo(() => new Map(cats.map((c) => [c.id, c.name] as const)), [cats]);

  async function reloadCats() {
    try {
      const r = await fetch('/api/admin/categories', { cache: 'no-store' });
      const j = await r.json();
      if (j?.ok && Array.isArray(j.categories)) setCats(j.categories);
    } catch { }
  }
  useEffect(() => { void reloadCats(); }, []);

  function resetNewForm() {
    setNewName(""); setNewPrice(""); setNewCat(""); setNewDesc(""); setNewAvail(true); setNewFile(null); setNewDays([]);
  }

  function CategoriesManager() {
    const [newCatName, setNewCatName] = useState("");
    const [busy, setBusy] = useState(false);

    async function addCategory() {
      if (!newCatName.trim()) return;
      try {
        setBusy(true);
        const res = await fetch('/api/admin/categories', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ name: newCatName.trim() }) });
        const j = await res.json().catch(() => ({}));
        if (!res.ok || !j?.ok) throw new Error(j?.error || 'No se pudo crear la categoría');
        setNewCatName(""); await reloadCats();
      } catch (e: any) { alert(e?.message || 'Error'); } finally { setBusy(false); }
    }

    async function renameCategory(id: number, name: string) {
      try {
        setBusy(true);
        const res = await fetch('/api/admin/categories', { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id, name }) });
        const j = await res.json().catch(() => ({}));
        if (!res.ok || !j?.ok) throw new Error(j?.error || 'No se pudo renombrar');
        await reloadCats();
      } catch (e: any) { alert(e?.message || 'Error'); } finally { setBusy(false); }
    }

    async function reorder(id: number, dir: -1 | 1) {
      const idx = cats.findIndex(c => c.id === id);
      if (idx < 0) return;
      const targetIdx = idx + (dir as number);
      if (targetIdx < 0 || targetIdx >= cats.length) return;
      const me = cats[idx];
      const neighbor = cats[targetIdx];
      try {
        setBusy(true);
        const next = cats.slice();
        [next[idx], next[targetIdx]] = [next[targetIdx], next[idx]];
        const r1 = await fetch('/api/admin/categories', { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id: me.id, sort_order: targetIdx }) });
        if (!r1.ok) throw new Error('No se pudo guardar el orden');
        const r2 = await fetch('/api/admin/categories', { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id: neighbor.id, sort_order: idx }) });
        if (!r2.ok) throw new Error('No se pudo guardar el orden');
        setCats(next); await reloadCats();
      } catch (e: any) { alert(e?.message || 'Error'); } finally { setBusy(false); }
    }

    async function remove(id: number) {
      if (!confirm('¿Eliminar la categoría? Si tiene productos no se podrá borrar.')) return;
      try {
        setBusy(true);
        const res = await fetch(`/api/admin/categories?id=${id}`, { method: 'DELETE' });
        const j = await res.json().catch(() => ({}));
        if (!res.ok || !j?.ok) throw new Error(j?.error || 'No se pudo eliminar');
        await reloadCats();
      } catch (e: any) { alert(e?.message || 'Error'); } finally { setBusy(false); }
    }

    return (
      <div className="flex flex-wrap gap-2 items-center">
        {cats.map((c, idx) => (
          <div key={c.id} className="group relative inline-flex items-center gap-2 px-3 py-1 bg-white border border-slate-200 rounded-full text-sm font-medium text-slate-700 shadow-sm hover:border-emerald-300 hover:shadow-md transition-all">
            <span className="cursor-default">{c.name}</span>
            <div className="hidden group-hover:flex items-center gap-1 ml-1 border-l pl-2 border-slate-200">
              <button onClick={() => reorder(c.id, -1)} disabled={busy || idx === 0} className="hover:text-emerald-600 px-1 disabled:opacity-30">↑</button>
              <button onClick={() => reorder(c.id, +1)} disabled={busy || idx === cats.length - 1} className="hover:text-emerald-600 px-1 disabled:opacity-30">↓</button>
              <button onClick={() => remove(c.id)} disabled={busy} className="hover:text-rose-600 px-1"><Trash2 className="w-3 h-3" /></button>
            </div>
          </div>
        ))}
        <div className="flex items-center gap-2">
          <input
            className="glass-input px-3 py-1 rounded-full text-sm w-32 focus:w-48 transition-all"
            placeholder="+ Nueva cat..."
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addCategory()}
          />
          <button onClick={addCategory} disabled={busy || !newCatName.trim()} className="p-1 rounded-full bg-emerald-50 text-emerald-600 hover:bg-emerald-100 disabled:opacity-50"><Plus className="w-4 h-4" /></button>
        </div>
      </div>
    );
  }

  async function refresh() {
    const res = await fetch("/api/admin/orders/products", { cache: "no-store" });
    const { products: p, weekdays: wd } = await res.json();
    setProducts(p ?? []);
    setWeekdays(wd ?? {});
  }

  async function onCreate() {
    if (!newName.trim()) return;
    setLoading(true);
    const body: any = {
      name: newName.trim(),
      price: Number(newPrice || 0),
      category_id: newCat === "" ? null : Number(newCat),
      description: newDesc.trim() || null,
      available: newAvail,
      image_url: null,
    };
    if (menuMode === 'daily') body.weekdays = newDays.slice();
    const res = await fetch("/api/products", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (!res.ok) { setLoading(false); alert("Error al crear producto"); return; }
    const { id } = (await res.json()) as { id: number };
    if (id && newFile) {
      const compact = await compressImage(newFile);
      const fd = new FormData(); fd.append("id", String(id)); fd.append("file", compact);
      const up = await fetch("/api/products", { method: "PATCH", body: fd });
      if (!up.ok) { setLoading(false); alert("Producto creado, pero error al subir la imagen"); await refresh(); resetNewForm(); return; }
    }
    setLoading(false); await refresh(); resetNewForm();
  }

  async function onDelete(id: number) {
    if (!confirm("¿Eliminar producto?")) return;
    setLoading(true);
    const res = await fetch(`/api/products?id=${id}`, { method: "DELETE" });
    setLoading(false);
    if (!res.ok) { alert("Error al eliminar"); return; }
    await refresh();
  }

  function startEdit(p: Product) {
    setEditingId(p.id);
    setEditRow({ id: p.id, name: p.name, description: p.description, price: p.price, available: p.available, category_id: p.category_id });
    setEditDays(weekdays[p.id] ? [...weekdays[p.id]] : []);
    setEditModalOpen(true);
    setEditFile(null);
    setEditFilePreview(null);
    setEditZoom(1);
    setEditOffsetX(0);
    setEditOffsetY(0);
  }

  async function saveEdit() {
    if (!editingId) return; setLoading(true);
    const payload: any = { id: editingId, ...editRow, price: parseFloat(String(editRow.price ?? 0)) };
    if (menuMode === 'daily') payload.weekdays = editDays.slice();
    const res = await fetch("/api/products", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    setLoading(false);
    if (!res.ok) { const txt = await res.text().catch(() => ""); alert("Error al guardar cambios" + (txt ? `: ${txt}` : "")); return; }
    setWeekdays((prev) => ({ ...prev, [editingId]: menuMode === 'daily' ? editDays.slice() : (prev[editingId] || []) }));
    setEditingId(null); setEditRow({}); setEditModalOpen(false); setEditFile(null); setEditFilePreview(null); await refresh();
  }

  function cancelEdit() { setEditingId(null); setEditRow({}); setEditModalOpen(false); setEditFile(null); setEditFilePreview(null); setEditZoom(1); setEditOffsetX(0); setEditOffsetY(0); }

  function triggerUpload(id: number) { setUploadTargetId(id); fileRef.current?.click(); }

  async function onFilePicked(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f || !uploadTargetId) return;
    if (editingId && uploadTargetId === editingId) {
      try { const url = URL.createObjectURL(f); setEditFile(f); setEditFilePreview(url); setEditZoom(1); setEditOffsetX(0); setEditOffsetY(0); } catch { setEditFile(f); setEditFilePreview(null); }
      e.target.value = ""; return;
    }
    setLoading(true);
    const compact = await compressImage(f);
    const fd = new FormData(); fd.append("id", String(uploadTargetId)); fd.append("file", compact);
    const res = await fetch("/api/products", { method: "PATCH", body: fd }); setLoading(false); e.target.value = ""; setUploadTargetId(null);
    if (!res.ok) { const txt = await res.text().catch(() => ""); alert("Error al subir imagen" + (txt ? `: ${txt}` : "")); return; }
    await refresh();
  }

  // ... (Rest of image editing logic helper functions)
  async function buildEditedImage(file: File): Promise<File> {
    try {
      const url = URL.createObjectURL(file);
      const img = new Image();
      await new Promise<void>((res, rej) => { img.onload = () => res(); img.onerror = () => rej(); img.src = url; });
      const iw = img.naturalWidth || img.width;
      const ih = img.naturalHeight || img.height;
      const MAX_W = 1400, MAX_H = 1400;
      const baseScale = Math.min(MAX_W / iw, MAX_H / ih, 1);
      const finalScale = baseScale * Math.max(1, editZoom || 1);
      const drawW = Math.max(1, Math.round(iw * finalScale));
      const drawH = Math.max(1, Math.round(ih * finalScale));
      const canvasW = Math.min(drawW, MAX_W);
      const canvasH = Math.min(drawH, MAX_H);
      const canvas = document.createElement('canvas');
      canvas.width = canvasW; canvas.height = canvasH;
      const ctx = canvas.getContext('2d');
      if (!ctx) { URL.revokeObjectURL(url); return file; }
      const extraX = canvasW - drawW;
      const extraY = canvasH - drawH;
      const offsetX = extraX / 2 + (editOffsetX || 0) * canvasW * 0.5;
      const offsetY = extraY / 2 + (editOffsetY || 0) * canvasH * 0.5;
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, canvasW, canvasH);
      ctx.drawImage(img, offsetX, offsetY, drawW, drawH);
      const blob: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.9));
      URL.revokeObjectURL(url);
      if (!blob) return file;
      const name = (file.name || 'image').replace(/\.[^.]+$/, '.jpg');
      return new File([blob], name, { type: 'image/jpeg' });
    } catch { return file; }
  }

  async function uploadPendingImage() {
    if (!editFile || !editingId) return;
    setLoading(true);
    try {
      const edited = await buildEditedImage(editFile);
      const compact = await compressImage(edited);
      const fd = new FormData(); fd.append("id", String(editingId)); fd.append("file", compact);
      const res = await fetch("/api/products", { method: "PATCH", body: fd });
      if (!res.ok) { const txt = await res.text().catch(() => ""); throw new Error(txt || 'Error al subir imagen'); }
      setEditFile(null); setEditFilePreview(null); setEditZoom(1); setEditOffsetX(0); setEditOffsetY(0); await refresh();
    } catch (err: any) { alert(err?.message || 'No se pudo subir la imagen'); } finally { setLoading(false); }
  }

  async function startAdjustExistingImage(url?: string | null) {
    if (!url) return;
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const fname = (url.split('/').pop() || 'imagen') + '.jpg';
      const file = new File([blob], fname, { type: blob.type || 'image/jpeg' });
      const preview = URL.createObjectURL(file);
      setEditFile(file); setEditFilePreview(preview); setEditZoom(1); setEditOffsetX(0); setEditOffsetY(0);
    } catch { alert('No se pudo cargar la imagen existente para editar.'); }
  }

  function resetImageEdits() {
    if (editFilePreview || editFile) { setEditZoom(1); setEditOffsetX(0); setEditOffsetY(0); return; }
    setEditFile(null); setEditFilePreview(null); setEditZoom(1); setEditOffsetX(0); setEditOffsetY(0);
  }

  async function removeImage(id: number) {
    if (!confirm("¿Eliminar la imagen del producto?")) return;
    setLoading(true);
    const res = await fetch("/api/products", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, image_url: null }) });
    setLoading(false);
    if (!res.ok) { const txt = await res.text().catch(() => ""); alert("Error al quitar imagen" + (txt ? `: ${txt}` : "")); return; }
    await refresh();
  }

  async function toggleAvailable(p: Product, checked: boolean) {
    setProducts((prev) => prev.map((x) => (x.id === p.id ? { ...x, available: checked } : x)));
    const res = await fetch("/api/products", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: p.id, available: checked }) });
    if (!res.ok) { setProducts((prev) => prev.map((x) => (x.id === p.id ? { ...x, available: !checked } : x))); alert("No se pudo actualizar disponible"); }
  }

  const view = useMemo(() => {
    let arr = products.slice();
    if (filterCat !== "") arr = arr.filter((p) => p.category_id === Number(filterCat));
    const q = filterName.trim().toLowerCase(); if (q) arr = arr.filter((p) => p.name.toLowerCase().includes(q));
    if (filterAvail !== "all") arr = arr.filter((p) => (filterAvail === "yes" ? p.available : !p.available));
    arr.sort((a, b) => (a.category_id ?? 0) - (b.category_id ?? 0) || (a.sort_order ?? 0) - (b.sort_order ?? 0) || a.name.localeCompare(b.name));
    return arr;
  }, [products, filterCat, filterName, filterAvail]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">

      {/* input para subir imagen */}
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFilePicked} />

      {/* Categories Manager - Modernized */}
      <div className="glass-panel p-6 rounded-2xl">
        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-emerald-600" />
            Categorías
          </div>
          <button
            onClick={() => setReorderMode(true)}
            className="text-xs flex items-center gap-1 bg-white border border-slate-200 px-3 py-1.5 rounded-full hover:bg-slate-50 hover:border-emerald-300 transition-all shadow-sm text-slate-600 font-medium"
          >
            <ArrowUpDown className="w-3 h-3" /> Reordenar Productos
          </button>
        </h3>
        <CategoriesManager />
      </div>

      {reorderMode ? (
        <ReorderableProductList
          products={products}
          onSave={async () => { await refresh(); setReorderMode(false); }}
          onCancel={() => setReorderMode(false)}
        />
      ) : (
        <>
          {/* CREATE FORM */}
          <div id="create-product-form" className="glass-panel p-6 rounded-2xl border-l-[6px] border-emerald-500">
            <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
              <div className="bg-emerald-100 p-2 rounded-lg text-emerald-700"><Plus className="w-5 h-5" /></div>
              Nuevo Producto
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              <div className="md:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase text-slate-500 tracking-wider">Nombre</label>
                  <input className="glass-input w-full px-4 py-2 rounded-xl" placeholder="Ej. Pizza Margarita" value={newName} onChange={(e) => setNewName(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase text-slate-500 tracking-wider">Precio (€)</label>
                  <input type="number" step="0.01" className="glass-input w-full px-4 py-2 rounded-xl" placeholder="0.00" value={String(newPrice)} onChange={(e) => setNewPrice(e.target.value)} />
                </div>
                <div className="md:col-span-2 space-y-1">
                  <label className="text-xs font-semibold uppercase text-slate-500 tracking-wider">Descripción</label>
                  <textarea className="glass-input w-full px-4 py-2 rounded-xl resize-none h-20" placeholder="Ingredientes, alérgenos..." value={newDesc} onChange={(e) => setNewDesc(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase text-slate-500 tracking-wider">Categoría</label>
                  <select className="glass-input w-full px-4 py-2 rounded-xl bg-white/50" value={newCat} onChange={(e) => setNewCat(e.target.value)}>
                    <option value="">-- Sin categoría --</option>
                    {cats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="md:col-span-2 flex flex-col md:flex-row gap-6 pt-4">
                  <div className="flex items-center">
                    <label className="flex items-center gap-3 cursor-pointer select-none">
                      <div className={`w-12 h-6 rounded-full p-1 transition-colors ${newAvail ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                        <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${newAvail ? 'translate-x-6' : ''}`} />
                      </div>
                      <span className="font-medium text-slate-700">{newAvail ? 'Disponible' : 'No disponible'}</span>
                      <input type="checkbox" className="hidden" checked={newAvail} onChange={(e) => setNewAvail(e.target.checked)} />
                    </label>
                  </div>
                  {menuMode === 'daily' && (
                    <div className="flex flex-col gap-2">
                      <span className="text-xs font-bold uppercase text-slate-500 tracking-wider">Disponibilidad Semanal</span>
                      <WeekdaySelector value={newDays} onChange={setNewDays} compact />
                    </div>
                  )}
                </div>
              </div>

              {/* Image Upload Area */}
              <div className="md:col-span-4 flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-2xl bg-slate-50/50 hover:bg-slate-50 transition-colors relative overflow-hidden group min-h-[200px]">
                {newFilePreview ? (
                  <div className="relative w-full h-full">
                    <img src={newFilePreview} className="w-full h-full object-cover" />
                    <button onClick={() => setNewFile(null)} className="absolute top-2 right-2 bg-white/90 p-1.5 rounded-full text-rose-600 shadow-sm hover:scale-110 transition-transform"><X className="w-4 h-4" /></button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center cursor-pointer p-6 text-center w-full h-full justify-center">
                    <Upload className="w-8 h-8 text-slate-400 mb-2 group-hover:text-emerald-500 transition-colors" />
                    <span className="text-sm font-medium text-slate-600">Subir foto</span>
                    <span className="text-xs text-slate-400 mt-1">Click para explorar</span>
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => setNewFile(e.target.files?.[0] || null)} />
                  </label>
                )}
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button onClick={onCreate} disabled={loading || !newName.trim()} className="btn-primary flex items-center gap-2 px-8 py-3">
                <Plus className="w-5 h-5" />
                Crear Producto
              </button>
            </div>
          </div>

          {/* TABLE */}
          <div className="glass-panel overflow-hidden rounded-2xl">
            {/* Table Header/Filter Bar */}
            <div className="p-4 border-b border-white/20 bg-slate-50/50 flex flex-wrap gap-4 items-center justify-between">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  className="glass-input w-full pl-10 pr-4 py-2 rounded-xl text-sm"
                  placeholder="Buscar por nombre..."
                  value={filterName}
                  onChange={(e) => setFilterName(e.target.value)}
                />
              </div>
              <select className="glass-input px-4 py-2 rounded-xl text-sm bg-white/50" value={filterCat} onChange={(e) => setFilterCat(e.target.value)}>
                <option value="">Todas las categorías</option>
                {cats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            {view.length === 0 ? (
              <div className="p-12">
                {products.length === 0 && !filterName && !filterCat && filterAvail === 'all' ? (
                  <EmptyState
                    icon={ShoppingBag}
                    title="Tu menú está vacío"
                    description="Añade tu primer producto para empezar a recibir pedidos."
                    action={
                      <button onClick={() => document.getElementById('create-product-form')?.scrollIntoView({ behavior: 'smooth' })} className="text-emerald-600 font-medium hover:underline">
                        Crear Producto
                      </button>
                    }
                    compact
                  />
                ) : (
                  <EmptyState
                    icon={Search}
                    title="No se encontraron productos"
                    description="Intenta ajustar los filtros o la búsqueda."
                    compact
                  />
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-slate-500 uppercase text-xs font-semibold tracking-wider">
                    <tr>
                      <th className="px-6 py-4">Producto</th>
                      <th className="px-6 py-4">Precio</th>
                      <th className="px-6 py-4">Categoría</th>
                      <th className="px-6 py-4">Estado</th>
                      <th className="px-6 py-4 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {view.map(p => (
                      <tr key={p.id} className="hover:bg-slate-50/80 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden flex-shrink-0">
                              {p.image_url ? (
                                <img src={p.image_url} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-300"><ImageIcon className="w-5 h-5" /></div>
                              )}
                            </div>
                            <div>
                              <div className="font-bold text-slate-800">{p.name}</div>
                              {p.description && <div className="text-xs text-slate-500 max-w-[200px] truncate">{p.description}</div>}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-mono font-medium text-slate-700">
                          {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(p.price)}
                        </td>
                        <td className="px-6 py-4">
                          {p.category_id ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800 border border-slate-200">
                              {catById.get(p.category_id)}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400 italic">Sin categoría</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide border ${p.available ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-100'}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${p.available ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                            {p.available ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => startEdit(p)} className="p-2 rounded-lg text-slate-400 hover:bg-white hover:text-emerald-600 hover:shadow-sm border border-transparent hover:border-slate-100 transition-all">
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button onClick={() => onDelete(p.id)} className="p-2 rounded-lg text-slate-400 hover:bg-white hover:text-rose-600 hover:shadow-sm border border-transparent hover:border-slate-100 transition-all">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Modal edición producto - Premium Style */}
          {editModalOpen && editingId && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
              <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto glass-panel p-6 rounded-2xl shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="mb-6 flex items-center justify-between border-b border-slate-100 pb-4">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">Actualizar producto</h3>
                    <p className="text-sm text-slate-500">Modifica los detalles del producto.</p>
                  </div>
                  <button onClick={cancelEdit} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X className="w-5 h-5 text-slate-400" /></button>
                </div>

                <div className="space-y-6">
                  {/* Image Editing Section */}
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                    <div className="flex flex-col md:flex-row gap-4">
                      <div className="h-32 w-48 bg-white rounded-lg border border-slate-200 overflow-hidden flex-shrink-0 relative">
                        {(() => {
                          const previewSrc = editFilePreview ?? (products.find(x => x.id === editingId)?.image_url) ?? null;
                          if (!previewSrc) return <div className="w-full h-full flex flex-col items-center justify-center text-slate-300"> <ImageIcon className="w-8 h-8 mb-2" /> <span className="text-xs">Sin imagen</span></div>;
                          const translateX = editFilePreview ? editOffsetX * 50 : 0;
                          const translateY = editFilePreview ? editOffsetY * 50 : 0;
                          const zoom = editFilePreview ? editZoom : 1;
                          return (
                            <img src={previewSrc} className="w-full h-full object-cover transition-transform" style={{ transform: `translate(${translateX}%, ${translateY}%) scale(${zoom})`, transformOrigin: 'center' }} />
                          );
                        })()}
                      </div>
                      <div className="flex-1 space-y-3">
                        <div className="flex flex-wrap gap-2">
                          <button type="button" onClick={() => triggerUpload(editingId)} className="btn-secondary text-xs px-3 py-2">
                            <Upload className="w-3 h-3 mr-2 inline" /> Cambiar imagen
                          </button>
                          {editFile && (
                            <button type="button" onClick={uploadPendingImage} disabled={loading} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs px-3 py-2 font-medium transition-colors">
                              Confirmar subida
                            </button>
                          )}
                          {(products.find(x => x.id === editingId)?.image_url) && (
                            <button type="button" onClick={() => removeImage(editingId)} className="text-rose-600 hover:bg-rose-50 rounded-lg text-xs px-3 py-2 transition-colors">
                              Eliminar imagen
                            </button>
                          )}
                        </div>
                        {editFilePreview && (
                          <div className="grid grid-cols-3 gap-2 text-xs text-slate-500">
                            <label>Zoom <input type="range" min={1} max={3} step={0.05} value={editZoom} onChange={(e) => setEditZoom(Number(e.target.value))} className="w-full" /></label>
                            <label>X <input type="range" min={-0.5} max={0.5} step={0.01} value={editOffsetX} onChange={(e) => setEditOffsetX(Number(e.target.value))} className="w-full" /></label>
                            <label>Y <input type="range" min={-0.5} max={0.5} step={0.01} value={editOffsetY} onChange={(e) => setEditOffsetY(Number(e.target.value))} className="w-full" /></label>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold uppercase text-slate-500">Nombre</label>
                      <input className="glass-input w-full px-3 py-2 rounded-lg" value={editRow.name ?? ''} onChange={(e) => setEditRow(r => ({ ...r, name: e.target.value }))} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold uppercase text-slate-500">Precio</label>
                      <input type="number" className="glass-input w-full px-3 py-2 rounded-lg" value={String(editRow.price ?? 0)} onChange={(e) => setEditRow(r => ({ ...r, price: Number(e.target.value) }))} />
                    </div>
                    <div className="md:col-span-2 space-y-1">
                      <label className="text-xs font-semibold uppercase text-slate-500">Descripción</label>
                      <textarea className="glass-input w-full px-3 py-2 rounded-lg resize-none h-20" value={editRow.description ?? ''} onChange={(e) => setEditRow(r => ({ ...r, description: e.target.value }))} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold uppercase text-slate-500">Categoría</label>
                      <select className="glass-input w-full px-3 py-2 rounded-lg" value={editRow.category_id ?? ''} onChange={(e) => setEditRow(r => ({ ...r, category_id: Number(e.target.value) || null }))}>
                        <option value="">Sin categoría</option>
                        {cats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                    <div className="flex items-center pt-5">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" className="rounded text-emerald-600 focus:ring-emerald-500" checked={!!editRow.available} onChange={(e) => setEditRow(r => ({ ...r, available: e.target.checked }))} />
                        <span className="text-sm font-medium text-slate-700">Producto Disponible</span>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="mt-8 flex justify-end gap-3 pt-4 border-t border-slate-100">
                  <button onClick={cancelEdit} className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-medium transition-colors">Cancelar</button>
                  <button onClick={saveEdit} disabled={loading} className="btn-primary px-6 py-2">Guardar Cambios</button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
