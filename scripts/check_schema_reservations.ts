
import { supabaseAdmin } from "@/lib/supabaseAdmin";

async function main() {
    console.log("Checking businesses table schema...");
    const { data: businesses, error: bizError } = await supabaseAdmin
        .from('businesses')
        .select('slug, social')
        .limit(1);

    if (bizError) {
        console.error("Error selecting businesses:", bizError);
    } else {
        console.log("Business found:", businesses && businesses.length > 0 ? businesses[0] : "None");
        if (businesses && businesses.length > 0) {
            const social = businesses[0].social;
            console.log("Social column type:", typeof social);
            console.log("Social keys:", social ? Object.keys(social) : "null");
            console.log("Reservations Zones:", social?.reservations_zones);
        }
    }
}

main().catch(console.error);
