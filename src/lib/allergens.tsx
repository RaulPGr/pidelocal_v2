

import React from "react";
import {
    Wheat,
    Milk,
    Nut,
    Fish,
    Shell,
    Bean,
    Carrot,
} from "lucide-react";

// Safe wrapper for text icons to behave as valid React components accepting props
const TextIcon = ({ text, className, ...props }: { text: string; className?: string }) => (
    <span
        className={`font-bold text-[10px] flex items-center justify-center ${className || ''}`}
        {...props}
    >
        {text}
    </span>
);

// We wrap Lucide icons to ensure they are treated as valid components even if imported strangely,
// though usually direct usage is fine. This format standardizes everything.
export const ALLERGENS = [
    { id: "gluten", label: "Gluten", icon: Wheat },
    { id: "crustaceans", label: "Crustáceos", icon: Shell || ((p: any) => <TextIcon text="CRU" {...p} />) },
    { id: "eggs", label: "Huevos", icon: (props: any) => <TextIcon text="HUE" {...props} /> },
    { id: "fish", label: "Pescado", icon: Fish },
    { id: "peanuts", label: "Cacahuetes", icon: (props: any) => <TextIcon text="CAC" {...props} /> },
    { id: "soybeans", label: "Soja", icon: Bean || ((p: any) => <TextIcon text="SOJ" {...p} />) },
    { id: "milk", label: "Lácteos", icon: Milk },
    { id: "nuts", label: "Frutos de cáscara", icon: Nut || ((p: any) => <TextIcon text="NUEZ" {...p} />) },
    { id: "celery", label: "Apio", icon: Carrot || ((p: any) => <TextIcon text="APIO" {...p} />) }, // Carrot closest to celery
    { id: "mustard", label: "Mostaza", icon: (props: any) => <TextIcon text="MOS" {...props} /> },
    { id: "sesame", label: "Sésamo", icon: (props: any) => <TextIcon text="SES" {...props} /> },
    { id: "sulphites", label: "Sulfitos", icon: (props: any) => <TextIcon text="SO2" {...props} /> },
    { id: "lupin", label: "Altramuces", icon: (props: any) => <TextIcon text="ALT" {...props} /> },
    { id: "molluscs", label: "Moluscos", icon: (props: any) => <TextIcon text="MOL" {...props} /> },
];
