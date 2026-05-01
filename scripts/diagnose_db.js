import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.VITE_SUPABASE_ANON_KEY;

const adminClient = createClient(supabaseUrl, serviceKey);

async function diagnose() {
  console.log('\n========================================');
  console.log('  DIAGNÓSTICO COMPLETO DO SUPABASE');
  console.log('========================================\n');

  // 1. Verificar conexão
  console.log('1. CONEXÃO');
  console.log('   URL:', supabaseUrl);
  console.log('   Service Key:', serviceKey ? '✅ Presente' : '❌ AUSENTE');
  console.log('   Anon Key:', anonKey ? '✅ Presente' : '❌ AUSENTE');

  // 2. Verificar todas as tabelas
  console.log('\n2. TABELAS');
  const allTables = [
    'routes', 'route_history', 'sellers', 'client_registrations',
    'transactions', 'commissions', 'cdr_records', 'tickets',
    'pendencies', 'receipts', 'user_permissions'
  ];

  for (const table of allTables) {
    const { data, error, count } = await adminClient
      .from(table)
      .select('*', { count: 'exact' });

    if (error) {
      console.log(`   ❌ ${table}: ERRO - ${error.message}`);
    } else {
      console.log(`   ✅ ${table}: OK (${data.length} registros)`);
    }
  }

  // 3. Verificar usuários auth
  console.log('\n3. USUÁRIOS AUTH');
  const { data: authUsers, error: authError } = await adminClient.auth.admin.listUsers();
  if (authError) {
    console.log('   ❌ Erro ao listar usuários:', authError.message);
  } else {
    authUsers.users.forEach(u => {
      console.log(`   👤 ${u.email} (ID: ${u.id})`);
    });
  }

  // 4. Verificar permissões
  console.log('\n4. PERMISSÕES');
  const { data: perms, error: permsError } = await adminClient
    .from('user_permissions')
    .select('*');

  if (permsError) {
    console.log('   ❌ Erro ao verificar permissões:', permsError.message);
  } else if (perms.length === 0) {
    console.log('   ⚠️  NENHUMA permissão encontrada! Isso explica o problema.');
  } else {
    perms.forEach(p => {
      console.log(`   👤 ${p.username || 'sem-nome'} | Role: ${p.role} | Finance: ${p.can_view_finance} | Routes: ${p.can_manage_routes} | Sellers: ${p.can_view_sellers} | Tickets: ${p.can_manage_tickets}`);
    });
  }

  // 5. Testar INSERT com anon key (simula o que o frontend faz)
  console.log('\n5. TESTE DE INSERT (simulando frontend)');

  // Primeiro, vamos buscar um user para fazer login
  if (authUsers?.users?.length > 0) {
    const testUser = authUsers.users[0];
    console.log(`   Testando com usuário: ${testUser.email}`);

    // Testar insert com service role (deve funcionar sempre)
    const testSeller = {
      id: crypto.randomUUID(),
      name: 'TESTE_DIAGNOSTICO',
      email: 'teste@diagnostico.com',
      status: 'ACTIVE',
      portfolio_size: 0,
      active_clients: 0,
      default_rate: 0,
      performance_score: 0,
      created_at: new Date().toISOString()
    };

    const { data: insertData, error: insertError } = await adminClient
      .from('sellers')
      .insert([testSeller])
      .select();

    if (insertError) {
      console.log(`   ❌ INSERT falhou (service role): ${insertError.message}`);
      console.log('   ⚠️  Problema na estrutura da tabela sellers!');
    } else {
      console.log('   ✅ INSERT com service role: OK');

      // Limpar o registro de teste
      await adminClient.from('sellers').delete().eq('id', testSeller.id);
      console.log('   🧹 Registro de teste removido');
    }
  }

  // 6. Verificar RLS policies
  console.log('\n6. VERIFICANDO RLS POLICIES');
  const { data: rlsData, error: rlsError } = await adminClient.rpc('exec_sql', {
    sql: `
      SELECT tablename, policyname, permissive, cmd, qual
      FROM pg_policies 
      WHERE schemaname = 'public' 
      ORDER BY tablename, policyname;
    `
  });

  if (rlsError) {
    // Tentar método alternativo
    console.log('   ⚠️  Não foi possível consultar pg_policies diretamente.');
    console.log('   Tentando verificar via select com anon key...');

    const anonClient = createClient(supabaseUrl, anonKey);
    
    // Tentar login como pauloricardo
    const { data: loginData, error: loginError } = await anonClient.auth.signInWithPassword({
      email: 'paulinhosheldom@gmail.com',
      password: 'Gerax@2025'
    });

    if (loginError) {
      console.log(`   ❌ Login falhou: ${loginError.message}`);
      console.log('   ⚠️  Isso significa que o frontend não consegue se autenticar!');
    } else {
      console.log(`   ✅ Login OK como: ${loginData.user.email}`);

      // Testar SELECT
      for (const table of ['sellers', 'routes', 'transactions', 'tickets']) {
        const { data: d, error: e } = await anonClient.from(table).select('*');
        console.log(`   ${e ? '❌' : '✅'} SELECT ${table}: ${e ? e.message : `OK (${d.length} registros)`}`);
      }

      // Testar INSERT como usuário autenticado
      const testInsert = {
        id: crypto.randomUUID(),
        name: 'TESTE_RLS',
        email: 'rls@teste.com',
        status: 'ACTIVE',
        portfolio_size: 0,
        active_clients: 0,
        default_rate: 0,
        performance_score: 0,
        created_at: new Date().toISOString()
      };

      const { error: rlsInsertError } = await anonClient.from('sellers').insert([testInsert]).select();
      if (rlsInsertError) {
        console.log(`   ❌ INSERT sellers (como user): ${rlsInsertError.message}`);
        console.log('   🔴 RLS está BLOQUEANDO inserções! Precisa corrigir as policies.');
      } else {
        console.log('   ✅ INSERT sellers (como user): OK');
        await adminClient.from('sellers').delete().eq('id', testInsert.id);
        console.log('   🧹 Registro de teste removido');
      }

      await anonClient.auth.signOut();
    }
  } else {
    console.log('   Policies encontradas:');
    rlsData?.forEach(p => {
      console.log(`   📜 ${p.tablename}: ${p.policyname} (${p.cmd}) - ${p.permissive}`);
    });
  }

  console.log('\n========================================');
  console.log('  DIAGNÓSTICO CONCLUÍDO');
  console.log('========================================\n');
}

diagnose().catch(console.error);
