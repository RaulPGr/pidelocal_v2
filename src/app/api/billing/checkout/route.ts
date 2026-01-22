import { NextResponse } from "next/server";
import { headers, cookies } from "next/headers";
import { stripe, STRIPE_CONFIG } from "@/lib/stripe"; // Helper helper
import { getSubscriptionForSlug } from "@/lib/subscription-server";

export async function POST(req: Request) {
    try {
        const { plan } = await req.json(); // 'starter', 'medium', 'premium'

        // 1. Get current business context
        const cookieStore = await cookies();
        const slug = cookieStore.get("x-tenant-slug")?.value;
        if (!slug) return NextResponse.json({ error: "No tenant context" }, { status: 400 });

        const sub = await getSubscriptionForSlug(slug);
        if (!sub.businessId) {
            console.error(`Business not found for slug: '${slug}'`);
            return NextResponse.json({ error: `Business not found for slug: '${slug}'` }, { status: 404 });
        }

        // 2. Select Price ID
        // @ts-ignore
        const targetPlan = STRIPE_CONFIG.PLANS[plan];
        if (!targetPlan || !targetPlan.priceId) {
            return NextResponse.json({ error: "Plan inválido o no configurado" }, { status: 400 });
        }

        // 3. Create Checkout Session
        const headerList = await headers();
        const origin = headerList.get("origin") || "http://localhost:3000";

        // We need to construct the SUCCESS URL properly on the SUBDOMAIN
        // But stripe requires absolute URL.
        // If we are in dev (localhost), origin might be http://localhost:3000 (if root) or http://slug.localhost:3000
        // We want to return to the billing page.
        const returnUrl = `${origin}/admin/settings/billing?status={CHECKOUT_SESSION_ID}`;

        const session = await stripe.checkout.sessions.create({
            mode: 'subscription',
            payment_method_types: ['card'],
            line_items: [
                {
                    price: targetPlan.priceId,
                    quantity: 1,
                },
            ],
            success_url: returnUrl,
            cancel_url: `${origin}/admin/settings/billing`,
            customer_email: undefined, // Could pass user email if we had it handy in req
            metadata: {
                businessId: sub.businessId,
                slug: slug,
                plan: plan
            },
            allow_promotion_codes: true,
            billing_address_collection: 'required',
            tax_id_collection: { enabled: true }, // IVA support
        });

        return NextResponse.json({ url: session.url });

    } catch (e: any) {
        console.error(e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
