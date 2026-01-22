"use client";

import { useState } from "react";
import { useCart } from "@/context/CartContext";
import { useSubscriptionPlan } from "@/context/SubscriptionPlanContext";
import { useOrdersEnabled } from "@/context/OrdersEnabledContext";
import { subscriptionAllowsOrders } from "@/lib/subscription";

type Props = {
  product: { id: number | string; name: string; price: number; listPrice?: number; image_url?: string; category_id?: number | null };
  disabled?: boolean;
  disabledLabel?: string;
};

export default function AddToCartButton({ product, disabled, disabledLabel }: Props) {
  const plan = useSubscriptionPlan();
  const ordersEnabled = useOrdersEnabled();
  const planAllows = subscriptionAllowsOrders(plan);
  const allowOrdering = planAllows && ordersEnabled;

  const { state: { items }, addItem: addItemToCart, remove, dec } = useCart();
  const [busy, setBusy] = useState(false);

  // Calculate specific quantity for this product
  const qty = items.filter(i => i.id === product.id).reduce((acc, i) => acc + i.qty, 0);

  async function onAdd() {
    if (disabled || busy || !allowOrdering) return;
    setBusy(true);
    // Simulate tiny delay for feedback if needed, or just add
    addItemToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      listPrice: product.listPrice,
      image: product.image_url,
      category_id: product.category_id
    }, 1);

    // Reset busy after short timeout to clean up or just immediately if sync
    setTimeout(() => setBusy(false), 200);
  }

  function onDec(e: React.MouseEvent) {
    e.stopPropagation();
    const item = items.find(i => i.id === product.id);
    if (item) {
      if (item.qty <= 1) remove(item.id);
      else dec(item.id);
    }
  }

  function onInc(e: React.MouseEvent) {
    e.stopPropagation();
    onAdd();
  }

  const buttonDisabled = !!disabled || busy || !allowOrdering;
  const label = !allowOrdering
    ? (planAllows ? "Pedidos desactivados" : "No disponible tu plan")
    : disabled
      ? (disabledLabel || "Agotado")
      : busy
        ? "..."
        : "Añadir";

  if (!buttonDisabled && qty > 0) {
    return (
      <div className="mt-2 w-full flex items-center justify-between bg-white border-2 border-emerald-500 rounded-lg overflow-hidden h-9 shadow-sm animate-in fade-in zoom-in duration-300 pointer-events-auto">
        <button
          onClick={onDec}
          className="h-full px-3 flex items-center justify-center text-emerald-700 hover:bg-emerald-50 transition-colors active:bg-emerald-100"
        >
          <span className="text-lg font-bold leading-none mb-0.5">-</span>
        </button>
        <span className="font-bold text-emerald-700 text-sm select-none">{qty}</span>
        <button
          onClick={onInc}
          className="h-full px-3 flex items-center justify-center text-emerald-700 hover:bg-emerald-50 transition-colors active:bg-emerald-100"
        >
          <span className="text-lg font-bold leading-none mb-0.5">+</span>
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onAdd();
      }}
      disabled={buttonDisabled}
      className={`mt-2 w-full rounded-lg border border-transparent px-3 py-1.5 text-sm font-bold shadow-sm transition-all active:scale-95 ${buttonDisabled
        ? "bg-slate-100 text-slate-400 cursor-not-allowed"
        : "bg-slate-900 text-white hover:bg-slate-800 hover:shadow-md"
        }`}
    >
      {label}
    </button>
  );
}
