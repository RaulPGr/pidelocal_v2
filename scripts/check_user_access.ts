
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkAccess() {
    const email = 'raulyecla88@gmail.com';
    console.log(`Checking access for: ${email}`);

    // 1. Find User
    const { data: { users }, error: userError } = await supabase.auth.admin.listUsers();
    const user = users?.find(u => u.email === email);

    if (!user) {
        console.error("User not found in Auth!");
        return;
    }
    console.log(`User found: ${user.id}`);

    // 2. Find Business
    const { data: businesses, error: bizError } = await supabase.from('businesses').select('*');
    if (bizError) console.error(bizError);

    console.log(`Found ${businesses?.length} businesses.`);
    businesses?.forEach(b => {
        console.log(` - ${b.name} (${b.slug}) [${b.id}]`);
    });

    // 3. Find Memberships
    const { data: members, error: memError } = await supabase
        .from('business_members')
        .select('*')
        .eq('user_id', user.id);

    if (memError) console.error(memError);

    console.log(`User memberships:`);
    members?.forEach(m => {
        console.log(` - Role: ${m.role} | BusinessID: ${m.business_id}`);
    });

    // Cross reference
    console.log("Analysis:");
    members?.forEach(m => {
        const b = businesses?.find(biz => biz.id === m.business_id);
        if (b) {
            console.log(`User HAS ACCESS to: ${b.name} (${b.slug})`);
        } else {
            console.log(`User has access to unknown business ID: ${m.business_id}`);
        }
    });

    if (members?.length === 0) {
        console.log("User has NO memberships.");
    }
}

checkAccess();
