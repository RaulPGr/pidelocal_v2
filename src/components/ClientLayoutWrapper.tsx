
"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import DayTabsClientAdjust from "@/components/DayTabsClientAdjust";

export default function ClientLayoutWrapper({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const p = pathname || "";

    // Logic matches the previous server-side check but runs reliably on client
    const isAdmin = p.startsWith("/admin") || p.startsWith("/superadmin");

    if (isAdmin) {
        return <>{children}</>;
    }

    return (
        <>
            <div className="fixed top-0 left-0 right-0 z-50 app-navbar-bg text-white shadow-lg shadow-black/10">
                <Navbar />
            </div>

            <main className="min-h-screen pt-[64px] md:pt-[72px]">
                <DayTabsClientAdjust />
                <div className="pt-0 md:pt-0">
                    {children}
                </div>
                <Footer />
            </main>
        </>
    );
}
