"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { LogOut } from "lucide-react";

// Botón minimalista usado en el admin para cerrar sesión con fetch /api/logout.
export default function LogoutButton({ className }: { className?: string }) {
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/logout", { method: "POST" });
    router.refresh();
  }

  return (
    <button
      onClick={handleLogout}
      className={
        className || "rounded-full border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
      }
    >
      <div className="flex items-center gap-2">
        <LogOut className="h-4 w-4" />
        <span>Cerrar sesión</span>
      </div>
    </button>
  );
}
