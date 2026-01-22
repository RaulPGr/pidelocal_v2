"use client";

import { useState, useRef } from "react";
import { Upload, Clock, Pizza, Check, ArrowRight, Store, Palette } from "lucide-react";
import { useRouter } from "next/navigation";

type Step = "welcome" | "identity" | "schedule" | "menu" | "finish";

export default function OnboardingWizard({ business }: { business: any }) {
    const router = useRouter();
    const [step, setStep] = useState<Step>("welcome");
    const [loading, setLoading] = useState(false);

    // Form Data
    const [name, setName] = useState(business?.name || "");
    const [color, setColor] = useState("#4f46e5"); // Default Indigo
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [logoPreview, setLogoPreview] = useState<string | null>(business?.logo_url || null);

    const [scheduleType, setScheduleType] = useState<"split" | "continuous" | null>(null);

    const [productName, setProductName] = useState("");
    const [productPrice, setProductPrice] = useState("12.00");

    const fileInputRef = useRef<HTMLInputElement>(null);

    // Helpers
    const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setLogoFile(file);
            setLogoPreview(URL.createObjectURL(file));
        }
    };

    const saveIdentity = async () => {
        setLoading(true);
        try {
            // 1. Upload Logo if changed
            if (logoFile) {
                const formData = new FormData();
                formData.append("type", "logo");
                formData.append("file", logoFile);
                await fetch("/api/admin/business", { method: "POST", body: formData });
            }

            // 2. Update Name & Color
            // Simulamos color theme guardando en theme_config (simple)
            const themeConfig = { ...business?.theme_config, primaryColor: color };

            await fetch("/api/admin/business", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name,
                    theme_config: themeConfig
                }),
            });

            setStep("schedule");
        } catch (e) {
            alert("Error guardando datos.");
        } finally {
            setLoading(false);
        }
    };

    const saveSchedule = async () => {
        if (!scheduleType) return;
        setLoading(true);
        try {
            // Horarios predefinidos simplificados
            let hours = null;
            if (scheduleType === "split") {
                // Comidas y Cenas (L-D)
                hours = {
                    monday: { open: "13:00", close: "16:00", open2: "20:00", close2: "23:30" },
                    tuesday: { open: "13:00", close: "16:00", open2: "20:00", close2: "23:30" },
                    wednesday: { open: "13:00", close: "16:00", open2: "20:00", close2: "23:30" },
                    thursday: { open: "13:00", close: "16:00", open2: "20:00", close2: "23:30" },
                    friday: { open: "13:00", close: "16:00", open2: "20:00", close2: "24:00" },
                    saturday: { open: "13:00", close: "16:00", open2: "20:00", close2: "24:00" },
                    sunday: { open: "13:00", close: "16:00", open2: "20:00", close2: "23:30" },
                };
            } else {
                // Continuo 12h a 24h
                hours = {
                    monday: { open: "12:00", close: "23:59" },
                    tuesday: { open: "12:00", close: "23:59" },
                    wednesday: { open: "12:00", close: "23:59" },
                    thursday: { open: "12:00", close: "23:59" },
                    friday: { open: "12:00", close: "23:59" },
                    saturday: { open: "12:00", close: "23:59" },
                    sunday: { open: "12:00", close: "23:59" },
                };
            }

            await fetch("/api/admin/business", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    opening_hours: JSON.stringify(hours),
                    ordering_hours: JSON.stringify(hours) // Same for now
                }),
            });

            setStep("menu");
        } catch (e) {
            alert("Error guardando horario.");
        } finally {
            setLoading(false);
        }
    };

    const saveProduct = async () => {
        if (!productName) return;
        setLoading(true);
        try {
            // 1. Create Category "Recomendados" or "Principales"
            // Check if exists first? Nah, just create one, API should handle or we create unique.
            // Actually, let's just POST to categories.
            const catRes = await fetch("/api/admin/categories", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: "Principales", sort_order: 1 }),
            });
            const catData = await catRes.json();
            const catId = catData.data?.id;

            if (catId) {
                // 2. Create Product
                await fetch("/api/admin/products", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        category_id: catId,
                        name: productName,
                        description: "Plato estrella de la casa",
                        price: parseFloat(productPrice),
                        is_active: true
                    }),
                });
            }

            setStep("finish");
            setTimeout(() => {
                window.location.href = "/admin"; // Force reload to clear wizard state (since page logic checks emptiness)
            }, 2000);
        } catch (e) {
            alert("Error creando producto.");
            setLoading(false);
        }
    };


    // UI Renders
    if (step === "finish") {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/90 backdrop-blur-sm animate-in fade-in">
                <div className="bg-white rounded-2xl p-12 text-center max-w-lg shadow-2xl scale-125 transition-transform duration-500">
                    <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl animate-bounce">
                        🎉
                    </div>
                    <h2 className="text-3xl font-bold text-slate-900 mb-2">¡Todo listo!</h2>
                    <p className="text-slate-500 text-lg">Tu restaurante ya está configurado para recibir pedidos.</p>
                    <p className="mt-8 text-sm text-slate-400">Redirigiendo al panel...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/95 backdrop-blur-md p-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                {/* Progress Bar */}
                <div className="h-1.5 bg-slate-100 w-full flex">
                    <div className={`h-full bg-indigo-600 transition-all duration-500 ${step === 'welcome' ? 'w-5' : step === 'identity' ? 'w-1/3' : step === 'schedule' ? 'w-2/3' : 'w-full'}`}></div>
                </div>

                <div className="p-8 md:p-12 overflow-y-auto flex-1">

                    {step === "welcome" && (
                        <div className="text-center space-y-8 py-8 animate-in slide-in-from-bottom-4">
                            <div className="w-20 h-20 bg-indigo-100 rounded-3xl rotate-3 mx-auto flex items-center justify-center text-indigo-600">
                                <Store className="w-10 h-10" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-slate-900 mb-3">Bienvenido a PideLocal</h1>
                                <p className="text-lg text-slate-500 max-w-md mx-auto">
                                    Vamos a configurar tu restaurante digital en menos de 2 minutos. Solo necesitamos lo básico.
                                </p>
                            </div>
                            <button
                                onClick={() => setStep("identity")}
                                className="btn-primary text-lg px-8 py-4 rounded-xl shadow-xl shadow-indigo-500/20 hover:scale-105 transition-transform"
                            >
                                Empezar Configuración <ArrowRight className="w-5 h-5 ml-2" />
                            </button>
                        </div>
                    )}

                    {step === "identity" && (
                        <div className="space-y-8 animate-in slide-in-from-right-8">
                            <div className="text-center mb-8">
                                <h2 className="text-2xl font-bold text-slate-900">Identidad del Negocio</h2>
                                <p className="text-slate-500">¿Cómo te van a reconocer tus clientes?</p>
                            </div>

                            <div className="flex flex-col items-center gap-6">
                                {/* Logo Upload */}
                                <div
                                    className="relative w-32 h-32 rounded-full bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center cursor-pointer hover:bg-slate-50 transition-colors group overflow-hidden"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    {logoPreview ? (
                                        <img src={logoPreview} className="w-full h-full object-cover" />
                                    ) : (
                                        <Upload className="w-8 h-8 text-slate-400 group-hover:text-indigo-500" />
                                    )}
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <span className="text-white text-xs font-bold">Cambiar</span>
                                    </div>
                                </div>
                                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleLogoSelect} />

                                <div className="w-full max-w-sm space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nombre del Restaurante</label>
                                        <input
                                            value={name} onChange={e => setName(e.target.value)}
                                            placeholder="Ej: Pizzería Vesubio"
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none text-lg font-bold"
                                        />
                                    </div>

                                    {/* Color Picker Simple */}
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Color de Marca</label>
                                        <div className="flex flex-wrap gap-3">
                                            {['#4f46e5', '#e91e63', '#f59e0b', '#10b981', '#1e293b'].map(c => (
                                                <button
                                                    key={c}
                                                    onClick={() => setColor(c)}
                                                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-transform hover:scale-110 ${color === c ? 'ring-2 ring-offset-2 ring-slate-900 scale-110' : ''}`}
                                                    style={{ backgroundColor: c }}
                                                >
                                                    {color === c && <Check className="w-5 h-5 text-white" />}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-6 flex justify-end">
                                <button
                                    onClick={saveIdentity}
                                    disabled={!name || loading}
                                    className="btn-primary px-8 py-3 rounded-xl disabled:opacity-50"
                                >
                                    {loading ? "Guardando..." : "Siguiente"} <ArrowRight className="w-4 h-4 ml-2" />
                                </button>
                            </div>
                        </div>
                    )}

                    {step === "schedule" && (
                        <div className="space-y-8 animate-in slide-in-from-right-8">
                            <div className="text-center mb-8">
                                <h2 className="text-2xl font-bold text-slate-900">Horario de Apertura</h2>
                                <p className="text-slate-500">Define cuándo pueden pedir tus clientes (podrás ajustarlo luego).</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <button
                                    onClick={() => setScheduleType("split")}
                                    className={`p-6 rounded-2xl border-2 text-left transition-all hover:bg-slate-50 ${scheduleType === 'split' ? 'border-indigo-600 bg-indigo-50/50 ring-1 ring-indigo-600' : 'border-slate-200'}`}
                                >
                                    <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center mb-4">
                                        <Clock className="w-6 h-6" />
                                    </div>
                                    <h3 className="font-bold text-lg text-slate-900 mb-1">Comidas y Cenas</h3>
                                    <p className="text-sm text-slate-500">Horario partido típico de hostelería.</p>
                                    <div className="mt-3 text-xs font-mono text-slate-400 bg-white p-2 rounded border border-slate-100">
                                        13:00 - 16:00<br />20:00 - 23:30
                                    </div>
                                </button>

                                <button
                                    onClick={() => setScheduleType("continuous")}
                                    className={`p-6 rounded-2xl border-2 text-left transition-all hover:bg-slate-50 ${scheduleType === 'continuous' ? 'border-indigo-600 bg-indigo-50/50 ring-1 ring-indigo-600' : 'border-slate-200'}`}
                                >
                                    <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-4">
                                        <Store className="w-6 h-6" />
                                    </div>
                                    <h3 className="font-bold text-lg text-slate-900 mb-1">Todo el día</h3>
                                    <p className="text-sm text-slate-500">Abierto ininterrumpidamente.</p>
                                    <div className="mt-3 text-xs font-mono text-slate-400 bg-white p-2 rounded border border-slate-100">
                                        12:00 - 00:00
                                    </div>
                                </button>
                            </div>

                            <div className="pt-6 flex justify-end">
                                <button
                                    onClick={saveSchedule}
                                    disabled={!scheduleType || loading}
                                    className="btn-primary px-8 py-3 rounded-xl disabled:opacity-50"
                                >
                                    {loading ? "Guardando..." : "Siguiente"} <ArrowRight className="w-4 h-4 ml-2" />
                                </button>
                            </div>
                        </div>
                    )}

                    {step === "menu" && (
                        <div className="space-y-8 animate-in slide-in-from-right-8">
                            <div className="text-center mb-8">
                                <h2 className="text-2xl font-bold text-slate-900">Tu Primer Plato</h2>
                                <p className="text-slate-500">Crea el producto estrella de tu carta (podrás añadir más luego).</p>
                            </div>

                            <div className="max-w-sm mx-auto space-y-6">
                                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col items-center">
                                    <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4">
                                        <Pizza className="w-10 h-10" />
                                    </div>

                                    <div className="w-full space-y-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nombre del Plato</label>
                                            <input
                                                autoFocus
                                                value={productName} onChange={e => setProductName(e.target.value)}
                                                placeholder="Ej: Pizza Margarita"
                                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none text-lg font-bold text-center bg-white"
                                            />
                                        </div>
                                        <div className="flex gap-4 items-center justify-center">
                                            <div className="w-32">
                                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Precio (€)</label>
                                                <input
                                                    type="number"
                                                    value={productPrice} onChange={e => setProductPrice(e.target.value)}
                                                    step="0.50"
                                                    className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none font-mono text-center"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-6 flex justify-end">
                                <button
                                    onClick={saveProduct}
                                    disabled={!productName || loading}
                                    className="btn-primary px-8 py-3 rounded-xl disabled:opacity-50 w-full md:w-auto"
                                >
                                    {loading ? "Creando y Finalizando..." : "Finalizar Configuración"} <Check className="w-4 h-4 ml-2" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
