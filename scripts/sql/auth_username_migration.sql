-- ==========================================
-- GERAX TELECOMROUTER - USERNAME AUTH MIGRATION
-- ==========================================

-- 1. Limpeza e Ajuste da Tabela de Permissões
ALTER TABLE public.user_permissions DROP COLUMN IF EXISTS user_email;
ALTER TABLE public.user_permissions ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;

-- 2. Garantir que as políticas de RLS usem o user_id (UUID)
DROP POLICY IF EXISTS "Usuários podem ver suas próprias permissões" ON public.user_permissions;
DROP POLICY IF EXISTS "Users can view own permissions" ON public.user_permissions;
DROP POLICY IF EXISTS "Masters can manage everything" ON public.user_permissions;
DROP POLICY IF EXISTS "Masters podem gerenciar tudo" ON public.user_permissions;

-- Política: Usuário vê seu próprio registro
CREATE POLICY "Users can view own profile" 
ON public.user_permissions FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

-- Política: Master gerencia tudo
CREATE POLICY "Masters manage all" 
ON public.user_permissions FOR ALL 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM public.user_permissions 
        WHERE user_id = auth.uid() AND role = 'MASTER'
    )
);

-- 3. Trigger para manter o vínculo de ID
-- Como agora o Master cria o usuário, o trigger de 'AFTER INSERT ON auth.users' 
-- ainda é útil, mas o username será preenchido via metadados.

CREATE OR REPLACE FUNCTION public.handle_new_user_permissions()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_permissions (user_id, role, username)
    VALUES (
        NEW.id, 
        'USER', 
        COALESCE(NEW.raw_user_meta_data->>'username', SPLIT_PART(NEW.email, '@', 1))
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- INSTRUÇÃO PARA O MASTER (pauloricardo):
-- No SQL Editor do Supabase, você deve:
-- 1. Criar o usuário no Auth (pauloricardo@gerax.local) com a senha lK2EUIOIJH9$
-- 2. Rodar o comando abaixo substituindo o UUID:
-- UPDATE public.user_permissions SET role = 'MASTER', username = 'pauloricardo' WHERE user_id = 'SEU-UUID-AQUI';
-- ==========================================
