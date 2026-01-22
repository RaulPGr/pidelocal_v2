
import React from 'react';

type Props = {
    value: number[];
    onChange: (v: number[]) => void;
    compact?: boolean;
};

export default function WeekdaySelector({ value, onChange, compact }: Props) {
    const days = [
        { d: 1, label: 'L' }, { d: 2, label: 'M' }, { d: 3, label: 'X' },
        { d: 4, label: 'J' }, { d: 5, label: 'V' }, { d: 6, label: 'S' }, { d: 7, label: 'D' },
    ];
    function toggle(day: number, checked: boolean) {
        const set = new Set(value);
        if (checked) set.add(day); else set.delete(day);
        const arr = Array.from(set).sort((a, b) => a - b);
        onChange(arr);
    }
    return (
        <div className={compact ? 'flex gap-2' : 'flex flex-wrap gap-2'}>
            {days.map(({ d, label }) => (
                <label key={d} className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold transition-colors cursor-pointer border ${value.includes(d) ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'}`}>
                    <input type="checkbox" className="hidden" checked={value.includes(d)} onChange={(e) => toggle(d, e.target.checked)} />
                    <span>{label}</span>
                </label>
            ))}
        </div>
    );
}
