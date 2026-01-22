"use client";

import StatsClient from "./StatsClient";
import { useAdminAccess } from "@/context/AdminAccessContext";
import UpgradeGate from "@/components/admin/UpgradeGate";

export default function StatsPage() {
  const { plan, isSuper } = useAdminAccess();

  if (plan !== "premium" && !isSuper) {
    return (
      <UpgradeGate
        plan={plan}
        requiredPlan="premium"
        featureName="Estadísticas Avanzadas"
        description="Toma decisiones informadas analizando tus ventas y rendimiento."
        benefits={[
          "Gráficos de ventas por día/semana/mes",
          "Productos más vendidos",
          "Horas punta de actividad",
          "Exportación de datos"
        ]}
      />
    );
  }

  return (
    <StatsClient />
  );
}
