"use client";

import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import ReservationModal from "@/components/ReservationModal";

type ReservationContextType = {
    openReservationModal: () => void;
    closeReservationModal: () => void;
};

const ReservationContext = createContext<ReservationContextType | undefined>(undefined);

export function ReservationProvider({ children }: { children: ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);
    const [businessName, setBusinessName] = useState("Restaurante");

    // Fetch business name for the modal
    useEffect(() => {
        fetch("/api/settings/home")
            .then((res) => res.json())
            .then((j) => {
                if (j.ok && j.data?.business?.name) {
                    setBusinessName(j.data.business.name);
                }
            })
            .catch(() => { });
    }, []);

    const openReservationModal = () => setIsOpen(true);
    const closeReservationModal = () => setIsOpen(false);

    return (
        <ReservationContext.Provider value={{ openReservationModal, closeReservationModal }}>
            {children}
            <ReservationModal
                isOpen={isOpen}
                onClose={closeReservationModal}
                businessName={businessName}
            />
        </ReservationContext.Provider>
    );
}

export function useReservation() {
    const context = useContext(ReservationContext);
    if (context === undefined) {
        throw new Error("useReservation must be used within a ReservationProvider");
    }
    return context;
}
