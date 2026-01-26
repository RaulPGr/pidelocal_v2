"use server";

import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { revalidatePath } from "next/cache";

export type GlobalStats = {
    totalRevenueCents: number;
    totalOrders: number;
    totalBusinesses: number;
    activeSubscriptions: number;
};

export type BusinessSummary = {
    id: string;
    name: string;
    slug: string;
    email: string | null;
    subscription_plan: string;
    created_at: string;
    revenue_30d_cents: number;
    orders_30d: number;
    is_active: boolean; // Derived from subscription or specific column check
    image_url?: string;
};

export async function getGlobalStats(): Promise<GlobalStats> {
    // 1. Total Businesses
    const { count: totalBusinesses } = await supabaseAdmin
        .from("businesses")
        .select("*", { count: "exact", head: true });

    // 2. Active Subscriptions (simple logic: plan != 'free' or 'starter' if that's free? Assuming premium/medium are paid)
    // Or check billing status. For now, let's count 'premium' + 'medium'.
    const { count: activeSubscriptions } = await supabaseAdmin
        .from("businesses")
        .select("*", { count: "exact", head: true })
        .in("theme_config->>subscription", ["medium", "premium"]); // This JSON approach might depend on DB structure

    // Fallback if JSON query is tricky in standardized Supabase client without raw SQL:
    // We'll fetch all and filter in memory if dataset is small, or use a simpler approximation.
    // Given user request "profesional", fetching all IDs is fine for <1000 businesses.

    // 3. Orders & Revenue (Global)
    // We aggregate from 'orders' table.
    const { data: orders } = await supabaseAdmin
        .from("orders")
        .select("total_cents")
        .in("status", ["confirmed", "delivered", "ready", "preparing"]); // Valid paid/accepted orders

    const totalOrders = orders?.length || 0;
    const totalRevenueCents = orders?.reduce((acc, o) => acc + (o.total_cents || 0), 0) || 0;

    return {
        totalBusinesses: totalBusinesses || 0,
        activeSubscriptions: activeSubscriptions || 0,
        totalOrders,
        totalRevenueCents
    };
}

export async function getBusinessesList(): Promise<BusinessSummary[]> {
    // Fetch businesses
    const { data: businesses, error } = await supabaseAdmin
        .from("businesses")
        .select("*")
        .order("created_at", { ascending: false });

    if (error || !businesses) return [];

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const dateStr = thirtyDaysAgo.toISOString();

    // Fetch recent orders for ALL businesses in one go would be optimal, 
    // but simpler to do separate queries or one big query group by.
    // Let's do one big query for recent orders and aggregate in memory.
    const { data: recentOrders } = await supabaseAdmin
        .from("orders")
        .select("business_id, total_cents")
        .gte("created_at", dateStr)
        .in("status", ["confirmed", "delivered", "ready", "preparing"]);

    const statsMap = new Map<string, { rev: number; count: number }>();

    recentOrders?.forEach(o => {
        if (!o.business_id) return;
        const curr = statsMap.get(o.business_id) || { rev: 0, count: 0 };
        curr.rev += (o.total_cents || 0);
        curr.count += 1;
        statsMap.set(o.business_id, curr);
    });

    return businesses.map(b => {
        // Parse plan safely
        let plan = "starter";
        try {
            const t = typeof b.theme_config === 'string' ? JSON.parse(b.theme_config) : b.theme_config;
            plan = t?.subscription || "starter";
        } catch { }

        const s = statsMap.get(b.id) || { rev: 0, count: 0 };

        return {
            id: b.id,
            name: b.name || "Sin nombre",
            slug: b.slug,
            email: b.email,
            subscription_plan: plan,
            created_at: b.created_at,
            revenue_30d_cents: s.rev,
            orders_30d: s.count,
            is_active: true, // Placeholder until we have a real 'active' column
            image_url: b.image_url
        };
    });
}

export async function updateBusinessPlan(businessId: string, newPlan: string) {
    try {
        const { data: biz, error: fetchError } = await supabaseAdmin
            .from('businesses')
            .select('theme_config')
            .eq('id', businessId)
            .single();

        if (fetchError || !biz) throw new Error("Business not found");

        // Ensure theme_config is an object
        let currentConfig = biz.theme_config;
        if (typeof currentConfig === 'string') {
            try {
                currentConfig = JSON.parse(currentConfig);
            } catch {
                currentConfig = {};
            }
        }
        if (!currentConfig) currentConfig = {};

        const newConfig = { ...currentConfig, subscription: newPlan };

        const { error: updateError } = await supabaseAdmin
            .from('businesses')
            .update({ theme_config: newConfig })
            .eq('id', businessId);

        if (updateError) throw updateError;

        revalidatePath('/superadmin');
        return { success: true };
    } catch (e) {
        console.error("Error updating plan:", e);
        return { success: false, error: 'Failed to update plan' };
    }
}
