// src/app/api/notifications/subscribe/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getSubscriptionForSlug } from '@/lib/subscription-server'; // Helper to get businessId from slug if needed, or check cookie via supabase

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { subscription, slug } = body;

        if (!subscription || !subscription.endpoint || !slug) {
            return NextResponse.json({ ok: false, message: 'Invalid payload' }, { status: 400 });
        }

        // Obtener business_id del slug
        const { data: business } = await supabaseAdmin
            .from('businesses')
            .select('id')
            .eq('slug', slug)
            .single();

        if (!business) {
            return NextResponse.json({ ok: false, message: 'Business not found' }, { status: 404 });
        }

        // Guardar suscripción
        // Usamos upsert basado en el endpoint para no duplicar
        const { error } = await supabaseAdmin
            .from('push_subscriptions')
            .upsert({
                business_id: business.id,
                endpoint: subscription.endpoint,
                p256dh: subscription.keys.p256dh,
                auth: subscription.keys.auth,
                user_agent: req.headers.get('user-agent') || null,
                updated_at: new Date().toISOString()
            }, { onConflict: 'endpoint' });

        if (error) throw error;

        return NextResponse.json({ ok: true });
    } catch (e: any) {
        console.error('Subscribe error:', e);
        return NextResponse.json({ ok: false, message: e.message }, { status: 500 });
    }
}
