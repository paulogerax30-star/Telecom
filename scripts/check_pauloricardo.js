import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkPermissions() {
  const email = 'paulinhosheldom@gmail.com';
  
  const { data: users, error: listError } = await supabase.auth.admin.listUsers();
  const user = users?.users.find(u => u.email === email);
  
  if (!user) {
    console.error('User not found:', email);
    return;
  }
  
  console.log('User ID:', user.id);
  
  const { data: perms, error: permsError } = await supabase
    .from('user_permissions')
    .select('*')
    .eq('user_id', user.id)
    .single();
    
  if (permsError) {
    console.error('Error fetching permissions:', permsError.message);
  } else {
    console.log('Permissions in DB:', perms);
  }
}

checkPermissions();
