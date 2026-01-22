"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  type CartItem,
  subscribe,
  addItem as addItemLib,
  setQty,
  removeItem,
  clearCart as clearCartLib,
} from "@/lib/cart-storage";

export type { CartItem };

export type CartState = { items: CartItem[] };

const CartContext = createContext<{
  state: CartState;
  addItem: (item: any, qty?: number) => void;
  inc: (id: string | number) => void;
  dec: (id: string | number) => void;
  remove: (id: string | number) => void;
  clear: () => void;
  isOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
} | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  // Sync with lib/cart-storage
  useEffect(() => {
    const unsub = subscribe((nextItems) => {
      setItems(nextItems);
    });
    return () => unsub();
  }, []);

  const addItem = (item: any, qty = 1) => {
    // Delegate to lib
    addItemLib(item, qty);
    setIsOpen(true);
  };

  const inc = (id: string | number) => {
    const it = items.find((x) => x.id === id);
    if (it) setQty(id, it.qty + 1, it.variantKey || undefined);
  };

  const dec = (id: string | number) => {
    const it = items.find((x) => x.id === id);
    if (it) setQty(id, Math.max(0, it.qty - 1), it.variantKey || undefined);
  };

  const remove = (id: string | number) => {
    const it = items.find((x) => x.id === id);
    removeItem(id, it?.variantKey || undefined);
  };

  const clear = () => clearCartLib();

  return (
    <CartContext.Provider
      value={{
        state: { items },
        addItem,
        inc,
        dec,
        remove,
        clear,
        isOpen,
        openDrawer: () => setIsOpen(true),
        closeDrawer: () => setIsOpen(false),
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
