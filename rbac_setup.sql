-- ==========================================
-- GERAX TELECOMROUTER - RBAC SETUP SCRIPT
-- ==========================================

-- 1. Tabela de Permissões
CREATE TABLE IF NOT EXISTS public.user_permissions (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    user_email TEXT, -- Adicionado para facilitar identificação no painel
    role TEXT NOT NULL CHECK (role IN ('MASTER', 'USER')) DEFAULT 'USER',
    can_view_finance BOOLEAN DEFAULT FALSE,
    can_manage_routes BOOLEAN DEFAULT FALSE,
    can_view_sellers BOOLEAN DEFAULT FALSE,
    can_manage_tickets BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comentário: A coluna 'role' define o nível de acesso global.
-- As colunas 'can_...' definem acessos granulares a módulos específicos.

-- 2. Habilitar RLS
ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;

-- 3. Políticas de Segurança (RLS)

-- A. Usuários podem ver suas próprias permissões
CREATE POLICY "Usuários podem ver suas próprias permissões" 
ON public.user_permissions FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

-- B. Masters podem gerenciar todas as permissões
-- Nota: Usamos SECURITY DEFINER para evitar recursão infinita se necessário, 
-- mas aqui a política direta costuma funcionar bem.
CREATE POLICY "Masters podem gerenciar tudo" 
ON public.user_permissions FOR ALL 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM public.user_permissions 
        WHERE user_id = auth.uid() AND role = 'MASTER'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.user_permissions 
        WHERE user_id = auth.uid() AND role = 'MASTER'
    )
);

-- 4. Função e Trigger para updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON public.user_permissions
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 5. Automação: Criar registro de permissões para novos usuários
CREATE OR REPLACE FUNCTION public.handle_new_user_permissions()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_permissions (user_id, role, user_email)
    VALUES (NEW.id, 'USER', NEW.email);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Remove o trigger se já existir para evitar erro em re-execução
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user_permissions();

-- ==========================================
-- NOTA PARA O ADMINISTRADOR:
-- Para definir o primeiro MASTER, execute manualmente:
-- UPDATE public.user_permissions SET role = 'MASTER' WHERE user_id = 'ID-DO-SEU-USUARIO';
-- ==========================================
