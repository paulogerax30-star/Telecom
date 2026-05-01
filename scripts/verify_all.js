import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyAll() {
  console.log('--- Verificando todas as tabelas ---');

  const tables = [
    'routes',
    'sellers',
    'client_registrations',
    'transactions',
    'commissions',
    'tickets',
    'pendencies',
    'receipts'
  ];

  for (const table of tables) {
    const { data, error } = await supabase.from(table).select('*').limit(1);
    if (error) {
      console.log(`Erro na tabela ${table}:`, error.message);
    } else {
      console.log(`Tabela ${table}: OK (Registros: ${data.length})`);
    }
  }
}

verifyAll();
