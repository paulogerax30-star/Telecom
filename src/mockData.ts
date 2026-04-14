import { Route, RouteHistory, Transaction, NettingSession, CDRRecord, Seller, Commission } from './types';

export const mockSellers: Seller[] = [
  {
    id: 's1',
    name: 'André',
    email: 'andre@gerax.com',
    status: 'ACTIVE',
    portfolioSize: 45,
    activeClients: 42,
    defaultRate: 2.5,
    performanceScore: 92,
    createdAt: '2023-01-15T10:00:00Z'
  },
  {
    id: 's2',
    name: 'Naira',
    email: 'naira@gerax.com',
    status: 'ACTIVE',
    portfolioSize: 60,
    activeClients: 55,
    defaultRate: 5.1,
    performanceScore: 78,
    createdAt: '2023-03-20T09:30:00Z'
  },
  {
    id: 's3',
    name: 'Dayana',
    email: 'dayana@gerax.com',
    status: 'ACTIVE',
    portfolioSize: 20,
    activeClients: 18,
    defaultRate: 1.2,
    performanceScore: 85,
    createdAt: '2023-08-10T14:15:00Z'
  },
  {
    id: 's4',
    name: 'Bruno',
    email: 'bruno@gerax.com',
    status: 'ACTIVE',
    portfolioSize: 35,
    activeClients: 30,
    defaultRate: 3.2,
    performanceScore: 88,
    createdAt: '2023-09-05T11:00:00Z'
  },
  {
    id: 's5',
    name: 'Luana',
    email: 'luana@gerax.com',
    status: 'ACTIVE',
    portfolioSize: 25,
    activeClients: 22,
    defaultRate: 1.8,
    performanceScore: 90,
    createdAt: '2023-10-12T16:45:00Z'
  }
];

export const mockCommissions: Commission[] = [
  {
    id: 'c1',
    sellerId: 's1',
    sellerName: 'Carlos Mendes',
    clientId: 'e1',
    clientName: 'Telecom Corp',
    competence: '2024-03',
    invoiceAmount: 15000.00,
    receivedAmount: 15000.00,
    commissionAmount: 750.00, // 5%
    ruleName: '5% sobre Recebimento',
    status: 'RELEASED',
    releaseDate: '2024-04-16T10:00:00Z',
    createdAt: '2024-04-01T08:00:00Z'
  },
  {
    id: 'c2',
    sellerId: 's2',
    sellerName: 'Ana Silva',
    clientId: 'e4',
    clientName: 'CallCenter BR',
    competence: '2024-03',
    invoiceAmount: 25000.00,
    receivedAmount: 10000.00,
    commissionAmount: 300.00, // 3% sobre o recebido (proporcional)
    ruleName: '3% Consumo (Proporcional)',
    status: 'CALCULATED',
    createdAt: '2024-04-01T08:00:00Z'
  },
  {
    id: 'c3',
    sellerId: 's1',
    sellerName: 'Carlos Mendes',
    clientId: 'e5',
    clientName: 'Tech Solutions',
    competence: '2024-04',
    invoiceAmount: 5000.00,
    receivedAmount: 0.00,
    commissionAmount: 250.00,
    ruleName: '5% Serviços',
    status: 'WITHHELD', // Retida por falta de pagamento
    createdAt: '2024-04-02T09:00:00Z'
  }
];

export const initialRoutes: Route[] = [
  {
    id: '1',
    name: 'TIM_SP_MOBILE_P1',
    routeType: 'GSM',
    provider: 'TIM',
    binaType: 'CLI Aberta',
    category: 'Móvel-Móvel',
    rate: 0.15,
    cost: 0.10,
    priority: 1,
    status: 'Ativa',
    observations: 'Rota principal para SP',
    createdAt: new Date().toISOString(),
    asr: 45.5,
    acd: 120,
    pdd: 2.5,
    totalCalls: 1500,
    answeredCalls: 682,
    revenue: 102.30,
    totalCost: 68.20,
    profit: 34.10
  },
  {
    id: '2',
    name: 'VIVO_RJ_FIXO_P2',
    routeType: 'SIP',
    provider: 'VIVO',
    binaType: 'Fixa',
    category: 'Fixo-Fixo',
    rate: 0.08,
    cost: 0.05,
    priority: 2,
    status: 'Ativa',
    observations: 'Backup para RJ',
    createdAt: new Date().toISOString(),
    asr: 65.2,
    acd: 180,
    pdd: 1.8,
    totalCalls: 2000,
    answeredCalls: 1304,
    revenue: 160.00,
    totalCost: 100.00,
    profit: 60.00
  },
  {
    id: '3',
    name: 'CLARO_MG_MISTA_P1',
    routeType: 'E1',
    provider: 'CLARO',
    binaType: 'Mista',
    category: 'Fixo-Móvel',
    rate: 0.12,
    cost: 0.09,
    priority: 1,
    status: 'Teste',
    observations: 'Em fase de homologação',
    createdAt: new Date().toISOString(),
    asr: 15.0, // Alerta: ASR < 20%
    acd: 45,
    pdd: 6.5, // Alerta: PDD > 5s
    totalCalls: 500,
    answeredCalls: 75,
    revenue: 60.00,
    totalCost: 45.00,
    profit: 15.00
  }
];

