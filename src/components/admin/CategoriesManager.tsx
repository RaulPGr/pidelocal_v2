"use client";

import React, { useState, useEffect } from "react";
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Trash2, Edit2, Plus, Check, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

type Category = {
    id: number;
    name: string;
    sort_order?: number | null;
};

type Props = {
    categories: Category[];
    onUpdate: () => void; // Trigger parent refresh
};

export default function CategoriesManager({ categories, onUpdate }: Props) {
    const [items, setItems] = useState<Category[]>(categories);
    const [isExpanded, setIsExpanded] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editName, setEditName] = useState("");
    const [newName, setNewName] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Mantener orden local sincronizado con props, pero respetando orden numérico
        const sorted = [...categories].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0) || a.id - b.id);
        setItems(sorted);
    }, [categories]);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    async function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            setItems((items) => {
                const oldIndex = items.findIndex((i) => i.id === active.id);
                const newIndex = items.findIndex((i) => i.id === over.id);
                const newOrder = arrayMove(items, oldIndex, newIndex);

                // Optimistic update
                saveOrder(newOrder);
                return newOrder;
            });
        }
    }

    async function saveOrder(newItems: Category[]) {
        try {
            const payload = newItems.map((c, index) => ({ id: c.id, sort_order: index }));
            // Batch update endpoint for categories reorder would be ideal, 
            // but if not exists, we loop (or create one). 
            // For now, let's assume we use the existing patch route in a loop or a new batch route.
            // To be safe and efficient, let's implement a loop here or ask backend for batch.
            // Since we implemented batch for products, we SHOULD have one for categories or create it.
            // Let's use the single PATCH for now to be safe, but fire and forget mostly.

            // Better approach: Create a reorder endpoint or use existing.
            // Let's try sending individually for now, but debounce if possible.
            // Actually, let's use the existing single PATCH endpoint.

            await Promise.all(payload.map(p =>
                fetch('/api/admin/categories', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: p.id, sort_order: p.sort_order })
                })
            ));

            onUpdate();
        } catch (e) {
            toast.error("Error al guardar el orden");
        }
    }

    async function addCategory() {
        if (!newName.trim()) return;
        setLoading(true);
        try {
            const res = await fetch('/api/admin/categories', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newName.trim() })
            });
            if (!res.ok) throw new Error("Error al crear");
            setNewName("");
            toast.success("Categoría creada");
            onUpdate();
        } catch {
            toast.error("No se pudo crear la categoría");
        } finally {
            setLoading(false);
        }
    }

    async function deleteCategory(id: number) {
        if (!confirm("¿Eliminar categoría? Si tiene productos, no se borrará.")) return;
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/categories?id=${id}`, { method: 'DELETE' });
            const data = await res.json();
            if (!res.ok || !data.ok) throw new Error(data.error || "Error al eliminar");
            toast.success("Categoría eliminada");
            onUpdate();
        } catch (e: any) {
            toast.error(e.message || "No se pudo eliminar");
        } finally {
            setLoading(false);
        }
    }

    async function startEdit(c: Category) {
        setEditingId(c.id);
        setEditName(c.name);
    }

    async function saveEdit() {
        if (!editingId || !editName.trim()) return;
        setLoading(true);
        try {
            const res = await fetch('/api/admin/categories', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: editingId, name: editName.trim() })
            });
            if (!res.ok) throw new Error("Error al editar");
            setEditingId(null);
            toast.success("Categoría actualizada");
            onUpdate();
        } catch {
            toast.error("No se pudo actualizar");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="glass-panel p-6 rounded-2xl mb-8 border-l-[6px] border-indigo-500">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="text-lg font-bold text-slate-900">Gestión de Categorías</h3>
                    <p className="text-sm text-slate-500">Organiza las secciones de tu carta.</p>
                </div>
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="text-sm text-indigo-600 font-medium hover:underline"
                >
                    {isExpanded ? "Ocultar" : "Gestionar / Reordenar"}
                </button>
            </div>

            {isExpanded && (
                <div className="animate-in slide-in-from-top-2 fade-in duration-300 space-y-4">
                    {/* Add New */}
                    <div className="flex gap-2">
                        <input
                            className="glass-input flex-1 px-4 py-2 rounded-xl text-sm"
                            placeholder="Nueva categoría (ej. Postres)..."
                            value={newName}
                            onChange={e => setNewName(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && addCategory()}
                        />
                        <button
                            onClick={addCategory}
                            disabled={loading || !newName.trim()}
                            className="btn-primary px-4 py-2 rounded-xl flex items-center gap-2"
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                            Añadir
                        </button>
                    </div>

                    <div className="border-t border-slate-100 my-4"></div>

                    {/* List DnD */}
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                    >
                        <SortableContext
                            items={items.map(i => i.id)}
                            strategy={verticalListSortingStrategy}
                        >
                            <div className="space-y-2">
                                {items.map(cat => (
                                    <SortableItem
                                        key={cat.id}
                                        category={cat}
                                        onDelete={() => deleteCategory(cat.id)}
                                        onEdit={() => startEdit(cat)}
                                        isEditing={editingId === cat.id}
                                        editName={editName}
                                        setEditName={setEditName}
                                        onSaveEdit={saveEdit}
                                        onCancelEdit={() => setEditingId(null)}
                                    />
                                ))}
                            </div>
                        </SortableContext>
                    </DndContext>
                </div>
            )}
        </div>
    );
}

function SortableItem({
    category, onDelete, onEdit, isEditing, editName, setEditName, onSaveEdit, onCancelEdit
}: any) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: category.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : "auto",
        opacity: isDragging ? 0.5 : 1,
    };

    if (isEditing) {
        return (
            <div className="flex items-center gap-2 bg-indigo-50 p-2 rounded-xl border border-indigo-200">
                <input
                    className="flex-1 bg-white px-3 py-1.5 rounded-lg text-sm border border-indigo-200 outline-none focus:ring-2 focus:ring-indigo-500"
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    autoFocus
                />
                <button onClick={onSaveEdit} className="p-1.5 text-emerald-600 hover:bg-emerald-100 rounded-lg"><Check className="w-4 h-4" /></button>
                <button onClick={onCancelEdit} className="p-1.5 text-slate-400 hover:bg-slate-200 rounded-lg"><X className="w-4 h-4" /></button>
            </div>
        )
    }

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`flex items-center gap-3 bg-white p-3 rounded-xl border ${isDragging ? "border-indigo-400 shadow-md" : "border-slate-100 hover:border-slate-300"
                } transition-colors group`}
        >
            <div {...attributes} {...listeners} className="text-slate-400 cursor-grab active:cursor-grabbing hover:text-indigo-600 p-1">
                <GripVertical className="w-5 h-5" />
            </div>

            <span className="flex-1 font-medium text-slate-700 text-sm">{category.name}</span>

            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={onEdit} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                    <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button onClick={onDelete} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                </button>
            </div>
        </div>
    );
}
