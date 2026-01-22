"use client";

import { useEffect, useState, useRef } from "react";
import { ArrowRight, ChevronLeft, ChevronRight, Search, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

type Section = {
    id: number | "nocat";
    name: string;
};

export default function CategoryNav({ sections }: { sections: Section[] }) {
    const [activeId, setActiveId] = useState<string | number>("all");
    const navRef = useRef<HTMLDivElement>(null);
    const router = useRouter();
    const searchParams = useSearchParams();

    // Scroll State for Arrows
    const [showLeftArrow, setShowLeftArrow] = useState(false);
    const [showRightArrow, setShowRightArrow] = useState(true);

    // Search State
    const [isOpen, setIsOpen] = useState(false);
    const initialQuery = searchParams.get("q") || "";
    const [term, setTerm] = useState(initialQuery);
    const inputRef = useRef<HTMLInputElement>(null);

    // Update arrows based on scroll position
    const checkScroll = () => {
        if (!navRef.current) return;
        const { scrollLeft, scrollWidth, clientWidth } = navRef.current;
        setShowLeftArrow(scrollLeft > 10);
        setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
    };

    useEffect(() => {
        const el = navRef.current;
        if (el) {
            el.addEventListener("scroll", checkScroll);
            checkScroll(); // Initial check
            window.addEventListener("resize", checkScroll);
        }
        return () => {
            if (el) el.removeEventListener("scroll", checkScroll);
            window.removeEventListener("resize", checkScroll);
        };
    }, []);

    const scrollNav = (direction: 'left' | 'right') => {
        if (!navRef.current) return;
        const scrollAmount = 300;
        navRef.current.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: "smooth" });
    };

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

    // Auto-scroll nav to center active element
    useEffect(() => {
        if (!navRef.current) return;
        const container = navRef.current;
        const activeBtn = container.querySelector(`[data-cat-id="${activeId}"]`) as HTMLElement;

        if (activeBtn) {
            const containerWidth = container.clientWidth;
            const btnLeft = activeBtn.offsetLeft;
            const btnWidth = activeBtn.offsetWidth;

            // Calculate center position
            const scrollLeft = btnLeft - (containerWidth / 2) + (btnWidth / 2);

            container.scrollTo({
                left: scrollLeft,
                behavior: "smooth"
            });
        }
    }, [activeId]);

    // Auto focus when opening search
    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    return (
        <div className="sticky top-[64px] md:top-[72px] z-40 bg-white/90 backdrop-blur-xl border-y border-slate-200/50 shadow-sm transition-all duration-300 supports-[backdrop-filter]:bg-white/60">
            <div className="max-w-7xl mx-auto flex items-center justify-between px-4 py-3 gap-4 relative">

                {/* Scrollable Categories container */}
                <div className={`relative flex-1 overflow-hidden transition-opacity duration-300 ${isOpen ? 'opacity-0 pointer-events-none hidden sm:block sm:opacity-100 sm:pointer-events-auto' : 'opacity-100'}`}>

                    {/* Left Blur/Arrow */}
                    <div className={`absolute left-0 top-0 bottom-0 flex items-center z-10 transition-opacity duration-300 ${showLeftArrow ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                        <div className="absolute inset-0 bg-gradient-to-r from-white via-white/80 to-transparent w-16 pointer-events-none" />
                        <button
                            onClick={() => scrollNav('left')}
                            className="relative z-20 p-1.5 rounded-full bg-white shadow-md border border-slate-100 text-slate-600 hover:text-slate-900 hover:scale-110 transition-all ml-1"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                    </div>

                    <div ref={navRef} className="flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth px-2 select-none">
                        {/* "Todo" / Top Button */}
                        <button
                            data-cat-id="all"
                            onClick={() => scrollToSection("all")}
                            className={`whitespace-nowrap px-5 py-2.5 rounded-full text-sm font-bold transition-all duration-300 transform active:scale-95 flex-shrink-0 ${activeId === "all"
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
                                    data-cat-id={s.id}
                                    onClick={() => scrollToSection(s.id)}
                                    className={`whitespace-nowrap px-5 py-2.5 rounded-full text-sm font-bold transition-all duration-300 transform active:scale-95 flex-shrink-0 ${isActive
                                        ? "bg-slate-900 text-white shadow-lg shadow-slate-900/20 scale-105"
                                        : "bg-slate-100 text-slate-600 hover:bg-white hover:text-slate-900 hover:shadow-md"
                                        }`}
                                >
                                    {s.name}
                                </button>
                            );
                        })}
                        {/* Spacer for right arrow */}
                        <div className="w-4 flex-shrink-0" />
                    </div>

                    {/* Right Blur/Arrow */}
                    <div className={`absolute right-0 top-0 bottom-0 flex items-center z-10 transition-opacity duration-300 ${showRightArrow ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                        <div className="absolute inset-0 bg-gradient-to-l from-white via-white/80 to-transparent w-16 pointer-events-none" />
                        <button
                            onClick={() => scrollNav('right')}
                            className="relative z-20 p-1.5 rounded-full bg-white shadow-md border border-slate-100 text-slate-600 hover:text-slate-900 hover:scale-110 transition-all mr-1"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Search Bar */}
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
                                onBlur={() => !term && setIsOpen(false)}
                            />
                        ) : (
                            <button
                                onClick={() => setIsOpen(true)}
                                className="p-2.5 text-slate-400 hover:bg-slate-100 rounded-full hover:text-slate-700 transition-colors"
                            >
                                <Search className="w-5 h-5" />
                            </button>
                        )}

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
