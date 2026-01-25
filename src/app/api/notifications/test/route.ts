// src/app/api/notifications/test/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { sendPushToBusiness } from '@/lib/notifications';

export async function POST(req: NextRequest) {
    try {
        // 1. Authenticate
        // 1. Authenticate
        const cookieStore = await cookies();
        const supabase = createRouteHandlerClient({ cookies: () => Promise.resolve(cookieStore) });
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ ok: false, message: 'Unauthorized' }, { status: 401 });
        }

        // Check Env Vars
        if (!process.env.VAPID_PRIVATE_KEY || !process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) {
            return NextResponse.json({ ok: false, message: 'Faltan claves VAPID en servidor' }, { status: 500 });
        }

        // 2. Find Business
        const { data: ownedBusiness } = await supabaseAdmin
            .from('businesses')
            .select('id')
            .eq('user_id', user.id)
            .maybeSingle();

        if (!ownedBusiness) {
            return NextResponse.json({ ok: false, message: 'No business found' }, { status: 404 });
        }

        // 3. Send Test Push
        // This sends to ALL devices of the business. Ideally we should filter by the user's current session or endpoint if possible,
        // but sending to all is fine for a test in this context.
        await sendPushToBusiness(ownedBusiness.id, {
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
