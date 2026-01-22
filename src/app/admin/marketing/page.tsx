
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import MarketingClient from "./MarketingClient";

export const metadata = {
    title: "Marketing | PideLocal Admin",
};

export default async function MarketingPage() {
    const cookieStore = await cookies();
    const slug = cookieStore.get("x-tenant-slug")?.value;

    if (!slug) {
        return <div className="p-8">Error: No se ha seleccionado ningún negocio.</div>;
    }

    const { supabaseAdmin } = await import("@/lib/supabaseAdmin");

    // Fetch the SPECIFIC business by slug
    const { data: business } = await supabaseAdmin
        .from('businesses')
        .select('id, name, slug, logo_url')
        .eq('slug', slug)
        .single();

    if (!business) {
        return <div className="p-8">Negocio no encontrado o no tienes acceso.</div>;
    }

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <MarketingClient
                tenantName={business.name}
                tenantSlug={business.slug}
                logoUrl={business.logo_url}
            />
        </div>
    );
}
