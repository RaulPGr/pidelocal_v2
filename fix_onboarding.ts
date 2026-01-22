
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://xkazwwaaustjofhikjpt.supabase.co";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhrYXp3d2FhdXN0am9maGlranB0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDY0NjgxMSwiZXhwIjoyMDc2MjIyODExfQ.bdusjtXm--eeYwCz2AiUnxBST514KdksvzP-0Dhd6YQ";

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
    const slug = 'prueba-3'; // The user's business
    console.log(`Updating onboarding for slug: ${slug}`);

    const { data: business, error: findError } = await supabase
        .from('businesses')
        .select('id, social')
        .eq('slug', slug)
        .single();

    if (findError || !business) {
        console.error('Business not found', findError);
        return;
    }

    const currentSocial = (business.social as any) || {};
    const newSocial = { ...currentSocial, onboarding_completed: true };

    const { error: updateError } = await supabase
        .from('businesses')
        .update({ social: newSocial })
        .eq('id', business.id);

    if (updateError) {
        console.error('Update failed', updateError);
    } else {
        console.log('✅ Success! Onboarding marked as completed.');
    }
}

main();
