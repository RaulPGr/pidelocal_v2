"use client";

import { useState } from "react";
import BusinessSettingsClient from "@/app/admin/settings/business/client.clean";
import OrdersHoursSettingsClient from "@/app/admin/settings/orders/client";
import ThemeSettingsClient from "@/app/admin/settings/theme/client";
import SettingsClient from "./settingsClient";
import { useAdminAccess } from "@/context/AdminAccessContext";
import { subscriptionAllowsOrders, subscriptionAllowsReservations } from "@/lib/subscription";
import { Store, Calendar, ShoppingBag, CreditCard, Clock, Palette } from "lucide-react";
import clsx from "clsx";
import PushNotificationManager from "@/components/admin/PushNotificationManager";

export default function SettingsPage() {
  const { plan, isSuper } = useAdminAccess();
  const allowOrders = subscriptionAllowsOrders(plan) || isSuper;
  const allowReservations = subscriptionAllowsReservations(plan) || isSuper;

  const [activeTab, setActiveTab] = useState<"business" | "reservations" | "orders" | "payments" | "theme">("business");

  const tabs = [
    { id: "business", label: "Negocio", icon: Store, show: true },
    { id: "theme", label: "Tema", icon: Palette, show: true },
    { id: "orders", label: "Pedidos y Horarios", icon: ShoppingBag, show: allowOrders },
    { id: "payments", label: "Pagos", icon: CreditCard, show: allowOrders },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">Configuración</h2>
        <p className="text-slate-500 text-sm">Administra la información de tu negocio, horarios y preferencias.</p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-1">
        {tabs.filter(t => t.show).map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={clsx(
                "flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-all relative top-[1px]",
                activeTab === tab.id
                  ? "bg-white text-emerald-600 border border-slate-200 border-b-white"
                  : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
              )}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Content */}
      <div className="min-h-[400px] animate-in fade-in slide-in-from-bottom-2 duration-300">
        {activeTab === "business" && (
          <div className="space-y-6">
            <div className="glass-panel p-6 rounded-2xl flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900">Notificaciones PUSH</h3>
                <p className="text-sm text-slate-500">Recibe avisos en tu móvil incluso cuando esté bloqueado.</p>
              </div>
              <PushNotificationManager />
            </div>
            <BusinessSettingsClient mode="full" />
          </div>
        )}

        {activeTab === "theme" && (
          <ThemeSettingsClient />
        )}



        {activeTab === "orders" && (
          <div className="space-y-8">
            <OrdersHoursSettingsClient />
          </div>
        )}

        {activeTab === "payments" && (
          <SettingsClient />
        )}
      </div>
    </div>
  );
}
