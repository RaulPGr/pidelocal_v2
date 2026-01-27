"use client";

import { useEffect, useState } from "react";
import { Users, UserPlus, Shield, Clock, Trash2, Key } from "lucide-react";

export default function TeamSettingsClient() {
    function getTenantFromUrl(): string {
        if (typeof window === "undefined") return "";
        try {
            return new URLSearchParams(window.location.search).get("tenant") || "";
        } catch {
            return "";
        }
    }

    const [loading, setLoading] = useState(false); // Initial loading handled by effects
    const [memberEmail, setMemberEmail] = useState("");
    const [memberPassword, setMemberPassword] = useState("");
    const [memberRole, setMemberRole] = useState<"staff" | "manager">("staff");
    const [memberMsg, setMemberMsg] = useState<string | null>(null);
    const [memberSaving, setMemberSaving] = useState(false);
    const [membersLoading, setMembersLoading] = useState(false);
    const [membersError, setMembersError] = useState<string | null>(null);
    const [members, setMembers] = useState<
        Array<{ userId: string; email: string | null; role: string; createdAt: string | null; lastAccessAt: string | null }>
    >([]);
    const [accessLogs, setAccessLogs] = useState<Array<{ userId: string; email: string | null; accessedAt: string | null }>>([]);
    const [accessLogsLoading, setAccessLogsLoading] = useState(false);
    const [accessLogsError, setAccessLogsError] = useState<string | null>(null);

    function generateMemberPassword() {
        const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@$%";
        let out = "";
        for (let i = 0; i < 12; i += 1) out += chars.charAt(Math.floor(Math.random() * chars.length));
        setMemberPassword(out);
        setMemberMsg(null);
    }

    async function addMember() {
        const email = memberEmail.trim().toLowerCase();
        if (!email) {
            setMemberMsg("Introduce un email valido.");
            return;
        }
        setMemberSaving(true);
        setMemberMsg(null);
        try {
            const payload: Record<string, string> = { email, role: memberRole };
            if (memberPassword.trim()) payload.password = memberPassword.trim();
            const tenant = getTenantFromUrl();
            const url = tenant ? `/api/admin/members?tenant=${encodeURIComponent(tenant)}` : "/api/admin/members";
            const resp = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            const j = await resp.json();
            if (!resp.ok || !j?.ok) throw new Error(j?.error || "No se pudo crear el usuario");
            if (j?.password) {
                setMemberMsg(`Usuario creado. Entrega esta contraseña temporal: ${j.password}`);
            } else {
                setMemberMsg(j?.info || "Usuario vinculado al negocio.");
            }
            setMemberEmail("");
            setMemberPassword("");
            setMemberRole("staff");
            void loadMembers();
        } catch (e: any) {
            setMemberMsg(e?.message || "No se pudo crear el usuario");
        } finally {
            setMemberSaving(false);
        }
    }

    async function loadMembers() {
        setMembersLoading(true);
        setMembersError(null);
        try {
            const tenant = getTenantFromUrl();
            const url = tenant ? `/api/admin/members?tenant=${encodeURIComponent(tenant)}` : "/api/admin/members";
            const resp = await fetch(url, { cache: "no-store" });
            const j = await resp.json();
            if (!resp.ok || !j?.ok) throw new Error(j?.error || "No se pudieron cargar los usuarios");
            setMembers(Array.isArray(j.members) ? j.members : []);
        } catch (e: any) {
            setMembersError(e?.message || "No se pudieron cargar los usuarios");
        } finally {
            setMembersLoading(false);
        }
    }

    async function loadAccessLogs() {
        setAccessLogsLoading(true);
        setAccessLogsError(null);
        try {
            const tenant = getTenantFromUrl();
            const url = tenant ? `/api/admin/member-access-logs?tenant=${encodeURIComponent(tenant)}` : "/api/admin/member-access-logs";
            const resp = await fetch(url, { cache: "no-store" });
            const j = await resp.json();
            if (!resp.ok || !j?.ok) throw new Error(j?.error || "No se pudo obtener el historial de accesos");
            setAccessLogs(Array.isArray(j.logs) ? j.logs : []);
        } catch (e: any) {
            setAccessLogsError(e?.message || "No se pudo obtener el historial de accesos");
        } finally {
            setAccessLogsLoading(false);
        }
    }

    async function removeMember(userId: string, email?: string | null) {
        const label = email || userId;
        if (!window.confirm(`Eliminar acceso de ${label}?`)) return;
        try {
            const tenant = getTenantFromUrl();
            const url = tenant ? `/api/admin/members?tenant=${encodeURIComponent(tenant)}` : "/api/admin/members";
            const resp = await fetch(url, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId }),
            });
            const j = await resp.json();
            if (!resp.ok || !j?.ok) throw new Error(j?.error || "No se pudo eliminar el usuario");
            setMemberMsg(`Acceso eliminado para ${label}`);
            void loadMembers();
        } catch (e: any) {
            setMemberMsg(e?.message || "No se pudo eliminar el usuario");
        }
    }

    useEffect(() => {
        void loadMembers();
        void loadAccessLogs();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div className="space-y-6">
            <div className="glass-panel p-6">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                    <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                        <Users className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-800">Usuarios del Negocio</h3>
                        <p className="text-sm text-slate-500">
                            Gestiona quién tiene acceso a este panel de administración.
                        </p>
                    </div>
                </div>

                <p className="text-xs text-slate-500 mb-4 bg-slate-50 p-3 rounded-lg border border-slate-100">
                    Puedes crear nuevos usuarios o vincular cuentas existentes. Los roles definen qué pueden hacer:
                    <br />
                    <strong>Staff:</strong> Solo productos y configuración básica.
                    <br />
                    <strong>Manager:</strong> Acceso total, incluyendo gestión de personal.
                </p>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-12 bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <div className="lg:col-span-5">
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Email</label>
                        <div className="relative">
                            <Users className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                className="pl-9 glass-input w-full"
                                value={memberEmail}
                                onChange={(e) => setMemberEmail(e.target.value)}
                                type="email"
                                placeholder="usuario@correo.com"
                            />
                        </div>
                    </div>
                    <div className="lg:col-span-3">
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Rol</label>
                        <div className="relative">
                            <Shield className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <select
                                className="pl-9 glass-input w-full"
                                value={memberRole}
                                onChange={(e) => setMemberRole(e.target.value === "manager" ? "manager" : "staff")}
                            >
                                <option value="staff">Staff</option>
                                <option value="manager">Manager</option>
                            </select>
                        </div>
                    </div>
                    <div className="lg:col-span-4">
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Contraseña (Opcional)</label>
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <Key className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                <input
                                    className="pl-9 glass-input w-full"
                                    value={memberPassword}
                                    onChange={(e) => setMemberPassword(e.target.value)}
                                    type="text"
                                    placeholder="Generar..."
                                />
                            </div>
                            <button
                                type="button"
                                className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-500 transition-colors"
                                onClick={generateMemberPassword}
                                title="Generar contraseña segura"
                            >
                                <Key className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                    <div className="lg:col-span-12 flex justify-end mt-2">
                        <button
                            onClick={() => void addMember()}
                            disabled={memberSaving}
                            className="btn-primary flex items-center gap-2"
                        >
                            <UserPlus className="w-4 h-4" />
                            {memberSaving ? "Añadiendo..." : "Agregar Usuario"}
                        </button>
                    </div>
                </div>
                {memberMsg && (
                    <div className="mt-4 rounded-lg border border-slate-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500" />
                        {memberMsg}
                    </div>
                )}
            </div>

            <div className="glass-panel p-6">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                    <div className="p-2 bg-slate-100 rounded-lg text-slate-600">
                        <Users className="w-5 h-5" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800">Equipo Actual</h3>
                </div>

                {membersLoading ? (
                    <div className="text-sm text-slate-500 text-center py-8">Cargando usuarios...</div>
                ) : membersError ? (
                    <div className="rounded border border-yellow-200 bg-yellow-50 px-3 py-2 text-sm text-yellow-800">
                        {membersError}
                    </div>
                ) : members.length === 0 ? (
                    <div className="text-sm text-slate-500 text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                        No hay usuarios vinculados todavía.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                            <thead>
                                <tr className="text-left text-slate-500 border-b border-slate-100">
                                    <th className="px-3 py-2 font-medium">Email</th>
                                    <th className="px-3 py-2 font-medium">Rol</th>
                                    <th className="px-3 py-2 font-medium">Alta</th>
                                    <th className="px-3 py-2 font-medium">Último acceso</th>
                                    <th className="px-3 py-2 text-right font-medium">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {members.map((m) => {
                                    const date = m.createdAt ? new Date(m.createdAt) : null;
                                    const formatted = date ? date.toLocaleString() : "-";
                                    const lastAccess = m.lastAccessAt ? new Date(m.lastAccessAt).toLocaleString() : "Nunca";
                                    return (
                                        <tr key={m.userId} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-3 py-3 font-medium text-slate-900">{m.email || "(sin email)"}</td>
                                            <td className="px-3 py-3">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize ${m.role === 'manager' ? 'bg-purple-100 text-purple-800' : 'bg-slate-100 text-slate-800'}`}>
                                                    {m.role}
                                                </span>
                                            </td>
                                            <td className="px-3 py-3 text-slate-500">{formatted}</td>
                                            <td className="px-3 py-3 text-slate-500">{lastAccess}</td>
                                            <td className="px-3 py-3 text-right">
                                                <button
                                                    type="button"
                                                    className="text-sm text-rose-500 hover:text-rose-700 hover:bg-rose-50 p-1.5 rounded-md transition-colors"
                                                    onClick={() => void removeMember(m.userId, m.email)}
                                                    title="Eliminar acceso"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <div className="glass-panel p-6">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-100 rounded-lg text-slate-600">
                            <Clock className="w-5 h-5" />
                        </div>
                        <div>
                            <h4 className="text-lg font-bold text-slate-800">Historial de Accesos</h4>
                            <p className="text-xs text-slate-500">Últimos inicios de sesión en el panel.</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => void loadAccessLogs()}
                        className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors bg-white shadow-sm"
                    >
                        Actualizar Lista
                    </button>
                </div>
                {accessLogsLoading ? (
                    <div className="text-sm text-slate-500 text-center py-8">Cargando historial...</div>
                ) : accessLogsError ? (
                    <div className="rounded border border-yellow-200 bg-yellow-50 px-3 py-2 text-sm text-yellow-800">{accessLogsError}</div>
                ) : accessLogs.length === 0 ? (
                    <div className="text-sm text-slate-500 text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                        Aún no hay accesos registrados.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                            <thead>
                                <tr className="text-left text-slate-500 border-b border-slate-100">
                                    <th className="px-3 py-2 font-medium">Fecha y hora</th>
                                    <th className="px-3 py-2 font-medium">Usuario</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {accessLogs.map((log, idx) => {
                                    const date = log.accessedAt ? new Date(log.accessedAt) : null;
                                    const formatted = date ? date.toLocaleString() : "-";
                                    return (
                                        <tr key={`${log.userId}-${idx}`} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-3 py-3 text-slate-500">{formatted}</td>
                                            <td className="px-3 py-3 font-medium text-slate-900">{log.email || "(sin email)"}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
