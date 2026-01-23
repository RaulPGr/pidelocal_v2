"use client";

import React, { useState, useRef } from "react";
import ReactCrop, { type Crop, type PixelCrop, centerCrop, makeAspectCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { Check, X, RotateCcw, ZoomIn, ZoomOut } from "lucide-react";

type Props = {
    imageSrc: string;
    aspect?: number;
    onCropComplete: (croppedBlob: Blob) => void;
    onCancel: () => void;
};

// Helper for initial centered crop
function centerAspectCrop(mediaWidth: number, mediaHeight: number, aspect: number) {
    return centerCrop(
        makeAspectCrop(
            {
                unit: '%',
                width: 90,
            },
            aspect,
            mediaWidth,
            mediaHeight,
        ),
        mediaWidth,
        mediaHeight,
    )
}

export default function ImageCropper({ imageSrc, aspect = 16 / 9, onCropComplete, onCancel }: Props) {
    const [crop, setCrop] = useState<Crop>();
    const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
    const imgRef = useRef<HTMLImageElement>(null);
    const [scale, setScale] = useState(1);
    const [rotate, setRotate] = useState(0);

    function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
        const { width, height } = e.currentTarget;
        setCrop(centerAspectCrop(width, height, aspect));
    }

    async function handleSave() {
        const image = imgRef.current;
        const crop = completedCrop;

        if (!image || !crop) return;

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const scaleX = image.naturalWidth / image.width;
        const scaleY = image.naturalHeight / image.height;

        // High quality output
        const pixelRatio = window.devicePixelRatio;
        canvas.width = crop.width * scaleX * pixelRatio;
        canvas.height = crop.height * scaleY * pixelRatio;

        ctx.scale(pixelRatio, pixelRatio);
        ctx.imageSmoothingQuality = 'high';

        const cropX = crop.x * scaleX;
        const cropY = crop.y * scaleY;

        // Draw logic
        // We'll simplisticly draw the cropped area
        ctx.drawImage(
            image,
            cropX,
            cropY,
            crop.width * scaleX,
            crop.height * scaleY,
            0,
            0,
            crop.width * scaleX,
            crop.height * scaleY,
        );

        // Convert to blob
        canvas.toBlob((blob) => {
            if (blob) onCropComplete(blob);
        }, 'image/jpeg', 0.95);
    }

    return (
        <div className="flex flex-col h-full bg-slate-900 text-white rounded-xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            {/* Toolbar */}
            <div className="flex items-center justify-between p-4 bg-slate-800 border-b border-slate-700">
                <h3 className="font-bold text-sm uppercase tracking-wider text-slate-300">Ajustar Imagen</h3>
                <div className="flex gap-2">
                    {/* Could add rotate/zoom controls here later if needed */}
                </div>
                <button onClick={onCancel} className="p-2 hover:bg-slate-700 rounded-full transition-colors">
                    <X className="w-5 h-5 text-slate-400" />
                </button>
            </div>

            {/* Editor Area */}
            <div className="flex-1 overflow-auto flex items-center justify-center p-8 bg-black/50 min-h-[400px]">
                <ReactCrop
                    crop={crop}
                    onChange={(_, percentCrop) => setCrop(percentCrop)}
                    onComplete={(c) => setCompletedCrop(c)}
                    aspect={aspect}
                    className="shadow-2xl"
                >
                    <img
                        ref={imgRef}
                        alt="Crop me"
                        src={imageSrc}
                        onLoad={onImageLoad}
                        className="max-h-[500px] object-contain"
                    />
                </ReactCrop>
            </div>

            {/* Footer Actions */}
            <div className="p-4 bg-slate-800 border-t border-slate-700 flex justify-end gap-3">
                <button
                    onClick={onCancel}
                    className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white transition-colors"
                >
                    Cancelar
                </button>
                <button
                    onClick={handleSave}
                    className="px-6 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2"
                >
                    <Check className="w-4 h-4" /> Aplicar Recorte
                </button>
            </div>
        </div>
    );
}
