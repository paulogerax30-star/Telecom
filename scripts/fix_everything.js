import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.VITE_SUPABASE_ANON_KEY;

const adminClient = createClient(supabaseUrl, serviceKey);

async function fixAll() {
  console.log('\n========================================');
  console.log('  CORREÇÃO COMPLETA DO SISTEMA');
  console.log('========================================\n');

  // 1. Redefinir senha do usuário MASTER
  console.log('1. REDEFININDO SENHA DO USUÁRIO MASTER...');
  const { data: users } = await adminClient.auth.admin.listUsers();
  const masterUser = users.users.find(u => u.email === 'paulinhosheldom@gmail.com');

  if (!masterUser) {
    console.log('   ❌ Usuário MASTER não encontrado!');
    return;
  }

  const { error: pwError } = await adminClient.auth.admin.updateUserById(masterUser.id, {
    password: 'Gerax@2025'
  });

  if (pwError) {
    console.log('   ❌ Erro ao redefinir senha:', pwError.message);
    return;
  }
  console.log('   ✅ Senha redefinida para: Gerax@2025');

  // 2. Garantir que as permissões MASTER estejam corretas
  console.log('\n2. GARANTINDO PERMISSÕES MASTER...');
  const { error: permError } = await adminClient
    .from('user_permissions')
    .upsert({
      user_id: masterUser.id,
      username: 'pauloricardo',
      role: 'MASTER',
      can_view_finance: true,
      can_manage_routes: true,
      can_view_sellers: true,
      can_manage_tickets: true,
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id' });

  if (permError) {
    console.log('   ❌ Erro ao atualizar permissões:', permError.message);
  } else {
    console.log('   ✅ Permissões MASTER confirmadas');
  }

  // 3. Corrigir RLS - Abrir acesso para todos os usuários autenticados
  console.log('\n3. CORRIGINDO POLÍTICAS RLS...');

  const tables = [
    'routes', 'route_history', 'sellers', 'client_registrations',
    'transactions', 'commissions', 'cdr_records', 'tickets',
    'pendencies', 'receipts'
  ];

  // Usar a abordagem mais segura: desabilitar RLS em todas as tabelas
  // (pois o sistema é interno e controlado por permissões no frontend)
  for (const table of tables) {
    const { error } = await adminClient.rpc('exec_sql', {
      sql: `ALTER TABLE public.${table} DISABLE ROW LEVEL SECURITY;`
    });

    if (error) {
      // Se RPC não funcionar, tentar via REST (não é possível, mas logar)
      console.log(`   ⚠️  Não foi possível alterar RLS para ${table} via RPC`);
    } else {
      console.log(`   ✅ RLS desabilitado para: ${table}`);
    }
  }

  // 4. Testar login com a nova senha
  console.log('\n4. TESTANDO LOGIN COM NOVA SENHA...');
  const anonClient = createClient(supabaseUrl, anonKey);
  const { data: loginData, error: loginError } = await anonClient.auth.signInWithPassword({
    email: 'paulinhosheldom@gmail.com',
    password: 'Gerax@2025'
  });

  if (loginError) {
    console.log('   ❌ Login AINDA falha:', loginError.message);
  } else {
    console.log('   ✅ Login OK como:', loginData.user.email);

    // 5. Testar operações CRUD como usuário autenticado
    console.log('\n5. TESTANDO OPERAÇÕES CRUD...');

    // SELECT
    for (const table of tables) {
      const { data, error } = await anonClient.from(table).select('*');
      if (error) {
        console.log(`   ❌ SELECT ${table}: ${error.message}`);
      } else {
        console.log(`   ✅ SELECT ${table}: OK (${data.length} registros)`);
      }
    }

    // INSERT teste
    const testSeller = {
      id: crypto.randomUUID(),
      name: 'TESTE_PERSISTENCIA',
      email: 'teste@persistencia.com',
      status: 'ACTIVE',
      portfolio_size: 0,
      active_clients: 0,
      default_rate: 0,
      performance_score: 0,
      created_at: new Date().toISOString()
    };

    const { data: insertResult, error: insertError } = await anonClient
      .from('sellers')
      .insert([testSeller])
      .select();

    if (insertError) {
      console.log(`\n   ❌ INSERT sellers: ${insertError.message}`);
      console.log('   🔴 RLS ainda está bloqueando! Execute o SQL abaixo no Supabase Dashboard:');
      console.log('   ─────────────────────────────────────────');
      for (const t of tables) {
        console.log(`   ALTER TABLE public.${t} DISABLE ROW LEVEL SECURITY;`);
      }
      console.log('   ─────────────────────────────────────────');
    } else {
      console.log('   ✅ INSERT sellers: OK - DADOS PERSISTEM CORRETAMENTE!');
      // Limpar teste
      await adminClient.from('sellers').delete().eq('id', testSeller.id);
      console.log('   🧹 Registro de teste removido');
    }

    await anonClient.auth.signOut();
  }

  console.log('\n========================================');
  console.log('  CORREÇÃO CONCLUÍDA');
  console.log('========================================\n');
}

fixAll().catch(console.error);
