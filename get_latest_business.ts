
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://xkazwwaaustjofhikjpt.supabase.co";
const supabaseServiceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhrYXp3d2FhdXN0am9maGlranB0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDY0NjgxMSwiZXhwIjoyMDc2MjIyODExfQ.bdusjtXm--eeYwCz2AiUnxBST514KdksvzP-0Dhd6YQ";

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
    const { data, error } = await supabase
        .from('businesses')
        .select('name, slug, created_at')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

    if (error) {
        console.error('Error fetching business:', error);
    } else {
        console.log('Latest Business:', JSON.stringify(data, null, 2));
    }
}

main();
