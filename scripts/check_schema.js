import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkSchema() {
  const { data, error } = await supabase.rpc('get_schema_details'); // This might not exist
  
  if (error) {
    console.log('RPC get_schema_details failed, trying direct query...');
    // Fallback to querying user_permissions
    const { data: cols, error: colError } = await supabase
      .from('user_permissions')
      .select('*')
      .limit(1);
    
    if (colError) {
      console.error('Error fetching user_permissions:', colError.message);
    } else {
      console.log('user_permissions sample data:', cols);
    }
  } else {
    console.log('Schema details:', data);
  }
}

checkSchema();
