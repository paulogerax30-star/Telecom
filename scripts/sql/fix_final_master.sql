-- ============================================================
-- GERAX TELECOM - SCRIPT DE CORREÇÃO FINAL (MASTER & RLS)
-- ============================================================

-- 1. Criar função de verificação de MASTER (Evita recursão infinita no RLS)
CREATE OR REPLACE FUNCTION public.is_master()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_permissions 
    WHERE user_id = auth.uid() AND role = 'MASTER'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Corrigir políticas de RLS para a tabela user_permissions
DROP POLICY IF EXISTS "Masters podem gerenciar tudo" ON public.user_permissions;
DROP POLICY IF EXISTS "Usuários podem ver suas próprias permissões" ON public.user_permissions;

CREATE POLICY "Usuários podem ver suas próprias permissões" 
ON public.user_permissions FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

CREATE POLICY "Masters podem gerenciar tudo"
ON public.user_permissions FOR ALL
TO authenticated
USING (public.is_master())
WITH CHECK (public.is_master());

-- 3. Configurar usuário MASTER (paulinhosheldom@gmail.com)
-- Garante que o registro exista e tenha o papel de MASTER
INSERT INTO public.user_permissions (user_id, role, user_email, can_view_finance, can_manage_routes, can_view_sellers, can_manage_tickets)
SELECT id, 'MASTER', email, true, true, true, true
FROM auth.users WHERE email = 'paulinhosheldom@gmail.com'
ON CONFLICT (user_id) DO UPDATE SET 
  role = 'MASTER',
  can_view_finance = true,
  can_manage_routes = true,
  can_view_sellers = true,
  can_manage_tickets = true;

-- 4. Notificar sucesso
DO $$ 
BEGIN 
  RAISE NOTICE 'Configuração MASTER concluída com sucesso!';
END $$;
