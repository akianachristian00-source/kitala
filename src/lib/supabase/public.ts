import { createClient } from '@supabase/supabase-js';
/** Client anonyme sans cookies : permet le rendu statique + ISR des vitrines. */
export const createPublicClient = () =>
  createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
