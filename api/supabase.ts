// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// O "!" no final diz ao TypeScript: "Eu garanto que essa variável existe no .env"
export const supabase = createClient(supabaseUrl, supabaseAnonKey);