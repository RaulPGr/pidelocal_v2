
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
    console.error("Missing credentials");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    console.log("Fetching last 5 orders...");
    const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

    if (error) {
        console.error("Error:", error);
    } else {
        data.forEach(o => {
            console.log(`[${o.created_at}] ID:${o.id} Code:${o.code}`);
            console.log(`    Status: ${o.status}`);
            console.log(`    Payment: ${o.payment_method} | Status: ${o.payment_status}`);
            console.log("---------------------------------------------------");
        });
    }
}

main();
