import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { ExternalLink, Settings, ShieldCheck, MapPin } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

async function getBusinesses() {
    const { data, error } = await supabaseAdmin
        .from("businesses")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Error fetching businesses:", error);
        return [];
    }
    return data || [];
}

export default async function SuperAdminPage() {
    const businesses = await getBusinesses();

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Panel de Control Global</h1>
                    <p className="text-slate-500">Gestión centralizada de todos los comercios registrados.</p>
                </div>
                <div className="bg-white px-4 py-2 rounded-lg shadow-sm border border-slate-200 text-sm font-medium text-slate-600">
                    Total: <span className="text-slate-900 font-bold">{businesses.length}</span>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Negocio</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Slug / URL</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Plan</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Creado</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                            {businesses.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                                        No hay negocios registrados todavía.
                                    </td>
                                </tr>
                            ) : (
                                businesses.map((biz: any) => {
                                    const plan = biz.subscription_plan || "free";
                                    const isPremium = plan === "premium";
                                    const createdAt = new Date(biz.created_at).toLocaleDateString("es-ES", { day: '2-digit', month: 'short', year: 'numeric' });

                                    return (
                                        <tr key={biz.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="flex-shrink-0 h-10 w-10 bg-slate-100 rounded-full flex items-center justify-center text-xl overflow-hidden border border-slate-200">
                                                        {biz.image_url ? (
                                                            <img src={biz.image_url} alt="" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <span>🏪</span>
                                                        )}
                                                    </div>
                                                    <div className="ml-4">
                                                        <div className="text-sm font-bold text-slate-900">{biz.name || "Sin Nombre"}</div>
                                                        <div className="text-xs text-slate-500 flex items-center gap-1">
                                                            <MapPin className="w-3 h-3" /> {biz.address || "Sin dirección"}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-slate-100 text-slate-800 font-mono">
                                                    {biz.slug}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-bold rounded-full uppercase tracking-wide ${isPremium ? "bg-emerald-100 text-emerald-800" : "bg-blue-100 text-blue-800"
                                                    }`}>
                                                    {plan}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                                {createdAt}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                                                <a
                                                    href={`/admin/settings/theme?tenant=${biz.slug}`}
                                                    className="text-indigo-600 hover:text-indigo-900 inline-flex items-center gap-1 hover:underline"
                                                >
                                                    <Settings className="w-4 h-4" /> Configurar
                                                </a>
                                                <a
                                                    href={`/?tenant=${biz.slug}`}
                                                    target="_blank"
                                                    className="text-emerald-600 hover:text-emerald-900 inline-flex items-center gap-1 hover:underline"
                                                >
                                                    Ver Web <ExternalLink className="w-4 h-4" />
                                                </a>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
