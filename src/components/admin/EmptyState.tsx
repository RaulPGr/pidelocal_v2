import { LucideIcon } from 'lucide-react';
import React from 'react';

type Props = {
    icon: LucideIcon;
    title: string;
    description: string;
    action?: React.ReactNode;
    compact?: boolean;
};

export default function EmptyState({ icon: Icon, title, description, action, compact }: Props) {
    return (
        <div className={`flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50 ${compact ? 'py-12' : 'py-20'} animate-in fade-in zoom-in-95 duration-500`}>
            <div className={`bg-white p-4 rounded-full shadow-sm mb-4 ${compact ? 'p-3' : 'p-4'}`}>
                <Icon className={`text-slate-300 ${compact ? 'w-8 h-8' : 'w-12 h-12'}`} />
            </div>
            <h3 className={`font-bold text-slate-900 ${compact ? 'text-lg' : 'text-xl'}`}>{title}</h3>
            <p className="text-slate-500 mt-2 max-w-sm mx-auto mb-6">{description}</p>
            {action && (
                <div className="mt-2">
                    {action}
                </div>
            )}
        </div>
    );
}
