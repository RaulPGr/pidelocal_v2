"use client";

import React, { useState, useRef } from "react";
import Cropper from "react-easy-crop";
import { Check, X, GalleryHorizontalEnd } from "lucide-react";

type Props = {
    imageSrc: string;
    aspect?: number;
    onCropComplete: (croppedBlob: Blob) => void;
    onCancel: () => void;
};

export default function ImageCropper({ imageSrc, aspect = 16 / 9, onCropComplete, onCancel }: Props) {
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    const onCropChange = (crop: { x: number; y: number }) => {
        setCrop(crop);
    };

    const onZoomChange = (zoom: number) => {
        setZoom(zoom);
    };

    const onCropCompleteInternal = (_: any, croppedAreaPixels: any) => {
        setCroppedAreaPixels(croppedAreaPixels);
    };

    async function createImage(url: string): Promise<HTMLImageElement> {
        return new Promise((resolve, reject) => {
            const image = new Image();
            image.addEventListener("load", () => resolve(image));
            image.addEventListener("error", (error) => reject(error));
            image.setAttribute("crossOrigin", "anonymous");
            image.src = url;
        });
    }

    async function getCroppedImg(imageSrc: string, pixelCrop: any): Promise<Blob | null> {
        const image = await createImage(imageSrc);
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        if (!ctx) return null;

        // Set width/height of canvas to match the cropped area
        canvas.width = pixelCrop.width;
        canvas.height = pixelCrop.height;

        // Draw the cropped image onto the canvas
        // This cuts out the unwanted parts
        ctx.drawImage(
            image,
            pixelCrop.x,
            pixelCrop.y,
            pixelCrop.width,
            pixelCrop.height,
            0,
            0,
            pixelCrop.width,
            pixelCrop.height
        );

        // As a blob
        return new Promise((resolve, reject) => {
            canvas.toBlob((blob) => {
                if (blob) resolve(blob);
                else reject(new Error("Canvas is empty"));
            }, "image/jpeg", 0.95);
        });
    }

    const handleSave = async () => {
        if (!croppedAreaPixels) return;
        setLoading(true);
        try {
            const blob = await getCroppedImg(imageSrc, croppedAreaPixels);
            if (blob) {
                onCropComplete(blob);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-slate-900 text-white rounded-xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            {/* Toolbar */}
            <div className="flex items-center justify-between p-4 bg-slate-800 border-b border-slate-700 z-10">
                <h3 className="font-bold text-sm uppercase tracking-wider text-slate-300 flex items-center gap-2">
                    <GalleryHorizontalEnd className="w-4 h-4 text-emerald-500" />
                    Ajustar Imagen
                </h3>
                <button onClick={onCancel} className="p-2 hover:bg-slate-700 rounded-full transition-colors">
                    <X className="w-5 h-5 text-slate-400" />
                </button>
            </div>

            {/* Editor Area */}
            <div className="flex-1 relative bg-black/50 min-h-[400px]">
                <Cropper
                    image={imageSrc}
                    crop={crop}
                    zoom={zoom}
                    aspect={aspect}
                    onCropChange={onCropChange}
                    onZoomChange={onZoomChange}
                    onCropComplete={onCropCompleteInternal}
                    showGrid={true}
                    classes={{
                        containerClassName: "bg-slate-900/50"
                    }}
                />
            </div>

            {/* Footer Actions */}
            <div className="p-4 bg-slate-800 border-t border-slate-700 flex flex-col gap-4">

                {/* Custom ZOOM Slider */}
                <div className="flex items-center gap-4 px-2">
                    <span className="text-xs font-bold text-slate-400 uppercase w-12">Zoom</span>
                    <input
                        type="range"
                        value={zoom}
                        min={1}
                        max={3}
                        step={0.1}
                        aria-labelledby="Zoom"
                        onChange={(e) => setZoom(Number(e.target.value))}
                        className="w-full h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-emerald-500 hover:accent-emerald-400"
                    />
                    <span className="text-xs font-mono text-slate-500 w-8 text-right">{Math.round((zoom - 1) * 100)}%</span>
                </div>

                <div className="flex justify-end gap-3 pt-2 border-t border-slate-700/50">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className="px-6 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Check className="w-4 h-4" />
                        {loading ? 'Procesando...' : 'Aplicar Recorte'}
                    </button>
                </div>
            </div>
        </div>
    );
}
