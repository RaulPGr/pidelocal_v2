import clsx from "clsx";
import { ALLERGENS } from "@/lib/allergens";

type Props = {
    value: string[];
    onChange: (val: string[]) => void;
    className?: string;
};

export default function AllergenSelector({ value = [], onChange, className }: Props) {

    function toggle(id: string) {
        if (value.includes(id)) {
            onChange(value.filter(x => x !== id));
        } else {
            onChange([...value, id]);
        }
    }

    return (
        <div className={clsx("flex flex-wrap gap-1", className)}>
            {ALLERGENS.map(al => {
                const Icon = al.icon;
                const active = value.includes(al.id);
                return (
                    <button
                        key={al.id}
                        type="button"
                        onClick={() => toggle(al.id)}
                        title={al.label}
                        className={clsx(
                            "p-1.5 rounded-md border transition-all flex items-center justify-center",
                            active
                                ? "bg-rose-50 border-rose-200 text-rose-600 shadow-sm"
                                : "bg-white border-slate-200 text-slate-400 hover:border-slate-300 hover:text-slate-600"
                        )}
                    >
                        {/* @ts-ignore */}
                        <Icon className="w-4 h-4" />
                    </button>
                );
            })}
        </div>
    );
}
