import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET() {
    try {
        const { data: businesses, error } = await supabaseAdmin
            .from("businesses")
            .select("*");

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({
            count: businesses?.length,
            rows: businesses
        }, { status: 200 });

    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
