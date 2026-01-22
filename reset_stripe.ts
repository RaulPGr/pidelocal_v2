
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://xkazwwaaustjofhikjpt.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhrYXp3d2FhdXN0am9maGlranB0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDY0NjgxMSwiZXhwIjoyMDc2MjIyODExfQ.bdusjtXm--eeYwCz2AiUnxBST514KdksvzP-0Dhd6YQ";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function clearStripe() {
    console.log('--- Reseteando conexión Stripe para prueba-3 ---');

    // 1. Get current social
    const { data: business } = await supabase
        .from('businesses')
        .select('social')
        .eq('slug', 'prueba-3')
        .single();

    if (!business) {
        console.error('Negocio no encontrado');
        return;
    }

    const newSocial = { ...business.social, stripe_account_id: null };

    // 2. Update
    const { error } = await supabase
        .from('businesses')
        .update({ social: newSocial })
        .eq('slug', 'prueba-3');

    if (error) console.error('Error:', error);
    else console.log('✅ Conexión eliminada. Listo para reconectar.');
}

clearStripe();
