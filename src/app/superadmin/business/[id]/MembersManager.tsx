"use client";

import { useState } from "react";
import { addBusinessMember, removeBusinessMember, type BusinessMember } from "../actions";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, User, Shield } from "lucide-react";

type Props = {
    businessId: string;
    initialMembers: BusinessMember[];
};

export default function MembersManager({ businessId, initialMembers }: Props) {
    const [members, setMembers] = useState(initialMembers);
    const [newEmail, setNewEmail] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleAdd(e: React.FormEvent) {
        e.preventDefault();
        if (!newEmail) return;

        setLoading(true);
        const res = await addBusinessMember(businessId, newEmail);
        setLoading(false);

        if (res.success) {
            toast.success("Usuario añadido correctamente");
            setNewEmail("");
            // Ideally we re-fetch, but for now we rely on revalidatePath and a soft refresh or just waiting for page reload.
            // Since props come from server, strict way is router.refresh().
            window.location.reload();
        } else {
            toast.error(res.error || "Error al añadir usuario");
        }
    }

    async function handleRemove(userId: string) {
        if (!confirm("¿Seguro que quieres quitar acceso a este usuario?")) return;

        const res = await removeBusinessMember(businessId, userId);
        if (res.success) {
            toast.success("Usuario eliminado");
            setMembers(members.filter(m => m.userId !== userId));
        } else {
            toast.error("Error al eliminar usuario");
        }
    }

    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center">
                <h2 className="font-bold text-slate-800 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-emerald-600" />
                    Gestión de Accesos
                </h2>
                <span className="text-xs font-medium px-2 py-1 bg-slate-100 rounded-full text-slate-600">
                    {members.length} usuarios
                </span>
            </div>

            <div className="p-5 space-y-6">
                {/* List */}
                <div className="space-y-3">
                    {members.map(member => (
                        <div key={member.userId} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-white border flex items-center justify-center text-slate-400">
                                    <User className="w-4 h-4" />
                                </div>
                                <div>
                                    <div className="text-sm font-medium text-slate-900">{member.email}</div>
                                    <div className="text-xs text-slate-500 flex gap-2">
                                        <span>Rol: {member.role}</span>
                                        {member.lastAccessAt && (
                                            <span>• Último acceso: {new Date(member.lastAccessAt).toLocaleDateString()}</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => handleRemove(member.userId)}
                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Revocar acceso"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    ))}

                    {members.length === 0 && (
                        <div className="text-center py-4 text-slate-400 text-sm">
                            No hay usuarios con acceso.
                        </div>
                    )}
                </div>

                {/* Add Form */}
                <form onSubmit={handleAdd} className="flex gap-2 pt-4 border-t border-slate-100">
                    <input
                        type="email"
                        placeholder="nuevo@usuario.com"
                        value={newEmail}
                        onChange={e => setNewEmail(e.target.value)}
                        className="flex-1 px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        required
                    />
                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                        Añadir
                    </button>
                </form>
            </div>
        </div>
    );
}
