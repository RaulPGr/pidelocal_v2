"use client";

import { useCart } from "@/context/CartContext";
import { X, Trash2, ShoppingBag, Plus, Minus, ShieldCheck } from "lucide-react";
import { useEffect, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function CartDrawer() {
    const { state, remove: removeItem, inc, dec, clear: clearCart, isOpen, closeDrawer } = useCart();
    const drawerRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    // Close on Escape key
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === "Escape") closeDrawer();
        };
        if (isOpen) window.addEventListener("keydown", handleEsc);
        return () => window.removeEventListener("keydown", handleEsc);
    }, [isOpen, closeDrawer]);

    // Prevent scrolling when drawer is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
        return () => { document.body.style.overflow = ""; };
    }, [isOpen]);

    const items = state?.items || [];
    const total = items.reduce((acc: number, item: any) => acc + (item.price * item.qty), 0);
    const formatPrice = (n: number) => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(n);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
                onClick={closeDrawer}
            />

            {/* Drawer Panel */}
            <div
                ref={drawerRef}
                className="relative h-full w-full max-w-md bg-white/90 backdrop-blur-xl shadow-2xl transition-transform duration-300 animate-in slide-in-from-right sm:max-w-lg flex flex-col border-l border-white/20"
            >
                {/* Header */}
                <div className="flex items-center justify-between border-b px-6 py-4 bg-white/80 backdrop-blur-md sticky top-0 z-10">
                    <h2 className="text-xl font-heading font-semibold text-slate-900 flex items-center gap-2">
                        <ShoppingBag className="h-5 w-5 text-emerald-600" />
                        Tu Pedido
                    </h2>
                    <button
                        onClick={closeDrawer}
                        className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>

                {/* Items List */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {items.length === 0 ? (
                        <div className="flex h-full flex-col items-center justify-center text-center space-y-4 text-slate-500">
                            <ShoppingBag className="h-16 w-16 opacity-20" />
                            <p className="text-lg font-medium">Tu carrito está vacío</p>
                            <button
                                onClick={closeDrawer}
                                className="text-emerald-600 hover:underline font-medium"
                            >
                                Explorar el menú
                            </button>
                        </div>
                    ) : (
                        <ul className="space-y-6">
                            {items.map((item: any) => (
                                <li key={item.id} className="flex gap-4">
                                    {/* Image (if available) */}
                                    <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg border border-slate-100 bg-slate-50 relative">
                                        {item.image_url ? (
                                            <img
                                                src={item.image_url}
                                                alt={item.name}
                                                className="h-full w-full object-cover"
                                            />
                                        ) : (
                                            <div className="h-full w-full flex items-center justify-center text-xs text-slate-400">Sin foto</div>
                                        )}
                                    </div>

                                    <div className="flex flex-1 flex-col justify-between">
                                        <div>
                                            <div className="flex justify-between items-start">
                                                <h3 className="text-base font-medium text-slate-900 line-clamp-2">{item.name}</h3>
                                                <p className="ml-4 text-sm font-semibold text-slate-900">{formatPrice(item.price * item.qty)}</p>
                                            </div>
                                            {/* Options/Modifiers would go here if we tracked them properly in display */}
                                        </div>

                                        <div className="flex items-center justify-between mt-2">
                                            <div className="flex items-center rounded-lg border border-slate-200 shadow-sm">
                                                <button
                                                    onClick={() => item.qty > 1 ? dec(item.id) : removeItem(item.id)}
                                                    className="p-1 hover:bg-slate-100 text-slate-600 transition-colors"
                                                >
                                                    <Minus className="h-4 w-4" />
                                                </button>
                                                <span className="w-8 text-center text-sm font-medium text-slate-900">{item.qty}</span>
                                                <button
                                                    onClick={() => inc(item.id)}
                                                    className="p-1 hover:bg-slate-100 text-slate-600 transition-colors"
                                                >
                                                    <Plus className="h-4 w-4" />
                                                </button>
                                            </div>
                                            <button
                                                onClick={() => removeItem(item.id)}
                                                className="text-xs text-rose-600 hover:text-rose-700 font-medium flex items-center gap-1 hover:bg-rose-50 px-2 py-1 rounded"
                                            >
                                                <Trash2 className="h-3 w-3" /> Eliminar
                                            </button>
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {/* Footer */}
                {items.length > 0 && (
                    <div className="border-t bg-slate-50 p-6 space-y-4">
                        <div className="flex items-center justify-between text-base font-medium text-slate-900">
                            <p>Subtotal</p>
                            <p>{formatPrice(total)}</p>
                        </div>
                        <p className="text-xs text-slate-500 text-center">Impuestos y gastos de envío calculados en el checkout</p>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={clearCart}
                                className="rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50 hover:text-slate-900"
                            >
                                Vaciar
                            </button>
                            <button
                                onClick={() => { closeDrawer(); router.push('/cart'); }}
                                className="rounded-lg bg-emerald-600 px-4 py-3 text-sm font-bold text-white shadow-md hover:bg-emerald-700 active:scale-95 transition-transform"
                            >
                                Tramitar pedido
                            </button>
                        </div>
                        <div className="flex items-center justify-center gap-2 pt-2 text-xs text-slate-400 font-medium">
                            <ShieldCheck className="h-4 w-4 text-emerald-500" />
                            <span>Pagos 100% Seguros vía</span>
                            <span className="font-bold text-[#635BFF]">stripe</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
