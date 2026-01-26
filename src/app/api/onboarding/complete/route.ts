import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: Request) {
    try {
        const { userId, email, businessName, slug, plan } = await req.json();

        if (!userId || !slug || !businessName) {
            return NextResponse.json({ error: "Faltan datos requeridos" }, { status: 400 });
        }

        // 1. Verify slug uniqueness
        const { data: existing } = await supabaseAdmin
            .from("businesses")
            .select("id")
            .eq("slug", slug)
            .maybeSingle();

        if (existing) {
            return NextResponse.json({ error: "Este identificador (slug) ya está en uso. Prueba con otro." }, { status: 409 });
        }

        // 2. Create Business
        const { data: business, error: bizError } = await supabaseAdmin
            .from("businesses")
            .insert({
                name: businessName,
                slug: slug,
                // subscription_plan legacy: stored in theme_config
                email: email, // Contact email
                theme_config: {
                    subscription: plan || "starter",
                    billing: {
                        trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
                        subscription_status: 'trialing'
                    }
                }
            })
            .select()
            .single();

        if (bizError) {
            console.error("Error creating business", bizError);
            return NextResponse.json({
                error: bizError.message || "Error al crear el restaurante.",
                details: bizError.details
            }, { status: 500 });
        }

        // 2.5 Verify User Exists in Auth (Debug step)
        const { data: { user: authUser }, error: authCheckError } = await supabaseAdmin.auth.admin.getUserById(userId);
        if (authCheckError || !authUser) {
            console.error("User not found in Auth:", authCheckError);
            return NextResponse.json({ error: "El usuario no se creó correctamente en el sistema de autenticación." }, { status: 500 });
        }

        // 3. Link User as Member (Owner)
        const { error: linkError } = await supabaseAdmin
            .from("business_members")
            .insert({
                business_id: business.id,
                user_id: userId,
                role: "owner"
            });

        if (linkError) {
            console.error("Error linking user", linkError);
            // Return detailed error for debugging
            return NextResponse.json({ error: "Error al asignar permisos: " + linkError.message + " | " + linkError.details }, { status: 500 });
        }

        return NextResponse.json({ ok: true, slug: business.slug });

    } catch (e: any) {
        console.error(e);
        return NextResponse.json({ error: e.message || "Error interno" }, { status: 500 });
    }
}
