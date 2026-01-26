"use client";

import { useState } from "react";
import { updateBusinessPlan } from "./actions";
import { toast } from "sonner";
import { Check, ChevronDown, Loader2 } from "lucide-react";
import clsx from "clsx";

type Props = {
    businessId: string;
    currentPlan: string;
};

const PLANS = [
    { id: "starter", label: "Starter (Gratis)", color: "slate" },
    { id: "medium", label: "Medium", color: "blue" },
    { id: "premium", label: "Premium", color: "emerald" },
];

export default function PlanSelector({ businessId, currentPlan }: Props) {
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);

    // Close dropdown when clicking outside would be ideal, but for simplicity reusing simple absolute div
    // or we could stick to native select for robustness on mobile?
    // Let's use a native select for now to be 100% robust and easy, 
    // styled to look like a badge.

    async function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
        const newPlan = e.target.value;
        setLoading(true);
        const res = await updateBusinessPlan(businessId, newPlan);
        setLoading(false);

        if (res.success) {
            toast.success(`Plan actualizado a ${newPlan.toUpperCase()}`);
        } else {
            toast.error("Error al actualizar el plan");
        }
    }

    const activeColor = PLANS.find(p => p.id === currentPlan)?.color || "slate";

    const colorClasses: any = {
        slate: "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200",
        blue: "bg-blue-50 text-blue-700 border-blue-100 hover:bg-blue-100",
        emerald: "bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100",
    };

    return (
        <div className="relative inline-block">
            <div className={clsx(
                "relative flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide border transition-colors cursor-pointer",
                colorClasses[activeColor]
            )}>
                {loading ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                    <>
                        <span className="min-w-[60px] text-center">{currentPlan}</span>
                        <ChevronDown className="w-3 h-3 opacity-50" />
                    </>
                )}

                <select
                    value={currentPlan}
                    onChange={handleChange}
                    disabled={loading}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                >
                    {PLANS.map(p => (
                        <option key={p.id} value={p.id}>
                            {p.label}
                        </option>
                    ))}
                </select>
            </div>
        </div>
    );
}
