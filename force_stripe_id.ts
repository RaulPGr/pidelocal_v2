
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://xkazwwaaustjofhikjpt.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhrYXp3d2FhdXN0am9maGlranB0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDY0NjgxMSwiZXhwIjoyMDc2MjIyODExfQ.bdusjtXm--eeYwCz2AiUnxBST514KdksvzP-0Dhd6YQ";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const NEW_STRIPE_ID = 'acct_1SrxEc3l9H4HTfhn'; // Taken from user screenshot URL

async function updateStripeId() {
    console.log(`--- Forzando conexión a cuenta Stripe: ${NEW_STRIPE_ID} ---`);

    // 1. Get current business
    const { data: business } = await supabase
        .from('businesses')
        .select('social')
        .eq('slug', 'prueba-3')
        .single();

    if (!business) {
        console.error('Negocio no encontrado');
        return;
    }

    const newSocial = { ...business.social, stripe_account_id: NEW_STRIPE_ID };

    // 2. Update
    const { error } = await supabase
        .from('businesses')
        .update({ social: newSocial })
        .eq('slug', 'prueba-3');

    if (error) {
        console.error('Error actualizando DB:', error);
    } else {
        console.log('✅ Base de datos actualizada con el nuevo ID.');
    }
}

updateStripeId();
