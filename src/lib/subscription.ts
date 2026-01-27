export type SubscriptionPlan = "starter" | "medium" | "premium";

export function normalizeSubscriptionPlan(input: unknown): SubscriptionPlan {
  const raw = String(input ?? "").trim().toLowerCase();
  // Normalize variations
  if (raw.includes("starter") || raw.includes("piloto") || raw.includes("prueba")) return "starter";
  if (raw === "medium") return "medium";
  if (raw === "premium") return "premium";

  // Default fallback
  return "premium";
}

export function subscriptionAllowsOrders(plan: SubscriptionPlan): boolean {
  return true; // We enforce limits in backend for Starter, but feature is enabled
}

export function subscriptionAllowsReservations(plan: SubscriptionPlan): boolean {
  return plan === "medium" || plan === "premium";
}
