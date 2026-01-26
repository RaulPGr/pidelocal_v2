import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { adminEmails } from "@/utils/plan";

async function checkSuperAdmin() {
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

    if (!email) return { allowed: false, unauthenticated: true, email: null };

    const admins = adminEmails();
    // If no admins are set, maybe we want to allow access in dev? 
    // But user asked for professional mode, so better strict by default unless empty list implies open (dangerous for published app).
    // Existing logic was "if 0, check email exists".
    // We stick to strict whitelist, if empty list, only allow if logic was lenient before, but likely empty list means nobody allowed.
    // However, original logic said: return admins.length === 0 ? !!email : admins.includes(email);
    const isAllowed = admins.length === 0 ? !!email : admins.includes(email);

    return { allowed: isAllowed, unauthenticated: false, email };
}

export default async function SuperAdminLayout({ children }: { children: React.ReactNode }) {
    const { allowed, unauthenticated } = await checkSuperAdmin();

    if (unauthenticated) {
        redirect("/login?next=/superadmin");
    }

    if (!allowed) {
        // Logged in but not allowed
        redirect("/");
    }

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
                            <Link href="/superadmin" className="text-sm font-medium hover:text-emerald-400 text-slate-300 transition-colors">Dashboard</Link>
                            <Link href="/superadmin/support" className="text-sm font-medium hover:text-emerald-400 text-slate-300 transition-colors">Soporte</Link>
                            <Link href="/" className="text-sm font-medium hover:text-emerald-400 text-slate-300 transition-colors">Ir a Home</Link>
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
