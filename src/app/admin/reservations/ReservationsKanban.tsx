"use client";

import { useMemo } from "react";
import {
    DndContext,
    DragOverlay,
    useDroppable,
    DragStartEvent,
    DragEndEvent,
    closestCenter
} from "@dnd-kit/core";
import {
    SortableContext,
    verticalListSortingStrategy,
    useSortable
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Check, Clock, X, User, Phone, Users, MessageSquare, MapPin } from "lucide-react";
import clsx from "clsx";
import { useState } from "react";

type AdminReservation = {
    id: string;
    customer_name: string;
    customer_phone: string;
    party_size: number;
    reserved_at: string;
    notes: string | null;
    status: string;
};

type Props = {
    items: AdminReservation[];
    onStatusChange: (id: string, newStatus: string) => void;
    loading: boolean;
};

const COLS = [
    { id: 'pending', title: 'Pendientes', color: 'bg-amber-100 border-amber-200 text-amber-800' },
    { id: 'confirmed', title: 'Confirmadas', color: 'bg-emerald-100 border-emerald-200 text-emerald-800' },
    { id: 'cancelled', title: 'Canceladas', color: 'bg-rose-100 border-rose-200 text-rose-800' },
];

function parseNote(raw: string | null) {
    if (!raw) return { zone: null, text: null };

    let text = raw;
    let zoneName = null;

    const zoneMatch = text.match(/\[Zona:\s*([^\]]+)\]/i);
    if (zoneMatch) {
        zoneName = zoneMatch[1].trim();
        text = text.replace(zoneMatch[0], "");
    }

    text = text.replace(/\[ID:[^\]]+\]/gi, "");

    return {
        zone: zoneName,
        text: text.trim() || null
    };
}

export default function ReservationsKanban({ items, onStatusChange }: Props) {
    const [activeId, setActiveId] = useState<string | null>(null);

    const columns = useMemo(() => {
        const cols: Record<string, AdminReservation[]> = {
            pending: [],
            confirmed: [],
            cancelled: []
        };
        items.forEach(item => {
            if (cols[item.status]) cols[item.status].push(item);
            else cols['pending'].push(item); // Fallback
        });
        return cols;
    }, [items]);

    function handleDragStart(event: DragStartEvent) {
        setActiveId(event.active.id as string);
    }

    function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event;
        setActiveId(null);

        if (!over) return;

        const activeId = active.id as string;
        const overId = over.id as string;

        // Find custom status?
        // In this simple kanban, dropping on a container (column) triggers status change
        // Dropping on an item also triggers status change to that item's column

        let newStatus = overId;

        // Check if dropped on an item instead of column
        if (!COLS.find(c => c.id === newStatus)) {
            const overItem = items.find(i => i.id === overId);
            if (overItem) newStatus = overItem.status;
        }

        const currentItem = items.find(i => i.id === activeId);
        if (currentItem && currentItem.status !== newStatus && COLS.find(c => c.id === newStatus)) {
            onStatusChange(activeId, newStatus);
        }
    }

    const activeItem = activeId ? items.find(i => i.id === activeId) : null;

    return (
        <DndContext
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full min-h-[500px]">
                {COLS.map(col => (
                    <DroppableColumn
                        key={col.id}
                        col={col}
                        items={columns[col.id] || []}
                    />
                ))}
            </div>

            <DragOverlay>
                {activeItem ? <KanbanCard item={activeItem} isOverlay /> : null}
            </DragOverlay>
        </DndContext>
    );
}

function DroppableColumn({ col, items }: { col: any, items: AdminReservation[] }) {
    const { setNodeRef } = useDroppable({ id: col.id });

    return (
        <div ref={setNodeRef} className="flex flex-col h-full bg-slate-50/50 rounded-xl border border-slate-200/60 p-3">
            <div className={clsx("px-4 py-3 rounded-lg border mb-3 font-bold text-sm flex justify-between items-center", col.color)}>
                {col.title}
                <span className="bg-white/50 px-2 py-0.5 rounded-full text-xs">{items.length}</span>
            </div>

            <div className="flex-1 space-y-3 min-h-[200px]">
                <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
                    {items.map(item => <KanbanCard key={item.id} item={item} />)}
                </SortableContext>
                {items.length === 0 && (
                    <div className="h-24 border-2 border-dashed border-slate-200 rounded-lg flex items-center justify-center text-slate-400 text-xs uppercase font-medium">
                        Vacío
                    </div>
                )}
            </div>
        </div>
    );
}



function KanbanCard({ item, isOverlay }: { item: AdminReservation, isOverlay?: boolean }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
    const { zone, text: cleanNote } = parseNote(item.notes);

    const style = transform ? {
        transform: CSS.Translate.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    } : undefined;

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...listeners}
            {...attributes}
            className={clsx(
                "bg-white p-4 rounded-xl shadow-sm border border-slate-100 group cursor-grab active:cursor-grabbing hover:shadow-md transition-all relative overflow-hidden",
                isOverlay && "shadow-xl scale-105 rotate-2 ring-2 ring-emerald-500/50 z-50 opacity-90"
            )}
        >
            {/* Zone Tag if present */}
            {zone && (
                <div className="absolute top-0 right-0 bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-1 rounded-bl-lg border-b border-l border-emerald-100 flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {zone}
                </div>
            )}

            <div className="flex justify-between items-start mb-2 pr-8">
                <div className="font-bold text-slate-800 text-sm">{item.customer_name}</div>
                <div className="flex items-center gap-1 text-xs font-semibold bg-slate-100 px-2 py-0.5 rounded-full text-slate-600">
                    <Users className="w-3 h-3" />
                    {item.party_size}
                </div>
            </div>

            <div className="text-xs text-slate-500 space-y-1 mb-3">
                <div className="flex items-center gap-1.5">
                    <Clock className="w-3 h-3 text-emerald-500" />
                    {new Date(item.reserved_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                </div>
                <div className="flex items-center gap-1.5 hover:text-emerald-600">
                    <Phone className="w-3 h-3" />
                    {item.customer_phone}
                </div>
            </div>

            {cleanNote && (
                <div className="mt-2 text-[10px] leading-tight bg-amber-50 text-amber-800 p-2 rounded-lg border border-amber-100 flex gap-2">
                    <MessageSquare className="w-3 h-3 shrink-0" />
                    <span className="line-clamp-2">{cleanNote}</span>
                </div>
            )}
        </div>
    );
}
