"use client";

import { useMemo, useState } from "react";
import { ALLERGENS } from "@/lib/allergens";

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
  category_id?: number | null;
  option_groups: OptionGroup[];
  image_url?: string | null;
  allergens?: string[];
};

type CartOptionSelection = {
  optionId: string;
  name: string;
  groupId: string;
  groupName: string;
  price_delta: number;
};

type Props = {
  product: Product;
  onConfirm: (selection: {
    options: CartOptionSelection[];
    totalPrice: number;
    basePrice: number;
    optionTotal: number;
    variantKey: string;
  }) => void;
  onClose: () => void;
};

function formatPrice(n: number) {
  try {
    return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(n);
  } catch {
    return `${n.toFixed(2)} EUR`;
  }
}

// Modal que permite elegir toppings/extras antes de añadir el producto al carrito.
export default function ProductOptionsModal({ product, onConfirm, onClose }: Props) {
  const basePrice = Number(product.price || 0);
  const [selected, setSelected] = useState<Record<string, Set<string>>>(() => {
    const initial: Record<string, Set<string>> = {};
    for (const group of product.option_groups) {
      if (group.selection_type === "single") {
        const min = group.min_select ?? (group.is_required !== false ? 1 : 0);
        if (min > 0 && group.options.length > 0) {
          initial[group.id] = new Set([group.options[0].id]);
        } else {
          initial[group.id] = new Set();
        }
      } else {
        initial[group.id] = new Set();
      }
    }
    return initial;
  });

  function toggle(group: OptionGroup, optionId: string) {
    setSelected((prev) => {
      const current = new Set(prev[group.id] || []);
      const selectionType = group.selection_type || "single";
      const max = group.max_select ?? (selectionType === "single" ? 1 : null);
      if (selectionType === "single") {
        if (current.has(optionId)) {
          current.clear();
        } else {
          current.clear();
          current.add(optionId);
        }
      } else {
        if (current.has(optionId)) {
          current.delete(optionId);
        } else {
          if (max && current.size >= max) return prev;
          current.add(optionId);
        }
      }
      return { ...prev, [group.id]: current };
    });
  }

  // Normalizamos límites y requisitos para simplificar la validación.
  const normalizedGroups = useMemo(() => {
    return product.option_groups.map((group) => {
      const selectionType = group.selection_type || "single";
      const min = group.min_select ?? (group.is_required !== false && selectionType === "single" ? 1 : 0);
      const max = group.max_select ?? (selectionType === "single" ? 1 : null);
      return {
        ...group,
        min,
        max,
      };
    });
  }, [product.option_groups]);

  const validation = useMemo(() => {
    const errors: Record<string, string> = {};
    for (const group of normalizedGroups) {
      const picks = selected[group.id] || new Set();
      const count = picks.size;
      if (group.min && count < group.min) {
        errors[group.id] = `Selecciona al menos ${group.min}`;
      }
      if (group.max && count > group.max) {
        errors[group.id] = `Máximo ${group.max}`;
      }
    }
    return {
      valid: Object.keys(errors).length === 0,
      errors,
    };
  }, [normalizedGroups, selected]);

  // Lista plana de las opciones seleccionadas, útil para calcular total y renderizar.
  const selectionList = useMemo(() => {
    const list: CartOptionSelection[] = [];
    for (const group of normalizedGroups) {
      const picks = selected[group.id] || new Set();
      for (const optionId of picks) {
        const option = group.options.find((opt) => opt.id === optionId);
        if (!option) continue;
        list.push({
          optionId,
          name: option.name,
          groupId: group.id,
          groupName: group.name,
          price_delta: Number(option.price_delta || 0),
        });
      }
    }
    list.sort((a, b) => (a.groupName || "").localeCompare(b.groupName || "") || a.name.localeCompare(b.name));
    return list;
  }, [normalizedGroups, selected]);

  const optionTotal = selectionList.reduce((sum, opt) => sum + opt.price_delta, 0);
  const finalPrice = basePrice + optionTotal;
  const variantKey =
    selectionList.length > 0 ? [product.id, ...selectionList.map((opt) => opt.optionId)].join("|") : String(product.id);

  function handleConfirm() {
    if (!validation.valid) return;
    onConfirm({
      options: selectionList,
      totalPrice: finalPrice,
      basePrice,
      optionTotal,
      variantKey,
    });
  }

  import { createPortal } from "react-dom";

  // ... (imports remain)

  export default function ProductOptionsModal({ product, onConfirm, onClose }: Props) {
    // ... (logic remains same)

    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    if (!mounted) return null;

    return createPortal(
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 px-3 py-6 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="max-h-full w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col">
          <div className="flex items-start gap-4 border-b px-5 py-4 bg-slate-50/50">
            {product.image_url && (
              <img src={product.image_url} alt={product.name} className="hidden h-20 w-20 rounded-xl object-cover sm:block shadow-sm" />
            )}
            <div className="flex-1">
              <h2 className="text-xl font-bold text-slate-900">{product.name}</h2>
              <p className="text-sm text-slate-500 font-medium">Precio base: {formatPrice(basePrice)}</p>
              {Array.isArray(product.allergens) && product.allergens.length > 0 && (
                <div className="flex gap-1.5 mt-2 flex-wrap">
                  {product.allergens.map((algId) => {
                    const alg = ALLERGENS.find((a) => a.id === algId);
                    if (!alg) return null;
                    const Icon = alg.icon;
                    return (
                      <div
                        key={algId}
                        title={alg.label}
                        className="text-slate-500 bg-white p-1 rounded-md border border-slate-200 shadow-sm"
                      >
                        {/* @ts-ignore */}
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors"
              type="button"
            >
              <span className="sr-only">Cerrar</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-6 space-y-6">
            {normalizedGroups.map((group) => {
              const picks = selected[group.id] || new Set();
              const error = validation.errors[group.id];
              const isSingle = group.selection_type === "single";
              return (
                <div key={group.id} className="bg-slate-50/50 rounded-xl border border-slate-200 overflow-hidden">
                  <div className="bg-slate-100/50 px-4 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-slate-900">{group.name}</h3>
                      {group.description && <p className="text-xs text-slate-500 mt-0.5">{group.description}</p>}
                    </div>
                    <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded-full ${group.is_required !== false || (group.min ?? 0) > 0 ? "bg-amber-100 text-amber-700" : "bg-slate-200 text-slate-600"}`}>
                      {group.is_required !== false || (group.min ?? 0) > 0 ? "Obligatorio" : "Opcional"}
                    </span>
                  </div>

                  <div className="p-3 space-y-2">
                    {group.options.map((opt) => {
                      const checked = picks.has(opt.id);
                      const inputId = `${group.id}-${opt.id}`;
                      return (
                        <label
                          key={opt.id}
                          htmlFor={inputId}
                          className={`group flex cursor-pointer items-center justify-between rounded-lg border p-3 transition-all ${checked
                              ? "border-emerald-500 bg-emerald-50/50 shadow-sm ring-1 ring-emerald-500/20"
                              : "border-slate-200 bg-white hover:border-emerald-300 hover:shadow-sm"
                            }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`flex items-center justify-center w-5 h-5 rounded-full border transition-all ${checked ? "bg-emerald-500 border-emerald-500 text-white" : "bg-white border-slate-300"
                              }`}>
                              {isSingle ? (
                                <div className={`w-2 h-2 rounded-full bg-white transition-opacity ${checked ? 'opacity-100' : 'opacity-0'}`} />
                              ) : (
                                <svg className={`w-3 h-3 transition-opacity ${checked ? 'opacity-100' : 'opacity-0'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                              )}
                            </div>

                            {/* Hidden actual input */}
                            {isSingle ? (
                              <input
                                type="radio"
                                id={inputId}
                                name={group.id}
                                checked={checked}
                                onChange={() => toggle(group, opt.id)}
                                className="sr-only"
                              />
                            ) : (
                              <input
                                type="checkbox"
                                id={inputId}
                                checked={checked}
                                onChange={() => toggle(group, opt.id)}
                                className="sr-only"
                              />
                            )}

                            <span className={`font-medium transition-colors ${checked ? 'text-emerald-900' : 'text-slate-700'}`}>{opt.name}</span>
                          </div>

                          <span className={`text-sm font-semibold ${checked ? 'text-emerald-700' : 'text-slate-500'}`}>
                            {opt.price_delta > 0 ? `+${formatPrice(opt.price_delta)}` : opt.price_delta < 0 ? `-${formatPrice(Math.abs(opt.price_delta))}` : ""}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                  {error && <div className="px-4 pb-3 pt-0"><p className="text-xs font-bold text-rose-500 flex items-center gap-1">⚠️ {error}</p></div>}
                </div>
              );
            })}
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t px-6 py-5 bg-white">
            <div className="flex flex-col items-start">
              <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">Total Final</span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-900">{formatPrice(finalPrice)}</span>
                {optionTotal > 0 && <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">+{formatPrice(optionTotal)} extras</span>}
              </div>
            </div>

            <div className="flex gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 sm:flex-none px-5 py-3 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={!validation.valid}
                className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-emerald-900/20 disabled:opacity-50 disabled:shadow-none transition-all hover:scale-105 active:scale-95"
              >
                Añadir al Pedido
              </button>
            </div>
          </div>
        </div>
      </div>,
      document.body
    );
  }
