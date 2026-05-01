import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkRLS() {
  const { data, error } = await supabase.rpc('check_rls_status', { table_name: 'user_permissions' });
  
  if (error) {
    console.log('RPC check_rls_status not available. Checking manually via pg_tables...');
    const { data: tables, error: tableError } = await supabase.rpc('get_tables_info'); // Another guess
    
    if (tableError) {
       // Just check if we can select everything as service role
       const { data: all, error: allErr } = await supabase.from('user_permissions').select('*');
       console.log('Service role can see all:', all?.length, 'rows');
    }
  }
}

checkRLS();
