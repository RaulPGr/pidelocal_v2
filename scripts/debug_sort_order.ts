
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

function loadEnv() {
    try {
        const envPath = path.resolve(process.cwd(), '.env.local');
        const content = fs.readFileSync(envPath, 'utf-8');
        const env: Record<string, string> = {};
        content.split('\n').forEach(line => {
            const [key, ...val] = line.split('=');
            if (key && val) env[key.trim()] = val.join('=').trim().replace(/^"|"$/g, '');
        });
        return env;
    } catch { return {}; }
}

const env = loadEnv();
const supabase = createClient(
    env.NEXT_PUBLIC_SUPABASE_URL!,
    env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
    console.log('--- Finding Business with "Burgers" and "Bebidas" ---');

    // Find categories named 'Burgers'
    const { data: cats } = await supabase
        .from('categories')
        .select('id, business_id')
        .eq('name', 'Burgers')
        .limit(5);

    if (!cats || cats.length === 0) { console.log("No 'Burgers' found."); return; }

    for (const c of cats) {
        const bid = c.business_id;
        // Check if this biz also has "Bebidas"
        const { data: sibling } = await supabase
            .from('categories')
            .select('id')
            .eq('business_id', bid)
            .eq('name', 'Bebidas')
            .single();

        if (sibling) {
            const { data: b } = await supabase.from('businesses').select('name, slug').eq('id', bid).single();
            console.log(`\nFound candidate business: ${b?.name} (${b?.slug})`);

            const { data: all } = await supabase
                .from('categories')
                .select('*')
                .eq('business_id', bid)
                .order('sort_order', { ascending: true })
                .order('name', { ascending: true });

            all?.forEach(cat => {
                console.log(`  [${cat.id}] ${cat.name.padEnd(15)} | sort_order: ${cat.sort_order}`);
            });
        }
    }
}

main();
