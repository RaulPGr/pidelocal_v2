import { getAllSupportTickets } from "../actions";
import Link from "next/link";
import { MessageSquare, ArrowRight, User } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function SupportDashboard() {
    const tickets = await getAllSupportTickets();

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Soporte Técnico</h1>
                    <p className="text-slate-500">Bandeja de entrada de incidencias.</p>
                </div>
                <div className="bg-white px-4 py-2 rounded-lg border text-sm font-medium shadow-sm">
                    {tickets.filter((t: any) => t.status === 'open').length} Abiertos
                </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="min-w-full divide-y divide-slate-100">
                    <thead className="bg-slate-50">
                        <tr>
                            <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase">Estado</th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase">Negocio</th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase">Asunto</th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase">Última Act.</th>
                            <th className="px-6 py-4 text-right"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {tickets.map((t: any) => (
                            <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-4">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                                        ${t.status === 'open' ? 'bg-green-100 text-green-800' :
                                            t.status === 'answered' ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-800'}`}>
                                        {t.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-sm font-medium text-slate-900">
                                    {t.business?.name || "Sin nombre"}
                                    <div className="text-xs text-slate-500 font-normal">{t.business?.slug}</div>
                                </td>
                                <td className="px-6 py-4 text-sm text-slate-600">
                                    {t.subject}
                                </td>
                                <td className="px-6 py-4 text-sm text-slate-500">
                                    {new Date(t.updated_at).toLocaleDateString()} {new Date(t.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <Link href={`/superadmin/support/${t.id}`} className="text-emerald-600 hover:text-emerald-800 font-medium text-sm flex items-center justify-end gap-1">
                                        Ver <ArrowRight className="w-4 h-4" />
                                    </Link>
                                </td>
                            </tr>
                        ))}
                        {tickets.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                                    No hay tickets de soporte.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
