"use client";

import { useState, ReactNode } from "react";
import ReservationModal from "./ReservationModal";

type Props = {
    businessName: string;
    children: ReactNode;
    className?: string; // wrapper className
};

export default function ReservationTrigger({ businessName, children, className }: Props) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            <div className={className} onClick={() => setIsOpen(true)}>
                {children}
            </div>
            <ReservationModal
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                businessName={businessName}
            />
        </>
    );
}
