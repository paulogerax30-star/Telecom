-- ================================================
-- CORREÇÃO COMPLETA - GERAX TELECOMROUTER
-- Execute no SQL Editor do Supabase
-- ================================================

-- 1. Corrigir o trigger (remover user_email que não existe)
CREATE OR REPLACE FUNCTION public.handle_new_user_permissions()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_permissions (user_id, role)
    VALUES (NEW.id, 'USER')
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user_permissions();

-- 2. Adicionar UNIQUE em user_id (necessário para ON CONFLICT)
ALTER TABLE public.user_permissions 
    ADD CONSTRAINT user_permissions_user_id_key UNIQUE (user_id);

-- 3. Corrigir a função is_master() (já existe, mas garantir)
CREATE OR REPLACE FUNCTION public.is_master()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_permissions 
        WHERE user_id = auth.uid() AND role = 'MASTER'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Remover políticas conflitantes de user_permissions
DROP POLICY IF EXISTS "Masters podem gerenciar tudo" ON public.user_permissions;
DROP POLICY IF EXISTS "Usuários podem ver suas próprias permissões" ON public.user_permissions;
DROP POLICY IF EXISTS "Master total access" ON public.user_permissions;

-- 5. Recriar políticas corretas (sem recursão)
ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;

-- Usuário vê só suas próprias permissões
CREATE POLICY "ver proprias permissoes"
ON public.user_permissions FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- MASTER gerencia tudo (usando is_master() com SECURITY DEFINER evita recursão)
CREATE POLICY "master gerencia tudo"
ON public.user_permissions FOR ALL
TO authenticated
USING (public.is_master())
WITH CHECK (public.is_master());

-- 6. Garantir que o usuário MASTER existe corretamente
INSERT INTO public.user_permissions (user_id, role, username, can_view_finance, can_manage_routes, can_view_sellers, can_manage_tickets)
SELECT id, 'MASTER', 'pauloricardo', true, true, true, true
FROM auth.users 
WHERE email = 'paulinhosheldom@gmail.com'
ON CONFLICT (user_id) DO UPDATE 
SET role = 'MASTER', 
    can_view_finance = true, 
    can_manage_routes = true, 
    can_view_sellers = true, 
    can_manage_tickets = true;

-- 7. Verificar resultado
SELECT u.email, p.role, p.can_view_finance, p.can_manage_routes
FROM public.user_permissions p
JOIN auth.users u ON u.id = p.user_id
WHERE u.email = 'paulinhosheldom@gmail.com';
