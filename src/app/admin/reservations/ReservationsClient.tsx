"use client";

import { useAdminAccess } from "@/context/AdminAccessContext";
import { subscriptionAllowsReservations } from "@/lib/subscription";
import { useState } from "react";
import { CalendarDays, Settings, LayoutGrid } from "lucide-react";
import clsx from "clsx";
import ReservationsList from "./ReservationsList";
import ReservationsConfig from "./ReservationsConfig";
import UpgradeGate from "@/components/admin/UpgradeGate";

export default function ReservationsClient() {
  const { plan, isSuper } = useAdminAccess();
  const reservationsBlocked = !subscriptionAllowsReservations(plan) && !isSuper;
  const [activeTab, setActiveTab] = useState<'bookings' | 'config'>('bookings');

  if (reservationsBlocked) {
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
    <div className="space-y-6">
      {/* Header & Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/60 pb-4">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent flex items-center gap-2">
            <CalendarDays className="w-6 h-6 text-slate-700" />
            Reservas de Mesa
          </h2>
          <p className="text-slate-500 text-sm mt-1">Gestiona solicitudes y configura tu disponibilidad.</p>
        </div>

        <div className="flex p-1 bg-slate-100 rounded-xl">
          <button
            onClick={() => setActiveTab('bookings')}
            className={clsx(
              "px-4 py-2 text-sm font-medium rounded-lg transition-all flex items-center gap-2",
              activeTab === 'bookings'
                ? "bg-white text-slate-900 shadow-sm ring-1 ring-black/5"
                : "text-slate-500 hover:text-slate-700"
            )}
          >
            <LayoutGrid className="w-4 h-4" />
            Reservas
          </button>
          <button
            onClick={() => setActiveTab('config')}
            className={clsx(
              "px-4 py-2 text-sm font-medium rounded-lg transition-all flex items-center gap-2",
              activeTab === 'config'
                ? "bg-white text-slate-900 shadow-sm ring-1 ring-black/5"
                : "text-slate-500 hover:text-slate-700"
            )}
          >
            <Settings className="w-4 h-4" />
            Configuración
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
        {activeTab === 'bookings' ? <ReservationsList /> : <ReservationsConfig />}
      </div>
    </div>
  );
}
