
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
    const slug = 'lafarola';
    console.log(`Fixing categories for: ${slug}`);

    const { data: biz } = await supabase.from('businesses').select('id').eq('slug', slug).single();
    if (!biz) { console.error('Business not found'); return; }

    // Get categories ordered by ID (Creation order, which is what Admin checks)
    const { data: cats } = await supabase
        .from('categories')
        .select('id, name')
        .eq('business_id', biz.id)
        .order('id', { ascending: true });

    if (!cats) return;

    console.log('--- Applying Sort Order based on Creation Order ---');
    for (let i = 0; i < cats.length; i++) {
        const c = cats[i];
        const newOrder = i + 1;
        console.log(`Updating ${c.name} (ID: ${c.id}) -> sort_order: ${newOrder}`);

        await supabase
            .from('categories')
            .update({ sort_order: newOrder })
            .eq('id', c.id);
    }
    console.log('Done!');
}

main();
