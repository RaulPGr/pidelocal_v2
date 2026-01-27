import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET(req: NextRequest) {
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state"); // "tenant:uuid:slug"
    const error = url.searchParams.get("error");

    // Fallback redirect if we can't parse state (shouldn't happen often)
    const rootRedirect = `${process.env.NEXT_PUBLIC_SITE_URL || "https://pidelocal.es"}/admin/settings/orders`;

    if (error) {
        return NextResponse.redirect(`${rootRedirect}?error=${error}`);
    }

    if (!code || !state || !state.startsWith("tenant:")) {
        return NextResponse.redirect(`${rootRedirect}?error=invalid_request`);
    }

    const parts = state.split(":");
    const tenantId = parts[1];
    const tenantSlug = parts[2];

    // Check if we have enough info to redirect back to specific tenant
    let finalRedirectBase = rootRedirect;
    if (tenantSlug) {
        // Reconstruct tenant URL: protocol + slug + root domain
        // Assuming NEXT_PUBLIC_SITE_URL is something like "https://pidelocal.es"
        // We want "https://slug.pidelocal.es/admin/settings/orders"
        const rootUrl = new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://pidelocal.es");
        const protocol = rootUrl.protocol; // "https:"
        const host = rootUrl.host; // "pidelocal.es" (without port if 80/443, with if local)

        // If localhost, logic might differ, but for prod:
        finalRedirectBase = `${protocol}//${tenantSlug}.${host}/admin/settings/orders`;
    }

    try {
        // 1. Exchange Code for Account ID
        const response = await stripe.oauth.token({
            grant_type: "authorization_code",
            code,
        });

        const accountId = response.stripe_user_id;

        // 2. Save Account ID to Business
        // We store it in 'social' jsonb column to avoid schema changes
        // First fetch existing social
        const { data: business } = await supabaseAdmin
            .from("businesses")
            .select("social")
            .eq("id", tenantId)
            .single();

        const currentSocial = (business as any)?.social || {};
        const newSocial = { ...currentSocial, stripe_account_id: accountId };

        await supabaseAdmin
            .from("businesses")
            .update({ social: newSocial })
            .eq("id", tenantId);

        return NextResponse.redirect(`${finalRedirectBase}?success=stripe_connected`);

    } catch (e: any) {
        console.error("Stripe Callback Error:", e);
        return NextResponse.redirect(`${finalRedirectBase}?error=${encodeURIComponent(e.message)}`);
    }
}
