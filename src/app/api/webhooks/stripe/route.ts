import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { sendOrderReceiptEmail, sendOrderBusinessNotificationEmail } from '@/lib/email/sendOrderReceipt';
import { notifyOrderViaTelegram } from '@/lib/order-telegram-notify';

// This secret should be in your .env
// For local dev, we use the one printed by "stripe listen"
const ENDPOINT_SECRET = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_d5a7bf9ae8c13b21f07d77fe530828d171a64402a14b6f4fc7ef88223a0ba57c';

export async function POST(req: NextRequest) {
    const body = await req.text();
    const signature = (await headers()).get('stripe-signature') as string;

    let event;

    try {
        event = stripe.webhooks.constructEvent(body, signature, ENDPOINT_SECRET);
    } catch (err: any) {
        console.error(`⚠️  Webhook signature verification failed.`, err.message);
        return NextResponse.json({ error: err.message }, { status: 400 });
    }

    // Handle the event
    if (event.type === 'checkout.session.completed') {
        const session = event.data.object as any;
        const orderId = session.client_reference_id || session.metadata?.orderId;

        if (orderId) {
            console.log(`💰 Pago recibido para pedido ${orderId}`);

            // 1. Update Order
            const { data: order, error } = await supabaseAdmin
                .from('orders')
                .update({ status: 'confirmed', payment_status: 'paid', stripe_session_id: session.id })
                .eq('id', orderId)
                .select('*, items:order_items(*, options:order_item_options(*))')
                .single();

            if (error || !order) {
                console.error('Error updating order', error);
            } else {
                // 2. Notifications
                // Fetch Tenant/Business
                const { data: business } = await supabaseAdmin
                    .from('businesses')
                    .select('*')
                    .eq('id', order.business_id)
                    .single();

                if (business) {
                    try {
                        // Prepare Items for Email
                        const optionLabel = (opt: any) => {
                            const base = opt.group_name_snapshot ? `${opt.group_name_snapshot}: ${opt.name_snapshot}` : opt.name_snapshot;
                            const priceDelta = Number(opt.price_delta_snapshot || 0);
                            if (priceDelta) {
                                const formatted = priceDelta.toLocaleString("es-ES", { style: "currency", currency: "EUR" });
                                const sign = priceDelta > 0 ? "+" : "-";
                                return `${base} (${sign}${formatted})`;
                            }
                            return base;
                        };

                        const itemsSimple = order.items.map((it: any) => ({
                            name: it.name,
                            qty: it.quantity,
                            price: it.unit_price_cents / 100,
                            options: (it.options || []).map(optionLabel),
                        }));
                        const subtotal = itemsSimple.reduce((a: any, it: any) => a + it.price * it.qty, 0);

                        // --- Email Customer ---
                        if (order.customer_email) {
                            await sendOrderReceiptEmail({
                                orderId: order.id,
                                orderCode: order.code,
                                businessName: business.name,
                                businessAddress: [business.address_line, business.postal_code, business.city].filter(Boolean).join(', '),
                                businessLogoUrl: business.logo_url,
                                customerEmail: order.customer_email,
                                customerName: order.customer_name,
                                items: itemsSimple,
                                subtotal,
                                total: order.total_cents / 100,
                                pickupTime: order.pickup_at,
                                notes: order.notes,
                                discount: (order.discount_cents || 0) / 100,
                                promotionName: order.promotion_name,
                            });
                        }

                        // --- Email Business ---
                        const social = business.social || {};
                        const notifyTarget = (social.notify_orders_email && String(social.notify_orders_email).trim()) || business.email;
                        if (social.notify_orders_enabled && notifyTarget) {
                            await sendOrderBusinessNotificationEmail({
                                orderId: order.id,
                                orderCode: order.code,
                                businessName: business.name,
                                businessAddress: [business.address_line, business.postal_code, business.city].filter(Boolean).join(', '),
                                businessLogoUrl: business.logo_url,
                                businessEmail: notifyTarget,
                                items: itemsSimple,
                                total: order.total_cents / 100,
                                customerName: order.customer_name,
                                customerPhone: order.customer_phone,
                                customerEmail: order.customer_email,
                                pickupTime: order.pickup_at,
                                notes: order.notes,
                            });
                        }

                        // --- Telegram ---
                        await notifyOrderViaTelegram(orderId, {
                            ...social,
                            slug: business.slug,
                            businessName: business.name,
                        });

                    } catch (e) {
                        console.error("Error sending notifications in webhook", e);
                    }
                }
            }
        }
    }

    return NextResponse.json({ received: true });
}
