
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
  console.log('--- Finding Business with "Milanesas" ---');

  // Find the category first
  const { data: cats, error } = await supabase
    .from('categories')
    .select('id, name, business_id, sort_order')
    .ilike('name', 'Milanesas')
    .limit(1);

  if (error) { console.error(error); return; }
  if (!cats || cats.length === 0) {
    console.log("No category 'Milanesas' found.");
    return;
  }

  const targetCat = cats[0];
  console.log(`Found category: ${targetCat.name} (BizID: ${targetCat.business_id})`);

  // Get Business Name
  const { data: biz } = await supabase
    .from('businesses')
    .select('id, name, slug')
    .eq('id', targetCat.business_id)
    .single();

  console.log(`Business: ${biz?.name} (Slug: ${biz?.slug})\n`);

  // Get ALL categories for this business
  const { data: allCats } = await supabase
    .from('categories')
    .select('id, name, sort_order')
    .eq('business_id', targetCat.business_id)
    .order('sort_order', { ascending: true }); // Check how DB returns it

  console.log('--- Current DB Order (by sort_order ASC) ---');
  allCats?.forEach(c => {
    console.log(`[${c.id}] ${c.name.padEnd(15)} | Order: ${c.sort_order}`);
  });
}

main();
