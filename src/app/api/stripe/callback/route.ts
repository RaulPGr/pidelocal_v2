import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET(req: NextRequest) {
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state"); // "tenant:uuid"
    const error = url.searchParams.get("error");

    if (error) {
        return NextResponse.redirect(`${url.origin}/admin/settings/orders?error=${error}`);
    }

    if (!code || !state || !state.startsWith("tenant:")) {
        return NextResponse.redirect(`${url.origin}/admin/settings/orders?error=invalid_request`);
    }

    const tenantId = state.split(":")[1];

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

        return NextResponse.redirect(`${url.origin}/admin/settings/orders?success=stripe_connected`);

    } catch (e: any) {
        console.error("Stripe Callback Error:", e);
        return NextResponse.redirect(`${url.origin}/admin/settings/orders?error=${encodeURIComponent(e.message)}`);
    }
}
