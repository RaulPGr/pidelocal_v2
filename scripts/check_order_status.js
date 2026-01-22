
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

function getEnv() {
    try {
        const envPath = path.join(process.cwd(), '.env.local');
        const content = fs.readFileSync(envPath, 'utf8');
        const env = {};
        content.split('\n').forEach(line => {
            const parts = line.split('=');
            if (parts.length >= 2) {
                const key = parts[0].trim();
                const value = parts.slice(1).join('=').trim().replace(/"/g, '');
                if (key && value && !key.startsWith('#')) env[key] = value;
            }
        });
        return env;
    } catch (e) { return {}; }
}

const env = getEnv();
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing credentials in .env.local");
    process.exit(1);
}

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
        .maybeSingle();

    if (error) {
        console.error("Error:", error);
    } else if (!data) {
        console.log("Order Not Found");
    } else {
        console.log("Order Found (" + data.id + "):");
        console.log("  Status:", data.status);
        console.log("  Payment Method:", data.payment_method);
        console.log("  Payment Status:", data.payment_status);
        console.log("  Created At:", data.created_at);
    }
}

main();
