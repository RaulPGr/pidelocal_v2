"use server";

import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { headers } from "next/headers";

export async function recordPageVisit(businessId: string, path: string) {
    try {
        const h = await headers();
        const userAgent = h.get("user-agent") || "";
        const referer = h.get("referer") || "";

        // Simple hash for visitor ID (IP + UA) - rudimentary but sufficient for basic uniqueness stats without cookies
        // Note: IP is not always available in headers in all environments, so we'll fall back to UA + time window or similar.
        // Making it truly unique without cookies is hard, but we can try basic fingerprinting or just log every hit.
        // For "Visitas", raw hits are okay. For "Usuarios únicos", we'd need a cookie.
        // Let's rely on client-side generating a simple session ID if possible, or just log raw.
        // Migration said "visitor_hash".

        const ip = h.get("x-forwarded-for") || "unknown";
        const visitorHash = Buffer.from(`${ip}-${userAgent}`).toString('base64');

        await supabaseAdmin.from("business_page_visits").insert({
            business_id: businessId,
            path,
            referrer: referer,
            visitor_hash: visitorHash
        });
    } catch (e) {
        // Fail silently to not impact user experience
        console.error("Analytics error:", e);
    }
}
