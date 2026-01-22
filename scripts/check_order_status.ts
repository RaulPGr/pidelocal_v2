
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    const idFragment = process.argv[2];
    if (!idFragment) {
        console.log("Provide order ID fragment");
        return;
    }

    const { data, error } = await supabase
        .from('orders')
        .select('*')
        .ilike('id', `%${idFragment}%`)
        .single();

    if (error) {
        console.error("Error:", error);
    } else {
        console.log("Order Found:", {
            id: data.id,
            status: data.status,
            payment_method: data.payment_method,
            payment_status: data.payment_status,
            created_at: data.created_at
        });
    }
}

main();
