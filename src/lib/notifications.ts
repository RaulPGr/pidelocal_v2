// src/lib/notifications.ts
import webPush from 'web-push';
import { supabaseAdmin } from './supabaseAdmin';

// Configurar Web Push
if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    webPush.setVapidDetails(
        process.env.NEXT_PUBLIC_VAPID_SUBJECT || 'mailto:admin@pidelocal.com',
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
        process.env.VAPID_PRIVATE_KEY
    );
}

type PushPayload = {
    title: string;
    body: string;
    url?: string;
    icon?: string;
    tag?: string;
};

/**
 * Envía una notificación push a todas las suscripciones de un negocio.
 */
export async function sendPushToBusiness(businessId: string, payload: PushPayload) {
    if (!process.env.VAPID_PRIVATE_KEY) {
        console.warn('VAPID_PRIVATE_KEY no configurado, saltando push notifications.');
        return;
    }

    try {
        // 1. Obtener suscripciones del negocio
        const { data: subs, error } = await supabaseAdmin
            .from('push_subscriptions')
            .select('*')
            .eq('business_id', businessId);

        if (error || !subs || subs.length === 0) return;

        console.log(`[push] Enviando a ${subs.length} dispositivos del negocio ${businessId}`);

        // 2. Enviar a cada una
        const notifications = subs.map(async (sub) => {
            const pushConfig = {
                endpoint: sub.endpoint,
                keys: {
                    p256dh: sub.p256dh,
                    auth: sub.auth,
                },
            };

            try {
                await webPush.sendNotification(pushConfig, JSON.stringify(payload));
            } catch (err: any) {
                if (err.statusCode === 410 || err.statusCode === 404) {
                    // Suscripción inválida/expirada, borrar de DB
                    console.log(`[push] Borrando suscripción inválida: ${sub.id}`);
                    await supabaseAdmin.from('push_subscriptions').delete().eq('id', sub.id);
                } else {
                    console.error('[push] Error enviando:', err.message);
                }
            }
        });

        await Promise.all(notifications);

    } catch (err) {
        console.error('[push] Error general:', err);
    }
}
