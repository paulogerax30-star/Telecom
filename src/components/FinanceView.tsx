import React, { useState, useMemo } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  Filter, 
  Download, 
  ArrowUpRight, 
  ArrowDownRight, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  FileText,
  Users,
  Search,
  PlusCircle,
  PieChart as PieChartIcon,
  BarChart as BarChartIcon,
  Activity,
  Zap,
  Calculator,
  Percent,
  Settings,
  ChevronRight,
  ChevronDown,
  X,
  Save,
  RefreshCw as RefreshCwIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';
import { Transaction, NettingSession, CDRRecord } from '../types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type FinanceTab = 'overview' | 'cashflow' | 'billing' | 'payable' | 'receivable' | 'netting' | 'commissions';

export default function FinanceView({ 
  transactions, 
  onAddTransaction, 
  onUpdateTransaction 
}: { 
  transactions: Transaction[], 
  onAddTransaction: (t: Transaction) => void, 
  onUpdateTransaction: (t: Transaction) => void 
}) {
  const { user, isMaster } = useAuth();
  const [activeSubTab, setActiveSubTab] = useState<FinanceTab>('overview');
  const [selectedPayableCategory, setSelectedPayableCategory] = useState('Todas');
  const [nettingSessions, setNettingSessions] = useState<NettingSession[]>([]);
  const [isPayableModalOpen, setIsPayableModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [financialCategories, setFinancialCategories] = useState<string[]>([
    'Administrativo',
    'Infraestrutura',
    'Interconexão',
    'Marketing',
    'Custo Variável'
  ]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [payableForm, setPayableForm] = useState({
    entityName: '',
    cnpj: '',
    bankAccount: '',
    bankAgency: '',
    pixKey: '',
    nfNumber: '',
    dueDate: '',
    paymentCondition: '',
    amount: '',
    installments: '1',
    category: 'Administrativo',
    description: ''
  });

  const handlePayTransaction = (id: string) => {
    const transaction = transactions.find(t => t.id === id);
    if (transaction) {
      onUpdateTransaction({
        ...transaction,
        status: 'PAID',
        paymentDate: format(new Date(), 'yyyy-MM-dd'),
        amountReceived: transaction.amount,
        openBalance: 0
      });
      toast.success('Pagamento baixado com sucesso!');
    }
  };

  const handleAddPayable = (e: React.FormEvent) => {
    e.preventDefault();
    const newTransaction: Transaction = {
      id: crypto.randomUUID(),
      entityId: `e-${Date.now()}`,
      entityName: payableForm.entityName,
      type: 'EXPENSE',
      category: payableForm.category,
      description: payableForm.description || 'Lançamento Manual',
      competence: format(new Date(), 'yyyy-MM'),
      emissionDate: format(new Date(), 'yyyy-MM-dd'),
      dueDate: payableForm.dueDate,
      originalAmount: parseFloat(payableForm.amount),
      discount: 0,
      interest: 0,
      fine: 0,
      amount: parseFloat(payableForm.amount),
      status: 'PENDING_APPROVAL',
      priority: 'MEDIUM',
      cnpj: payableForm.cnpj,
      bankAccount: payableForm.bankAccount,
      bankAgency: payableForm.bankAgency,
      pixKey: payableForm.pixKey,
      nfNumber: payableForm.nfNumber,
      paymentCondition: payableForm.paymentCondition,
      installments: parseInt(payableForm.installments),
      createdBy: 'Operador Técnico', // Current user placeholder
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    onAddTransaction(newTransaction);
    setIsPayableModalOpen(false);
    setPayableForm({
      entityName: '',
      cnpj: '',
      bankAccount: '',
      bankAgency: '',
      pixKey: '',
      nfNumber: '',
      dueDate: '',
      paymentCondition: '',
      amount: '',
      installments: '1',
      category: financialCategories[0] || '',
      description: ''
    });
    toast.success('Conta lançada com sucesso!');
  };

  const handleAddCategory = () => {
    if (!newCategoryName.trim()) {
      toast.error('O nome da categoria não pode estar vazio');
      return;
    }
    if (financialCategories.includes(newCategoryName.trim())) {
      toast.error('Esta categoria já existe');
      return;
    }
    setFinancialCategories(prev => [...prev, newCategoryName.trim()]);
    setNewCategoryName('');
    toast.success('Categoria adicionada com sucesso!');
  };

  const handleRemoveCategory = (categoryToRemove: string) => {
    if (financialCategories.length <= 1) {
      toast.error('É necessário ter pelo menos uma categoria');
      return;
    }
    setFinancialCategories(prev => prev.filter(c => c !== categoryToRemove));
    if (payableForm.category === categoryToRemove) {
      setPayableForm(prev => ({ ...prev, category: financialCategories.find(c => c !== categoryToRemove) || '' }));
    }
    toast.success('Categoria removida com sucesso!');
  };

  // Commission Calculator State
  const [calcBaseValue, setCalcBaseValue] = useState<number>(0);
  const [calcPercentage, setCalcPercentage] = useState<number>(0);
  const [calcBonusType, setCalcBonusType] = useState<'FIXED' | 'PERCENTAGE'>('FIXED');
  const [calcBonusValue, setCalcBonusValue] = useState<number>(0);

  const calculatedCommission = useMemo(() => {
    const base = calcBaseValue * (calcPercentage / 100);
    const bonus = calcBonusType === 'PERCENTAGE' ? calcBaseValue * (calcBonusValue / 100) : calcBonusValue;
    return base + bonus;
  }, [calcBaseValue, calcPercentage, calcBonusType, calcBonusValue]);

  const stats = useMemo(() => {
    const totalIncome = transactions.filter(t => t.type === 'INCOME').reduce((acc, t) => acc + t.amount, 0);
    const totalExpense = transactions.filter(t => t.type === 'EXPENSE').reduce((acc, t) => acc + t.amount, 0);
    const pendingReceivable = transactions.filter(t => t.type === 'INCOME' && (t.status === 'PENDING_APPROVAL' || t.status === 'APPROVED' || t.status === 'PARTIALLY_PAID')).reduce((acc, t) => acc + (t.openBalance || t.amount), 0);
    const pendingPayable = transactions.filter(t => t.type === 'EXPENSE' && (t.status === 'PENDING_APPROVAL' || t.status === 'APPROVED' || t.status === 'SCHEDULED' || t.status === 'PARTIALLY_PAID')).reduce((acc, t) => acc + (t.openBalance || t.amount), 0);
    const overdue = transactions.filter(t => t.status === 'OVERDUE').reduce((acc, t) => acc + (t.openBalance || t.amount), 0);

    return {
      balance: totalIncome - totalExpense,
      totalIncome,
      totalExpense,
      pendingReceivable,
      pendingPayable,
      overdue,
      margin: totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome) * 100 : 0
    };
  }, [transactions]);

  const chartData = [
    { name: 'Seg', income: 4000, expense: 2400 },
    { name: 'Ter', income: 3000, expense: 1398 },
    { name: 'Qua', income: 2000, expense: 9800 },
    { name: 'Qui', income: 2780, expense: 3908 },
    { name: 'Sex', income: 1890, expense: 4800 },
    { name: 'Sáb', income: 2390, expense: 3800 },
    { name: 'Dom', income: 3490, expense: 4300 },
  ];

  const categoryData = [
    { name: 'Billing', value: 15000 },
    { name: 'Interconexão', value: 13000 },
    { name: 'Custos Fixos', value: 1200 },
    { name: 'Comissões', value: 2500 },
  ];

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'];

  return (
    <div className="space-y-6 pb-20">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Módulo Financeiro</h2>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Gestão de Billing, Fluxo de Caixa e Netting</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition-all">
            <Calendar className="w-4 h-4" />
            Período
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg">
            <Download className="w-4 h-4" />
            Exportar
          </button>
        </div>
      </div>

      {/* Sub-navigation */}
      <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-2xl w-fit overflow-x-auto custom-scrollbar max-w-full">
        {[
          { id: 'overview', label: 'Dashboard BI', icon: BarChartIcon },
          { id: 'cashflow', label: 'Fluxo de Caixa', icon: Activity },
          { id: 'billing', label: 'Billing Telecom', icon: Zap },
          { id: 'receivable', label: 'Contas a Receber', icon: TrendingUp },
          { id: 'payable', label: 'Contas a Pagar', icon: TrendingDown },
          { id: 'netting', label: 'Netting', icon: RefreshCwIcon },
          { id: 'commissions', label: 'Comissões', icon: Users },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id as FinanceTab)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
              activeSubTab === tab.id 
                ? "bg-white text-blue-600 shadow-sm" 
                : "text-slate-500 hover:text-slate-700"
            )}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeSubTab === 'overview' && (
        <div className="space-y-6 animate-in fade-in duration-500">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <FinanceStatCard 
              title="Saldo em Caixa" 
              value={stats.balance} 
              icon={DollarSign}
              trend="+12.5%"
              color="blue"
            />
            <FinanceStatCard 
              title="A Receber (Pendente)" 
              value={stats.pendingReceivable} 
              icon={TrendingUp}
              trend="+5.2%"
              color="emerald"
            />
            <FinanceStatCard 
              title="A Pagar (Pendente)" 
              value={stats.pendingPayable} 
              icon={TrendingDown}
              trend="-2.1%"
              color="amber"
            />
            <FinanceStatCard 
              title="Inadimplência" 
              value={stats.overdue} 
              icon={AlertCircle}
              trend="+0.8%"
              color="rose"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Chart */}
            <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">Evolução Financeira</h3>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Entradas</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-rose-500 rounded-full"></div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Saídas</span>
                  </div>
                </div>
              </div>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#EF4444" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 10, fontWeight: 700, fill: '#94A3B8' }}
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 10, fontWeight: 700, fill: '#94A3B8' }}
                      tickFormatter={(value) => `R$ ${value}`}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#FFF', 
                        borderRadius: '16px', 
                        border: '1px solid #E2E8F0',
                        boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'
                      }}
                    />
                    <Area type="monotone" dataKey="income" stroke="#3B82F6" strokeWidth={3} fillOpacity={1} fill="url(#colorIncome)" />
                    <Area type="monotone" dataKey="expense" stroke="#EF4444" strokeWidth={3} fillOpacity={1} fill="url(#colorExpense)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Distribution Chart */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight mb-6">Composição de Custos</h3>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 space-y-2">
                {categoryData.map((item, index) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index] }}></div>
                      <span className="text-[10px] font-bold text-slate-600 uppercase">{item.name}</span>
                    </div>
                    <span className="text-[10px] font-black text-slate-800">R$ {item.value.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">Lançamentos Recentes</h3>
              <button className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline">Ver Todos</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50">
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Data</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Entidade</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Categoria</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Valor</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {transactions.slice(0, 5).map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 text-xs font-bold text-slate-600">{t.dueDate}</td>
                      <td className="px-6 py-4">
                        <p className="text-xs font-black text-slate-800 uppercase tracking-tight">{t.entityName}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">{t.description}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-lg text-[9px] font-black uppercase tracking-widest">
                          {t.category}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "text-sm font-black",
                          t.type === 'INCOME' ? "text-emerald-600" : "text-rose-600"
                        )}>
                          {t.type === 'INCOME' ? '+' : '-'} R$ {t.amount.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest",
                          t.status === 'PAID' ? "bg-emerald-100 text-emerald-700" :
                          t.status === 'OVERDUE' ? "bg-rose-100 text-rose-700" :
                          t.status === 'PENDING_APPROVAL' || t.status === 'APPROVED' || t.status === 'SCHEDULED' ? "bg-amber-100 text-amber-700" :
                          "bg-slate-100 text-slate-700"
                        )}>
                          {t.status.replace('_', ' ')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'receivable' && (
        <div className="space-y-6 animate-in fade-in duration-500">
          {/* Receivable Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <FinanceStatCard 
              title="Total a Receber" 
              value={transactions.filter(t => t.type === 'INCOME' && t.status !== 'PAID').reduce((acc, t) => acc + (t.openBalance || t.amount), 0)} 
              icon={TrendingUp}
              trend="A receber"
              color="blue"
            />
            <FinanceStatCard 
              title="Inadimplência (Vencido)" 
              value={transactions.filter(t => t.type === 'INCOME' && t.status === 'OVERDUE').reduce((acc, t) => acc + (t.openBalance || t.amount), 0)} 
              icon={AlertCircle}
              trend="Crítico"
              color="rose"
            />
            <FinanceStatCard 
              title="Recebido no Mês" 
              value={transactions.filter(t => t.type === 'INCOME' && (t.status === 'PAID' || t.status === 'PARTIALLY_PAID')).reduce((acc, t) => acc + (t.amountReceived || 0), 0)} 
              icon={CheckCircle2}
              trend="Concluído"
              color="emerald"
            />
            <FinanceStatCard 
              title="Renegociado" 
              value={transactions.filter(t => t.type === 'INCOME' && t.renegotiated).reduce((acc, t) => acc + t.amount, 0)} 
              icon={RefreshCwIcon}
              trend="Em acordo"
              color="amber"
            />
          </div>

          {/* Filters & Actions */}
          <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Buscar cliente..." 
                  className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all w-64"
                />
              </div>
              <select className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none transition-all">
                <option value="">Todos os Status</option>
                <option value="PENDING_APPROVAL">Aguardando Faturamento</option>
                <option value="SCHEDULED">Emitida</option>
                <option value="PARTIALLY_PAID">Recebimento Parcial</option>
                <option value="PAID">Recebida</option>
                <option value="OVERDUE">Vencida</option>
              </select>
              <select className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none transition-all">
                <option value="">Tipo de Receita</option>
                <option value="RECURRENT">Plano Mensal</option>
                <option value="CONSUMPTION">Consumo (CDR)</option>
                <option value="FIXED_PLUS_EXCESS">Plano + Excedente</option>
                <option value="SERVICE">Serviços</option>
              </select>
            </div>
            <button className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-200">
              <PlusCircle className="w-4 h-4" />
              Gerar Cobrança
            </button>
          </div>

          {/* Receivable Table */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50">
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Vencimento</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Cliente</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Competência</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Valor Final</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Recebido</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Em Aberto</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {transactions.filter(t => t.type === 'INCOME').map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span className={cn(
                            "text-xs font-bold",
                            t.status === 'OVERDUE' ? "text-rose-600" : "text-slate-600"
                          )}>
                            {format(new Date(t.dueDate), 'dd/MM/yyyy')}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-xs font-black text-slate-800 uppercase tracking-tight">{t.entityName}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[9px] text-slate-400 font-bold uppercase">{t.description}</span>
                          {t.renegotiated && (
                            <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded text-[8px] font-black uppercase tracking-widest">Renegociado</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-lg text-[9px] font-black uppercase tracking-widest">
                          {t.competence}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-black text-slate-900">
                          R$ {t.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-black text-emerald-600">
                          R$ {(t.amountReceived || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "text-sm font-black",
                          (t.openBalance || 0) > 0 ? "text-rose-600" : "text-slate-400"
                        )}>
                          R$ {(t.openBalance || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest",
                          t.status === 'PAID' ? "bg-emerald-100 text-emerald-700" :
                          t.status === 'PARTIALLY_PAID' ? "bg-blue-100 text-blue-700" :
                          t.status === 'OVERDUE' ? "bg-rose-100 text-rose-700" :
                          "bg-amber-100 text-amber-700"
                        )}>
                          {t.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-400 hover:text-blue-600" title="Ver Detalhes">
                            <FileText className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handlePayTransaction(t.id)}
                            className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-400 hover:text-emerald-600" 
                            title="Baixar Recebimento"
                          >
                            <DollarSign className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'payable' && (
        <div className="space-y-6 animate-in fade-in duration-500">
          {/* Payable Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <FinanceStatCard 
              title="Total em Aberto" 
              value={transactions.filter(t => t.type === 'EXPENSE' && t.status !== 'PAID').reduce((acc, t) => acc + t.amount, 0)} 
              icon={TrendingDown}
              trend="A pagar"
              color="amber"
            />
            <FinanceStatCard 
              title="Vencido" 
              value={transactions.filter(t => t.type === 'EXPENSE' && t.status === 'OVERDUE').reduce((acc, t) => acc + t.amount, 0)} 
              icon={AlertCircle}
              trend="Crítico"
              color="rose"
            />
            <FinanceStatCard 
              title="Vence Hoje" 
              value={transactions.filter(t => t.type === 'EXPENSE' && t.dueDate === format(new Date(), 'yyyy-MM-dd')).reduce((acc, t) => acc + t.amount, 0)} 
              icon={Clock}
              trend="Urgente"
              color="blue"
            />
            <FinanceStatCard 
              title="Pago no Mês" 
              value={transactions.filter(t => t.type === 'EXPENSE' && t.status === 'PAID').reduce((acc, t) => acc + t.amount, 0)} 
              icon={CheckCircle2}
              trend="Concluído"
              color="emerald"
            />
          </div>

          {/* Filters & Actions */}
          <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Buscar fornecedor..." 
                  className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all w-64"
                />
              </div>
              <select className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none transition-all">
                <option value="">Todos os Status</option>
                <option value="PENDING_APPROVAL">Pendente Aprovação</option>
                <option value="APPROVED">Aprovado</option>
                <option value="SCHEDULED">Agendado</option>
                <option value="PAID">Pago</option>
                <option value="OVERDUE">Vencido</option>
              </select>
              <select 
                className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none transition-all"
                value={selectedPayableCategory}
                onChange={(e) => setSelectedPayableCategory(e.target.value)}
              >
                <option value="Todas">Todas as Categorias</option>
                {financialCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <button 
              onClick={() => setIsPayableModalOpen(true)}
              className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
            >
              <PlusCircle className="w-4 h-4" />
              Lançar Conta
            </button>
          </div>

          {/* Payable Table */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50">
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Vencimento</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Fornecedor</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Categoria</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Valor Final</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {transactions.filter(t => {
                    const isExpense = t.type === 'EXPENSE';
                    if (selectedPayableCategory === 'Todas') return isExpense;
                    
                    // Simple mapping for demo purposes
                    const catMap: Record<string, string> = {
                      'Interconexão': 'INTERCONNECTION',
                      'Infraestrutura': 'INFRA_SERVER',
                      'Administrativo': 'ADMIN_OFFICE'
                    };
                    
                    const targetCat = catMap[selectedPayableCategory] || selectedPayableCategory.toUpperCase().replace(' ', '_');
                    return isExpense && t.category === targetCat;
                  }).map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span className={cn(
                            "text-xs font-bold",
                            t.status === 'OVERDUE' ? "text-rose-600" : "text-slate-600"
                          )}>
                            {format(new Date(t.dueDate), 'dd/MM/yyyy')}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-xs font-black text-slate-800 uppercase tracking-tight">{t.entityName}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">{t.description}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-lg text-[9px] font-black uppercase tracking-widest">
                          {t.category.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-black text-slate-900">
                          R$ {t.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest",
                          t.status === 'PAID' ? "bg-emerald-100 text-emerald-700" :
                          t.status === 'OVERDUE' ? "bg-rose-100 text-rose-700" :
                          t.status === 'SCHEDULED' ? "bg-blue-100 text-blue-700" :
                          "bg-amber-100 text-amber-700"
                        )}>
                          {t.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-400 hover:text-blue-600" title="Ver Detalhes">
                            <FileText className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handlePayTransaction(t.id)}
                            className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-400 hover:text-emerald-600" 
                            title="Aprovar/Pagar"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
      {activeSubTab === 'netting' && (
        <div className="space-y-6 animate-in fade-in duration-500">
          <div className="bg-blue-600 p-8 rounded-3xl text-white relative overflow-hidden shadow-xl shadow-blue-200">
            <div className="relative z-10">
              <h3 className="text-2xl font-black uppercase tracking-tight mb-2">Módulo de Netting</h3>
              <p className="text-blue-100 text-sm font-medium max-w-xl">
                Realize o abatimento cruzado entre faturas de fornecedores que também são clientes da Gerax. 
                Gere o saldo líquido e otimize o fluxo de caixa.
              </p>
              <button className="mt-6 px-6 py-3 bg-white text-blue-600 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-blue-50 transition-all shadow-lg">
                Nova Sessão de Netting
              </button>
            </div>
            <RefreshCwIcon className="w-64 h-64 absolute -right-16 -bottom-16 text-blue-500/20 rotate-12" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {nettingSessions.map(session => (
              <div key={session.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
                      <Users className="w-5 h-5 text-slate-600" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight">{session.entityName}</h4>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Sessão: {session.id}</span>
                    </div>
                  </div>
                  <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-lg text-[9px] font-black uppercase tracking-widest">
                    {session.status}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-[9px] font-black text-slate-400 uppercase mb-1">A Receber</p>
                    <p className="text-sm font-black text-emerald-600">R$ {session.grossReceivable.toLocaleString()}</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-[9px] font-black text-slate-400 uppercase mb-1">A Pagar</p>
                    <p className="text-sm font-black text-rose-600">R$ {session.grossPayable.toLocaleString()}</p>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                    <p className="text-[9px] font-black text-blue-400 uppercase mb-1">Saldo Líquido</p>
                    <p className="text-sm font-black text-blue-600">R$ {session.netAmount.toLocaleString()}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button className="flex-1 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all">
                    Aprovar Netting
                  </button>
                  <button className="px-4 py-3 bg-slate-100 text-slate-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all">
                    Detalhes
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeSubTab === 'billing' && (
        <div className="space-y-6 animate-in fade-in duration-500">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">Rating Engine - CDRs Processados</h3>
                  <button className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all">
                    Importar CDR
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/50">
                        <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Início</th>
                        <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Destino</th>
                        <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Duração</th>
                        <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Venda</th>
                        <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Custo</th>
                        <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Lucro</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {[].map((cdr: any) => (
                        <tr key={cdr.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-4 py-3 text-[10px] font-bold text-slate-600">{format(new Date(cdr.startTime), 'HH:mm:ss')}</td>
                          <td className="px-4 py-3 text-[10px] font-black text-slate-800">{cdr.destination}</td>
                          <td className="px-4 py-3 text-[10px] font-bold text-slate-600">{cdr.durationBilled}s</td>
                          <td className="px-4 py-3 text-[10px] font-black text-emerald-600">R$ {cdr.saleValue.toFixed(4)}</td>
                          <td className="px-4 py-3 text-[10px] font-black text-rose-600">R$ {cdr.costValue.toFixed(4)}</td>
                          <td className="px-4 py-3 text-[10px] font-black text-blue-600">R$ {cdr.profit.toFixed(4)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight mb-6">Fechamento Mensal</h3>
                <div className="space-y-4">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Competência</p>
                    <p className="text-sm font-black text-slate-800">Abril / 2024</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Status</p>
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-lg text-[9px] font-black uppercase tracking-widest">Em Aberto</span>
                  </div>
                  <button className="w-full py-4 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg">
                    Processar Faturamento
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'commissions' && (
        <div className="space-y-6 animate-in fade-in duration-500">
          {/* Commission Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <FinanceStatCard 
              title="Comissão Liberada" 
              value={0} 
              icon={CheckCircle2}
              trend="Mês atual"
              color="emerald"
            />
            <FinanceStatCard 
              title="Comissão Retida" 
              value={0} 
              icon={AlertCircle}
              trend="Inadimplência"
              color="rose"
            />
            <FinanceStatCard 
              title="Apurado (Pendente)" 
              value={0} 
              icon={Clock}
              trend="Aguardando Pgto"
              color="amber"
            />
            <FinanceStatCard 
              title="Melhor Vendedor" 
              value={92} 
              icon={TrendingUp}
              trend="Carlos Mendes"
              color="blue"
              isCurrency={false}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Sellers Performance Ranking */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">Ranking de Performance</h3>
                <button className="text-[10px] font-bold text-blue-600 uppercase hover:underline">Ver Todos</button>
              </div>
              <div className="space-y-4">
                {[].map((seller: any, index) => (
                  <div key={seller.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center text-xs font-black text-white",
                        index === 0 ? "bg-amber-500 shadow-lg shadow-amber-200" :
                        index === 1 ? "bg-slate-400" :
                        index === 2 ? "bg-amber-700" : "bg-slate-200 text-slate-600"
                      )}>
                        {index + 1}º
                      </div>
                      <div>
                        <p className="text-xs font-black text-slate-800">{seller.name}</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase">{seller.activeClients} clientes ativos</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={cn(
                        "text-sm font-black",
                        seller.performanceScore >= 90 ? "text-emerald-600" :
                        seller.performanceScore >= 70 ? "text-amber-500" : "text-rose-600"
                      )}>
                        {seller.performanceScore} pts
                      </p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase">Score</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Commissions Table & Calculator */}
            <div className="lg:col-span-2 space-y-6">
              {/* Commission Calculator */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center border border-blue-100">
                    <Calculator className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">Calculadora de Comissão</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Simulação rápida de ganhos</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Valor Total do Cliente</label>
                    <div className="relative">
                      <DollarSign className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input 
                        type="number" 
                        value={calcBaseValue || ''}
                        onChange={(e) => setCalcBaseValue(Number(e.target.value))}
                        placeholder="0.00" 
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">% do Vendedor</label>
                    <div className="relative">
                      <Percent className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input 
                        type="number" 
                        value={calcPercentage || ''}
                        onChange={(e) => setCalcPercentage(Number(e.target.value))}
                        placeholder="0" 
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Bônus (Opcional)</label>
                    <div className="flex gap-2">
                      <select 
                        value={calcBonusType}
                        onChange={(e) => setCalcBonusType(e.target.value as 'FIXED' | 'PERCENTAGE')}
                        className="px-2 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none transition-all w-20"
                      >
                        <option value="FIXED">R$</option>
                        <option value="PERCENTAGE">%</option>
                      </select>
                      <input 
                        type="number" 
                        value={calcBonusValue || ''}
                        onChange={(e) => setCalcBonusValue(Number(e.target.value))}
                        placeholder="0" 
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                      />
                    </div>
                  </div>
                  <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-2 flex flex-col justify-center items-center h-[42px]">
                    <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest leading-none mb-0.5">Total Estimado</span>
                    <span className="text-sm font-black text-emerald-700 leading-none">R$ {calculatedCommission.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>

              {/* Commissions Table */}
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">Apuração de Comissões</h3>
                  <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-200">
                    <PlusCircle className="w-3.5 h-3.5" />
                    Calcular Período
                  </button>
                </div>
                <div className="overflow-x-auto flex-1">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/50">
                        <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Vendedor</th>
                        <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Cliente</th>
                        <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Faturado</th>
                        <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Recebido</th>
                        <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Comissão</th>
                        <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {[].map((c: any) => (
                        <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-4 py-3">
                            <p className="text-xs font-black text-slate-800">{c.sellerName}</p>
                            <p className="text-[9px] text-slate-400 font-bold uppercase">{c.competence}</p>
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-xs font-black text-slate-800">{c.clientName}</p>
                            <p className="text-[9px] text-slate-400 font-bold uppercase">{c.ruleName}</p>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-xs font-bold text-slate-600">
                              R$ {c.invoiceAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={cn(
                              "text-xs font-bold",
                              c.receivedAmount < c.invoiceAmount ? "text-amber-600" : "text-emerald-600"
                            )}>
                              R$ {c.receivedAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm font-black text-slate-900">
                              R$ {c.commissionAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={cn(
                              "px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest",
                              c.status === 'RELEASED' ? "bg-emerald-100 text-emerald-700" :
                              c.status === 'WITHHELD' ? "bg-rose-100 text-rose-700" :
                              "bg-amber-100 text-amber-700"
                            )}>
                              {c.status === 'RELEASED' ? 'LIBERADA' : c.status === 'WITHHELD' ? 'RETIDA' : 'APURADA'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lançar Conta Modal */}
      <AnimatePresence>
        {isPayableModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsPayableModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-4xl bg-white rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="bg-white px-8 py-6 border-b border-slate-200 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
                    <PlusCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Lançar Conta</h2>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Contas a Pagar / Despesas</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsPayableModalOpen(false)}
                  className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400 hover:text-slate-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleAddPayable} className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Fornecedor Info */}
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome Fornecedor *</label>
                      <input 
                        type="text" 
                        required
                        value={payableForm.entityName}
                        onChange={(e) => setPayableForm(prev => ({ ...prev, entityName: e.target.value }))}
                        className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                        placeholder="Ex: Amazon AWS"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">CNPJ Fornecedor</label>
                      <input 
                        type="text" 
                        value={payableForm.cnpj}
                        onChange={(e) => setPayableForm(prev => ({ ...prev, cnpj: e.target.value }))}
                        className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                        placeholder="00.000.000/0000-00"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Agência</label>
                        <input 
                          type="text" 
                          value={payableForm.bankAgency}
                          onChange={(e) => setPayableForm(prev => ({ ...prev, bankAgency: e.target.value }))}
                          className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                          placeholder="0001"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Conta Corrente</label>
                        <input 
                          type="text" 
                          value={payableForm.bankAccount}
                          onChange={(e) => setPayableForm(prev => ({ ...prev, bankAccount: e.target.value }))}
                          className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                          placeholder="00000-0"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Chave PIX</label>
                      <input 
                        type="text" 
                        value={payableForm.pixKey}
                        onChange={(e) => setPayableForm(prev => ({ ...prev, pixKey: e.target.value }))}
                        className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                        placeholder="E-mail, CPF ou Aleatória"
                      />
                    </div>
                  </div>

                  {/* Lançamento Info */}
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nº NF / Boleto</label>
                        <input 
                          type="text" 
                          value={payableForm.nfNumber}
                          onChange={(e) => setPayableForm(prev => ({ ...prev, nfNumber: e.target.value }))}
                          className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                          placeholder="000.000"
                        />
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between ml-1">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Categoria</label>
                          <button 
                            type="button"
                            onClick={() => setIsCategoryModalOpen(true)}
                            className="p-1 hover:bg-slate-100 rounded-lg transition-colors text-slate-400 hover:text-blue-600"
                            title="Gerenciar Categorias"
                          >
                            <Settings className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <select 
                          value={payableForm.category}
                          onChange={(e) => setPayableForm(prev => ({ ...prev, category: e.target.value }))}
                          className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                        >
                          {financialCategories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Vencimento *</label>
                        <input 
                          type="date" 
                          required
                          value={payableForm.dueDate}
                          onChange={(e) => setPayableForm(prev => ({ ...prev, dueDate: e.target.value }))}
                          className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Condição (Dias)</label>
                        <input 
                          type="text" 
                          value={payableForm.paymentCondition}
                          onChange={(e) => setPayableForm(prev => ({ ...prev, paymentCondition: e.target.value }))}
                          className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                          placeholder="Ex: 30 dias"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Valor BRL *</label>
                        <div className="relative">
                          <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">R$</span>
                          <input 
                            type="number" 
                            step="0.01"
                            required
                            value={payableForm.amount}
                            onChange={(e) => setPayableForm(prev => ({ ...prev, amount: e.target.value }))}
                            className="w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                            placeholder="0,00"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Parcelas</label>
                        <input 
                          type="number" 
                          min="1"
                          value={payableForm.installments}
                          onChange={(e) => setPayableForm(prev => ({ ...prev, installments: e.target.value }))}
                          className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Descrição / Observações</label>
                  <textarea 
                    value={payableForm.description}
                    onChange={(e) => setPayableForm(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-blue-500/10 outline-none transition-all resize-none"
                    rows={3}
                    placeholder="Detalhes adicionais do lançamento..."
                  />
                </div>

                <div className="bg-blue-50 p-6 rounded-3xl border border-blue-100">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
                      <Users className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Responsável pelo Lançamento</p>
                      <p className="text-xs font-black text-blue-900 uppercase">
                        {isMaster ? 'Administrador Master' : 'Operador Técnico'} ({user?.email})
                      </p>
                    </div>
                  </div>
                </div>
              </form>

              <div className="bg-white px-8 py-6 border-t border-slate-200 flex items-center justify-between shrink-0">
                <button 
                  type="button"
                  onClick={() => setIsPayableModalOpen(false)}
                  className="px-8 py-4 text-slate-400 text-xs font-black uppercase tracking-widest hover:text-slate-600 transition-all"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleAddPayable}
                  className="px-12 py-4 bg-slate-900 text-white text-xs font-black uppercase tracking-widest rounded-2xl hover:bg-slate-800 transition-all shadow-xl flex items-center gap-3"
                >
                  <Save className="w-4 h-4" />
                  Salvar Lançamento
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Category Management Modal */}
      <AnimatePresence>
        {isCategoryModalOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCategoryModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-[32px] shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="bg-white px-6 py-5 border-b border-slate-200 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 border border-blue-100">
                    <Settings className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">Categorias</h2>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Gerenciar opções de lançamento</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Add New Category */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nova Categoria</label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
                      className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                      placeholder="Nome da categoria..."
                    />
                    <button 
                      onClick={handleAddCategory}
                      className="px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
                    >
                      <PlusCircle className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Categories List */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Categorias Atuais</label>
                  <div className="max-h-[300px] overflow-y-auto custom-scrollbar space-y-2 pr-2">
                    {financialCategories.map((cat) => (
                      <div 
                        key={cat} 
                        className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 group hover:border-blue-200 transition-all"
                      >
                        <span className="text-sm font-bold text-slate-700">{cat}</span>
                        <button 
                          onClick={() => handleRemoveCategory(cat)}
                          className="p-1.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                          title="Remover Categoria"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex justify-end">
                <button 
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="px-6 py-2.5 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
                >
                  Concluir
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function FinanceStatCard({ title, value, icon: Icon, trend, color, isCurrency = true }: { 
  title: string, 
  value: number, 
  icon: any, 
  trend: string,
  color: 'blue' | 'emerald' | 'amber' | 'rose',
  isCurrency?: boolean
}) {
  const colors = {
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    rose: 'bg-rose-50 text-rose-600 border-rose-100'
  };

  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center border", colors[color])}>
          <Icon className="w-5 h-5" />
        </div>
        <div className={cn(
          "flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest",
          trend.startsWith('+') || trend === 'Mês atual' || trend === 'Carlos Mendes' || trend === 'Concluído' || trend === 'A receber' ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-700"
        )}>
          {trend.startsWith('+') ? <ArrowUpRight className="w-3 h-3" /> : trend.startsWith('-') ? <ArrowDownRight className="w-3 h-3" /> : null}
          {trend}
        </div>
      </div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{title}</p>
      <p className="text-2xl font-black text-slate-900 tracking-tight">
        {isCurrency ? `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : value}
      </p>
    </div>
  );
}


