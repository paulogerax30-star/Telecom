-- ==========================================
-- GERAX TELECOMROUTER - FULL ACCESS SQL
-- ==========================================

-- 1. Habilitar RLS em todas as tabelas
ALTER TABLE public.routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.route_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sellers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cdr_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pendencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

-- 2. Função auxiliar para checar se o usuário é MASTER
CREATE OR REPLACE FUNCTION public.is_master()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_permissions 
        WHERE user_id = auth.uid() AND role = 'MASTER'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Criar políticas de acesso total para MASTERS em todas as tabelas

-- Função para criar políticas de forma limpa
DO $$
DECLARE
    t TEXT;
    tables TEXT[] := ARRAY[
        'routes', 'route_history', 'sellers', 'commissions', 
        'transactions', 'client_registrations', 'cdr_records', 
        'pendencies', 'receipts', 'tickets'
    ];
BEGIN
    FOREACH t IN ARRAY tables
    LOOP
        -- Remover políticas antigas para evitar duplicidade
        EXECUTE format('DROP POLICY IF EXISTS "Master total access" ON public.%I', t);
        
        -- Criar nova política de acesso total
        EXECUTE format('CREATE POLICY "Master total access" ON public.%I FOR ALL TO authenticated USING (public.is_master()) WITH CHECK (public.is_master())', t);
    END LOOP;
END;
$$;

-- 4. Garantir que o Pauloricardo seja MASTER (caso o ID mude ou algo ocorra)
-- Buscamos pelo email paulinhosheldom@gmail.com
UPDATE public.user_permissions 
SET role = 'MASTER', 
    can_view_finance = true, 
    can_manage_routes = true, 
    can_view_sellers = true, 
    can_manage_tickets = true
WHERE user_id IN (SELECT id FROM auth.users WHERE email = 'paulinhosheldom@gmail.com');

-- 5. Se o registro não existir, o Pauloricardo pode estar bloqueado.
-- O trigger deve ter criado, mas garantimos aqui:
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
