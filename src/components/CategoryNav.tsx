"use client";

import { useEffect, useState, useRef } from "react";
// import { cn } from "@/lib/utils"; 
import { ArrowRight, Search } from "lucide-react";

type Section = {
    id: number | "nocat";
    name: string;
};

export default function CategoryNav({ sections }: { sections: Section[] }) {
    const [activeId, setActiveId] = useState<string | number>("all");
    const navRef = useRef<HTMLDivElement>(null);

    // Smooth scroll function
    function scrollToSection(id: string | number) {
        if (id === "all") {
            window.scrollTo({ top: 0, behavior: "smooth" });
            setActiveId("all");
            return;
        }
        const el = document.getElementById(`cat-${id}`);
        if (el) {
            // Offset for sticky header (approx 80px)
            const y = el.getBoundingClientRect().top + window.pageYOffset - 140;
            window.scrollTo({ top: y, behavior: "smooth" });
            setActiveId(id);
        }
    }

    // Intersection Observer to update active pill on scroll
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        // Extract ID from "cat-X"
                        const id = entry.target.id.replace("cat-", "");
                        setActiveId(id === "nocat" ? "nocat" : Number(id));

                        // Allow "Todo" to be active if at very top
                        if (window.scrollY < 100) setActiveId("all");
                    }
                });
            },
            { rootMargin: "-150px 0px -50% 0px" } // Trigger when section hits top part of screen
        );

        sections.forEach((s) => {
            const el = document.getElementById(`cat-${s.id}`);
            if (el) observer.observe(el);
        });

        return () => observer.disconnect();
    }, [sections]);

    return (
        <div className="sticky top-[64px] md:top-[72px] z-40 bg-white/90 backdrop-blur-xl border-y border-slate-200/50 shadow-sm transition-all duration-300 supports-[backdrop-filter]:bg-white/60">
            <div className="max-w-7xl mx-auto flex items-center justify-between px-4 py-3 gap-4">
                {/* Scrollable Categories container */}
                <div ref={navRef} className="flex items-center gap-2 overflow-x-auto no-scrollbar mask-gradient-right flex-1 select-none">
                    {/* "Todo" / Top Button */}
                    <button
                        onClick={() => scrollToSection("all")}
                        className={`whitespace-nowrap px-5 py-2.5 rounded-full text-sm font-bold transition-all duration-300 transform active:scale-95 ${activeId === "all"
                            ? "bg-slate-900 text-white shadow-lg shadow-slate-900/20 scale-105"
                            : "bg-slate-100 text-slate-600 hover:bg-white hover:text-slate-900 hover:shadow-md"
                            }`}
                    >
                        Todo
                    </button>

                    {/* Category Sections */}
                    {sections.map((s) => {
                        const isActive = activeId === s.id;
                        return (
                            <button
                                key={String(s.id)}
                                onClick={() => scrollToSection(s.id)}
                                className={`whitespace-nowrap px-5 py-2.5 rounded-full text-sm font-bold transition-all duration-300 transform active:scale-95 ${isActive
                                    ? "bg-slate-900 text-white shadow-lg shadow-slate-900/20 scale-105"
                                    : "bg-slate-100 text-slate-600 hover:bg-white hover:text-slate-900 hover:shadow-md"
                                    }`}
                            >
                                {s.name}
                            </button>
                        );
                    })}
                </div>

                {/* Right Actions (Hidden on tiny screens) */}
                <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-slate-200">
                    <div className="p-2 text-slate-400">
                        <Search className="w-5 h-5" />
                    </div>
                </div>
            </div>
        </div>
    );
}
