import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { getTenant } from "@/lib/tenant";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET(req: NextRequest) {
    try {
        const url = new URL(req.url);
        const tenantSlug = url.searchParams.get("tenant");

        // 1. Validate Tenant
        const tenant = await getTenant(tenantSlug, { path: url.pathname });
        if (!tenant) {
            return NextResponse.json({ ok: false, message: "Negocio no encontrado" }, { status: 404 });
        }

        // 2. Generate Account Link (Standard/Express)
        // We use the root domain for the callback to match Stripe whitelist
        // FIX: NEXT_PUBLIC_SITE_URL might be set to a subdomain in some envs. 
        // We enforce the production root domain for the callback.
        const rootDomain = "https://pidelocal.es";

        // State to verify callback security AND know where to return
        // Format: tenant:id:slug
        const state = `tenant:${tenant.id}:${tenantSlug}`;

        const params = new URLSearchParams({
            response_type: 'code',
            client_id: process.env.STRIPE_CLIENT_ID!,
            scope: 'read_write',
            state: state,
            'stripe_user[email]': tenant.email || undefined,
            'stripe_user[url]': `https://${tenantSlug}.pidelocal.es`, // Best effort
            'stripe_user[business_name]': tenant.name,
            redirect_uri: `${rootDomain}/api/stripe/callback`,
        });

        return NextResponse.json({
            ok: true,
            url: `https://connect.stripe.com/oauth/authorize?${params.toString()}`
        });

    } catch (e: any) {
        console.error("Stripe Connect Error:", e);
        return NextResponse.json({ ok: false, message: e.message }, { status: 500 });
    }
}
