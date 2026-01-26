"use client";

import { useState, useEffect } from "react";
import { MessageSquare, Send, X, AlertCircle, CheckCircle2, Loader2, ChevronLeft } from "lucide-react";
import { createSupportTicket, getTenantTickets, replyTenantTicket } from "@/app/actions/support";

type Ticket = {
    id: string;
    subject: string;
    status: string;
    created_at: string;
    updated_at: string;
    // We assume messages are embedded or fetched separately. For simplicity in list, maybe not needed.
    // If our server action returns tickets with messages, we use them.
    support_messages?: Message[];
};

type Message = {
    id: string;
    ticket_id: string;
    sender_role: string;
    message: string;
    created_at: string;
};

export default function SupportWidget({ businessId }: { businessId: string }) {
    const [view, setView] = useState<'list' | 'create' | 'chat'>('list');
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
    const [loading, setLoading] = useState(false);

    // Create form
    const [subject, setSubject] = useState("");
    const [message, setMessage] = useState("");

    // Reply form
    const [replyMsg, setReplyMsg] = useState("");

    useEffect(() => {
        if (!businessId) return;
        loadTickets();
    }, [businessId]);

    async function loadTickets() {
        setLoading(true);
        const res = await getTenantTickets(businessId);
        setTickets(res as Ticket[]);
        if (selectedTicket) {
            // Refresh selected ticket
            const found = res.find((t: any) => t.id === selectedTicket.id);
            if (found) setSelectedTicket(found as Ticket);
        }
        setLoading(false);
    }

    async function handleCreate(e: React.FormEvent) {
        e.preventDefault();
        if (!subject || !message) return;
        setLoading(true);
        const res = await createSupportTicket(businessId, subject, message);
        if (res.success) {
            setSubject("");
            setMessage("");
            await loadTickets();
            setView('list');
        } else {
            alert("Error: " + res.error);
        }
        setLoading(false);
    }

    async function handleReply(e: React.FormEvent) {
        e.preventDefault();
        if (!replyMsg || !selectedTicket) return;
        // Optimistic update?
        const newMsgOption = {
            id: 'temp-' + Date.now(),
            ticket_id: selectedTicket.id,
            sender_role: 'business',
            message: replyMsg,
            created_at: new Date().toISOString()
        };
        // Should update local state momentarily?

        await replyTenantTicket(selectedTicket.id, replyMsg);
        setReplyMsg("");
        await loadTickets(); // Refresh to get real message
    }

    // Views
    if (view === 'create') {
        return (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden flex flex-col h-[500px]">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                    <h3 className="font-bold text-slate-800">Nuevo Ticket</h3>
                    <button onClick={() => setView('list')} className="text-slate-400 hover:text-slate-600">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <form onSubmit={handleCreate} className="p-4 flex-1 flex flex-col gap-4 overflow-y-auto">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Asunto</label>
                        <input
                            value={subject} onChange={e => setSubject(e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                            placeholder="Ej: Problema con un pedido"
                            required
                        />
                    </div>
                    <div className="flex-1">
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Mensaje</label>
                        <textarea
                            value={message} onChange={e => setMessage(e.target.value)}
                            className="w-full h-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
                            placeholder="Describe tu consulta..."
                            required
                        />
                    </div>
                    <button disabled={loading} className="w-full bg-emerald-600 text-white font-bold py-3 rounded-xl hover:bg-emerald-700 transition flex justify-center">
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Enviar Ticket"}
                    </button>
                </form>
            </div>
        )
    }

    if (view === 'chat' && selectedTicket) {
        // Sort messages
        const msgs = (selectedTicket.support_messages || []).sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

        return (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden flex flex-col h-[500px]">
                <div className="p-3 border-b border-slate-100 flex items-center justify-between bg-white z-10 shadow-sm">
                    <button onClick={() => setView('list')} className="flex items-center text-slate-500 hover:text-slate-800 text-sm font-medium">
                        <ChevronLeft className="w-4 h-4 mr-1" /> Volver
                    </button>
                    <span className="font-bold text-slate-800 truncate max-w-[200px]" title={selectedTicket.subject}>
                        {selectedTicket.subject}
                    </span>
                    <div className={`w-2 h-2 rounded-full ${selectedTicket.status === 'open' ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                </div>

                <div className="flex-1 bg-slate-50 p-4 overflow-y-auto space-y-4">
                    {msgs.map(m => {
                        const isMe = m.sender_role === 'business';
                        return (
                            <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${isMe ? 'bg-emerald-600 text-white rounded-br-none' : 'bg-white border border-slate-200 text-slate-700 rounded-bl-none shadow-sm'
                                    }`}>
                                    <div>{m.message}</div>
                                    <div className={`text-[10px] mt-1 ${isMe ? 'text-emerald-200' : 'text-slate-400'}`}>
                                        {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                    {msgs.length === 0 && <div className="text-center text-slate-400 text-sm mt-10">No hay mensajes.</div>}
                </div>

                <form onSubmit={handleReply} className="p-3 bg-white border-t flex gap-2">
                    <input
                        value={replyMsg} onChange={e => setReplyMsg(e.target.value)}
                        className="flex-1 px-3 py-2 border rounded-full text-sm focus:outline-none focus:border-emerald-500"
                        placeholder="Escribe una respuesta..."
                    />
                    <button type="submit" disabled={!replyMsg} className="p-2 bg-emerald-600 text-white rounded-full hover:bg-emerald-700 disabled:opacity-50">
                        <Send className="w-4 h-4" />
                    </button>
                </form>
            </div>
        )
    }

    // LIST VIEW
    return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden flex flex-col h-[500px]">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-emerald-600 text-white">
                <div className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    <h3 className="font-bold">Soporte Técnico</h3>
                </div>
                <button onClick={() => setView('create')} className="bg-white/20 hover:bg-white/30 px-3 py-1 rounded-full text-xs font-bold transition">
                    + Nuevo
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-2">
                {loading && tickets.length === 0 && (
                    <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>
                )}

                {!loading && tickets.length === 0 && (
                    <div className="text-center py-10 px-4">
                        <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 text-2xl">👋</div>
                        <p className="text-slate-500 text-sm">No tienes tickets abiertos.</p>
                        <button onClick={() => setView('create')} className="mt-2 text-emerald-600 font-bold text-sm hover:underline">
                            Crear el primero
                        </button>
                    </div>
                )}

                {tickets.map(t => (
                    <div
                        key={t.id}
                        onClick={() => { setSelectedTicket(t); setView('chat'); }}
                        className="p-3 rounded-xl border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/30 cursor-pointer transition flex justify-between items-center group"
                    >
                        <div>
                            <div className="font-bold text-slate-800 text-sm group-hover:text-emerald-700">{t.subject}</div>
                            <div className="text-xs text-slate-400 mt-1 flex gap-2">
                                <span>{new Date(t.created_at).toLocaleDateString()}</span>
                                <span className={t.status === 'open' ? 'text-green-600 font-medium' : 'text-slate-500'}>
                                    {t.status === 'answered' ? 'Respondido' : (t.status === 'open' ? 'Abierto' : 'Cerrado')}
                                </span>
                            </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-400" />
                    </div>
                ))}
            </div>
        </div>
    );
}
