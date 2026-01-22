"use client";

import { useState, useEffect } from "react";
import { X, Plus, Trash2, Check, Loader2, GripVertical } from "lucide-react";
import { toast } from "sonner";
import clsx from "clsx";


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

type Props = {
    open: boolean;
    onClose: () => void;
    group: OptionGroup | null; // null = new
    options?: OptionItem[]; // Initial options if editing
    onSave: () => void; // Trigger refresh
};

export default function OptionGroupDrawer({ open, onClose, group, options = [], onSave }: Props) {
    // Form States
    const [formData, setFormData] = useState<Partial<OptionGroup>>({
        selection_type: "single",
        min_select: 1,
        max_select: 1,
        is_required: true,
        sort_order: 0
    });

    // Local Options State (we manage options here too)
    const [localOptions, setLocalOptions] = useState<OptionItem[]>([]);

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    // Load data on open
    useEffect(() => {
        if (open) {
            if (group) {
                setFormData({
                    ...group,
                    min_select: group.min_select ?? 1,
                    max_select: group.max_select ?? 1,
                    sort_order: group.sort_order ?? 0
                });
                setLocalOptions([...options].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)));
            } else {
                setFormData({
                    name: "",
                    description: "",
                    selection_type: "single",
                    min_select: 1,
                    max_select: 1,
                    is_required: true,
                    sort_order: 0
                });
                setLocalOptions([]);
            }
        }
    }, [open, group, options]);

    // --- Actions ---

    async function handleSaveGroup() {
        if (!formData.name?.trim()) return toast.error("El nombre es obligatorio");
        setSaving(true);
        try {
            // 1. Save Group
            const payload = {
                ...formData,
                min_select: Number(formData.min_select),
                max_select: Number(formData.max_select)
            };
            const method = group ? "PATCH" : "POST";
            const body = group ? { id: group.id, ...payload } : payload;

            const res = await fetch("/api/admin/option-groups", {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body)
            });
            const j = await res.json();
            if (!j.ok) throw new Error(j.error);

            const groupId = group ? group.id : j.id;

            // 2. Save Options (Only if we have a groupId)
            // Strategy: We sync the local list. 
            // New items have no ID (or temp ID). Existing have ID.
            // Simplified: Just upsert them one by one or bulk? 
            // The API supports individual create/update. 
            // Use Promise.all
            await Promise.all(localOptions.map(async (opt, idx) => {
                const isTemp = opt.id.startsWith("temp-");
                const optBody = {
                    group_id: groupId,
                    name: opt.name,
                    price_delta: Number(opt.price_delta),
                    sort_order: idx // Enforce order by list position
                };

                if (isTemp) {
                    await fetch("/api/admin/options", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(optBody)
                    });
                } else {
                    await fetch("/api/admin/options", {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ id: opt.id, ...optBody })
                    });
                }
            }));

            // TODO: Handle deletions? 
            // If an option was removed from localOptions but existed in DB, it needs deletion.
            // We need original IDs list.
            if (group) {
                const originalIds = new Set(options.map(o => o.id));
                const currentIds = new Set(localOptions.filter(o => !o.id.startsWith("temp-")).map(o => o.id));
                const toDelete = [...originalIds].filter(id => !currentIds.has(id));
                await Promise.all(toDelete.map(id =>
                    fetch(`/api/admin/options?id=${id}`, { method: "DELETE" })
                ));
            }

            toast.success("Grupo guardado correctamente");
            onSave();
            onClose();

        } catch (e: any) {
            toast.error(e.message || "Error al guardar");
        } finally {
            setSaving(false);
        }
    }

    // Local Option Helpers
    function addOption() {
        setLocalOptions([...localOptions, {
            id: `temp-${Date.now()}`,
            group_id: group?.id || "",
            name: "",
            price_delta: 0,
            sort_order: localOptions.length
        }]);
    }

    function updateOption(id: string, field: keyof OptionItem, val: any) {
        setLocalOptions(prev => prev.map(o => o.id === id ? { ...o, [field]: val } : o));
    }

    function removeOption(id: string) {
        setLocalOptions(prev => prev.filter(o => o.id !== id));
    }

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex justify-end isolate">
            <div className="absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity" onClick={onClose} />

            <div className="relative w-full max-w-xl bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
                <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900">{group ? 'Editar Grupo' : 'Nuevo Grupo de Opciones'}</h2>
                        <p className="text-sm text-slate-500">Configura los extras (ej: Salsas, Tamaños).</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-8">
                    {/* Basic Info */}
                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase">Nombre Interno</label>
                            <input
                                className="glass-input w-full px-4 py-2.5"
                                placeholder="Ej: Salsas Hamburguesa"
                                value={formData.name || ''}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase">Título Público (Opcional)</label>
                            <input
                                className="glass-input w-full px-4 py-2.5"
                                placeholder="Ej: ¿Qué salsa prefieres?"
                                value={formData.description || ''}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>
                    </div>

                    <hr className="border-slate-100" />

                    {/* Rules */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold text-slate-900">Reglas de Selección</h3>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex bg-slate-100 p-1 rounded-xl">
                                <button
                                    onClick={() => setFormData({ ...formData, selection_type: 'single', max_select: 1, min_select: 1 })}
                                    className={clsx("flex-1 text-xs font-bold py-2 rounded-lg transition-all", formData.selection_type === 'single' ? "bg-white shadow text-emerald-700" : "text-slate-500")}
                                >
                                    Única (Radio)
                                </button>
                                <button
                                    onClick={() => setFormData({ ...formData, selection_type: 'multiple' })}
                                    className={clsx("flex-1 text-xs font-bold py-2 rounded-lg transition-all", formData.selection_type === 'multiple' ? "bg-white shadow text-emerald-700" : "text-slate-500")}
                                >
                                    Múltiple
                                </button>
                            </div>

                            <div className="flex items-center justify-between px-4 bg-slate-50 rounded-xl border border-slate-100">
                                <span className="text-sm font-medium text-slate-600">Obligatorio</span>
                                <input
                                    type="checkbox"
                                    className="w-5 h-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                                    checked={formData.is_required || false}
                                    onChange={e => setFormData({ ...formData, is_required: e.target.checked })}
                                />
                            </div>
                        </div>

                        {formData.selection_type === 'multiple' && (
                            <div className="grid grid-cols-2 gap-4 animate-in fade-in">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-400 uppercase">Mínimo</label>
                                    <input type="number" className="glass-input w-full" value={formData.min_select || ''} onChange={e => setFormData({ ...formData, min_select: Number(e.target.value) })} />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-400 uppercase">Máximo</label>
                                    <input type="number" className="glass-input w-full" value={formData.max_select || ''} onChange={e => setFormData({ ...formData, max_select: Number(e.target.value) })} />
                                </div>
                            </div>
                        )}
                    </div>

                    <hr className="border-slate-100" />

                    {/* Options List */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-bold text-slate-900">Opciones del Grupo</h3>
                            <button onClick={addOption} className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 bg-emerald-50 px-2 py-1 rounded-lg">
                                <Plus className="w-3 h-3" /> Añadir Opción
                            </button>
                        </div>

                        <div className="space-y-2">
                            {localOptions.map((opt, idx) => (
                                <div key={opt.id} className="flex items-center gap-2 p-2 bg-white border border-slate-200 rounded-xl hover:border-emerald-300 transition-colors shadow-sm">
                                    <div className="text-slate-300 cursor-move px-1"><GripVertical className="w-4 h-4" /></div>
                                    <input
                                        className="flex-1 bg-transparent text-sm font-medium focus:outline-none placeholder:text-slate-300"
                                        placeholder="Nombre (ej: Barbacoa)"
                                        value={opt.name}
                                        onChange={e => updateOption(opt.id, 'name', e.target.value)}
                                        autoFocus={opt.name === ""}
                                    />
                                    <div className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
                                        <span className="text-xs text-slate-400 font-bold">+</span>
                                        <input
                                            type="number" step="0.5"
                                            className="w-12 bg-transparent text-sm font-mono text-right focus:outline-none"
                                            value={opt.price_delta || ""}
                                            onChange={e => updateOption(opt.id, 'price_delta', e.target.value)}
                                            placeholder="0"
                                        />
                                        <span className="text-xs text-slate-400">€</span>
                                    </div>
                                    <button onClick={() => removeOption(opt.id)} className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                            {localOptions.length === 0 && (
                                <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                    <p className="text-sm text-slate-400 italic">Añade al menos una opción</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="p-6 border-t border-slate-100 bg-white flex justify-end gap-3 z-10 sticky bottom-0">
                    <button onClick={onClose} className="px-6 py-2.5 rounded-xl text-slate-500 font-medium hover:bg-slate-50 transition-colors">
                        Cancelar
                    </button>
                    <button
                        onClick={() => void handleSaveGroup()}
                        disabled={saving}
                        className="btn-primary px-8 py-2.5 rounded-xl shadow-lg shadow-emerald-500/20 flex items-center gap-2"
                    >
                        {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                        Guardar {localOptions.length > 0 && `(${localOptions.length} opciones)`}
                    </button>
                </div>
            </div>
        </div>
    );
}
