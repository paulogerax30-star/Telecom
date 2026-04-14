-- Script de Migração Supabase para TelecomHub

-- 1. TABELA DE ROTAS
CREATE TABLE IF NOT EXISTS routes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    route_type TEXT NOT NULL,
    provider TEXT NOT NULL,
    bina_type TEXT NOT NULL,
    category TEXT NOT NULL,
    rate DECIMAL(10,4) NOT NULL,
    cost DECIMAL(10,4) NOT NULL,
    priority INTEGER NOT NULL,
    status TEXT NOT NULL,
    observations TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    asr DECIMAL(5,2) DEFAULT 0,
    acd INTEGER DEFAULT 0,
    pdd DECIMAL(5,2) DEFAULT 0,
    total_calls INTEGER DEFAULT 0,
    answered_calls INTEGER DEFAULT 0,
    revenue DECIMAL(12,2) DEFAULT 0,
    total_cost DECIMAL(12,2) DEFAULT 0,
    profit DECIMAL(12,2) DEFAULT 0,
    last_test_score DECIMAL(5,2),
    last_test_date TIMESTAMPTZ
);

-- 2. TABELA DE HISTÓRICO DE ROTAS
CREATE TABLE IF NOT EXISTS route_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    route_id UUID REFERENCES routes(id) ON DELETE CASCADE,
    date TIMESTAMPTZ DEFAULT NOW(),
    status TEXT NOT NULL,
    classification TEXT NOT NULL,
    test_result TEXT NOT NULL,
    analyst TEXT NOT NULL,
    observations TEXT
);

-- 3. TABELA DE VENDEDORES
CREATE TABLE IF NOT EXISTS sellers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    status TEXT NOT NULL,
    portfolio_size INTEGER DEFAULT 0,
    active_clients INTEGER DEFAULT 0,
    default_rate DECIMAL(5,2) DEFAULT 0,
    performance_score INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TABELA DE COMISSÕES
CREATE TABLE IF NOT EXISTS commissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seller_id UUID REFERENCES sellers(id) ON DELETE CASCADE,
    seller_name TEXT,
    client_id TEXT,
    client_name TEXT,
    competence TEXT,
    invoice_amount DECIMAL(12,2),
    received_amount DECIMAL(12,2),
    commission_amount DECIMAL(12,2),
    rule_name TEXT,
    status TEXT,
    release_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. TABELA DE TRANSAÇÕES FINANCEIRAS
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_id TEXT,
    entity_name TEXT,
    type TEXT NOT NULL, -- INCOME / EXPENSE
    category TEXT NOT NULL,
    description TEXT,
    competence TEXT,
    emission_date DATE,
    due_date DATE,
    payment_date DATE,
    original_amount DECIMAL(12,2),
    discount DECIMAL(12,2) DEFAULT 0,
    interest DECIMAL(12,2) DEFAULT 0,
    fine DECIMAL(12,2) DEFAULT 0,
    amount DECIMAL(12,2) NOT NULL,
    amount_received DECIMAL(12,2) DEFAULT 0,
    open_balance DECIMAL(12,2),
    billing_type TEXT,
    renegotiated BOOLEAN DEFAULT FALSE,
    status TEXT NOT NULL,
    priority TEXT NOT NULL,
    observations TEXT,
    created_by TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. TABELA DE CADASTRO DE CLIENTES
CREATE TABLE IF NOT EXISTS client_registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seller_id UUID REFERENCES sellers(id),
    seller_name TEXT,
    client_name TEXT NOT NULL,
    cnpj TEXT,
    contact TEXT,
    contracted_routes TEXT[],
    rates TEXT,
    billing_type TEXT,
    server_id TEXT,
    ips TEXT,
    approx_channels TEXT,
    status TEXT DEFAULT 'ANALYSIS',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. TABELA DE CDRs
CREATE TABLE IF NOT EXISTS cdr_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    start_time TIMESTAMPTZ,
    origin TEXT,
    destination TEXT,
    duration_real INTEGER,
    duration_billed INTEGER,
    sale_value DECIMAL(12,4),
    cost_value DECIMAL(12,4),
    profit DECIMAL(12,4),
    status TEXT,
    route_id TEXT,
    provider_id TEXT,
    client_id TEXT
);

-- DADOS INICIAIS (MIGRAÇÃO)

-- Inserindo Vendedores
INSERT INTO sellers (id, name, email, status, portfolio_size, active_clients, default_rate, performance_score)
VALUES 
('c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c1c1', 'André', 'andre@gerax.com', 'ACTIVE', 45, 42, 2.5, 92),
('c2c2c2c2-c2c2-c2c2-c2c2-c2c2c2c2c2c2', 'Naira', 'naira@gerax.com', 'ACTIVE', 60, 55, 5.1, 78),
('c3c3c3c3-c3c3-c3c3-c3c3-c3c3c3c3c3c3', 'Dayana', 'dayana@gerax.com', 'ACTIVE', 20, 18, 1.2, 85);

-- Inserindo Rotas
INSERT INTO routes (id, name, route_type, provider, bina_type, category, rate, cost, priority, status, asr, acd, pdd, total_calls, answered_calls, revenue, total_cost, profit)
VALUES 
('r1r1r1r1-r1r1-r1r1-r1r1-r1r1r1r1r1r1', 'TIM_SP_MOBILE_P1', 'GSM', 'TIM', 'CLI Aberta', 'Móvel-Móvel', 0.15, 0.10, 1, 'Ativa', 45.5, 120, 2.5, 1500, 682, 102.30, 68.20, 34.10),
('r2r2r2r2-r2r2-r2r2-r2r2-r2r2r2r2r2r2', 'VIVO_RJ_FIXO_P2', 'SIP', 'VIVO', 'Fixa', 'Fixo-Fixo', 0.08, 0.05, 2, 'Ativa', 65.2, 180, 1.8, 2000, 1304, 160.00, 100.00, 60.00);

-- Inserindo Comissões
INSERT INTO commissions (seller_id, client_name, competence, invoice_amount, received_amount, commission_amount, status)
VALUES 
('c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c1c1', 'Telecom Corp', '2024-03', 15000.00, 15000.00, 750.00, 'RELEASED'),
('c2c2c2c2-c2c2-c2c2-c2c2-c2c2c2c2c2c2', 'CallCenter BR', '2024-03', 25000.00, 10000.00, 300.00, 'CALCULATED');

-- Inserindo Transações Financeiras
INSERT INTO transactions (id, entity_id, entity_name, type, category, description, competence, amount, status, priority)
VALUES 
('t1t1t1t1-t1t1-t1t1-t1t1-t1t1t1t1t1t1', 'e1', 'Telecom Corp', 'INCOME', 'BILLING', 'Faturamento Mensal Março', '2024-03', 15000.00, 'PENDING_APPROVAL', 'HIGH'),
('t5t5t5t5-t5t5-t5t5-t5t5-t5t5t5t5t5t5', 'e4', 'CallCenter BR', 'INCOME', 'BILLING', 'Consumo Rotas Premium', '2024-03', 26700.00, 'PARTIALLY_PAID', 'CRITICAL');
