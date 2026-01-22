"use client";

import { useState } from "react";
import AddToCartButton from "@/components/AddToCartButton";
import { useCart } from "@/context/CartContext";
import ProductOptionsModal from "@/components/ProductOptionsModal";
import { addItem } from "@/lib/cart-storage";

type OptionGroup = {
  id: string;
  name: string;
  description?: string | null;
  selection_type: "single" | "multiple";
  min_select?: number | null;
  max_select?: number | null;
  is_required?: boolean;
  options: Array<{
    id: string;
    name: string;
    price_delta: number;
  }>;
};

type Product = {
  id: number | string;
  name: string;
  price: number;
  listPrice?: number;
  image_url?: string | null;
  category_id?: number | null;
  option_groups?: OptionGroup[];
  allergens?: string[];
};

type Props = {
  product: Product;
  disabled?: boolean;
  disabledLabel?: string;
};

// Botón "Añadir al carrito" que abre el modal de toppings cuando el producto los tiene.
export default function AddToCartWithOptions({ product, disabled, disabledLabel }: Props) {
  const { state: { items } } = useCart();
  const qty = items.filter(i => i.id === product.id).reduce((acc, i) => acc + i.qty, 0);

  const hasOptions = Array.isArray(product.option_groups) && product.option_groups.length > 0;
  const [open, setOpen] = useState(false);

  if (!hasOptions) {
    return (
      <AddToCartButton
        product={{
          id: product.id,
          name: product.name,
          price: product.price,
          listPrice: product.listPrice,
          image_url: product.image_url || undefined,
          category_id: product.category_id ?? null,
        }}
        disabled={disabled}
        disabledLabel={disabledLabel}
      />
    );
  }

  // El modal devuelve la selección y aquí la persistimos en el almacenamiento del carrito.
  function handleConfirm(payload: { options: any[]; totalPrice: number; basePrice: number; optionTotal: number; variantKey: string }) {
    addItem(
      {
        id: product.id,
        name: product.name,
        price: payload.totalPrice,
        listPrice: product.listPrice ? product.listPrice + payload.optionTotal : undefined, // listPrice includes options too for fair comparison
        image: product.image_url || undefined,
        category_id: product.category_id ?? null,
        options: payload.options,
        variantKey: payload.variantKey,
        basePrice: payload.basePrice,
        optionTotal: payload.optionTotal,
      },
      1
    );
    setOpen(false);
  }

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen(true);
        }}
        disabled={disabled}
        className={`mt-2 w-full rounded-lg border border-transparent px-3 py-1.5 text-sm font-bold shadow-sm transition-all active:scale-95 flex items-center justify-center gap-2 ${disabled ? "bg-slate-100 text-slate-400 cursor-not-allowed" : "bg-slate-900 text-white hover:bg-slate-800 hover:shadow-md"
          }`}
      >
        <span>Personalizar</span>
        {qty > 0 && (
          <span className="flex items-center justify-center bg-emerald-500 text-white text-[10px] h-5 min-w-[20px] px-1 rounded-full shadow-sm">
            {qty}
          </span>
        )}
      </button>
      {open && (
        <ProductOptionsModal
          product={{
            id: product.id,
            name: product.name,
            price: product.price,
            category_id: product.category_id ?? null,
            option_groups: product.option_groups || [],
            image_url: product.image_url,
            allergens: product.allergens,
          }}
          onClose={() => setOpen(false)}
          onConfirm={handleConfirm}
        />
      )}
    </>
  );
}
