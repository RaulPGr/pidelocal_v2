// src/lib/supabase.ts
import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Usamos createBrowserClient para que las sesiones se guarden en cookies
// y el servidor (Middleware/Server Components) pueda leerlas autom\u00e1ticamente.
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);
