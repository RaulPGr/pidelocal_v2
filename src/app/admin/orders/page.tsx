"use client";

import OrdersClient from "./OrdersClient";
import { useAdminAccess } from "@/context/AdminAccessContext";
import { subscriptionAllowsOrders } from "@/lib/subscription";
import UpgradeGate from "@/components/admin/UpgradeGate";

export default function OrdersPage() {
  const { plan, isSuper } = useAdminAccess();

  if (!subscriptionAllowsOrders(plan) && !isSuper) {
    return (
      <UpgradeGate
        plan={plan}
        requiredPlan="premium"
        featureName="Pedidos Online & Delivery"
        description="Habilita el canal de venta online y gestiona tus pedidos en tiempo real con el Plan Premium."
        benefits={[
          "Carrito de compras integrado",
          "Pagos online con tarjeta (Stripe)",
          "Avisos visuales y sonoros en tiempo real",
          "Gestión de estados del pedido (Cocina, Reparto, etc)"
        ]}
      />
    );
  }

  return (
    <OrdersClient />
  );
}
