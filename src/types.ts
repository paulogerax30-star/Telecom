export type RouteCategory = 'Móvel-Móvel' | 'Fixo-Fixo' | 'Fixo-Móvel' | 'Internacional';

export type RouteClassification = 'Ótima' | 'Boa' | 'Regular' | 'Ruim' | 'Crítica';

export type RouteStatus = 'Ativa' | 'Inativa' | 'Teste';

export type BinaType = 'CLI Aberta' | 'Fixa' | 'Móvel' | 'Mista' | 'Sem Spam';

export interface Route {
  id: string;
  name: string;
  routeType: string; // Dynamic type
  provider: string; // Operadora
  binaType: BinaType;
  category: RouteCategory;
  rate: number; // Tarifa (R$/min)
  cost: number; // Custo (R$/min)
  priority: number; // Prioridade (número)
  status: RouteStatus;
  observations: string;
  createdAt: string;
  // Metrics (CDR / NextRouter Integration)
  asr: number; // %
  acd: number; // seconds
  pdd: number; // seconds
  totalCalls: number;
  answeredCalls: number;
  revenue: number; // Receita gerada
  totalCost: number; // Custo total
  profit: number; // Lucro
  lastTestScore?: number;
  lastTestDate?: string;
}

export interface RouteHistory {
  id: string;
  routeId: string;
  date: string;
  status: RouteStatus;
  classification: RouteClassification;
  testResult: string;
  analyst: string;
  observations: string;
}

export type TicketStatus = 'ABERTO' | 'VERIFICADO' | 'FINALIZADO';

export interface Ticket {
  id: string;
  date: string;
  routeType: string;
  reason: string;
  print?: string;
  status: TicketStatus;
  observations: string;
  supplier: string;
}

// Financial Types
export type TransactionType = 'INCOME' | 'EXPENSE';
export type TransactionStatus = 
  | 'DRAFT' 
  | 'PENDING_APPROVAL' 
  | 'APPROVED' 
  | 'SCHEDULED' 
  | 'PAID' 
  | 'PARTIALLY_PAID' 
  | 'OVERDUE' 
  | 'CANCELLED' 
  | 'DISPUTE' 
  | 'NETTED';

export type FinancialCategory = 
  | 'BILLING' 
  | 'INTERCONNECTION' 
  | 'FIXED_COST' 
  | 'VARIABLE_COST' 
  | 'COMMISSION' 
  | 'TAX'
  | 'INFRA_DATACENTER'
  | 'INFRA_SERVER'
  | 'INFRA_CLOUD'
  | 'TELECOM_ROUTE'
  | 'TELECOM_SIP'
  | 'ADMIN_OFFICE'
  | 'MARKETING'
  | 'SERVICE';

export type PriorityLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type BillingType = 'RECURRENT' | 'CONSUMPTION' | 'FIXED_PLUS_EXCESS' | 'AVULSO' | 'SERVICE';

export type CommissionStatus = 'PENDING' | 'CALCULATED' | 'APPROVED' | 'RELEASED' | 'WITHHELD' | 'REVERSED' | 'CANCELLED';

export interface Seller {
  id: string;
  name: string;
  email: string;
  phone?: string;
  birthDate?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'BLOCKED';
  portfolioSize: number;
  activeClients: number;
  defaultRate: number; // Taxa de inadimplência da carteira (%)
  performanceScore: number; // 0 a 100
  createdAt: string;
}

export interface ClientRegistration {
  id: string;
  sellerId: string;
  sellerName: string;
  clientName: string;
  cnpj: string;
  contact: string;
  contractedRoutes: string[];
  rates: string;
  billingType: string;
  serverId: string;
  ips: string;
  approxChannels: string;
  additionalInfo: string;
  status: 'CLOSED' | 'ANALYSIS';
  createdAt: string;
}

export type UserRole = 'MASTER' | 'USER';

export interface UserPermissions {
  user_id: string;
  username: string;
  role: UserRole;
  can_view_finance: boolean;
  can_manage_routes: boolean;
  can_view_sellers: boolean;
  can_manage_tickets: boolean;
  created_at: string;
  updated_at: string;
}

export interface Commission {
  id: string;
  sellerId: string;
  sellerName: string;
  clientId: string;
  clientName: string;
  competence: string;
  invoiceAmount: number; // Valor faturado
  receivedAmount: number; // Valor recebido (base para cálculo seguro)
  commissionAmount: number; // Valor da comissão
  ruleName: string;
  status: CommissionStatus;
  releaseDate?: string;
  createdAt: string;
}

