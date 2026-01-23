
import { supabaseAdmin } from "@/lib/supabaseAdmin";

async function main() {
    console.log("Checking reservations table schema...");
    // Try to insert a dummy record with a potential zone_id column to see if it fails, 
    // OR just select * limit 1 and print keys.

    const { data, error } = await supabaseAdmin
        .from('reservations')
        .select('*')
        .limit(1);

    if (error) {
        console.error("Error selecting:", error);
    } else {
        console.log("Columns found via Select *:", data && data.length > 0 ? Object.keys(data[0]) : "No rows found, cannot infer keys easily.");
    }
}

main().catch(console.error);
