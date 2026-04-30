import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAdditionalInfo() {
  const dummy = {
    seller_id: '11111111-1111-1111-1111-111111111111',
    seller_name: 'Test',
    client_name: 'Test Client 2',
    cnpj: '00.000.000/0000-01',
    contact: 'Test Contact',
    contracted_routes: ['Test'],
    rates: 'Test',
    billing_type: 'Test',
    server_id: 'Test',
    ips: 'Test',
    approx_channels: 'Test',
    status: 'ANALYSIS',
    additional_info: 'This is a test'
  };

  const { error: insertError } = await supabase.from('client_registrations').insert([dummy]).select();
  if (insertError) {
    console.log('Insert error with additional_info:', insertError.message);
  } else {
    console.log('Insert with additional_info successful!');
  }
}

checkAdditionalInfo();
