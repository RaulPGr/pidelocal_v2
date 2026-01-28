
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
    console.log('--- Inspecting Last 5 Businesses ---');

    const { data: businesses } = await supabase
        .from('businesses')
        .select('id, name, slug, created_at')
        .order('created_at', { ascending: false })
        .limit(5);

    if (!businesses) return;

    for (const b of businesses) {
        console.log(`\nBiz: ${b.name} (${b.slug}) [${b.id}] - Created: ${b.created_at}`);

        const { data: cats } = await supabase
            .from('categories')
            .select('id, name, sort_order')
            .eq('business_id', b.id)
            .order('sort_order', { ascending: true }) // Emulate API
            .order('name', { ascending: true });

        if (cats && cats.length > 0) {
            cats.forEach(c => {
                console.log(`   [${c.id}] ${c.name.padEnd(15)} | sort_order: ${c.sort_order}`);
            });
        } else {
            console.log('   (No categories)');
        }
    }
}

main();
