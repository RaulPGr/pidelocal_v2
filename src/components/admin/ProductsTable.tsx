"use client";

import React, { useMemo, useRef, useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
    Plus, Search, Filter, Trash2, Edit2, Image as ImageIcon,
    Check, X, Upload, ZoomIn, Move, ArrowUpDown, ShoppingBag, Loader2
} from "lucide-react";
import ReorderableProductList from "./ReorderableProductList";
import EmptyState from "@/components/admin/EmptyState";
import AllergenSelector from "./AllergenSelector";
import { ALLERGENS } from "@/lib/allergens";
import CategoriesManager from "./CategoriesManager";
import { toast } from "sonner";
import ImageCropper from "./ImageCropper";

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
    allergens?: string[];
};

type Props = {
    initialProducts: Product[];
    categories: Category[];
    initialWeekdays?: Record<number, number[]>;
};

import WeekdaySelector from "./WeekdaySelector";

export default function ProductsTable({ initialProducts, categories, initialWeekdays }: Props) {
    // State
    const [products, setProducts] = useState<Product[]>(initialProducts);
    const [cats, setCats] = useState<Category[]>(categories);
    const [weekdays, setWeekdays] = useState<Record<number, number[]>>(initialWeekdays || {});

    const [loading, setLoading] = useState(false);
    const [menuMode, setMenuMode] = useState<'fixed' | 'daily'>('fixed');
    const [reorderMode, setReorderMode] = useState(false);

    // Filters
    const [filterCat, setFilterCat] = useState<number | "">("");
    const [filterName, setFilterName] = useState("");
    const [filterAvail, setFilterAvail] = useState<"all" | "yes" | "no">("all");

    // Create/Edit State
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null); // If null, we are not editing. If set, we are editing.

    // Form Fields (Shared for Create & Edit)
    const [formData, setFormData] = useState<Partial<Product>>({
        available: true,
        allergens: [],
        price: 0
    });
    const [formDays, setFormDays] = useState<number[]>([]);
    const [formFile, setFormFile] = useState<File | null>(null);
    const [formFilePreview, setFormFilePreview] = useState<string | null>(null);

    // Image editing state
    const [editZoom, setEditZoom] = useState(1);
    const [editOffsetX, setEditOffsetX] = useState(0);
    const [editOffsetY, setEditOffsetY] = useState(0);
    const fileRef = useRef<HTMLInputElement>(null);

    // Cropper State
    const [isCropping, setIsCropping] = useState(false);
    const [cropSrc, setCropSrc] = useState<string | null>(null);

    const searchParams = useSearchParams();
    const router = useRouter();

    // Load business settings
    useEffect(() => {
        (async () => {
            try {
                const r = await fetch('/api/admin/business', { cache: 'no-store' });
                const j = await r.json();
                if (j?.ok && (j.data?.menu_mode === 'daily' || j.data?.menu_mode === 'fixed')) setMenuMode(j.data.menu_mode);
            } catch { }
        })();
    }, []);

    // Sync categories if they change from parent or refresh
    useEffect(() => { setCats(categories); }, [categories]);

    // Handle URL actions
    useEffect(() => {
        if (searchParams.get('action') === 'new') {
            openCreateModal();
            router.replace('/admin/products', { scroll: false });
        }
    }, [searchParams, router]);

    // Image compression helper
    async function compressImage(file: File, maxW = 1400, maxH = 1400, quality = 0.84): Promise<File> {
        try {
            if (!file || !(file instanceof File)) return file;
            if (file.size <= 2 * 1024 * 1024) return file;
            const url = URL.createObjectURL(file);
            const img = new Image();
            await new Promise<void>((res, rej) => { img.onload = () => res(); img.onerror = () => rej(); img.src = url; });
            const iw = img.naturalWidth || img.width;
            const ih = img.naturalHeight || img.height;
            const scale = Math.min(maxW / iw, maxH / ih, 1);
            const w = Math.round(iw * scale);
            const h = Math.round(ih * scale);
            const canvas = document.createElement('canvas');
            canvas.width = w; canvas.height = h;
            const ctx = canvas.getContext('2d');
            if (!ctx) return file;
            ctx.drawImage(img, 0, 0, w, h);
            const blob: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));
            URL.revokeObjectURL(url);
            if (!blob) return file;
            return new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' });
        } catch { return file; }
    }

    // --- Data Refresh ---
    async function refreshData() {
        const res = await fetch("/api/admin/orders/products", { cache: "no-store" });
        const { products: p, weekdays: wd, categories: c } = await res.json();
        setProducts(p ?? []);
        setWeekdays(wd ?? {});
        if (c) setCats(c);
    }

    // --- Actions ---

    function openCreateModal() {
        setEditingId(null);
        setFormData({ available: true, allergens: [], price: 0, name: '', description: '' });
        setFormDays([]);
        setFormFile(null);
        setFormFilePreview(null);
        setIsCreateOpen(true);
    }

    function openEditModal(p: Product) {
        setEditingId(p.id);
        setFormData({
            ...p,
            allergens: p.allergens || []
        });
        setFormDays(weekdays[p.id] || []);
        setFormFile(null);
        setFormFilePreview(null);
        // Reset image edit state
        setEditZoom(1); setEditOffsetX(0); setEditOffsetY(0);
        setIsCreateOpen(true);
    }

    async function handleSave() {
        if (!formData.name?.trim()) return toast.error("El nombre es obligatorio");
        setLoading(true);

        try {
            const isEdit = !!editingId;
            const url = "/api/products";
            const method = isEdit ? "PATCH" : "POST";

            const payload: any = {
                ...formData,
                price: Number(formData.price),
                description: formData.description?.trim() || null,
                category_id: formData.category_id ? Number(formData.category_id) : null
            };
            if (isEdit) payload.id = editingId;
            if (menuMode === 'daily') payload.weekdays = formDays;

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (!res.ok) throw new Error("Error al guardar producto");

            const data = await res.json();
            const prodId = isEdit ? editingId : data.id;

            // Handle Image Upload if present
            if (prodId && formFile) {
                // Apply crop/zoom if in edit mode and adjustments made? 
                // For simplicity, reusing logic or just uploading straight for now.
                // If we have zoom/offset logic, typically we'd canvas draw here. 
                // Let's keep it simple: upload compressed file.
                const compressed = await compressImage(formFile);
                const fd = new FormData();
                fd.append("id", String(prodId));
                fd.append("file", compressed);
                await fetch("/api/products", { method: "PATCH", body: fd });
            } else if (isEdit && prodId && formFilePreview && (editZoom !== 1 || editOffsetX !== 0 || editOffsetY !== 0)) {
                // Re-upload existing image with edits? (Complex, skip for now unless requested)
            }

            toast.success(isEdit ? "Producto actualizado" : "Producto creado");
            await refreshData();
            setIsCreateOpen(false);

        } catch (e) {
            toast.error("Ocurrió un error");
        } finally {
            setLoading(false);
        }
    }

    async function handleToggleAvailability(p: Product) {
        const newValue = !p.available;
        // Optimistic update
        setProducts(prev => prev.map(prod => prod.id === p.id ? { ...prod, available: newValue } : prod));

        try {
            const res = await fetch("/api/products", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: p.id, available: newValue })
            });

            if (!res.ok) throw new Error("Failed");

            if (!newValue) toast("Producto marcado como agotado", { icon: "🚫" });
            else toast.success("Producto disponible");

        } catch (e) {
            // Revert
            setProducts(prev => prev.map(prod => prod.id === p.id ? { ...prod, available: !newValue } : prod));
            toast.error("No se pudo actualizar");
        }
    }

    async function handleDelete(id: number) {
        if (!confirm("¿Seguro que quieres eliminar este producto?")) return;
        setLoading(true);
        try {
            const res = await fetch(`/api/products?id=${id}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Error");
            toast.success("Producto eliminado");
            await refreshData();
        } catch {
            toast.error("No se pudo eliminar");
        } finally {
            setLoading(false);
        }
    }

    // Image Helper
    function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
        const f = e.target.files?.[0];
        if (f) {
            const url = URL.createObjectURL(f);
            setCropSrc(url);
            setIsCropping(true);
            e.target.value = ''; // Reset so can select same file again
        }
    }

    function handleCropComplete(blob: Blob) {
        const file = new File([blob], "product-image.jpg", { type: "image/jpeg" });
        setFormFile(file);
        setFormFilePreview(URL.createObjectURL(blob));
        setIsCropping(false);
        setCropSrc(null);
    }


    // Filter Logic
    const filteredProducts = useMemo(() => {
        let arr = products.slice();
        if (filterCat !== "") arr = arr.filter((p) => p.category_id === Number(filterCat));
        const q = filterName.trim().toLowerCase();
        if (q) arr = arr.filter((p) => p.name.toLowerCase().includes(q));
        if (filterAvail !== "all") arr = arr.filter((p) => (filterAvail === "yes" ? p.available : !p.available));

        // Sort logic
        arr.sort((a, b) => {
            // Prioritize Category Order
            const catA = cats.find(c => c.id === a.category_id)?.sort_order ?? 999;
            const catB = cats.find(c => c.id === b.category_id)?.sort_order ?? 999;
            if (catA !== catB) return catA - catB;
            // Then Product Order
            return (a.sort_order ?? 0) - (b.sort_order ?? 0);
        });
        return arr;
    }, [products, filterCat, filterName, filterAvail, cats]);

    const catById = useMemo(() => new Map(cats.map((c) => [c.id, c.name] as const)), [cats]);

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20">

            {/* --- Header & Categories --- */}
            <CategoriesManager categories={cats} onUpdate={refreshData} />

            {/* --- Actions Bar --- */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-2xl shadow-sm border border-slate-100 sticky top-4 z-20">
                <div className="flex flex-1 gap-4 w-full md:w-auto">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            className="glass-input w-full pl-10 pr-4 py-2 rounded-xl text-sm"
                            placeholder="Buscar productos..."
                            value={filterName}
                            onChange={e => setFilterName(e.target.value)}
                        />
                    </div>
                    <select
                        className="glass-input px-4 py-2 rounded-xl text-sm bg-slate-50 border-slate-200"
                        value={filterCat}
                        onChange={e => setFilterCat(e.target.value ? Number(e.target.value) : "")}
                    >
                        <option value="">Todas las Categorías</option>
                        {cats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </div>

                <div className="flex gap-2 w-full md:w-auto">
                    <button
                        onClick={() => {
                            if (!filterCat) return toast.error("Selecciona una categoría para ordenar sus productos.");
                            setReorderMode(true);
                        }}
                        className={`px-4 py-2 text-sm flex items-center gap-2 transition-colors ${!filterCat ? 'text-slate-400 cursor-not-allowed bg-slate-100' : 'btn-secondary'}`}
                    >
                        <ArrowUpDown className="w-4 h-4" /> Ordenar
                    </button>
                    <button
                        onClick={openCreateModal}
                        className="btn-primary px-6 py-2 text-sm flex items-center gap-2 shadow-emerald-500/20 shadow-lg"
                    >
                        <Plus className="w-4 h-4" /> Nuevo Producto
                    </button>
                </div>
            </div>

            {/* --- Main Content --- */}
            {reorderMode ? (
                <ReorderableProductList
                    products={filteredProducts}
                    onSave={async () => { await refreshData(); setReorderMode(false); }}
                    onCancel={() => setReorderMode(false)}
                />
            ) : (
                <div className="glass-panel overflow-hidden rounded-2xl shadow-sm min-h-[400px]">
                    {filteredProducts.length === 0 ? (
                        <div className="p-12">
                            <EmptyState
                                icon={ShoppingBag}
                                title="No hay productos"
                                description={filterName || filterCat ? "No hay coinciencias con los filtros." : "Tu carta está vacía."}
                                compact
                            />
                        </div>
                    ) : (
                        <div className="overflow-x-auto max-w-full">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50/80 text-slate-500 uppercase text-xs font-semibold tracking-wider backdrop-blur-sm">
                                    <tr>
                                        <th className="px-6 py-4">Producto</th>
                                        <th className="px-6 py-4">Precio</th>
                                        <th className="px-6 py-4 hidden md:table-cell">Categoría</th>
                                        <th className="px-6 py-4">Disponible</th>
                                        <th className="px-6 py-4 text-right"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredProducts.map(p => (
                                        <tr key={p.id} className="hover:bg-slate-50/80 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden flex-shrink-0 relative">
                                                        {p.image_url ? (
                                                            <img src={p.image_url} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-slate-300"><ImageIcon className="w-5 h-5" /></div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-slate-800">{p.name}</div>
                                                        {p.description && <div className="text-xs text-slate-500 max-w-[200px] truncate">{p.description}</div>}
                                                        {Array.isArray(p.allergens) && p.allergens.length > 0 && (
                                                            <div className="flex gap-1 mt-1.5 flex-wrap">
                                                                {p.allergens.map(algId => {
                                                                    const alg = ALLERGENS.find(a => a.id === algId);
                                                                    if (!alg) return null;
                                                                    const Icon = alg.icon;
                                                                    return (
                                                                        <div key={algId} title={alg.label} className="text-slate-400 bg-slate-50 p-0.5 rounded border border-slate-100">
                                                                            {/* @ts-ignore */}
                                                                            <Icon className="w-3 h-3" />
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 font-mono font-medium text-slate-700">
                                                {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(p.price)}
                                            </td>
                                            <td className="px-6 py-4 hidden md:table-cell">
                                                {p.category_id ? (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800 border border-slate-200">
                                                        {catById.get(p.category_id)}
                                                    </span>
                                                ) : <span className="text-xs text-slate-400 italic">--</span>}
                                            </td>
                                            <td className="px-6 py-4">
                                                <button
                                                    onClick={() => handleToggleAvailability(p)}
                                                    className={`w-11 h-6 rounded-full transition-colors flex items-center px-0.5 shadow-inner ${p.available ? 'bg-emerald-500' : 'bg-slate-300'}`}
                                                    title={p.available ? "Disponible: Click para desactivar" : "Agotado: Click para activar"}
                                                >
                                                    <div className={`w-5 h-5 bg-white rounded-full shadow-sm transform transition-transform duration-200 ease-in-out ${p.available ? 'translate-x-5' : 'translate-x-0'}`} />
                                                </button>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button onClick={() => openEditModal(p)} className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" title="Editar"><Edit2 className="w-4 h-4" /></button>
                                                    <button onClick={() => handleDelete(p.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors" title="Eliminar"><Trash2 className="w-4 h-4" /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* --- CREATE / EDIT MODAL (Side Drawer Style) --- */}
            {isCreateOpen && (
                <div className="fixed inset-0 z-50 flex justify-end">
                    {/* Backdrop */}
                    <div className="absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity" onClick={() => setIsCreateOpen(false)} />

                    {/* Drawer */}
                    <div className="relative w-full max-w-xl bg-white h-full shadow-2xl p-0 flex flex-col animate-in slide-in-from-right duration-300">
                        <div className="flex items-center justify-between p-6 border-b border-slate-100">
                            <div>
                                <h2 className="text-xl font-bold text-slate-900">{editingId ? 'Editar Producto' : 'Nuevo Producto'}</h2>
                                <p className="text-sm text-slate-500">Rellena los detalles de tu plato.</p>
                            </div>
                            <button onClick={() => setIsCreateOpen(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            {/* Image Uploader */}
                            <div className="flex flex-col items-center">
                                <div
                                    className="w-full h-48 rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center relative overflow-hidden group cursor-pointer hover:border-emerald-400 transition-colors"
                                    onClick={() => fileRef.current?.click()}
                                >
                                    {formFilePreview || formData.image_url ? (
                                        <img src={formFilePreview || formData.image_url!} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="text-center p-4">
                                            <div className="bg-white p-3 rounded-full shadow-sm inline-block mb-2">
                                                <Upload className="w-6 h-6 text-emerald-500" />
                                            </div>
                                            <div className="text-sm font-medium text-slate-700">Subir foto del plato</div>
                                            <div className="text-xs text-slate-400 mt-1">PNG, JPG hasta 3MB</div>
                                        </div>
                                    )}

                                    <input type="file" ref={fileRef} className="hidden" accept="image/*" onChange={handleFileSelect} />

                                    {(formFilePreview || formData.image_url) && (
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                            <span className="text-white font-medium flex items-center gap-2"><Edit2 className="w-4 h-4" /> Cambiar</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Nombre</label>
                                    <input
                                        className="glass-input w-full px-4 py-2.5 rounded-xl font-medium"
                                        placeholder="Ej. Hamburguesa Doble"
                                        value={formData.name || ''}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Precio (€)</label>
                                    <input
                                        type="number" step="0.01"
                                        className="glass-input w-full px-4 py-2.5 rounded-xl font-mono text-slate-700"
                                        placeholder="0.00"
                                        value={formData.price}
                                        onChange={e => setFormData({ ...formData, price: Number(e.target.value) })}
                                    />
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Categoría</label>
                                    <select
                                        className="glass-input w-full px-4 py-2.5 rounded-xl"
                                        value={formData.category_id || ''}
                                        onChange={e => setFormData({ ...formData, category_id: e.target.value ? Number(e.target.value) : null })}
                                    >
                                        <option value="">-- Sin categoría --</option>
                                        {cats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>

                                <div className="col-span-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Descripción</label>
                                    <textarea
                                        className="glass-input w-full px-4 py-2.5 rounded-xl min-h-[100px] resize-none"
                                        placeholder="Ingredientes, elaboración..."
                                        value={formData.description || ''}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    />
                                </div>

                                <div className="col-span-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Alérgenos</label>
                                    <AllergenSelector
                                        value={formData.allergens || []}
                                        onChange={v => setFormData({ ...formData, allergens: v })}
                                    />
                                </div>
                            </div>

                            <div className="border-t border-slate-100 pt-4">
                                <div className="flex items-center justify-between mb-4">
                                    <label className="flex items-center gap-3 cursor-pointer">
                                        <div className={`w-11 h-6 rounded-full transition-colors flex items-center px-0.5 ${formData.available ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                                            <div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${formData.available ? 'translate-x-5' : 'translate-x-0'}`} />
                                        </div>
                                        <span className="text-sm font-medium text-slate-700">Disponible para pedir</span>
                                    </label>
                                    <input
                                        type="checkbox" className="hidden"
                                        checked={formData.available}
                                        onChange={e => setFormData({ ...formData, available: e.target.checked })}
                                    />
                                </div>

                                {menuMode === 'daily' && (
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Días Disponible</label>
                                        <WeekdaySelector value={formDays} onChange={setFormDays} />
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                            <button onClick={() => setIsCreateOpen(false)} className="px-6 py-2.5 rounded-xl font-medium text-slate-500 hover:bg-white transition-colors">Cancelar</button>
                            <button
                                onClick={handleSave}
                                disabled={loading}
                                className="btn-primary px-8 py-2.5 rounded-xl shadow-lg shadow-emerald-500/20 flex items-center gap-2"
                            >
                                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                                {editingId ? 'Guardar Cambios' : 'Crear Producto'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- CROPPER OVERLAY --- */}
            {isCropping && cropSrc && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                    <div className="w-full max-w-4xl h-[80vh]">
                        <ImageCropper
                            imageSrc={cropSrc!}
                            aspect={16 / 9} // Standard card aspect ratio
                            onCropComplete={handleCropComplete}
                            onCancel={() => { setIsCropping(false); setCropSrc(null); }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
