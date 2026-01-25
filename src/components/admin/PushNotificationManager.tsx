'use client';

import { useState, useEffect } from 'react';
import { Bell, BellOff, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

/**
 * Helper to convert VAPID key
 */
function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

export default function PushNotificationManager() {
    const [isSupported, setIsSupported] = useState(false);
    const [subscription, setSubscription] = useState<PushSubscription | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if ('serviceWorker' in navigator && 'PushManager' in window) {
            setIsSupported(true);
            registerServiceWorker();
        } else {
            setLoading(false);
        }
    }, []);

    async function registerServiceWorker() {
        try {
            const registration = await navigator.serviceWorker.register('/sw.js');
            const sub = await registration.pushManager.getSubscription();
            setSubscription(sub);
        } catch (error) {
            console.error('Service Worker Error', error);
        } finally {
            setLoading(false);
        }
    }

    async function subscribeToPush() {
        setLoading(true);
        try {
            const registration = await navigator.serviceWorker.ready;
            const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

            if (!vapidPublicKey) {
                toast.error('Falta la configuración push (VAPID Key)');
                return;
            }

            const sub = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
            });

            setSubscription(sub);

            // Save to Backend
            // Authentication is handled via cookies automatically
            await fetch('/api/notifications/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ subscription: sub })
            });

            toast.success('Notificaciones activadas', { description: 'Recibirás avisos incluso con el móvil bloqueado.' });
        } catch (error) {
            console.error(error);
            toast.error('No se pudo activar las notificaciones');
        } finally {
            setLoading(false);
        }
    }

    async function unsubscribeFromPush() {
        if (!subscription) return;
        setLoading(true);
        try {
            // 1. Unsubscribe from browser
            await subscription.unsubscribe();

            // 2. Optional: Notify backend to remove (we can just let it clean up on 410, but explicit is nice)
            // For now, fast path: just clear state.

            setSubscription(null);
            toast.success('Notificaciones desactivadas');
        } catch (error) {
            console.error(error);
            toast.error('Error al desactivar');
        } finally {
            setLoading(false);
        }
    }

    if (!isSupported) {
        return (
            <div className="text-xs text-slate-400 italic">
                No soportado en este dispositivo.
                <br />
                <span className="opacity-75">Nota: En iPhone debes "Añadir a Pantalla de Inicio" primero.</span>
            </div>
        );
    }

    if (loading) {
        return <Loader2 className="w-5 h-5 animate-spin text-slate-400" />;
    }

    if (subscription) {
        return (
            <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 text-emerald-600 font-medium px-4 py-2 bg-emerald-50 rounded-lg border border-emerald-100 cursor-default">
                    <Bell className="w-4 h-4" />
                    <span className="text-sm">Activas</span>
                </div>
                <button
                    onClick={unsubscribeFromPush}
                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="Desactivar notificaciones"
                >
                    <BellOff className="w-4 h-4" />
                </button>
            </div>
        );
    }

    return (
        <button
            onClick={subscribeToPush}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-all shadow-md active:scale-95"
        >
            <Bell className="w-4 h-4" />
            <span className="text-sm font-bold">Activar Alertas</span>
        </button>
    );
}
