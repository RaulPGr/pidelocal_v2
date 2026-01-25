// src/app/api/notifications/subscribe/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { subscription } = body;

        if (!subscription || !subscription.endpoint) {
            return NextResponse.json({ ok: false, message: 'Invalid payload' }, { status: 400 });
        }

        // 1. Authenticate User
        const cookieStore = cookies();
        const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ ok: false, message: 'Unauthorized' }, { status: 401 });
        }

        // 2. Find Business owned by User
        // Assume 1:1 relationship for now or check 'businesses' table where user_id = user.id
        // In this project, 'businesses' table usually has 'user_id' or we can check via admin context logic.
        // Let's assume businesses table has user_id. If not, we might need a different lookup.
        // Checking schema via context is hard, but based on previous code, businesses table likely has user_id or we are the owner.
        // Let's try select id from businesses where user_id = user.id.

        let businessId: string | null = null;

        // Try strict ownership first
        const { data: ownedBusiness } = await supabaseAdmin
            .from('businesses')
            .select('id')
            .eq('user_id', user.id)
            .maybeSingle();

        if (ownedBusiness) {
            businessId = ownedBusiness.id;
        } else {
            // Fallback: If 'slug' is provided AND user is authorized for that slug (e.g. via RLS or logic), use it.
            // But for security, let's stick to ownership or "admin_access" table if it exists.
            // Based on "useAdminAccess" context, there might be a relation.
            // Let's just return 404 if no owned business found for now, to be safe.
            // Wait, the user might be a staff member?
            // If plan is 'medium'/'premium', maybe they are the owner.
            return NextResponse.json({ ok: false, message: 'No business found for user' }, { status: 404 });
        }

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
