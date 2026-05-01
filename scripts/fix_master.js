import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase configuration in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixMasterUser() {
  const masterUsername = 'pauloricardo';
  const masterEmail = 'paulinhosheldom@gmail.com';
  const masterPassword = 'lK2EUIOIJH9$';

  console.log(`Checking for master user: ${masterEmail}...`);

  // 1. Get user from Auth
  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) {
    console.error('Error listing users:', listError.message);
    return;
  }

  let user = users.find(u => u.email === masterEmail);
  let userId = '';

  if (user) {
    console.log('User exists. Updating password and confirming email...');
    userId = user.id;
    const { error: updateError } = await supabase.auth.admin.updateUserById(userId, {
      password: masterPassword,
      email_confirm: true
    });
    if (updateError) {
      console.error('Error updating user:', updateError.message);
      return;
    }
    console.log('User updated successfully.');
  } else {
    console.log('User does not exist. Creating...');
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email: masterEmail,
      password: masterPassword,
      email_confirm: true,
      user_metadata: { username: masterUsername }
    });
    if (createError) {
      console.error('Error creating user:', createError.message);
      return;
    }
    userId = newUser.user.id;
    console.log('User created successfully.');
  }

  // 2. Check/Fix user_permissions
  console.log('Checking permissions for user ID:', userId);
  const { data: perms, error: permsError } = await supabase
    .from('user_permissions')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (permsError && permsError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
    console.error('Error checking permissions:', permsError.message);
    return;
  }

  if (perms) {
    console.log('Permissions entry exists. Ensuring role is MASTER...');
    const { error: updatePermsError } = await supabase
      .from('user_permissions')
      .update({ role: 'MASTER', username: masterUsername })
      .eq('user_id', userId);
    
    if (updatePermsError) {
      console.error('Error updating permissions:', updatePermsError.message);
    } else {
      console.log('Permissions updated successfully.');
    }
  } else {
    console.log('Permissions entry does not exist. Creating...');
    const { error: insertPermsError } = await supabase
      .from('user_permissions')
      .insert({
        user_id: userId,
        role: 'MASTER',
        username: masterUsername
      });
    
    if (insertPermsError) {
      console.error('Error inserting permissions:', insertPermsError.message);
    } else {
      console.log('Permissions created successfully.');
    }
  }

  console.log('\n--- MASTER ACCESS CONFIGURED ---');
  console.log(`Username: ${masterUsername}`);
  console.log(`Password: ${masterPassword}`);
  console.log('--------------------------------');
}

fixMasterUser();
