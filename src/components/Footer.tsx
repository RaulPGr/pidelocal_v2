
import { ShieldCheck } from "lucide-react";

export default function Footer() {
    return (
        <footer className="mt-10 border-t border-slate-200 bg-white/60">
            <div className="mx-auto max-w-6xl p-4 md:p-6 flex flex-col items-center justify-between gap-4 text-xs text-slate-500">
                {/* Trust Badge */}
                <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-full border border-slate-100 shadow-sm">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="font-medium">Pagos 100% seguros con <span className="text-[#635BFF] font-bold">stripe</span></span>
                </div>

                <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="inline-flex items-center gap-2">
                        <span>Web creada con</span>
                        <a href="https://pidelocal.es" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-medium text-slate-600 hover:text-emerald-700">
                            <img src="/images/pidelocal.png" alt="PideLocal" className="h-4 w-4" />
                            <span>PideLocal</span>
                        </a>
                    </div>
                    <div className="inline-flex items-center gap-4">
                        <a href="/legal/notice" className="hover:underline">Aviso Legal</a>
                        <a href="/legal/privacy" className="hover:underline">Privacidad</a>
                        <a href="/legal/cookies" className="hover:underline">Cookies</a>
                        <a href="/legal/terms" className="hover:underline">Términos</a>
                    </div>
                </div>
            </div>
        </footer>
    );
}
