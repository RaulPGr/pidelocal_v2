import HelpClient from "./HelpClient";
import { cookies } from "next/headers";
import { getSubscriptionForSlug } from "@/lib/subscription-server";

export const metadata = {
    title: "Centro de Ayuda - PideLocal Panel",
};

export default async function HelpPage() {
    let businessId = "";
    try {
        const c = await cookies();
        const slug = c.get("x-tenant-slug")?.value;
        if (slug) {
            const sub = await getSubscriptionForSlug(slug);
            businessId = sub.businessId || "";
        }
    } catch { }

    return <HelpClient businessId={businessId} />;
}
