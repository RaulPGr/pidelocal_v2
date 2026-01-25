import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { createSupabaseServerClient } from '@/lib/supabaseServer';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { subscription } = body;

        if (!subscription || !subscription.endpoint) {
            return NextResponse.json({ ok: false, message: 'Invalid payload' }, { status: 400 });
        }

        // 1. Authenticate User
        const supabase = await createSupabaseServerClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ ok: false, message: 'Unauthorized' }, { status: 401 });
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

        // 3. Save Subscription
        const { error } = await supabaseAdmin
            .from('push_subscriptions')
            .upsert({
                business_id: businessId,
                user_id: user.id, // Track which user added this device
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