export const initialHistory: RouteHistory[] = [
  {
    id: 'h1',
    routeId: '1',
    date: new Date().toISOString(),
    status: 'Ativa',
    classification: 'Ótima',
    testResult: 'Sucesso',
    analyst: 'Sistema',
    observations: 'Análise automática'
  }
];

export const mockTransactions: Transaction[] = [
  {
    id: 't1',
    entityId: 'e1',
    entityName: 'Telecom Corp',
    type: 'INCOME',
    category: 'BILLING',
    description: 'Faturamento Mensal Março',
    competence: '2024-03',
    emissionDate: '2024-04-01',
    dueDate: '2024-04-15',
    originalAmount: 15000.00,
    discount: 0,
    interest: 0,
    fine: 0,
    amount: 15000.00,
    amountReceived: 0,
    openBalance: 15000.00,
    billingType: 'FIXED_PLUS_EXCESS',
    status: 'PENDING_APPROVAL',
    priority: 'HIGH',
    createdBy: 'Sistema',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 't5',
    entityId: 'e4',
    entityName: 'CallCenter BR',
    type: 'INCOME',
    category: 'BILLING',
    description: 'Consumo Rotas Premium',
    competence: '2024-03',
    emissionDate: '2024-04-01',
    dueDate: '2024-04-05',
    originalAmount: 25000.00,
    discount: 0,
    interest: 1200.00,
    fine: 500.00,
    amount: 26700.00,
    amountReceived: 10000.00,
    openBalance: 16700.00,
    billingType: 'CONSUMPTION',
    renegotiated: true,
    status: 'PARTIALLY_PAID',
    priority: 'CRITICAL',
    createdBy: 'Sistema',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 't6',
    entityId: 'e5',
    entityName: 'Tech Solutions',
    type: 'INCOME',
    category: 'SERVICE',
    description: 'Implantação PABX IP',
    competence: '2024-04',
    emissionDate: '2024-04-02',
    dueDate: '2024-04-10',
    paymentDate: '2024-04-09',
    originalAmount: 5000.00,
    discount: 200.00,
    interest: 0,
    fine: 0,
    amount: 4800.00,
    amountReceived: 4800.00,
    openBalance: 0,
    billingType: 'AVULSO',
    status: 'PAID',
    priority: 'MEDIUM',
    createdBy: 'Comercial',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 't2',
    entityId: 'e2',
    entityName: 'Global Net',
    type: 'EXPENSE',
    category: 'INTERCONNECTION',
    description: 'Custo Interconexão SP',
    competence: '2024-03',
    emissionDate: '2024-04-01',
    dueDate: '2024-04-10',
    paymentDate: '2024-04-09',
    originalAmount: 8500.00,
    discount: 0,
    interest: 0,
    fine: 0,
    amount: 8500.00,
    amountReceived: 8500.00,
    openBalance: 0,
    status: 'PAID',
    priority: 'MEDIUM',
    createdBy: 'Financeiro',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 't3',
    entityId: 'e3',
    entityName: 'Local Link',
    type: 'EXPENSE',
    category: 'INFRA_SERVER',
    description: 'Aluguel Link Dedicado',
    competence: '2024-04',
    emissionDate: '2024-04-01',
    dueDate: '2024-04-05',
    originalAmount: 1200.00,
    discount: 0,
    interest: 50,
    fine: 20,
    amount: 1270.00,
    amountReceived: 0,
    openBalance: 1270.00,
    status: 'OVERDUE',
    priority: 'CRITICAL',
    createdBy: 'Suporte',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 't4',
    entityId: 'e1',
    entityName: 'Telecom Corp',
    type: 'EXPENSE',
    category: 'INTERCONNECTION',
    description: 'Custo Tráfego Reverso',
    competence: '2024-03',
    emissionDate: '2024-04-01',
    dueDate: '2024-04-20',
    originalAmount: 4500.00,
    discount: 0,
    interest: 0,
    fine: 0,
    amount: 4500.00,
    amountReceived: 0,
    openBalance: 4500.00,
    status: 'SCHEDULED',
    priority: 'MEDIUM',
    createdBy: 'Sistema',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

export const mockNetting: NettingSession[] = [
  {
    id: 'n1',
    entityId: 'e1',
    entityName: 'Telecom Corp',
    grossReceivable: 15000.00,
    grossPayable: 4500.00,
    netAmount: 10500.00,
    status: 'PROPOSED',
    createdAt: new Date().toISOString()
  }
];

export const mockCDRs: CDRRecord[] = [
  {
    id: 'c1',
    startTime: '2024-04-10T10:00:00Z',
    origin: '551199999999',
    destination: '551198888888',
    durationReal: 65,
    durationBilled: 66,
    saleValue: 0.165,
    costValue: 0.11,
    profit: 0.055,
    status: 'SUCCESS',
    routeId: '1',
    providerId: 'TIM',
    clientId: 'CLIENT_A'
  }
];
