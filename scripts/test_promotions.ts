
// scripts/test_promotions.ts
import { config } from 'dotenv';
import { resolve } from 'path';

// Manual env load
config({ path: resolve(process.cwd(), '.env.local') });

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('Missing env vars');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function main() {
    console.log('--- Testing Promotions CRUD ---');

    // 1. Get a Business ID (first one found)
    const { data: businesses } = await supabase.from('businesses').select('id, slug').limit(1);
    if (!businesses || businesses.length === 0) {
        console.error('No business found to test with.');
        return;
    }
    const business = businesses[0];
    console.log(`Using Business: ${business.slug} (${business.id})`);

    // 2. Create Promotion via Payload simulation (mimicking what API does)
    const newPromo = {
        business_id: business.id,
        name: '__TEST_PROMO_ANTIGRAVITY__',
        type: 'percent',
        value: 10,
        scope: 'order',
        active: true,
        weekdays: [1, 2, 3, 4, 5, 6, 7]
    };

    console.log('Creating Promotion...');
    const { data: created, error: createError } = await supabase
        .from('promotions')
        .insert(newPromo)
        .select()
        .single();

    if (createError) {
        console.error('Create Failed:', createError);
        return;
    }
    console.log('✅ Created:', created.id, created.name);

    // 3. Update Promotion (add product scope)
    // Find a product first
    const { data: products } = await supabase.from('products').select('id').eq('business_id', business.id).limit(2);
    const productIds = products?.map(p => p.id) || [];

    console.log('Updating Promotion with product scope...');
    const updatePayload = {
        scope: 'product',
        target_product_ids: productIds,
        // Backend logic also sets target_product_id to first one
        target_product_id: productIds[0] || null
    };

    const { error: updateError } = await supabase
        .from('promotions')
        .update(updatePayload)
        .eq('id', created.id);

    if (updateError) {
        console.error('Update Failed:', updateError);
    } else {
        console.log('✅ Updated successfully');
    }

    // 4. Verify Update
    const { data: verified } = await supabase.from('promotions').select('*').eq('id', created.id).single();
    console.log('Current State:', {
        scope: verified.scope,
        target_product_ids: verified.target_product_ids,
        target_product_id: verified.target_product_id
    });

    if (verified.scope === 'product' && Array.isArray(verified.target_product_ids)) {
        console.log('✅ Verification Passed: Scope and IDs stored correctly.');
    } else {
        console.error('❌ Verification Failed');
    }

    // 5. Cleanup
    console.log('Cleaning up...');
    await supabase.from('promotions').delete().eq('id', created.id);
    console.log('✅ Deleted test promotion');
}

main().catch(console.error);
