"use client";

import { useState } from "react";
import { Trash2, AlertTriangle, Loader2, X } from "lucide-react";
import { deleteBusiness } from "./actions";

interface DeleteBusinessButtonProps {
    businessId: string;
    businessName: string;
}

export default function DeleteBusinessButton({ businessId, businessName }: DeleteBusinessButtonProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [confirmationName, setConfirmationName] = useState("");
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState(1); // 1: Initial warning, 2: Type name

    async function handleDelete() {
        if (confirmationName !== businessName) return;

        setLoading(true);
        try {
            const res = await deleteBusiness(businessId);
            if (res.success) {
                setIsOpen(false);
                // Page will likely revalidate via server action, but we can reload to be sure if needed
            } else {
                alert(res.error || "Error al eliminar");
            }
        } catch (e) {
            alert("Error de conexión");
        } finally {
            setLoading(false);
        }
    }

    if (!isOpen) {
        return (
            <button
                onClick={() => { setIsOpen(true); setStep(1); setConfirmationName(""); }}
                className="p-2 text-rose-400 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors group"
                title="Eliminar Negocio"
            >
                <Trash2 className="w-4 h-4" />
            </button>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden border border-slate-200">

                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-rose-50/50">
                    <h3 className="font-bold text-rose-900 flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-rose-600" />
                        Eliminar Negocio
                    </h3>
                    <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    {step === 1 ? (
                        <>
                            <p className="text-slate-600 text-sm">
                                ¿Estás seguro de que quieres eliminar <strong>{businessName}</strong>?
                            </p>
                            <div className="bg-rose-50 text-rose-800 text-xs p-3 rounded-lg border border-rose-100 font-medium">
                                ⚠️ Esta acción eliminará permanentemente:
                                <ul className="list-disc list-inside mt-1 ml-1 space-y-1">
                                    <li>Datos del negocio y configuración</li>
                                    <li>Productos, carta y fotos</li>
                                    <li>Historial de pedidos y reservas</li>
                                    <li>Cuentas de empleados asociadas</li>
                                </ul>
                            </div>
                            <div className="flex gap-3 mt-4">
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="flex-1 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transaction-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={() => setStep(2)}
                                    className="flex-1 py-2 bg-rose-600 text-white font-bold rounded-xl hover:bg-rose-700 shadow-lg shadow-rose-500/20 transaction-colors"
                                >
                                    Continuar
                                </button>
                            </div>
                        </>
                    ) : (
                        <>
                            <p className="text-slate-600 text-sm">
                                Para confirmar, escribe <strong>{businessName}</strong> en el campo de abajo.
                            </p>
                            <input
                                type="text"
                                value={confirmationName}
                                onChange={(e) => setConfirmationName(e.target.value)}
                                placeholder="Escribe el nombre del negocio"
                                className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none font-bold text-slate-900"
                                autoFocus
                            />

                            <div className="flex gap-3 mt-2">
                                <button
                                    onClick={() => setStep(1)}
                                    className="px-4 py-2 text-slate-500 font-bold hover:text-slate-700"
                                >
                                    Atrás
                                </button>
                                <button
                                    onClick={handleDelete}
                                    disabled={confirmationName !== businessName || loading}
                                    className="flex-1 py-2 bg-rose-600 text-white font-bold rounded-xl hover:bg-rose-700 shadow-lg shadow-rose-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Eliminar Definitivamente"}
                                </button>
                            </div>
                        </>
                    )}
                </div>

            </div>
        </div>
    );
}
