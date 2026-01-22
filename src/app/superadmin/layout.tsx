import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { adminEmails } from "@/utils/plan";

async function isSuperAdmin() {
    const h = await headers();
    const proto = h.get("x-forwarded-proto") ?? "https";
    const host = h.get("host");
    const baseUrl = host ? `${proto}://${host}` : (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000");
    const cookie = h.get("cookie") ?? "";

    let email = "";
    try {
        const res = await fetch(`${baseUrl}/api/whoami`, { cache: "no-store", headers: { cookie } });
        if (res.ok) {
            const j = await res.json();
            email = String(j?.email || "").toLowerCase();
        }
    } catch { }

    const admins = adminEmails();
    // If no admins configured, allow first user (dev mode usually) or block. Safest is block if empty, but for dev maybe allow.
    // Using same logic as existing admin: if empty list, allow logic in existing admin is: "isSuper = admins.length === 0 ? !!email : admins.includes(email);"
    // BUT here we want STRICT superadmin. 
    return admins.length === 0 ? !!email : admins.includes(email);
}

export default async function SuperAdminLayout({ children }: { children: React.ReactNode }) {
    const allowed = await isSuperAdmin();
    if (!allowed) redirect("/");

    return (
        <div className="min-h-screen bg-slate-100">
            <nav className="bg-slate-900 text-white shadow-md">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16 items-center">
                        <div className="flex items-center gap-2">
                            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-teal-400">
                                PideLocal
                            </span>
                            <span className="px-2 py-1 bg-white/10 rounded text-xs font-mono text-slate-300">SUPERADMIN</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <a href="/" className="text-sm font-medium hover:text-emerald-400 text-slate-300 transition-colors">Ir a Home</a>
                        </div>
                    </div>
                </div>
            </nav>
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {children}
            </main>
        </div>
    );
}
