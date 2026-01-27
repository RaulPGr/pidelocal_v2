import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: Request) {
    try {
        const { userId, email, businessName, slug, plan, password } = await req.json();

        // Must have EITHER (userId + slug + businessName) OR (email + password + slug + businessName)
        if (!slug || !businessName || !(userId || (email && password))) {
            return NextResponse.json({ error: "Faltan datos requeridos (Email/Pass o UserID)" }, { status: 400 });
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

        // 2.5 Ensure User Exists (Server-Side Registration or Client ID)
        let finalUserId = userId;

        if (email && password) {
            // Check if user exists first to avoid error spam
            const { data: { users: searchUsers } } = await supabaseAdmin.auth.admin.listUsers();
            const found = searchUsers?.find(u => u.email?.toLowerCase() === email.toLowerCase());

            if (found) {
                finalUserId = found.id;
            } else {
                // Create user
                const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
                    email: email,
                    password: password,
                    email_confirm: true,
                    user_metadata: { full_name: businessName }
                });

                if (createError) {
                    return NextResponse.json({ error: "Error creando usuario: " + createError.message }, { status: 500 });
                }
                finalUserId = newUser.user!.id; // Non-null assertion safe if no error
            }
        } else if (userId) {
            // Verify provided userId exists
            const { data: { user: authUser }, error: authCheckError } = await supabaseAdmin.auth.admin.getUserById(userId);
            if (authCheckError || !authUser) {
                return NextResponse.json({ error: `Usuario ID ${userId} no encontrado.` }, { status: 404 });
            }
        } else {
            return NextResponse.json({ error: "No se pudo determinar el usuario." }, { status: 400 });
        }

        // 3. Link User as Member (Owner)
        const { error: linkError } = await supabaseAdmin
            .from("business_members")
            .insert({
                business_id: business.id,
                user_id: finalUserId,
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