export interface Transaction {
  id: string;
  entityId: string;
  entityName: string;
  type: TransactionType;
  category: string;
  description: string;
  competence: string; // YYYY-MM
  emissionDate: string;
  dueDate: string;
  paymentDate?: string;
  originalAmount: number;
  discount: number;
  interest: number;
  fine: number;
  amount: number; // Final amount
  amountReceived?: number; // Valor recebido/pago
  openBalance?: number; // Saldo em aberto
  paymentMethod?: string;
  bankAccount?: string;
  bankAgency?: string;
  pixKey?: string;
  cnpj?: string;
  nfNumber?: string;
  paymentCondition?: string; // dias após venda
  installments?: number;
  billingType?: BillingType;
  renegotiated?: boolean;
  status: TransactionStatus;
  priority: PriorityLevel;
  observations?: string;
  attachments?: string[];
  createdBy: string;
  approvedBy?: string;
  updatedBy?: string;
  nettingId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface NettingSession {
  id: string;
  entityId: string;
  entityName: string;
  grossReceivable: number;
  grossPayable: number;
  netAmount: number;
  status: 'PROPOSED' | 'APPROVED' | 'EXECUTED';
  approvedBy?: string;
  executedAt?: string;
  createdAt: string;
}

export interface CDRRecord {
  id: string;
  startTime: string;
  origin: string;
  destination: string;
  durationReal: number;
  durationBilled: number;
  saleValue: number;
  costValue: number;
  profit: number;
  status: 'SUCCESS' | 'FAILED';
  routeId: string;
  providerId: string;
  clientId: string;
}

export type ReceiptStatus = 'PENDING' | 'VALIDATED' | 'REJECTED' | 'DIVERGENT';
export type PendencyStatus = 'PENDING' | 'LINKED' | 'VALIDATED' | 'REJECTED' | 'DIVERGENT';

export interface Pendency {
  id: string;
  amount: number;
  description: string;
  createdAt: string;
  status: PendencyStatus;
  observation?: string;
  responsibleUser: string;
}

export interface Receipt {
  id: string;
  fileUrl: string;
  fileName: string;
  fileType: string;
  amount: number;
  date: string;
  description: string;
  observation?: string;
  status: ReceiptStatus;
  linkedPendencyId?: string;
  createdByUser: string;
  createdAt: string;
}

export interface HistoryEntry {
  id: string;
  userId: string;
  action: string;
  details: string;
  previousStatus?: string;
  newStatus?: string;
  timestamp: string;
}

export type CallClassification = 'EXCELENTE' | 'BOA' | 'REGULAR' | 'RUIM' | 'CRÍTICA' | 'INCONCLUSIVA';

export type TechnicalClass = 
  | 'SUCCESS_GOOD'
  | 'SUCCESS_SHORT'
  | 'SUCCESS_SUSPECT_VM'
  | 'SUCCESS_SUSPECT_FALSE_ANSWER'
  | 'FAIL_ROUTE'
  | 'FAIL_SUPPLIER'
  | 'FAIL_CLIENT_DATA'
  | 'FAIL_DESTINATION'
  | 'FAIL_SIGNALING'
  | 'FAIL_AUDIO'
  | 'FAIL_TIMEOUT'
  | 'FAIL_HIGH_PDD'
  | 'FAIL_UNKNOWN';

export interface CallRecord {
  id: string;
  timestamp: string;
  callId: string;
  origin: string;
  callerId: string;
  destination: string;
  client: string;
  supplier: string;
  route: string;
  server: string;
  routeType: string;
  pdd: number;
  ringTime: number;
  durationTotal: number;
  billsec: number;
  sipCode: number;
  sipReason: string;
  hangupCause: string;
  releaseSource: string;
  whoDisconnected: string;
  codec: string;
  rtp: boolean;
  amd: boolean;
  voicemail: boolean;
  operator: string;
  ddd: string;
  country: string;
  status: string;
  revenue: number;
  cost: number;
  profit: number;
  // Analysis results
  score?: number;
  classification?: CallClassification;
  technicalClass?: TechnicalClass;
  reason?: string;
  secondaryReasons?: string[];
  confidence?: 'HIGH' | 'MEDIUM' | 'LOW';
  impact?: string;
  suggestion?: string;
}
