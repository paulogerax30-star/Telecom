import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function updateUser() {
  const email = 'mariocromia@gmail.com';
  const password = '338229';

  const { data: users, error: listError } = await supabase.auth.admin.listUsers();
  
  const user = users.users.find(u => u.email === email);

  if (user) {
    console.log(`Updating password for user: ${email}...`);
    const { error } = await supabase.auth.admin.updateUserById(user.id, {
      password: password,
      email_confirm: true
    });

    if (error) console.error('Error:', error.message);
    else console.log('Password updated successfully!');
  } else {
    console.log('User not found, creating...');
    const { error } = await supabase.auth.admin.createUser({
      email, password, email_confirm: true
    });
    if (error) console.error('Error:', error.message);
    else console.log('User created successfully!');
  }
}

updateUser();
