"use client";

import { useState } from "react";
import { Send, CheckCircle, Archive } from "lucide-react";
import { adminReplyTicket, closeTicket } from "../../actions";
import { toast } from "sonner";

export default function AdminChat({ ticket, messages }: { ticket: any, messages: any[] }) {
    const [reply, setReply] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleSend(e: React.FormEvent) {
        e.preventDefault();
        if (!reply) return;
        setLoading(true);
        const res = await adminReplyTicket(ticket.id, reply);
        if (res.success) {
            setReply("");
            // Router refresh handled by server action revalidatePath, 
            // but we might need explicit refresh if using soft nav?
            // Usually ok.
        } else {
            toast.error("Error al enviar");
        }
        setLoading(false);
    }

    async function handleClose() {
        if (!confirm("¿Cerrar ticket?")) return;
        await closeTicket(ticket.id);
        toast.success("Ticket cerrado");
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-140px)]">
            <div className="lg:col-span-2 flex flex-col bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <div>
                        <h2 className="font-bold text-slate-800">{ticket.subject}</h2>
                        <div className="text-xs text-slate-500 mt-1">
                            Negocio: <strong>{ticket.business?.name}</strong> ({ticket.business?.slug})
                        </div>
                    </div>
                    <div className="flex gap-2">
                        {ticket.status !== 'closed' && (
                            <button onClick={handleClose} className="px-3 py-1 bg-white border border-slate-200 text-slate-600 rounded-lg text-xs hover:bg-slate-100 flex items-center gap-1">
                                <Archive className="w-3 h-3" /> Cerrar
                            </button>
                        )}
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">
                    {messages.map((m: any) => {
                        const isAdmin = m.sender_role === 'superadmin';
                        return (
                            <div key={m.id} className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[80%] rounded-2xl px-5 py-3 ${isAdmin ? 'bg-slate-800 text-white rounded-br-none' : 'bg-white border border-slate-200 text-slate-700 rounded-bl-none shadow-sm'
                                    }`}>
                                    <div className="text-sm leading-relaxed whitespace-pre-wrap">{m.message}</div>
                                    <div className={`text-[10px] mt-2 opacity-70`}>
                                        {new Date(m.created_at).toLocaleString()}
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>

                <form onSubmit={handleSend} className="p-4 bg-white border-t border-slate-100 flex gap-3">
                    <textarea
                        value={reply}
                        onChange={e => setReply(e.target.value)}
                        className="flex-1 px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-500 focus:outline-none resize-none h-20 text-sm"
                        placeholder="Escribir respuesta..."
                    />
                    <button
                        disabled={loading || !reply}
                        className="h-20 w-20 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl flex items-center justify-center disabled:opacity-50 transition-colors"
                    >
                        <Send className="w-6 h-6" />
                    </button>
                </form>
            </div>

            <div className="space-y-6">
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                    <h3 className="font-bold text-slate-800 mb-4">Detalles del Negocio</h3>
                    <div className="space-y-3 text-sm">
                        <div>
                            <span className="text-slate-500 block text-xs uppercase">Nombre</span>
                            <span className="font-medium text-slate-900">{ticket.business?.name}</span>
                        </div>
                        <div>
                            <span className="text-slate-500 block text-xs uppercase">Email</span>
                            <span className="font-medium text-slate-900">{ticket.business?.email}</span>
                        </div>
                        <div>
                            <span className="text-slate-500 block text-xs uppercase">ID</span>
                            <span className="font-mono text-xs text-slate-600 break-all">{ticket.business?.id}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
