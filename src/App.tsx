import React, { useState, useMemo, useEffect } from 'react';
import { LayoutDashboard, PlusCircle, Search, FileText, Settings as SettingsIcon, Bell, CheckCircle2, AlertCircle, Clock, Filter, ChevronRight, Menu, X, Database, Activity, History as HistoryIcon, User as UserIcon, LogOut, Calculator, List, DollarSign, Shield, FileSearch, Ticket as TicketIcon, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Toaster, toast } from 'sonner';
import { cn, isRoutePending, getDaysSinceLastTest, getRouteStatus } from './lib/utils';

// Components
import Dashboard from './components/Dashboard';
import RouteRegistration from './components/RouteRegistration';
import RouteAnalysis from './components/RouteAnalysis';
import FinanceView from './components/FinanceView';
import Settings from './components/Settings';
import CSVAnalysis from './components/CSVAnalysis';
import CSVComparator from './components/CSVComparator';
import ValueCalculator from './components/ValueCalculator';
import ErrorBoundary from './components/ErrorBoundary';

import RouteTypesView from './components/RouteTypesView';
import CallClassifier from './components/CallClassifier';
import ReceiptsView from './components/ReceiptsView';
import TicketsView from './components/TicketsView';
import SellersView from './components/SellersView';
import ClientsView from './components/ClientsView';
import { Route, RouteCategory, RouteClassification, RouteStatus, RouteHistory, Seller, ClientRegistration } from './types';
import { supabase } from './lib/supabase';
import Auth from './components/Auth';
import { User } from '@supabase/supabase-js';
import { mapKeysToSnakeCase, mapKeysToCamelCase } from './lib/database';
import { useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

type Tab = 'dashboard' | 'register' | 'analysis' | 'finance' | 'settings' | 'csv' | 'calculator' | 'route-types' | 'classifier' | 'receipts-main' | 'comparator' | 'tickets' | 'sellers' | 'clients';

const INITIAL_CATEGORIES: RouteCategory[] = [
  'Móvel-Móvel', 'Fixo-Fixo', 'Fixo-Móvel', 'Internacional'
];

const INITIAL_ROUTE_TYPES: string[] = [
  'GSM', 'SIP', 'E1', 'H323'
];

export default function App() {
  const { user, loading: authLoading, signOut, hasPermission, isMaster } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [loading, setLoading] = useState(false);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [categories, setCategories] = useState<RouteCategory[]>(INITIAL_CATEGORIES);
  const [models, setModels] = useState<string[]>(INITIAL_ROUTE_TYPES);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [editingRoute, setEditingRoute] = useState<Route | null>(null);
  const [history, setHistory] = useState<RouteHistory[]>([]);
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [clientRegistrations, setClientRegistrations] = useState<ClientRegistration[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [commissions, setCommissions] = useState<any[]>([]);
  const [cdrRecords, setCdrRecords] = useState<any[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [pendencies, setPendencies] = useState<Pendency[]>([]);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [historyEntries, setHistoryEntries] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    // Auth logic is now handled in AuthContext
  }, []);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      const { data: routesData } = await supabase.from('routes').select('*');
      const { data: sellersData } = await supabase.from('sellers').select('*');
      const { data: historyData } = await supabase.from('route_history').select('*').order('date', { ascending: false });
      const { data: clientsData } = await supabase.from('client_registrations').select('*');
      const { data: transactionsData } = await supabase.from('transactions').select('*');
      const { data: commissionsData } = await supabase.from('commissions').select('*');
      const { data: cdrRecordsData } = await supabase.from('cdr_records').select('*');
      const { data: ticketsData } = await supabase.from('tickets').select('*');
      const { data: pendenciesData } = await supabase.from('pendencies').select('*');
      const { data: receiptsData } = await supabase.from('receipts').select('*');

      if (routesData) setRoutes(mapKeysToCamelCase(routesData));
      if (sellersData) setSellers(mapKeysToCamelCase(sellersData));
      if (historyData) setHistory(mapKeysToCamelCase(historyData));
      if (clientsData) setClientRegistrations(mapKeysToCamelCase(clientsData));
      if (transactionsData) setTransactions(mapKeysToCamelCase(transactionsData));
      if (commissionsData) setCommissions(mapKeysToCamelCase(commissionsData));
      if (cdrRecordsData) setCdrRecords(mapKeysToCamelCase(cdrRecordsData));
      if (ticketsData) setTickets(mapKeysToCamelCase(ticketsData));
      if (pendenciesData) setPendencies(mapKeysToCamelCase(pendenciesData));
      if (receiptsData) setReceipts(mapKeysToCamelCase(receiptsData));
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const addHistoryEntry = async (route: Route, type: string, details: string) => {
    const newEntry = {
      route_id: route.id,
      date: new Date().toISOString(),
      status: route.status,
      classification: 'Regular',
      test_result: type,
      analyst: user?.email || 'Sistema',
      observations: details
    };
    
    const { data, error } = await supabase.from('route_history').insert([mapKeysToSnakeCase(newEntry)]).select();
    if (error) console.error('Error adding history:', error);
    if (data) setHistory(prev => [mapKeysToCamelCase(data[0]), ...prev].slice(0, 50));
  };

  const handleAddRoute = async (newRoute: Route) => {
    const { data, error } = await supabase.from('routes').insert([mapKeysToSnakeCase(newRoute)]).select();
    if (error) {
      toast.error('Erro ao cadastrar rota: ' + error.message);
      return;
    }
    if (data) {
      const camelData = mapKeysToCamelCase(data[0]);
      setRoutes(prev => [...prev, camelData]);
      addHistoryEntry(camelData, 'Cadastro', `Nova rota cadastrada: ${camelData.name}`);
      setSearchTerm('');
      setActiveTab('analysis');
      toast.success('Rota cadastrada com sucesso!');
    }
  };

  const handleUpdateRoute = async (updatedRoute: Route) => {
    const { error } = await supabase.from('routes').update(mapKeysToSnakeCase(updatedRoute)).eq('id', updatedRoute.id);
    if (error) {
      toast.error('Erro ao atualizar rota: ' + error.message);
      return;
    }
    setRoutes(prev => prev.map(r => r.id === updatedRoute.id ? updatedRoute : r));
    addHistoryEntry(updatedRoute, 'Edição', `Rota atualizada: ${updatedRoute.name}. Status: ${updatedRoute.status}`);
    setEditingRoute(null);
    setActiveTab('analysis');
    toast.success('Rota atualizada com sucesso!');
  };

  const handleDeleteRoute = async (id: string) => {
    const routeToDelete = routes.find(r => r.id === id);
    const { error } = await supabase.from('routes').delete().eq('id', id);
    if (error) {
      toast.error('Erro ao excluir rota: ' + error.message);
      return;
    }
    if (routeToDelete) {
      addHistoryEntry(routeToDelete, 'Exclusão', `Rota excluída: ${routeToDelete.name}`);
    }
    setRoutes(prev => prev.filter(r => r.id !== id));
    toast.error('Rota excluída com sucesso!');
  };

  const handleLogout = async () => {
    await signOut();
    toast.info('Sessão encerrada.');
  };

  const handleEdit = (route: Route) => {
    setEditingRoute(route);
    setActiveTab('register');
  };

  const handleAddCategory = (category: string) => {
    if (!categories.includes(category as RouteCategory)) {
      setCategories(prev => [...prev, category as RouteCategory]);
    }
  };

  const handleAddModel = (model: string) => {
    if (!models.includes(model)) {
      setModels(prev => [...prev, model]);
    }
  };

  const handleRemoveCategory = (category: string) => {
    setCategories(prev => prev.filter(c => c !== category));
  };

  const processedRoutes = useMemo(() => {
    return routes;
  }, [routes]);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'register', label: 'Cadastrar Rotas', icon: PlusCircle },
    { id: 'route-types', label: 'Tipos de Rotas', icon: List },
    { id: 'analysis', label: 'Análise de Rotas', icon: Activity },
    { id: 'csv', label: 'Exportar CSV', icon: FileText },
    { id: 'classifier', label: 'Classificador', icon: Shield },
    { id: 'finance', label: 'Financeiro', icon: DollarSign },
    { id: 'sellers', label: 'Vendedor', icon: UserIcon },
    { id: 'clients', label: 'Clientes', icon: Users },
    { id: 'calculator', label: 'Calcular Valor', icon: Calculator },
    { id: 'comparator', label: 'Comparador', icon: FileSearch },
    { id: 'receipts-main', label: 'Comprovante', icon: FileText },
    { id: 'tickets', label: 'Chamados', icon: TicketIcon },
    { id: 'settings', label: 'Configurações', icon: SettingsIcon },
  ];

  const filteredMenuItems = menuItems.filter(item => {
    if (item.id === 'finance') return hasPermission('can_view_finance');
    if (item.id === 'register' || item.id === 'analysis' || item.id === 'route-types') return hasPermission('can_manage_routes');
    if (item.id === 'sellers' || item.id === 'clients') return hasPermission('can_view_sellers');
    if (item.id === 'tickets') return hasPermission('can_manage_tickets');
    return true; // Dashboard, Settings, etc are accessible by all for now (RBAC management is inside Settings)
  });

  const criticalRoutesCount = processedRoutes.filter(r => r.asr < 20 || r.pdd > 5).length;

  if (authLoading || (user && loading)) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#1E293B]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <Toaster position="top-right" richColors />
        <Auth onAuthSuccess={() => {}} />
      </>
    );
  }

  return (
    <div className="flex h-screen bg-[#F8FAFC] text-slate-900 font-sans overflow-hidden">
      <Toaster position="top-right" richColors />
      
      {/* Sidebar */}
      <aside 
        className={cn(
          "bg-[#1E293B] text-white transition-all duration-300 flex flex-col z-50",
          isSidebarOpen ? "w-64" : "w-20"
        )}
      >
        <div className="p-5 flex items-center gap-3 border-b border-slate-700/50">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center shrink-0">
            <Database className="w-5 h-5 text-white" />
          </div>
          {isSidebarOpen && (
            <span className="font-bold text-lg tracking-tight whitespace-nowrap">TelecomRoute</span>
          )}
        </div>

        <nav className="flex-1 py-4 px-3 space-y-1.5 overflow-y-auto custom-scrollbar">
          {filteredMenuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id as Tab);
                if (item.id !== 'register') setEditingRoute(null);
              }}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-300 group relative",
                activeTab === item.id 
                  ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-900/40" 
                  : "text-slate-400 hover:bg-slate-800/50 hover:text-white"
              )}
            >
              {activeTab === item.id && (
                <motion.div 
                  layoutId="activeTab"
                  className="absolute inset-0 bg-blue-600 rounded-xl -z-10"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <item.icon className={cn(
                "w-5 h-5 shrink-0 transition-transform duration-300 group-hover:scale-110",
                activeTab === item.id ? "text-white" : "group-hover:text-white"
              )} />
              {isSidebarOpen && (
                <span className="font-bold text-[10px] uppercase tracking-widest whitespace-nowrap">
                  {item.label}
                </span>
              )}
            </button>
          ))}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-rose-400 hover:bg-rose-500/10 hover:text-rose-500 transition-all group"
          >
            <LogOut className="w-5 h-5 shrink-0 transition-transform duration-300 group-hover:scale-110" />
            {isSidebarOpen && (
              <span className="font-bold text-[10px] uppercase tracking-widest whitespace-nowrap">
                Sair
              </span>
            )}
          </button>
        </nav>

        <div className="p-4 border-t border-slate-700/50">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="w-full flex items-center gap-3 px-3 py-3 text-slate-400 hover:text-white transition-colors"
          >
            {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            {isSidebarOpen && <span className="font-medium">Recolher</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold text-slate-800 capitalize">
              {menuItems.find(i => i.id === activeTab)?.label || activeTab}
            </h2>
          </div>

          <div className="flex items-center gap-6">
            <div className="relative hidden md:block group">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
              <input 
                type="text" 
                placeholder="Buscar rotas, IPs ou analistas..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 bg-slate-100 border border-transparent rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all w-80 outline-none font-medium"
              />
            </div>
            
            <div className="flex items-center gap-4">
              <button className="relative p-2.5 text-slate-500 hover:bg-slate-100 rounded-xl transition-all hover:text-blue-600 group">
                <Bell className="w-5 h-5" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-white group-hover:scale-125 transition-transform"></span>
              </button>
              <div className="h-8 w-px bg-slate-200 mx-1"></div>
              <div className="flex items-center gap-3 pl-2">
                <div className="text-right hidden sm:block">
                  <p className="text-xs font-black text-slate-800 leading-none uppercase tracking-wider">
                    {isMaster ? 'Administrador Master' : 'Operador Técnico'}
                  </p>
                  <p className="text-[10px] font-bold text-slate-400 mt-1">{user?.email}</p>
                </div>
                <div className="w-10 h-10 bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl flex items-center justify-center text-slate-700 font-black border border-slate-200 shadow-sm transition-transform hover:scale-105 cursor-pointer">
                  PS
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-8">
          <ErrorBoundary>
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="h-full"
              >
                {activeTab === 'dashboard' && (
                  <Dashboard 
                    routes={processedRoutes} 
                    history={history}
                  />
                )}
                {activeTab === 'classifier' && (
                  <ProtectedRoute requiredPermission="can_manage_routes">
                    <CallClassifier />
                  </ProtectedRoute>
                )}
                {activeTab === 'finance' && (
                  <ProtectedRoute requiredPermission="can_view_finance">
                    <FinanceView 
                      transactions={transactions}
                      onAddTransaction={async (newT) => {
                        const { data, error } = await supabase.from('transactions').insert([mapKeysToSnakeCase(newT)]).select();
                        if (error) {
                          toast.error('Erro ao adicionar transação: ' + error.message);
                          return;
                        }
                        if (data) setTransactions(prev => [mapKeysToCamelCase(data[0]), ...prev]);
                      }}
                      onUpdateTransaction={async (updatedT) => {
                        const { error } = await supabase.from('transactions').update(mapKeysToSnakeCase(updatedT)).eq('id', updatedT.id);
                        if (error) {
                          toast.error('Erro ao atualizar transação: ' + error.message);
                          return;
                        }
                        setTransactions(prev => prev.map(t => t.id === updatedT.id ? updatedT : t));
                      }}
                    />
                  </ProtectedRoute>
                )}
                {activeTab === 'receipts-main' && (
                  <ProtectedRoute requiredPermission="can_view_finance">
                    <ReceiptsView 
                      pendencies={pendencies}
                      receipts={receipts}
                      onAddPendency={async (newP) => {
                        const { data, error } = await supabase.from('pendencies').insert([mapKeysToSnakeCase(newP)]).select();
                        if (error) {
                          toast.error('Erro ao criar pendência: ' + error.message);
                          return;
                        }
                        if (data) setPendencies(prev => [mapKeysToCamelCase(data[0]), ...prev]);
                      }}
                      onAddReceipt={async (newR) => {
                        const { data, error } = await supabase.from('receipts').insert([mapKeysToSnakeCase(newR)]).select();
                        if (error) {
                          toast.error('Erro ao salvar comprovante: ' + error.message);
                          return;
                        }
                        if (data) setReceipts(prev => [mapKeysToCamelCase(data[0]), ...prev]);
                      }}
                      onUpdateReceipt={async (updatedR) => {
                        const { error } = await supabase.from('receipts').update(mapKeysToSnakeCase(updatedR)).eq('id', updatedR.id);
                        if (error) {
                          toast.error('Erro ao atualizar comprovante: ' + error.message);
                          return;
                        }
                        setReceipts(prev => prev.map(r => r.id === updatedR.id ? updatedR : r));
                      }}
                      onUpdatePendency={async (updatedP) => {
                        const { error } = await supabase.from('pendencies').update(mapKeysToSnakeCase(updatedP)).eq('id', updatedP.id);
                        if (error) {
                          toast.error('Erro ao atualizar pendência: ' + error.message);
                          return;
                        }
                        setPendencies(prev => prev.map(p => p.id === updatedP.id ? updatedP : p));
                      }}
                    />
                  </ProtectedRoute>
                )}
                {activeTab === 'tickets' && (
                  <ProtectedRoute requiredPermission="can_manage_tickets">
                    <TicketsView 
                      tickets={tickets}
                      onAddTicket={async (newT) => {
                        const { data, error } = await supabase.from('tickets').insert([mapKeysToSnakeCase(newT)]).select();
                        if (error) {
                          toast.error('Erro ao abrir chamado: ' + error.message);
                          return;
                        }
                        if (data) setTickets(prev => [mapKeysToCamelCase(data[0]), ...prev]);
                      }}
                      onUpdateTicket={async (updatedT) => {
                        const { error } = await supabase.from('tickets').update(mapKeysToSnakeCase(updatedT)).eq('id', updatedT.id);
                        if (error) {
                          toast.error('Erro ao atualizar chamado: ' + error.message);
                          return;
                        }
                        setTickets(prev => prev.map(t => t.id === updatedT.id ? updatedT : t));
                      }}
                    />
                  </ProtectedRoute>
                )}
                {activeTab === 'register' && (
                  <ProtectedRoute requiredPermission="can_manage_routes">
                    <RouteRegistration 
                      onAdd={handleAddRoute} 
                      onUpdate={handleUpdateRoute}
                      onDelete={handleDeleteRoute}
                      onEdit={handleEdit}
                      editingRoute={editingRoute}
                      routes={processedRoutes}
                      models={models}
                      onAddModel={handleAddModel}
                      searchTerm={searchTerm}
                      onSearchChange={setSearchTerm}
                    />
                  </ProtectedRoute>
                )}
                {activeTab === 'analysis' && (
                  <ProtectedRoute requiredPermission="can_manage_routes">
                    <RouteAnalysis 
                      routes={processedRoutes} 
                      onUpdate={handleUpdateRoute}
                      onEdit={handleEdit}
                      onDelete={handleDeleteRoute}
                      searchTerm={searchTerm}
                      onSearchChange={setSearchTerm}
                    />
                  </ProtectedRoute>
                )}
                {activeTab === 'csv' && <CSVAnalysis />}
                {activeTab === 'comparator' && <CSVComparator />}
                {activeTab === 'calculator' && <ValueCalculator />}
                {activeTab === 'route-types' && (
                  <ProtectedRoute requiredPermission="can_manage_routes">
                    <RouteTypesView 
                      routes={processedRoutes} 
                      searchTerm={searchTerm}
                      onSearchChange={setSearchTerm}
                    />
                  </ProtectedRoute>
                )}
                { activeTab === 'sellers' && (
                  <ProtectedRoute requiredPermission="can_view_sellers">
                    <SellersView 
                      sellers={sellers}
                      registrations={clientRegistrations}
                      onAddSeller={async (newSeller) => {
                        const { data, error } = await supabase.from('sellers').insert([mapKeysToSnakeCase(newSeller)]).select();
                        if (error) {
                          toast.error('Erro ao adicionar vendedor: ' + error.message);
                          return;
                        }
                        if (data) setSellers(prev => [...prev, mapKeysToCamelCase(data[0])]);
                      }}
                      onRegisterClient={async (newReg) => {
                        const { data, error } = await supabase.from('client_registrations').insert([mapKeysToSnakeCase(newReg)]).select();
                        if (error) {
                          toast.error('Erro ao cadastrar cliente: ' + error.message);
                          return;
                        }
                        if (data) {
                          setClientRegistrations(prev => [...prev, mapKeysToCamelCase(data[0])]);
                          toast.success('Ficha de cliente cadastrada com sucesso!');
                        }
                      }}
                      onUpdateClient={async (updatedReg) => {
                        const { error } = await supabase.from('client_registrations').update(mapKeysToSnakeCase(updatedReg)).eq('id', updatedReg.id);
                        if (error) {
                          toast.error('Erro ao atualizar cliente: ' + error.message);
                          return;
                        }
                        setClientRegistrations(prev => prev.map(r => r.id === updatedReg.id ? updatedReg : r));
                      }}
                    />
                  </ProtectedRoute>
                )}
                { activeTab === 'clients' && (
                  <ProtectedRoute requiredPermission="can_view_sellers">
                    <ClientsView registrations={clientRegistrations} />
                  </ProtectedRoute>
                )}
                {activeTab === 'settings' && (
                  <Settings 
                    categories={categories} 
                    onAddCategory={handleAddCategory}
                    onRemoveCategory={handleRemoveCategory}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </ErrorBoundary>
        </div>
      </main>
    </div>
  );
}
