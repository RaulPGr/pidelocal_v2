export default function DashboardCard({
    title,
    value,
    icon: Icon,
    trend
}: {
    title: string;
    value: string;
    icon: any;
    trend?: string;
}) {
    return (
        <div className="glass-panel p-6 rounded-2xl relative overflow-hidden group hover:scale-[1.02] transition-transform duration-300">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wide">{title}</h3>
                <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                    <Icon className="h-5 w-5" />
                </div>
            </div>
            <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-slate-900">{value}</span>
                {trend && <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">{trend}</span>}
            </div>
        </div>
    );
}
