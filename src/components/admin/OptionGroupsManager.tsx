"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Layers,
  Plus,
  Trash2,
  Edit2,
  Check,
  List,
  Tag,
  Package,
  Search,
  AlertCircle,
  Loader2,
  MoreVertical
} from "lucide-react";
import clsx from "clsx";
import OptionGroupDrawer from "./OptionGroupDrawer";
import { toast } from "sonner";
import EmptyState from "./EmptyState";

type OptionGroup = {
  id: string;
  name: string;
  description?: string | null;
  selection_type: "single" | "multiple";
  min_select?: number | null;
  max_select?: number | null;
  is_required?: boolean | null;
  sort_order?: number | null;
};

type OptionItem = {
  id: string;
  group_id: string;
  name: string;
  price_delta?: number | null;
  sort_order?: number | null;
};

type Product = {
  id: number;
  name: string;
  active?: boolean | null;
  category_id?: number | null;
  category_name?: string | null;
};

type Category = {
  id: number;
  name: string;
};

type CategoryAssignment = {
  id: string;
  category_id: number;
  group_id: string;
};

export default function OptionGroupsManager() {
  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState<OptionGroup[]>([]);
  const [options, setOptions] = useState<OptionItem[]>([]);

  // Data for tabs
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryAssignments, setCategoryAssignments] = useState<CategoryAssignment[]>([]);

  // UI State
  const [activeTab, setActiveTab] = useState<"groups" | "categories" | "bulk">("groups");

  // Drawer State
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<OptionGroup | null>(null);

  // Bulk State
  const [bulkGroupId, setBulkGroupId] = useState<string>("");
  const [bulkProductIds, setBulkProductIds] = useState<string[]>([]);
  const [bulkSearch, setBulkSearch] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | "">("");

  async function load() {
    setLoading(true);
    try {
      const resp = await fetch("/api/admin/product-option-groups", { cache: "no-store" });
      const data = await resp.json();
      if (!data?.ok) throw new Error(data?.error || "Error cargando datos");

      setGroups(data.groups || []);
      setOptions(data.options || []);
      setProducts(data.products || []);
      setCategories(data.categories?.map((x: any) => ({ id: Number(x.id), name: x.name })) || []);
      setCategoryAssignments(data.categoryAssignments?.map((x: any) => ({ id: String(x.id), category_id: Number(x.category_id), group_id: x.group_id })) || []);

      // Defaults
      if (data.groups?.length && !bulkGroupId) setBulkGroupId(data.groups[0].id);
      if (data.categories?.length && selectedCategoryId === "") setSelectedCategoryId(Number(data.categories[0].id));

    } catch (e: any) {
      toast.error(e.message || "Error de conexión");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  // Computed
  const optionsByGroup = useMemo(() => {
    const map = new Map<string, OptionItem[]>();
    options.forEach(opt => {
      if (!map.has(opt.group_id)) map.set(opt.group_id, []);
      map.get(opt.group_id)!.push(opt);
    });
    map.forEach(list => list.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)));
    return map;
  }, [options]);

  const assignedGroupsByCat = useMemo(() => {
    const map = new Map<number, Set<string>>();
    categoryAssignments.forEach(a => {
      if (!map.has(a.category_id)) map.set(a.category_id, new Set());
      map.get(a.category_id)!.add(a.group_id);
    });
    return map;
  }, [categoryAssignments]);

  const filteredBulkProducts = useMemo(() => {
    if (!bulkSearch) return products;
    const lower = bulkSearch.toLowerCase();
    return products.filter(p => p.name.toLowerCase().includes(lower) || p.category_name?.toLowerCase().includes(lower));
  }, [products, bulkSearch]);

  // Handlers
  function handleEdit(group: OptionGroup) {
    setEditingGroup(group);
    setDrawerOpen(true);
  }

  function handleCreate() {
    setEditingGroup(null);
    setDrawerOpen(true);
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar este grupo y sus opciones?")) return;
    try {
      await fetch(`/api/admin/option-groups?id=${id}`, { method: 'DELETE' });
      toast.success("Grupo eliminado");
      await load();
    } catch {
      toast.error("No se pudo eliminar");
    }
  }

  // Bulk Actions
  async function toggleCategoryAssignment(gid: string) {
    if (!selectedCategoryId) return;
    try {
      const assigned = assignedGroupsByCat.get(Number(selectedCategoryId))?.has(gid);
      if (assigned) {
        await fetch(`/api/admin/category-option-groups?category_id=${selectedCategoryId}&group_id=${gid}`, { method: 'DELETE' });
      } else {
        await fetch("/api/admin/category-option-groups", { method: 'POST', body: JSON.stringify({ group_id: gid, category_id: selectedCategoryId }) });
      }
      await load(); // Refresh to show checkmark
    } catch { toast.error("Error al actualizar asignación"); }
  }

  async function applyBulk(action: 'assign' | 'remove') {
    if (!bulkGroupId || bulkProductIds.length === 0) return;
    const toastId = toast.loading("Procesando...");
    try {
      for (const pid of bulkProductIds) {
        const numericPid = Number(pid);
        if (action === 'assign') {
          await fetch("/api/admin/product-option-groups", { method: 'POST', body: JSON.stringify({ group_id: bulkGroupId, product_id: numericPid }) });
        } else {
          await fetch(`/api/admin/product-option-groups?product_id=${numericPid}&group_id=${bulkGroupId}`, { method: 'DELETE' });
        }
      }
      toast.dismiss(toastId);
      toast.success("Operación masiva completada");
      setBulkProductIds([]);
    } catch (e: any) {
      toast.dismiss(toastId);
      toast.error(e.message);
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Opciones y Extras</h2>
          <p className="text-slate-500 text-sm mt-1">Configura toppings, salsas y modificadores (ej: puntos de carne).</p>
        </div>

        <div className="flex bg-white p-1 rounded-xl shadow-sm border border-slate-200">
          {[
            { id: "groups", label: "Mis Grupos", icon: Layers },
            { id: "categories", label: "Por Categorías", icon: Tag },
            { id: "bulk", label: "Masivo", icon: Package }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={clsx(
                  "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all",
                  activeTab === tab.id ? "bg-slate-900 text-white shadow" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                )}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* --- GROUPS TAB (Card Layout) --- */}
      {activeTab === "groups" && (
        <>
          {groups.length === 0 && !loading ? (
            <EmptyState
              icon={Layers}
              title="No hay grupos de opciones"
              description="Crea tu primer grupo (ej: 'Elige tu Salsa' o 'Ingredientes Extra')."
              action={<button onClick={handleCreate} className="text-emerald-600 font-bold hover:underline">Crear Grupo</button>}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {/* Create Card */}
              <button
                onClick={handleCreate}
                className="flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-dashed border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/30 transition-all group min-h-[200px]"
              >
                <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <Plus className="w-6 h-6 text-emerald-500" />
                </div>
                <span className="font-bold text-slate-700">Crear Nuevo Grupo</span>
              </button>

              {/* Group Cards */}
              {groups.map(g => {
                const opts = optionsByGroup.get(g.id) || [];
                return (
                  <div key={g.id} className="glass-panel p-5 flex flex-col justify-between group h-full hover:border-emerald-500/30 transition-all hover:shadow-lg">
                    <div>
                      <div className="flex justify-between items-start mb-3">
                        <div className="bg-slate-100 p-2 rounded-lg">
                          <List className="w-5 h-5 text-slate-500" />
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => handleEdit(g)} className="p-2 hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 rounded-lg transition-colors"><Edit2 className="w-4 h-4" /></button>
                          <button onClick={() => handleDelete(g.id)} className="p-2 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </div>

                      <h3 className="font-bold text-slate-800 text-lg mb-1">{g.name}</h3>
                      <p className="text-xs text-slate-500 mb-4 line-clamp-2 min-h-[2.5em]">{g.description || "Sin descripción pública."}</p>

                      <div className="flex flex-wrap gap-2 mb-4">
                        <span className="text-[10px] font-bold uppercase tracking-wide bg-slate-100 text-slate-600 px-2 py-1 rounded-md border border-slate-200">
                          {g.selection_type === 'single' ? 'Unica' : 'Múltiple'}
                        </span>
                        {g.is_required && (
                          <span className="text-[10px] font-bold uppercase tracking-wide bg-amber-50 text-amber-700 px-2 py-1 rounded-md border border-amber-100">
                            Obligatorio
                          </span>
                        )}
                        <span className="text-[10px] font-bold uppercase tracking-wide bg-white text-slate-400 px-2 py-1 rounded-md border border-slate-200">
                          {opts.length} opc.
                        </span>
                      </div>
                    </div>

                    <div className="border-t border-slate-100 pt-3">
                      <div className="text-xs text-slate-500 flex flex-wrap gap-1">
                        {opts.slice(0, 3).map(o => (
                          <span key={o.id} className="bg-slate-50 px-1.5 py-0.5 rounded text-slate-600 border border-slate-100">{o.name}</span>
                        ))}
                        {opts.length > 3 && <span className="bg-slate-50 px-1.5 py-0.5 rounded text-slate-400">+{opts.length - 3}</span>}
                        {opts.length === 0 && <span className="italic text-slate-400">Sin opciones</span>}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}

      {/* --- CATEGORIES TAB --- */}
      {activeTab === "categories" && (
        <div className="glass-panel p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-800">Asignación por Categoría</h3>
              <p className="text-sm text-slate-500">Los grupos seleccionados aparecerán en TODOS los productos de esa categoría.</p>
            </div>
            <select
              className="glass-input w-64 px-4 py-2"
              value={selectedCategoryId}
              onChange={e => setSelectedCategoryId(Number(e.target.value))}
            >
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          {selectedCategoryId ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {groups.map(g => {
                const assigned = assignedGroupsByCat.get(Number(selectedCategoryId))?.has(g.id);
                return (
                  <button
                    key={g.id}
                    onClick={() => toggleCategoryAssignment(g.id)}
                    className={clsx(
                      "flex items-center justify-between p-4 rounded-xl border text-left transition-all",
                      assigned
                        ? "border-emerald-500 bg-emerald-50 ring-1 ring-emerald-500 text-emerald-900 shadow-sm"
                        : "border-slate-200 hover:border-slate-300 hover:shadow-md bg-white text-slate-600"
                    )}
                  >
                    <span className="font-medium">{g.name}</span>
                    {assigned && <Check className="w-5 h-5 text-emerald-600" />}
                  </button>
                )
              })}
              {groups.length === 0 && <p className="text-slate-400 italic col-span-full">No hay grupos creados.</p>}
            </div>
          ) : <p className="text-center py-8 text-slate-400">Selecciona una categoría para empezar.</p>}
        </div>
      )}

      {/* --- BULK TAB --- */}
      {activeTab === "bulk" && (
        <div className="glass-panel p-6 space-y-6">
          <div className="flex flex-col md:flex-row items-end gap-4 p-5 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex-1 w-full space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Aplicar Grupo</label>
              <select className="glass-input w-full px-4 py-2.5" value={bulkGroupId} onChange={e => setBulkGroupId(e.target.value)}>
                {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <button onClick={() => applyBulk('assign')} disabled={loading || !bulkProductIds.length || !bulkGroupId} className="btn-primary w-full md:w-auto">
                Asignar
              </button>
              <button onClick={() => applyBulk('remove')} disabled={loading || !bulkProductIds.length || !bulkGroupId} className="btn-secondary text-rose-600 w-full md:w-auto">
                Quitar
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  className="glass-input pl-10 w-full"
                  placeholder="Buscar productos..."
                  value={bulkSearch}
                  onChange={e => setBulkSearch(e.target.value)}
                />
              </div>
              <div className="text-sm font-medium text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
                {bulkProductIds.length} seleccionados
              </div>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <div className="max-h-[500px] overflow-y-auto bg-white">
                <table className="w-full text-left text-sm">
                  <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 z-10">
                    <tr>
                      <th className="px-4 py-3 w-12 bg-slate-50">
                        <input
                          type="checkbox"
                          className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                          onChange={(e) => {
                            if (e.target.checked) setBulkProductIds(filteredBulkProducts.map(p => String(p.id)));
                            else setBulkProductIds([]);
                          }}
                          checked={bulkProductIds.length === filteredBulkProducts.length && filteredBulkProducts.length > 0}
                        />
                      </th>
                      <th className="px-4 py-3 bg-slate-50 font-semibold text-slate-600">Producto</th>
                      <th className="px-4 py-3 bg-slate-50 font-semibold text-slate-600">Categoría</th>
                      <th className="px-4 py-3 bg-slate-50 font-semibold text-slate-600 text-right">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredBulkProducts.map(p => (
                      <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                            checked={bulkProductIds.includes(String(p.id))}
                            onChange={(e) => {
                              const vid = String(p.id);
                              if (e.target.checked) setBulkProductIds(prev => [...prev, vid]);
                              else setBulkProductIds(prev => prev.filter(x => x !== vid));
                            }}
                          />
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-700">{p.name}</td>
                        <td className="px-4 py-3 text-slate-500">{p.category_name || '-'}</td>
                        <td className="px-4 py-3 text-right">
                          {p.active === false ? <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-400 uppercase">Inactivo</span> : <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-600 uppercase">Activo</span>}
                        </td>
                      </tr>
                    ))}
                    {filteredBulkProducts.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-4 py-8 text-center text-slate-400 italic">No se encontraron productos</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- DRAWER --- */}
      <OptionGroupDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        group={editingGroup}
        options={editingGroup ? (optionsByGroup.get(editingGroup.id) || []) : []}
        onSave={load}
      />

    </div>
  );
}
