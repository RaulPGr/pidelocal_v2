"use client";

import ReservationsClient from "./ReservationsClient";
import { useAdminAccess } from "@/context/AdminAccessContext";
import { subscriptionAllowsReservations } from "@/lib/subscription";
import UpgradeGate from "@/components/admin/UpgradeGate";

export default function ReservationsPage() {
  const { plan, isSuper } = useAdminAccess();

  if (!subscriptionAllowsReservations(plan) && !isSuper) {
    return (
      <UpgradeGate
        plan={plan}
        requiredPlan="medium"
        featureName="Gestión de Reservas"
        description="Organiza tu sala y recibe reservas online 24/7 con el Plan Medium."
        benefits={[
          "Calendario interactivo de reservas",
          "Notificaciones por email y Telegram",
          "Gestión de lista de espera",
          "Historial de clientes"
        ]}
      />
    );
  }

  return (
    <ReservationsClient />
  );
}
