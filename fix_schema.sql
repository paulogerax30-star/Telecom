-- COMANDOS PARA CORRIGIR O BANCO DE DADOS (COPIE E COLE NO SQL EDITOR DO SUPABASE)

-- 1. Adicionar colunas faltantes na tabela de vendedores
ALTER TABLE sellers ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE sellers ADD COLUMN IF NOT EXISTS birth_date DATE;

-- 2. Adicionar coluna faltantes na tabela de cadastro de clientes
ALTER TABLE client_registrations ADD COLUMN IF NOT EXISTS additional_info TEXT;

-- 3. (Opcional) Garantir que as colunas existentes usem os tipos corretos
-- Isso ajuda a evitar erros de cast caso o Supabase tenha inferido tipos diferentes
ALTER TABLE client_registrations ALTER COLUMN contracted_routes TYPE TEXT[] USING contracted_routes::TEXT[];
