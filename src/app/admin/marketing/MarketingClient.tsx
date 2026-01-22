"use client";

import { useState, useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { Printer, Download, Share2, Globe, UtensilsCrossed } from "lucide-react";
import { toast } from "sonner";
import clsx from "clsx";

interface MarketingClientProps {
    tenantName: string;
    tenantSlug: string;
    logoUrl?: string; // Optional
}

export default function MarketingClient({ tenantName, tenantSlug, logoUrl }: MarketingClientProps) {
    const flyerRef = useRef<HTMLDivElement>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [target, setTarget] = useState<"home" | "menu">("menu");

    const baseUrl = `https://${tenantSlug}.pidelocal.es`;
    const qrUrl = target === "menu" ? `${baseUrl}/menu` : baseUrl;

    const downloadPDF = async () => {
        if (!flyerRef.current) return;
        setIsGenerating(true);
        const toastId = toast.loading("Generando cartel...");

        try {
            // 1. Capture the flyer div as a canvas
            const canvas = await html2canvas(flyerRef.current, {
                scale: 4, // High resolution
                useCORS: true, // Allow loading remote images (like logos)
                backgroundColor: "#ffffff",
            });

            // 2. Create PDF (A4 size)
            const imgData = canvas.toDataURL("image/png");
            const pdf = new jsPDF("p", "mm", "a4");
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();

            // 3. Add image to PDF (fit width)
            pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);

            // 4. Save
            const fileName = target === "menu" ? `cartel-carta-${tenantSlug}.pdf` : `cartel-web-${tenantSlug}.pdf`;
            pdf.save(fileName);
            toast.success("¡Cartel descargado!", { id: toastId });
        } catch (error) {
            console.error("PDF Error:", error);
            toast.error("Error al generar el PDF", { id: toastId });
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-8">

                {/* CONTROLS */}
                <div className="space-y-6 lg:w-1/3">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900">Marketing & Difusión</h2>
                        <p className="text-slate-500 mt-1">
                            Genera carteles personalizados para tu negocio.
                            Ideal para pegar en mesas, escaparates o incluir en tus repartos.
                        </p>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                        <label className="text-sm font-bold text-slate-900 uppercase tracking-wider block">
                            ¿A dónde lleva el QR?
                        </label>

                        <div className="grid grid-cols-1 gap-3">
                            <button
                                onClick={() => setTarget("menu")}
                                className={clsx(
                                    "flex items-center gap-3 p-4 rounded-xl border text-left transition-all",
                                    target === "menu"
                                        ? "border-indigo-600 bg-indigo-50 ring-1 ring-indigo-600"
                                        : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                                )}
                            >
                                <div className={clsx(
                                    "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                                    target === "menu" ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-400"
                                )}>
                                    <UtensilsCrossed className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className={clsx("font-bold", target === "menu" ? "text-indigo-900" : "text-slate-700")}>
                                        Directo a la Carta
                                    </p>
                                    <p className="text-xs text-slate-500">Recomendado para mesas (QR en mesa).</p>
                                </div>
                            </button>

                            <button
                                onClick={() => setTarget("home")}
                                className={clsx(
                                    "flex items-center gap-3 p-4 rounded-xl border text-left transition-all",
                                    target === "home"
                                        ? "border-indigo-600 bg-indigo-50 ring-1 ring-indigo-600"
                                        : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                                )}
                            >
                                <div className={clsx(
                                    "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                                    target === "home" ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-400"
                                )}>
                                    <Globe className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className={clsx("font-bold", target === "home" ? "text-indigo-900" : "text-slate-700")}>
                                        Página Principal
                                    </p>
                                    <p className="text-xs text-slate-500">Para redes sociales o escaparate.</p>
                                </div>
                            </button>
                        </div>
                    </div>

                    <button
                        onClick={downloadPDF}
                        disabled={isGenerating}
                        className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white px-6 py-4 rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isGenerating ? (
                            <>Generando...</>
                        ) : (
                            <>
                                <Download className="w-5 h-5" />
                                Descargar PDF ({target === "menu" ? "Carta" : "Web"})
                            </>
                        )}
                    </button>
                </div>

                {/* PREVIEW CONTAINER */}
                <div className="flex-1 flex justify-center bg-slate-100 p-8 rounded-2xl border border-slate-200 overflow-hidden min-h-[600px] items-center">
                    <div
                        ref={flyerRef}
                        className="relative bg-white text-center shadow-2xl flex flex-col items-center justify-between overflow-hidden"
                        style={{
                            width: "595px",
                            height: "842px", // A4 Aspect Ratio
                            padding: "60px 40px",
                            transform: "scale(0.65)", // Visual scale for desktop preview
                            transformOrigin: "center center",
                        }}
                    >
                        {/* Background decoration */}
                        <div className="absolute top-0 left-0 w-full h-4 bg-indigo-600"></div>
                        <div className="absolute bottom-0 left-0 w-full h-4 bg-indigo-600"></div>

                        {/* HEADER */}
                        <div className="mt-8 space-y-6">
                            {logoUrl ? (
                                <img
                                    src={logoUrl}
                                    alt={tenantName}
                                    className="h-32 w-auto mx-auto object-contain"
                                    crossOrigin="anonymous"
                                />
                            ) : (
                                <h1 className="text-5xl font-black text-slate-900 tracking-tight uppercase leading-none">
                                    {tenantName}
                                </h1>
                            )}
                        </div>

                        {/* MAIN CONTENT */}
                        <div className="flex-1 flex flex-col justify-center items-center space-y-8 w-full">
                            <div className="bg-slate-900 text-white px-8 py-3 rounded-full text-xl font-bold tracking-wider uppercase shadow-xl">
                                {target === 'menu' ? '¡Mira nuestra Carta!' : '¡Pide aquí sin esperas!'}
                            </div>

                            <div className="p-6 bg-white border-4 border-slate-900 rounded-3xl shadow-xl">
                                <QRCodeSVG
                                    value={qrUrl}
                                    size={280}
                                    level="H"
                                    includeMargin={true}
                                />
                            </div>

                            <div className="flex flex-col items-center gap-2">
                                <p className="text-slate-500 text-lg font-medium uppercase tracking-widest">Escanea el código con tu móvil</p>
                                <div className="w-16 h-1 bg-slate-200 rounded-full"></div>
                            </div>
                        </div>

                        {/* FOOTER */}
                        <div className="mb-8 space-y-2">
                            <p className="text-3xl font-bold text-slate-800">
                                {tenantSlug}.pidelocal.es{target === 'menu' ? '/menu' : ''}
                            </p>
                            <p className="text-slate-400 text-sm font-medium">Powered by PideLocal</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
