import React, { useState } from 'react';
import { 
  Users, 
  UserPlus, 
  FileText, 
  CheckCircle2, 
  Plus, 
  Search, 
  Building2, 
  Phone, 
  Globe, 
  ShieldCheck,
  ChevronRight,
  ChevronDown,
  Clock,
  X,
  Save,
  Briefcase,
  DollarSign,
  Database,
  Server
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { cn } from '../lib/utils';
import { Seller, ClientRegistration } from '../types';

interface SellersViewProps {
  sellers: Seller[];
  registrations: ClientRegistration[];
  onAddSeller: (seller: Omit<Seller, 'id' | 'createdAt'>) => void;
  onRegisterClient: (registration: Omit<ClientRegistration, 'id' | 'createdAt'>) => void;
  onUpdateClient?: (registration: ClientRegistration) => void;
}

const ROUTE_OPTIONS = [
  "ITX || CLI Aberta",
  "ITX || Anti Spam",
  "SMP || Bina Móvel",
  "TDM || Bina Mista",
  "TDM || Bina Fixo",
  "0/12/6 || Bina Fixo",
  "0/12/6 || Bina Móvel",
  "1/1 || Bina móvel",
  "1/1 || Bina mista",
  "FIXO || Liga para fixo",
  "FIXO || CLI Aberta para fixo",
  "0800 || Ligações para 0800"
];

const BILLING_OPTIONS = [
  "Pré-pago",
  "D+1",
  "Semanal",
  "Quinzenal",
  "Mensal",
  "Outro"
];

const SERVER_OPTIONS = ["84", "35", "52", "132", "68", "195", "21", "100", "38", "186", "180"];

export default function SellersView({ sellers, registrations, onAddSeller, onRegisterClient, onUpdateClient }: SellersViewProps) {
  const [activeTab, setActiveTab] = useState<'list' | 'register-client' | 'add-seller' | 'client-list' | 'performance'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [clientSearchTerm, setClientSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState<ClientRegistration | null>(null);
  const [selectedPerformanceSellerId, setSelectedPerformanceSellerId] = useState<string>('');

  const getSellerClientCount = (sellerId: string) => {
    return registrations.filter(r => r.sellerId === sellerId).length;
  };

  // Client Registration Form State
  const [clientForm, setClientForm] = useState({
    sellerId: '',
    clientName: '',
    cnpj: '',
    contact: '',
    contractedRoutes: [] as string[],
    rates: '',
    billingType: '',
    serverId: '',
    ips: '',
    approxChannels: '',
    additionalInfo: '',
    status: 'ANALYSIS' as 'CLOSED' | 'ANALYSIS'
  });

  // Seller Form State
  const [sellerForm, setSellerForm] = useState({
    name: '',
    email: '',
    phone: '',
    birthDate: '',
    status: 'ACTIVE' as const
  });

  const handleToggleRoute = (route: string) => {
    setClientForm(prev => ({
      ...prev,
      contractedRoutes: prev.contractedRoutes.includes(route)
        ? prev.contractedRoutes.filter(r => r !== route)
        : [...prev.contractedRoutes, route]
    }));
  };

  const handleSubmitClient = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check mandatory fields
    if (
      !clientForm.sellerId || 
      !clientForm.clientName || 
      !clientForm.cnpj || 
      !clientForm.contact || 
      clientForm.contractedRoutes.length === 0 || 
      !clientForm.rates || 
      !clientForm.billingType || 
      !clientForm.serverId ||
      !clientForm.approxChannels
    ) {
      toast.error("Preencha todos os campos obrigatórios (*)");
      return;
    }

    // Check CNPJ uniqueness
    const cnpjExists = registrations.some(r => r.cnpj === clientForm.cnpj);
    if (cnpjExists) {
      toast.error("Este CNPJ já está cadastrado para outro cliente");
      return;
    }

    // Check Client Name uniqueness
    const clientNameExists = registrations.some(r => r.clientName.toLowerCase() === clientForm.clientName.toLowerCase());
    if (clientNameExists) {
      toast.error("Este nome de cliente já está cadastrado");
      return;
    }

    // Check Contact uniqueness
    const contactExists = registrations.some(r => r.contact.toLowerCase() === clientForm.contact.toLowerCase());
    if (contactExists) {
      toast.error("Este contato já está cadastrado para outro cliente");
      return;
    }
    
    const selectedSeller = sellers.find(s => s.id === clientForm.sellerId);
    onRegisterClient({
      ...clientForm,
      sellerName: selectedSeller?.name || 'Desconhecido'
    });
    
    toast.success("Cliente registrado com sucesso!");
    setActiveTab('list');
    setClientForm({
      sellerId: '',
      clientName: '',
      cnpj: '',
      contact: '',
      contractedRoutes: [],
      rates: '',
      billingType: '',
      serverId: '',
      ips: '',
      approxChannels: '',
      additionalInfo: '',
      status: 'ANALYSIS'
    });
  };

  const handleSubmitSeller = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sellerForm.name || !sellerForm.email) {
      toast.error("Preecha os campos obrigatórios");
      return;
    }
    
    onAddSeller({
      ...sellerForm,
      portfolioSize: 0,
      activeClients: 0,
      defaultRate: 0,
      performanceScore: 0
    });
    
    toast.success("Vendedor cadastrado com sucesso!");
    setActiveTab('list');
    setSellerForm({ name: '', email: '', phone: '', birthDate: '', status: 'ACTIVE' });
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header Tabs */}
      <div className="flex items-center gap-4 bg-white p-2 rounded-[24px] border border-slate-200 shadow-sm w-fit">
        <button 
          onClick={() => setActiveTab('list')}
          className={cn(
            "flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
            activeTab === 'list' ? "bg-slate-900 text-white shadow-lg" : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
          )}
        >
          <Users className="w-4 h-4" />
          Vendedores
        </button>
        <button 
          onClick={() => setActiveTab('add-seller')}
          className={cn(
            "flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
            activeTab === 'add-seller' ? "bg-blue-600 text-white shadow-lg shadow-blue-200" : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
          )}
        >
          <UserPlus className="w-4 h-4" />
          Cadastrar Vendedor
        </button>
        <button 
          onClick={() => setActiveTab('register-client')}
          className={cn(
            "flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
            activeTab === 'register-client' ? "bg-emerald-600 text-white shadow-lg shadow-emerald-200" : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
          )}
        >
          <FileText className="w-4 h-4" />
          Cadastrar Cliente
        </button>
        <button 
          onClick={() => setActiveTab('client-list')}
          className={cn(
            "flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
            activeTab === 'client-list' ? "bg-blue-500 text-white shadow-lg shadow-blue-200" : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
          )}
        >
          <Building2 className="w-4 h-4" />
          Fichas de Clientes
        </button>
        <button 
          onClick={() => setActiveTab('performance')}
          className={cn(
            "flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
            activeTab === 'performance' ? "bg-amber-500 text-white shadow-lg shadow-amber-200" : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
          )}
        >
          <DollarSign className="w-4 h-4" />
          Performance
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'list' && (
          <motion.div 
            key="list"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Buscar vendedor..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sellers.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase())).map((seller) => (
                <div key={seller.id} className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all group">
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-600 group-hover:bg-blue-600 group-hover:text-white transition-all">
                        <Users className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-black text-slate-900 uppercase tracking-tight">{seller.name}</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{seller.email}</p>
                      </div>
                    </div>
                    <span className={cn(
                      "px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest",
                      seller.status === 'ACTIVE' ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                    )}>
                      {seller.status === 'ACTIVE' ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div 
                      onClick={() => {
                        setClientSearchTerm(seller.name);
                        setActiveTab('client-list');
                      }}
                      className="bg-slate-50 p-4 rounded-2xl cursor-pointer hover:bg-blue-50 transition-colors group/stat"
                    >
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 group-hover/stat:text-blue-600">Clientes Ativos</p>
                      <p className="text-xl font-black text-slate-900 group-hover/stat:text-blue-700">{getSellerClientCount(seller.id) || seller.activeClients}</p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-2xl">
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Score</p>
                      <p className="text-xl font-black text-blue-600">{seller.performanceScore}%</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {activeTab === 'add-seller' && (
          <motion.div 
            key="add-seller"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="max-w-2xl mx-auto"
          >
            <div className="bg-white rounded-[32px] border border-slate-200 shadow-xl overflow-hidden">
              <div className="p-8 border-b border-slate-100 bg-slate-50/50">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
                    <UserPlus className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Novo Vendedor</h3>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Cadastre um novo membro na equipe</p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSubmitSeller} className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome Completo</label>
                  <input 
                    type="text" 
                    value={sellerForm.name}
                    onChange={(e) => setSellerForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                    placeholder="Ex: André Silva"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">E-mail Corporativo</label>
                  <input 
                    type="email" 
                    value={sellerForm.email}
                    onChange={(e) => setSellerForm(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                    placeholder="andre@empresa.com"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Número</label>
                  <input 
                    type="tel" 
                    value={sellerForm.phone}
                    onChange={(e) => setSellerForm(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                    placeholder="(00) 00000-0000"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Data de Nascimento</label>
                  <input 
                    type="date" 
                    value={sellerForm.birthDate}
                    onChange={(e) => setSellerForm(prev => ({ ...prev, birthDate: e.target.value }))}
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-slate-700"
                  />
                </div>

                <div className="pt-4">
                  <button 
                    type="submit"
                    className="w-full py-5 bg-slate-900 text-white font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-slate-800 transition-all shadow-xl flex items-center justify-center gap-3"
                  >
                    <Save className="w-5 h-5" />
                    Salvar Vendedor
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}

        {activeTab === 'register-client' && (
          <motion.div 
            key="register-client"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="max-w-4xl mx-auto"
          >
            <form onSubmit={handleSubmitClient} className="space-y-8">
              {/* Section: Vendedor Responsável */}
              <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm space-y-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                    <Briefcase className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Vendedor Responsável <span className="text-rose-500">*</span></h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {sellers.map((seller) => (
                    <label 
                      key={seller.id}
                      className={cn(
                        "flex items-center gap-3 p-4 rounded-2xl border-2 transition-all cursor-pointer",
                        clientForm.sellerId === seller.id 
                          ? "border-blue-600 bg-blue-50/50" 
                          : "border-slate-100 bg-slate-50 hover:border-slate-200"
                      )}
                    >
                      <input 
                        type="radio" 
                        name="seller"
                        value={seller.id}
                        checked={clientForm.sellerId === seller.id}
                        onChange={(e) => setClientForm(prev => ({ ...prev, sellerId: e.target.value }))}
                        className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500"
                      />
                      <span className="text-xs font-bold text-slate-700">{seller.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Section: Cliente Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm space-y-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Cliente <span className="text-rose-500">*</span></h3>
                  </div>
                  <input 
                    type="text" 
                    value={clientForm.clientName}
                    onChange={(e) => setClientForm(prev => ({ ...prev, clientName: e.target.value }))}
                    placeholder="Nome da empresa"
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                  />
                </div>

                <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm space-y-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                      <FileText className="w-4 h-4" />
                    </div>
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">CNPJ <span className="text-rose-500">*</span></h3>
                  </div>
                  <input 
                    type="text" 
                    value={clientForm.cnpj}
                    onChange={(e) => setClientForm(prev => ({ ...prev, cnpj: e.target.value }))}
                    placeholder="00.000.000/0000-00"
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                  />
                </div>
              </div>

              {/* Section: Contato */}
              <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm space-y-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                    <Phone className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Contato Cliente <span className="text-rose-500">*</span></h3>
                </div>
                <input 
                  type="text" 
                  value={clientForm.contact}
                  onChange={(e) => setClientForm(prev => ({ ...prev, contact: e.target.value }))}
                  placeholder="Nome, Telefone ou E-mail"
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                />
              </div>

              {/* Section: Rotas Contratadas */}
              <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm space-y-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                    <Globe className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Rotas Contratadas <span className="text-rose-500">*</span></h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {ROUTE_OPTIONS.map((route) => (
                    <label 
                      key={route}
                      className={cn(
                        "flex items-center gap-3 p-4 rounded-2xl border-2 transition-all cursor-pointer",
                        clientForm.contractedRoutes.includes(route)
                          ? "border-blue-600 bg-blue-50/50" 
                          : "border-slate-100 bg-slate-50 hover:border-slate-200"
                      )}
                    >
                      <input 
                        type="checkbox" 
                        checked={clientForm.contractedRoutes.includes(route)}
                        onChange={() => handleToggleRoute(route)}
                        className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                      />
                      <span className="text-xs font-bold text-slate-700">{route}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Section: Tarifação */}
              <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                      <DollarSign className="w-4 h-4" />
                    </div>
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Valores/Tarifação <span className="text-rose-500">*</span></h3>
                  </div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{clientForm.rates.length}/20</span>
                </div>
                <div className="relative">
                  <input 
                    type="text"
                    value={clientForm.rates}
                    onChange={(e) => setClientForm(prev => ({ ...prev, rates: e.target.value.substring(0, 20) }))}
                    placeholder="Ex: 0,050 | 0,052"
                    maxLength={20}
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                  />
                  <p className="mt-2 text-[9px] text-slate-400 font-medium uppercase tracking-wider italic">Campo reduzido (máx 20 caracteres)</p>
                </div>
              </div>

              {/* Section: Cobrança & NF */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm space-y-6">
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Cobrança <span className="text-rose-500">*</span></h3>
                  <div className="space-y-3">
                    {BILLING_OPTIONS.map((option) => (
                      <label 
                        key={option}
                        className={cn(
                          "flex items-center gap-3 p-4 rounded-2xl border-2 transition-all cursor-pointer",
                          clientForm.billingType === option 
                            ? "border-blue-600 bg-blue-50/50" 
                            : "border-slate-100 bg-slate-50 hover:border-slate-200"
                        )}
                      >
                        <input 
                          type="radio" 
                          name="billing"
                          value={option}
                          checked={clientForm.billingType === option}
                          onChange={(e) => setClientForm(prev => ({ ...prev, billingType: e.target.value }))}
                          className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500"
                        />
                        <span className="text-xs font-bold text-slate-700">{option}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                      <Server className="w-4 h-4" />
                    </div>
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Escolher Servidor <span className="text-rose-500">*</span></h3>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {SERVER_OPTIONS.map((server) => (
                      <motion.button 
                        key={server}
                        type="button"
                        whileHover={{ scale: 1.02, translateY: -2 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setClientForm(prev => ({ ...prev, serverId: server }))}
                        className={cn(
                          "relative group overflow-hidden py-4 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-2",
                          clientForm.serverId === server 
                            ? "border-blue-600 bg-blue-600 text-white shadow-xl shadow-blue-200" 
                            : "border-slate-100 bg-slate-50 text-slate-400 hover:border-blue-200 hover:bg-white hover:text-blue-500"
                        )}
                      >
                        {clientForm.serverId === server && (
                          <motion.div 
                            layoutId="activeServer"
                            className="absolute inset-0 bg-gradient-to-br from-blue-600 to-blue-700 -z-10"
                          />
                        )}
                        <Server className={cn(
                          "w-5 h-5 transition-colors",
                          clientForm.serverId === server ? "text-blue-100" : "text-slate-300 group-hover:text-blue-400"
                        )} />
                        <span className="font-black text-base uppercase tracking-widest">{server}</span>
                        {clientForm.serverId === server && (
                          <div className="absolute top-1.5 right-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-200 animate-pulse" />
                          </div>
                        )}
                      </motion.button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Section: IPs & Canais */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm space-y-6">
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">IP's para liberação</h3>
                  <input 
                    type="text" 
                    value={clientForm.ips}
                    onChange={(e) => setClientForm(prev => ({ ...prev, ips: e.target.value }))}
                    placeholder="0.0.0.0"
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                  />
                </div>

                <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm space-y-6">
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Canais aproximados <span className="text-rose-500">*</span></h3>
                  <input 
                    type="text" 
                    value={clientForm.approxChannels}
                    onChange={(e) => setClientForm(prev => ({ ...prev, approxChannels: e.target.value }))}
                    placeholder="Ex: 50"
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                  />
                </div>
              </div>

              {/* Section: Status */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm space-y-6">
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Status do Cliente <span className="text-rose-500">*</span></h3>
                  <div className="flex gap-4">
                    <button 
                      type="button"
                      onClick={() => setClientForm(prev => ({ ...prev, status: 'CLOSED' }))}
                      className={cn(
                        "flex-1 py-4 rounded-2xl border-2 font-black text-[10px] uppercase tracking-widest transition-all",
                        clientForm.status === 'CLOSED' ? "border-emerald-600 bg-emerald-50 text-emerald-600" : "border-slate-100 bg-slate-50 text-slate-400"
                      )}
                    >
                      Fechado
                    </button>
                    <button 
                      type="button"
                      onClick={() => setClientForm(prev => ({ ...prev, status: 'ANALYSIS' }))}
                      className={cn(
                        "flex-1 py-4 rounded-2xl border-2 font-black text-[10px] uppercase tracking-widest transition-all",
                        clientForm.status === 'ANALYSIS' ? "border-amber-600 bg-amber-50 text-amber-600" : "border-slate-100 bg-slate-50 text-slate-400"
                      )}
                    >
                      Em Análise
                    </button>
                  </div>
                </div>
              </div>

              {/* Section: Adicionais */}
              <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm space-y-6">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Informações adicionais</h3>
                <textarea 
                  value={clientForm.additionalInfo}
                  onChange={(e) => setClientForm(prev => ({ ...prev, additionalInfo: e.target.value }))}
                  placeholder="Alguma observação importante?"
                  rows={4}
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-blue-500/10 outline-none transition-all resize-none"
                />
              </div>

              <div className="pt-4">
                <button 
                  type="submit"
                  className="w-full py-6 bg-emerald-600 text-white font-black uppercase tracking-[0.2em] rounded-[32px] hover:bg-emerald-700 transition-all shadow-2xl shadow-emerald-200 flex items-center justify-center gap-3"
                >
                  <CheckCircle2 className="w-6 h-6" />
                  Finalizar Cadastro de Cliente
                </button>
              </div>
            </form>
          </motion.div>
        )}
        {activeTab === 'client-list' && (
          <motion.div 
            key="client-list"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Buscar ficha de cliente..." 
                  value={clientSearchTerm}
                  onChange={(e) => setClientSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold"
                />
              </div>
              {clientSearchTerm && (
                <button 
                  onClick={() => setClientSearchTerm('')}
                  className="px-4 py-2.5 bg-slate-100 text-slate-600 text-[10px] font-black uppercase rounded-xl hover:bg-slate-200 transition-all"
                >
                  Limpar Filtro
                </button>
              )}
            </div>

            <div className="space-y-10">
              {Array.from(new Set(registrations.map(r => r.serverId))).sort().map(serverId => {
                const serverClients = registrations.filter(r => 
                  r.serverId === serverId &&
                  (r.clientName.toLowerCase().includes(clientSearchTerm.toLowerCase()) ||
                   r.sellerName.toLowerCase().includes(clientSearchTerm.toLowerCase()))
                );

                if (serverClients.length === 0) return null;

                return (
                  <div key={serverId || 'unassigned'} className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white shadow-md">
                        <Database className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">
                          Servidor {serverId || 'Não Definido'}
                        </h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          {serverClients.length} Cliente{serverClients.length !== 1 ? 's' : ''} alocado{serverClients.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                      {serverClients.map(reg => (
                        <div 
                          key={reg.id} 
                          onClick={() => setSelectedClient(reg)}
                          className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg hover:border-blue-300 transition-all group cursor-pointer flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex items-center gap-3 mb-3">
                              <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 shrink-0">
                                <Building2 className="w-4 h-4" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <h3 className="font-black text-slate-900 uppercase tracking-tight text-xs truncate">{reg.clientName}</h3>
                                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest truncate">{reg.cnpj}</p>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-2 border-t border-slate-50 pt-3">
                              <div>
                                <p className="text-[7px] font-bold text-slate-400 uppercase tracking-widest">Vendedor</p>
                                <p className="text-[9px] font-black text-slate-700 uppercase truncate">{reg.sellerName}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-[7px] font-bold text-slate-400 uppercase tracking-widest">Data</p>
                                <p className="text-[9px] font-black text-slate-700">{new Date(reg.createdAt).toLocaleDateString('pt-BR')}</p>
                              </div>
                            </div>
                          </div>

                          <div className="mt-3 flex justify-end">
                            <span className="text-[8px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                              Ficha Completa <ChevronRight className="w-2.5 h-2.5" />
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}

              {registrations.filter(r => 
                r.clientName.toLowerCase().includes(clientSearchTerm.toLowerCase()) ||
                r.sellerName.toLowerCase().includes(clientSearchTerm.toLowerCase())
              ).length === 0 && (
                <div className="col-span-full py-12 text-center bg-white rounded-[32px] border-2 border-dashed border-slate-100">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Nenhuma ficha encontrada</p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {activeTab === 'performance' && (
          <motion.div 
            key="performance"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
          >
            <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Performance por Vendedor</h3>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Selecione um vendedor para ver os detalhes da carteira</p>
                </div>
                <div className="relative min-w-[280px]">
                  <select 
                    value={selectedPerformanceSellerId}
                    onChange={(e) => setSelectedPerformanceSellerId(e.target.value)}
                    className="w-full pl-4 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-blue-500/10 outline-none transition-all appearance-none cursor-pointer"
                  >
                    <option value="">Selecione um Vendedor</option>
                    {sellers.map(seller => (
                      <option key={seller.id} value={seller.id}>{seller.name}</option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>
            </div>

            {selectedPerformanceSellerId && (
              <div className="space-y-8">
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Clientes Fechados</p>
                    <p className="text-3xl font-black text-emerald-600">
                      {registrations.filter(r => r.sellerId === selectedPerformanceSellerId && r.status === 'CLOSED').length}
                    </p>
                  </div>
                  <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Em Análise</p>
                    <p className="text-3xl font-black text-amber-600">
                      {registrations.filter(r => r.sellerId === selectedPerformanceSellerId && r.status === 'ANALYSIS').length}
                    </p>
                  </div>
                </div>

                {/* Clients Lists */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Closed Clients */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 px-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest">Clientes Fechados</h4>
                    </div>
                    <div className="space-y-3">
                      {registrations
                        .filter(r => r.sellerId === selectedPerformanceSellerId && r.status === 'CLOSED')
                        .map(reg => (
                          <div 
                            key={reg.id} 
                            onClick={() => setSelectedClient(reg)}
                            className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between group hover:border-blue-200 transition-all cursor-pointer"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
                                <Building2 className="w-5 h-5" />
                              </div>
                              <div>
                                <p className="text-sm font-black text-slate-900 uppercase tracking-tight">{reg.clientName}</p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">CNPJ: {reg.cnpj}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{reg.billingType}</p>
                            </div>
                          </div>
                        ))}
                      {registrations.filter(r => r.sellerId === selectedPerformanceSellerId && r.status === 'CLOSED').length === 0 && (
                        <div className="p-8 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-100">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nenhum cliente fechado</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Analysis Clients */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 px-2">
                      <Clock className="w-4 h-4 text-amber-600" />
                      <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest">Clientes em Análise</h4>
                    </div>
                    <div className="space-y-3">
                      {registrations
                        .filter(r => r.sellerId === selectedPerformanceSellerId && r.status === 'ANALYSIS')
                        .map(reg => (
                          <div 
                            key={reg.id} 
                            onClick={() => setSelectedClient(reg)}
                            className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between group hover:border-blue-200 transition-all cursor-pointer"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600">
                                <Building2 className="w-5 h-5" />
                              </div>
                              <div>
                                <p className="text-sm font-black text-slate-900 uppercase tracking-tight">{reg.clientName}</p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">CNPJ: {reg.cnpj}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="text-right">
                                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Prospecção</p>
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (onUpdateClient) {
                                    onUpdateClient({ ...reg, status: 'CLOSED' });
                                    toast.success(`Cliente ${reg.clientName} marcado como fechado!`);
                                  }
                                }}
                                className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-colors group/btn"
                                title="Mudar para Fechado"
                              >
                                <CheckCircle2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      {registrations.filter(r => r.sellerId === selectedPerformanceSellerId && r.status === 'ANALYSIS').length === 0 && (
                        <div className="p-8 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-100">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nenhum cliente em análise</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {!selectedPerformanceSellerId && (
              <div className="py-20 text-center bg-white rounded-[32px] border-2 border-dashed border-slate-100">
                <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 mx-auto mb-4">
                  <Users className="w-8 h-8" />
                </div>
                <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Selecione um vendedor para visualizar os dados</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Client Detail Modal (Reused from ClientsView logic or similar) */}
      <AnimatePresence>
        {selectedClient && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedClient(null)}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-4xl bg-[#F8FAFC] rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
              >
                <div className="bg-white px-8 py-6 border-b border-slate-200 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
                      <Building2 className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">{selectedClient.clientName}</h2>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">CNPJ: {selectedClient.cnpj}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setSelectedClient(null)}
                    className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Informações Gerais</h4>
                        <div className="space-y-3">
                          <div className="flex justify-between text-xs">
                            <span className="font-bold text-slate-500 uppercase">Vendedor</span>
                            <span className="font-black text-slate-900 uppercase">{selectedClient.sellerName}</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="font-bold text-slate-500 uppercase">Contato</span>
                            <span className="font-black text-slate-900">{selectedClient.contact}</span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Rotas Contratadas</h4>
                        <div className="flex flex-wrap gap-2">
                          {selectedClient.contractedRoutes.map(route => (
                            <span key={route} className="px-2 py-1 bg-blue-50 text-blue-700 rounded-lg text-[9px] font-black uppercase border border-blue-100">
                              {route}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Configurações Técnicas</h4>
                        <div className="space-y-3">
                          <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">IPs de Liberação</p>
                            <code className="text-xs font-mono text-blue-600 bg-slate-50 p-2 rounded-lg block">{selectedClient.ips || 'Nenhum'}</code>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="font-bold text-slate-500 uppercase">Canais</span>
                            <span className="font-black text-slate-900">{selectedClient.approxChannels}</span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Financeiro & Status</h4>
                        <div className="space-y-3">
                          <div className="flex justify-between text-xs">
                            <span className="font-bold text-slate-500 uppercase">Status</span>
                            <span className={cn(
                              "font-black uppercase px-2 py-0.5 rounded-md",
                              selectedClient.status === 'CLOSED' ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                            )}>
                              {selectedClient.status === 'CLOSED' ? 'FECHADO' : 'EM ANÁLISE'}
                            </span>
                          </div>
                          {selectedClient.status === 'ANALYSIS' && (
                            <button
                              onClick={() => {
                                if (onUpdateClient) {
                                  const updated = { ...selectedClient, status: 'CLOSED' as const };
                                  onUpdateClient(updated);
                                  setSelectedClient(updated);
                                  toast.success(`Cliente ${selectedClient.clientName} marcado como fechado!`);
                                }
                              }}
                              className="w-full py-2 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 mt-2"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Mudar para Fechado
                            </button>
                          )}
                          <div className="flex justify-between text-xs">
                            <span className="font-bold text-slate-500 uppercase">Tipo de Cobrança</span>
                            <span className="font-black text-slate-900">{selectedClient.billingType}</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="font-bold text-slate-500 uppercase">Servidor</span>
                            <span className="font-black text-blue-600 uppercase">
                              {selectedClient.serverId || 'NÃO DEFINIDO'}
                            </span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="font-bold text-slate-500 uppercase">Data Cadastro</span>
                            <span className="font-black text-slate-900">{new Date(selectedClient.createdAt).toLocaleDateString('pt-BR')}</span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Tarifação</h4>
                        <p className="text-xs font-bold text-blue-600 bg-blue-50 p-3 rounded-xl whitespace-pre-wrap">{selectedClient.rates}</p>
                      </div>

                      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Observações</h4>
                        <p className="text-xs font-medium text-slate-600 italic">{selectedClient.additionalInfo || 'Sem observações'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white px-8 py-6 border-t border-slate-200 flex justify-end shrink-0">
                  <button 
                    onClick={() => setSelectedClient(null)}
                    className="px-8 py-3 bg-slate-900 text-white text-xs font-black uppercase tracking-widest rounded-2xl hover:bg-slate-800 transition-all"
                  >
                    Fechar
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
    </div>
  );
}
