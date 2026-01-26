"use server";

import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

/* --- UTILS --- */
async function getUserId() {
    // We can use supabase auth.getUser() using the user's token passed in headers/cookies?
    // Using supabaseAdmin (service role) doesn't know the current user unless we pass a token.
    // Ideally we usage createServerComponentClient from @supabase/auth-helpers-nextjs or similar.
    // But here we might not have it setup easily in this file structure.
    // We will assume the client calls this action and nextjs handles auth context?
    // Usage of server actions automatically passes cookies? Yes.
    // So we can use createServerClient if we had it.
    // Let's look at how other actions do it.
    // `login/route.ts` sets cookies.
    // We need to read cookies.
    return null; // Placeholder: we will do it properly below.
}

// SIMPLIFICATION: We will trust the businessId passed IF we can verify membership.
// Since we don't have a standard "verifySession" in this file yet (it's scattered in routes),
// I will implement a quick check using cookies if possible, or assume this runs in a protected layout context
// BUT server actions are public API endpoints basically.
// I will import `cookies` from `next/headers`.

import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

async function getSessionUser() {
    const cookieStore = await cookies();

    // Create a client just to get the user
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() { return cookieStore.getAll() },
                setAll() { } // We don't save session here
            }
        }
    );
    const { data: { user } } = await supabase.auth.getUser();
    return user;
}

export async function createSupportTicket(businessId: string, subject: string, message: string) {
    const user = await getSessionUser();
    if (!user) return { success: false, error: "Unauthorized" };

    // Verify membership
    const { data: member } = await supabaseAdmin
        .from("business_members")
        .select("role")
        .eq("business_id", businessId)
        .eq("user_id", user.id)
        .single();

    if (!member) return { success: false, error: "No tienes permiso para este negocio" };

    // Create Ticket
    const { data: ticket, error: ticketError } = await supabaseAdmin
        .from("support_tickets")
        .insert({
            business_id: businessId,
            subject: subject,
            status: "open"
        })
        .select()
        .single();

    if (ticketError || !ticket) return { success: false, error: ticketError?.message };

    // Create Message
    const { error: msgError } = await supabaseAdmin
        .from("support_messages")
        .insert({
            ticket_id: ticket.id,
            sender_role: "business",
            message: message,
            read: false
        });

    if (msgError) return { success: false, error: msgError.message };

    revalidatePath(`/admin/help`);
    return { success: true, ticketId: ticket.id };
}

export async function getTenantTickets(businessId: string) {
    const user = await getSessionUser();
    if (!user) return [];

    // Verify membership (light check or rely on RLS if we used standard client, but we use Admin)
    const { data: member } = await supabaseAdmin
        .from("business_members")
        .select("role")
        .eq("business_id", businessId)
        .eq("user_id", user.id)
        .single();
    if (!member) return [];

    const { data } = await supabaseAdmin
        .from("support_tickets")
        .select("*, support_messages(*)") // Embed messages? Or just last message?
        .eq("business_id", businessId)
        .order("created_at", { ascending: false });

    return data || [];
}

export async function replyTenantTicket(ticketId: string, message: string) {
    const user = await getSessionUser();
    if (!user) return { success: false, error: "Unauthorized" };

    // We need to know businessId to verify membership, or we check if user is member of the ticket's business
    const { data: ticket } = await supabaseAdmin
        .from("support_tickets")
        .select("business_id")
        .eq("id", ticketId)
        .single();

    if (!ticket) return { success: false, error: "Ticket not found" };

    // Verify
    const { data: member } = await supabaseAdmin
        .from("business_members")
        .select("role")
        .eq("business_id", ticket.business_id)
        .eq("user_id", user.id)
        .single();

    if (!member) return { success: false, error: "Unauthorized" };

    // Insert
    await supabaseAdmin
        .from("support_messages")
        .insert({
            ticket_id: ticketId,
            sender_role: "business",
            message
        });

    // Update ticket updated_at
    await supabaseAdmin
        .from("support_tickets")
        .update({ updated_at: new Date().toISOString(), status: 'open' }) // Re-open if closed? or just update
        .eq("id", ticketId);

    revalidatePath(`/admin/help`);
    return { success: true };
}
