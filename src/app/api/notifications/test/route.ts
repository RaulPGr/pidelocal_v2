// src/app/api/notifications/test/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { sendPushToBusiness } from '@/lib/notifications';
import { createSupabaseServerClient } from '@/lib/supabaseServer';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest) {
    try {
        // 1. Authenticate
        const supabase = await createSupabaseServerClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ ok: false, message: 'Unauthorized' }, { status: 401 });
        }

        // Check Env Vars
        if (!process.env.VAPID_PRIVATE_KEY || !process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) {
            return NextResponse.json({ ok: false, message: 'Faltan claves VAPID en servidor' }, { status: 500 });
        }

        // 2. Find Business (Slug + Membership)
        const cookieStore = await cookies();
        const slug = cookieStore.get('x-tenant-slug')?.value || '';

        if (!slug) {
            return NextResponse.json({ ok: false, message: 'No tenant slug (recarga la pagina)' }, { status: 400 });
        }

        const { data: biz } = await supabaseAdmin
            .from('businesses')
            .select('id')
            .eq('slug', slug)
            .maybeSingle();

        if (!biz) {
            return NextResponse.json({ ok: false, message: 'Negocio no encontrado' }, { status: 404 });
        }

        // Check Membership
        const { data: member } = await supabaseAdmin
            .from('business_members')
            .select('user_id')
            .eq('business_id', biz.id)
            .eq('user_id', user.id)
            .maybeSingle();

        if (!member) {
            // Fallback: Check strict ownership just in case (legacy)
            const { data: owner } = await supabaseAdmin
                .from('businesses')
                .select('id')
                .eq('id', biz.id)
                .eq('user_id', user.id)
                .maybeSingle();

            if (!owner) {
                return NextResponse.json({ ok: false, message: 'No tienes acceso a este negocio' }, { status: 403 });
            }
        }

        const businessId = biz.id;

        // 3. Send Test Push
        // This sends to ALL devices of the business. Ideally we should filter by the user's current session or endpoint if possible,
        // but sending to all is fine for a test in this context.
        await sendPushToBusiness(businessId, {
            title: '🔔 Prueba de Notificación',
            body: 'Si lees esto, ¡funciona correctamente!',
            url: '/admin/settings'
        });

        return NextResponse.json({ ok: true });
    } catch (e: any) {
        console.error('Test Push Error:', e);
        return NextResponse.json({ ok: false, message: e.message || 'Error sending test' }, { status: 500 });
    }
}
