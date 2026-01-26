"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    ShoppingBag,
    Tags,
    UtensilsCrossed,
    ClipboardList,
    CalendarDays,
    Settings,
    BarChart3,
    LogOut,
    Menu,
    CreditCard,
    Printer,
    LifeBuoy,
    Smartphone,
    Download
} from "lucide-react";
import { useAdminAccess } from "@/context/AdminAccessContext";
import { subscriptionAllowsOrders, subscriptionAllowsReservations } from "@/lib/subscription";
import LogoutButton from "@/components/LogoutButton";
import clsx from "clsx";
import { useState, useEffect } from "react";

export default function AdminSidebar() {
    const pathname = usePathname();
    const { plan, isSuper, isTrial, trialEndsAt, businessName } = useAdminAccess();
    const [mobileOpen, setMobileOpen] = useState(false);

    const isStarter = plan === "starter";
    const isMedium = plan === "medium";

    const links = [
        { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true, locked: false },
        { href: "/admin/products", label: "Productos", icon: ShoppingBag, locked: false },
        { href: "/admin/promotions", label: "Promociones", icon: Tags, locked: false },
        { href: "/admin/options", label: "Toppings", icon: UtensilsCrossed, locked: false },
        {
            href: "/admin/orders",
            label: "Pedidos",
            icon: ClipboardList,
            locked: false,
        },
        {
            href: "/admin/reservations",
            label: "Reservas",
            icon: CalendarDays,
            locked: !subscriptionAllowsReservations(plan) && !isSuper,
            requiredPlan: "Medium"
        },
        { href: "/admin/settings", label: "Configuración", icon: Settings, locked: false },
        { href: "/admin/settings/billing", label: "Facturación", icon: CreditCard, locked: false },
        { href: "/admin/stats", label: "Estadísticas", icon: BarChart3, locked: plan !== "premium" && !isSuper, requiredPlan: "Premium" },
        { href: "/admin/marketing", label: "Marketing QR", icon: Printer, locked: false },
        { href: "/admin/help", label: "Ayuda", icon: LifeBuoy, locked: false },
    ];

    return (
        <>
            {/* Mobile Toggle */}
            <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="lg:hidden fixed bottom-6 right-6 z-50 p-4 bg-slate-900 text-white rounded-full shadow-xl hover:scale-105 transition-all"
            >
                <Menu className="h-6 w-6" />
            </button>

            {/* Sidebar Container */}
            <aside className={clsx(
                "fixed inset-y-0 left-0 z-40 w-64 bg-white/80 backdrop-blur-xl border-r border-slate-200/60 shadow-xl transition-transform duration-300 lg:translate-x-0 lg:shadow-none",
                mobileOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <div className="flex flex-col h-full">
                    {/* Header */}
                    <div className="p-6 border-b border-slate-100 flex-shrink-0">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-emerald-500/20 shrink-0">
                                {businessName ? businessName.charAt(0).toUpperCase() : 'P'}
                            </div>
                            <div className="min-w-0">
                                <h1 className="text-sm font-bold text-slate-900 tracking-tight leading-tight truncate" title={businessName || 'PideLocal'}>
                                    {businessName || 'PideLocal'}
                                </h1>
                                <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest">
                                    Manager
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
                        {links.map((link) => {
                            const isActive = link.exact
                                ? pathname === link.href
                                : pathname?.startsWith(link.href);

                            const Icon = link.icon;

                            return (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    onClick={() => setMobileOpen(false)}
                                    className={clsx(
                                        "flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative",
                                        isActive
                                            ? "bg-slate-900 text-white shadow-lg shadow-slate-900/20"
                                            : link.locked
                                                ? "text-slate-400 hover:bg-slate-50 cursor-not-allowed opacity-75"
                                                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                    )}
                                >
                                    <div className="flex items-center gap-3">
                                        <Icon className={clsx(
                                            "h-5 w-5 transition-colors",
                                            isActive ? "text-emerald-400" : link.locked ? "text-slate-300" : "text-slate-400 group-hover:text-slate-600"
                                        )} />
                                        {link.label}
                                    </div>
                                    {link.locked && (
                                        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-slate-100 rounded text-[10px] font-bold text-slate-500 uppercase tracking-wide border border-slate-200">
                                            <span className="hidden group-hover:inline">{link.requiredPlan}</span>
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                                                <path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                    )}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Footer */}
                    <div className="p-4 border-t border-slate-100 space-y-4">
                        <InstallAppButton />

                        {isTrial && trialEndsAt && (
                            <div className="pb-4 border-b border-slate-100">
                                <TrialWidget endDate={trialEndsAt} plan={plan} />
                            </div>
                        )}

                        <div className="px-3 py-2 bg-slate-50 rounded-lg border border-slate-100">
                            <p className="text-xs text-slate-500 font-medium">Plan Actual</p>
                            <p className="text-sm font-bold text-emerald-600 capitalize">{plan}</p>
                        </div>
                        <LogoutButton className="w-full justify-start pl-3 text-rose-600 hover:bg-rose-50" />

                        <div className="pt-2 flex justify-center">
                            <p className="text-[10px] text-slate-300 font-medium">
                                Powered by <span className="text-slate-400 font-bold">PideLocal</span> v2.0
                            </p>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Mobile Backdrop */}
            {mobileOpen && (
                <div
                    className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30 lg:hidden"
                    onClick={() => setMobileOpen(false)}
                />
            )}
        </>
    );
}
function TrialWidget({ endDate, plan }: { endDate: string, plan: string }) {
    const daysLeft = Math.ceil((new Date(endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    const isExpired = daysLeft <= 0;

    // Percentage for progress bar (assuming 14 days is 100%)
    const progress = Math.min(100, Math.max(0, (daysLeft / 14) * 100));

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-orange-600">
                <span>Prueba {plan}</span>
                {isExpired ? (
                    <span className="text-red-600 animate-pulse">Expirado</span>
                ) : (
                    <span>{daysLeft} días</span>
                )}
            </div>

            <div className="h-1.5 w-full bg-orange-200 rounded-full overflow-hidden">
                <div
                    className={`h-full rounded-full transition-all duration-500 ${isExpired ? 'bg-red-500 w-full' : 'bg-orange-500'}`}
                    style={{ width: isExpired ? '100%' : `${progress}%` }}
                />
            </div>

            <Link href="/admin/settings/billing" className="block w-full text-center py-2 bg-slate-900 text-white text-xs font-bold rounded-lg hover:bg-slate-800 transition-colors">
                {isExpired ? "Reactivar Cuenta" : "Suscribirse Ahora"}
            </Link>
        </div>
    )
}

function InstallAppButton() {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

    useEffect(() => {
        const handler = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e);
        };
        window.addEventListener('beforeinstallprompt', handler);
        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const handleInstall = async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            setDeferredPrompt(null);
        }
    };

    if (!deferredPrompt) return null;

    return (
        <button
            onClick={handleInstall}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-lg shadow-sm hover:shadow-md transition-all text-xs font-bold uppercase tracking-wide group"
        >
            <Download className="w-4 h-4 group-hover:scale-110 transition-transform" />
            <span>Instalar App</span>
        </button>
    );
}
