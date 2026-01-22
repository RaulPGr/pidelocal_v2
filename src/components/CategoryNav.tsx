"use client";

import { useEffect, useState, useRef } from "react";
// import { cn } from "@/lib/utils"; 
import { ArrowRight, Search, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useDebounce } from "use-debounce"; // We might not have this, better use custom debounce or simple timeout

type Section = {
    id: number | "nocat";
    name: string;
};

export default function CategoryNav({ sections }: { sections: Section[] }) {
    const [activeId, setActiveId] = useState<string | number>("all");
    const navRef = useRef<HTMLDivElement>(null);
    const router = useRouter();
    const searchParams = useSearchParams();

    // Search State
    const [isOpen, setIsOpen] = useState(false);
    const initialQuery = searchParams.get("q") || "";
    const [term, setTerm] = useState(initialQuery);
    const inputRef = useRef<HTMLInputElement>(null);

    // Debounce Search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (term === initialQuery) return;

            const params = new URLSearchParams(searchParams.toString());
            if (term) {
                params.set("q", term);
            } else {
                params.delete("q");
            }
            router.replace(`?${params.toString()}`, { scroll: false });
        }, 300);

        return () => clearTimeout(timer);
    }, [term, router, searchParams, initialQuery]);

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

    // Auto focus when opening search
    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    return (
        <div className="sticky top-[64px] md:top-[72px] z-40 bg-white/90 backdrop-blur-xl border-y border-slate-200/50 shadow-sm transition-all duration-300 supports-[backdrop-filter]:bg-white/60">
            <div className="max-w-7xl mx-auto flex items-center justify-between px-4 py-3 gap-4">

                {/* Scrollable Categories container (Hidden if search is mobile-active?) No, let's keep it but maybe shrink it */}
                <div ref={navRef} className={`flex items-center gap-2 overflow-x-auto no-scrollbar mask-gradient-right flex-1 select-none transition-opacity duration-300 ${isOpen ? 'opacity-0 pointer-events-none hidden sm:flex sm:opacity-100 sm:pointer-events-auto' : 'opacity-100'}`}>
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

                {/* Search Bar - Replaces nav on mobile when open, or sits on right on desktop */}
                <div className={`flex items-center ${isOpen ? 'flex-1 sm:flex-none' : ''}`}>
                    <div className={`relative flex items-center transition-all duration-300 ${isOpen ? 'w-full sm:w-64' : 'w-10'}`}>
                        {isOpen ? (
                            <input
                                ref={inputRef}
                                type="text"
                                value={term}
                                onChange={(e) => setTerm(e.target.value)}
                                placeholder="Buscar plato..."
                                className="w-full bg-slate-100 border border-slate-200 rounded-full px-4 py-2 pl-10 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all font-medium"
                                onBlur={() => !term && setIsOpen(false)} // Optional: close on blur if empty
                            />
                        ) : (
                            <button
                                onClick={() => setIsOpen(true)}
                                className="p-2.5 text-slate-400 hover:bg-slate-100 rounded-full hover:text-slate-700 transition-colors"
                            >
                                <Search className="w-5 h-5" />
                            </button>
                        )}

                        {/* Icons */}
                        <div className="absolute left-0 top-0 h-full flex items-center pl-3 pointer-events-none">
                            {isOpen && <Search className="w-4 h-4 text-slate-400" />}
                        </div>

                        {isOpen && (
                            <button
                                onClick={() => {
                                    setIsOpen(false);
                                    setTerm("");
                                }}
                                className="absolute right-0 top-0 h-full flex items-center pr-3 text-slate-400 hover:text-slate-600"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}
