import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Faltando variáveis de ambiente do Supabase (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY)');
}

/**
 * Cliente Supabase Singleton
 * Centraliza a conexão e garante que as variáveis de ambiente estejam presentes.
 */
export const supabase = createClient(
  supabaseUrl || '',
  supabaseAnonKey || ''
);

// Tipo utilitário para o padrão Result [data, error]
export type Result<T, E = Error> = [T | null, E | null];
