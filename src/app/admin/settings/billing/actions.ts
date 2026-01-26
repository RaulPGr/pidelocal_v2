"use server";

import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

// Self-cancellation for the LOGGED IN business owner
export async function cancelAccount() {
    console.log("Processing account cancellation...");
    const supabase = await createSupabaseServerClient();

    // 1. Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        return { success: false, error: "No autenticado" };
    }

    // 2. Identify the business owned by this user
    // We assume strict 1:1 or we delete the businesses where they are OWNER.
    // Ideally we check `business_members` where user_id = user.id AND role = 'owner'
    // Then delete those businesses.

    // For now, let's delete the business associated with the current session context if possible,
    // or search for the business owned.

    try {
        // Find business ownership
        const { data: memberships, error: memberError } = await supabase
            .from("business_members")
            .select("business_id, role")
            .eq("user_id", user.id)
            .eq("role", "owner");

        if (memberError || !memberships || memberships.length === 0) {
            return { success: false, error: "No eres propietario de ningún negocio o no se encontró." };
        }

        // 3. Delete businesses (Cascading via Supabase foreign keys usually)
        // Note: Standard users might NOT have permission to DELETE from 'businesses' table due to RLS.
        // If RLS prevents it, we need a Service Role action or RLS policy allowance.
        // "Users can delete their own business" policy might exist. 
        // If NOT, we need to use supabaseAdmin here? 
        // We can't import supabaseAdmin easily in "src/app/admin/..." if it assumes server-only env that is safe?
        // Actually `src/lib/supabaseAdmin` is available. Let's use it to be sure we bypass RLS for deletion.
        // SECURITY: Verify checking user ownership strictly before using Admin.

        // We already verified ownership via `memberships` (using user token).
        const businessIds = memberships.map(m => m.business_id);

        // Lazy import to avoid circular weirdness if any, though likely fine.
        const { supabaseAdmin } = await import("@/lib/supabaseAdmin");

        const { error: deleteError } = await supabaseAdmin
            .from("businesses")
            .delete()
            .in("id", businessIds);

        if (deleteError) throw deleteError;

        // 4. Create Support Ticket or Log reason? (Optional)

        // 5. Sign out user?
        await supabase.auth.signOut();

    } catch (e: any) {
        console.error("Cancellation error:", e);
        return { success: false, error: e.message || "Error al cancelar cuenta" };
    }

    redirect("/login");
}
