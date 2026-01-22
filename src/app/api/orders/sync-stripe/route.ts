
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { cookies } from 'next/headers';
import { stripe } from '@/lib/stripe';

export async function POST(req: NextRequest) {
    try {
        const cookieStore = await cookies();
        const slug = cookieStore.get('x-tenant-slug')?.value;
        if (!slug) throw new Error("No tenant slug");

        // Get Business ID
        const { data: business } = await supabaseAdmin
            .from('businesses')
            .select('id, social')
            .eq('slug', slug)
            .single();

        if (!business) throw new Error("Business not found");

        const stripeAccountId = (business.social as any)?.stripe_account_id;
        if (!stripeAccountId) throw new Error("Stripe not connected");

        // Find "stuck" orders: Card/Stripe + Unpaid + Created recently
        const { data: stuckOrders } = await supabaseAdmin
            .from('orders')
            .select('id, code, payment_status, stripe_session_id')
            .eq('business_id', business.id)
            .or('payment_method.eq.card,payment_method.eq.stripe')
            .neq('payment_status', 'paid')
            .gt('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Last 24h
            .order('created_at', { ascending: false });

        if (!stuckOrders || stuckOrders.length === 0) {
            return NextResponse.json({ ok: true, restored: 0, message: "No hay pedidos pendientes de revisión." });
        }

        let restoredCount = 0;

        for (const order of stuckOrders) {
            let session: any = null;

            // Strategy A: Use stored session ID
            if (order.stripe_session_id) {
                try {
                    session = await stripe.checkout.sessions.retrieve(order.stripe_session_id, { stripeAccount: stripeAccountId });
                } catch { }
            }

            // Strategy B: Search inside recent sessions (Stripe API doesn't allow filtering by client_reference_id directly)
            if (!session || session.payment_status !== 'paid') {
                try {
                    // Fetch last 50 sessions to find the match
                    const list = await stripe.checkout.sessions.list({
                        limit: 50,
                    }, { stripeAccount: stripeAccountId });

                    const found = list.data.find((s: any) => s.client_reference_id === order.id);
                    if (found) session = found;
                } catch { }
            }

            // Check if Paid
            if (session && session.payment_status === 'paid') {
                // Fix it!
                console.log(`[Sync] Fixing order ${order.id} (Session ${session.id})`);
                await supabaseAdmin
                    .from('orders')
                    .update({
                        status: 'confirmed', // Auto-confirm if paid? Or just 'pending' but paid? Usually 'confirmed' if paid.
                        payment_status: 'paid',
                        stripe_session_id: session.id
                    })
                    .eq('id', order.id);

                restoredCount++;

                // Ideally trigger notifications here too, but for now just DB sync is enough to make it appear.
            }
        }

        return NextResponse.json({
            ok: true,
            restored: restoredCount,
            message: restoredCount > 0
                ? `Se han recuperado ${restoredCount} pedidos pagados.`
                : "Todos los pedidos pendientes siguen sin pagar."
        });

    } catch (err: any) {
        return NextResponse.json({ ok: false, message: err.message }, { status: 500 });
    }
}
