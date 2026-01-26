"use server";

import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { normalizeSubscriptionPlan, type SubscriptionPlan } from "./subscription";

export type SubscriptionInfo = {
  plan: SubscriptionPlan;
  ordersEnabled: boolean;
  businessId?: string;
  businessName?: string;
  isTrial?: boolean;
  trialEndsAt?: string;
  subscriptionStatus?: string;
  debugError?: string;
};

export async function getSubscriptionForSlug(slug: string): Promise<SubscriptionInfo> {
  const safeSlug = (slug || "").trim();
  if (!safeSlug) return { plan: "premium", ordersEnabled: true };
  try {
    const { data, error } = await supabaseAdmin
      .from("businesses")
      .select("id, name, theme_config, social")
      .eq("slug", safeSlug)
      .maybeSingle();

    if (error || !data) return { plan: "starter", ordersEnabled: true }; // Default fallback

    let theme = (data as any)?.theme_config;
    if (typeof theme === 'string') {
      try {
        theme = JSON.parse(theme);
      } catch (e) {
        theme = {};
      }
    }
    theme = theme ?? {};
    const billing = theme?.billing || {};

    // Explicit plan from DB column (which we set on onboarding) - subscription_plan column removed
    let plan = normalizeSubscriptionPlan(theme?.subscription);

    const status = billing.subscription_status || 'active'; // Default active for legacy
    const trialEnds = billing.trial_ends_at;
    let isTrial = status === 'trialing';

    // Check expiration
    if (isTrial && trialEnds) {
      const now = new Date();
      const end = new Date(trialEnds);
      if (now > end) {
        // Trial Expired - Logic can be expanded here
      }
    }

    const social = (data as any)?.social || {};
    const ordersEnabled = social?.orders_enabled !== false;

    return {
      plan,
      ordersEnabled,
      businessId: (data as any)?.id,
      businessName: (data as any)?.name,
      isTrial,
      trialEndsAt: trialEnds,
      subscriptionStatus: status
    };
  } catch {
    return { plan: "starter", ordersEnabled: true };
  }
}
