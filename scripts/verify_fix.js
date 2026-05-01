import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function verify() {
  const sellerDummy = {
    name: 'Verification Seller',
    email: 'verify@test.com',
    phone: '123456',
    birth_date: '1990-01-01',
    status: 'ACTIVE'
  };

  const { error: sellerError } = await supabase.from('sellers').insert([sellerDummy]).select();
  if (sellerError) {
    console.log('Seller verification error:', sellerError.message);
  } else {
    console.log('Seller verification successful!');
  }

  const clientDummy = {
    seller_id: '11111111-1111-1111-1111-111111111111',
    client_name: 'Verification Client',
    cnpj: '99.999.999/9999-99',
    contact: 'Verify',
    contracted_routes: ['Verify'],
    rates: 'Verify',
    billing_type: 'Verify',
    server_id: '84',
    ips: '1.1.1.1',
    approx_channels: '10',
    additional_info: 'Verification works!',
    status: 'ANALYSIS'
  };

  const { error: clientError } = await supabase.from('client_registrations').insert([clientDummy]).select();
  if (clientError) {
    console.log('Client verification error:', clientError.message);
  } else {
    console.log('Client verification successful!');
  }
}

verify();
