'use client';

import React, { useState, useEffect } from 'react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Save, Loader2, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

type Product = {
    id: number;
    name: string;
    price: number;
    sort_order?: number | null;
    category_id?: number | null;
    available: boolean;
};

type Props = {
    products: Product[];
    onSave: () => void;
    onCancel: () => void;
};

export default function ReorderableProductList({ products, onSave, onCancel }: Props) {
    const [items, setItems] = useState<Product[]>([]);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        // Orden inicial: por sort_order, luego ID
        const sorted = [...products].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0) || a.id - b.id);
        setItems(sorted);
    }, [products]);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            setItems((items) => {
                const oldIndex = items.findIndex(i => i.id === active.id);
                const newIndex = items.findIndex(i => i.id === over.id);
                return arrayMove(items, oldIndex, newIndex);
            });
        }
    }

    async function handleSave() {
        setSaving(true);
        try {
            // Preparamos payload: { items: [{id, sort_order}] }
            const payload = items.map((p, index) => ({
                id: p.id,
                sort_order: index
            }));

            const res = await fetch('/api/admin/products/reorder', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ items: payload }),
            });

            if (!res.ok) throw new Error('Error al guardar el orden');

            toast.success('Orden actualizado correctamente');
            onSave(); // Refresh padre
        } catch (e) {
            toast.error('No se pudo guardar el orden');
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="glass-panel p-6 rounded-2xl animate-in fade-in duration-300">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
                <div>
                    <h3 className="text-xl font-bold text-slate-900">Reordenar Productos</h3>
                    <p className="text-sm text-slate-500">Arrastra para cambiar el orden en que aparecen en el menú.</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={onCancel} disabled={saving} className="btn-secondary flex items-center gap-2">
                        <ArrowLeft className="w-4 h-4" /> Cancelar
                    </button>
                    <button onClick={handleSave} disabled={saving} className="btn-primary flex items-center gap-2">
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Guardar Orden
                    </button>
                </div>
            </div>

            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >
                <SortableContext
                    items={items.map(i => i.id)}
                    strategy={verticalListSortingStrategy}
                >
                    <div className="space-y-2 max-w-3xl mx-auto">
                        {items.map((item) => (
                            <SortableItem key={item.id} product={item} />
                        ))}
                    </div>
                </SortableContext>
            </DndContext>
        </div>
    );
}

function SortableItem({ product }: { product: Product }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: product.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : 'auto',
        opacity: isDragging ? 0.8 : 1,
    };

    return (
        <div ref={setNodeRef} style={style} className={`flex items-center gap-4 bg-white p-3 rounded-xl border ${isDragging ? 'border-emerald-400 shadow-lg scale-105' : 'border-slate-200 hover:border-emerald-200'} transition-all`}>
            <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-slate-400 hover:text-emerald-600 p-2">
                <GripVertical className="w-5 h-5" />
            </div>
            <div className="flex-1">
                <div className="font-semibold text-slate-800">{product.name}</div>
                <div className="text-xs text-slate-500">{new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(product.price)}</div>
            </div>
            <div className="text-xs text-slate-400 font-mono">
                #{product.id}
            </div>
        </div>
    );
}
