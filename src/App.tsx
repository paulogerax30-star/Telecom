import React, { useState, useMemo, useEffect } from 'react';
import { LayoutDashboard, PlusCircle, Search, FileText, Settings as SettingsIcon, Bell, CheckCircle2, AlertCircle, Clock, Filter, ChevronRight, Menu, X, Database, Activity, History as HistoryIcon, User, LogOut, Calculator, List, DollarSign, Shield, FileSearch, Ticket as TicketIcon, Users } from 'lucide-react';
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

type Tab = 'dashboard' | 'register' | 'analysis' | 'finance' | 'settings' | 'csv' | 'calculator' | 'route-types' | 'classifier' | 'receipts-main' | 'comparator' | 'tickets' | 'sellers' | 'clients';

const INITIAL_CATEGORIES: RouteCategory[] = [
  'Móvel-Móvel', 'Fixo-Fixo', 'Fixo-Móvel', 'Internacional'
];

const INITIAL_ROUTE_TYPES: string[] = [
  'GSM', 'SIP', 'E1', 'H323'
];

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [routes, setRoutes] = useState<Route[]>([]);
  const [categories, setCategories] = useState<RouteCategory[]>(INITIAL_CATEGORIES);
  const [models, setModels] = useState<string[]>(INITIAL_ROUTE_TYPES);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [editingRoute, setEditingRoute] = useState<Route | null>(null);
  const [showPendingAlert, setShowPendingAlert] = useState(true);
  const [history, setHistory] = useState<RouteHistory[]>([]);
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [clientRegistrations, setClientRegistrations] = useState<ClientRegistration[]>([]);

  const addHistoryEntry = (route: Route, type: string, details: string) => {
    const newEntry: RouteHistory = {
      id: `h-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      routeId: route.id,
      date: new Date().toISOString(),
      status: route.status,
      classification: 'Regular', // Default for history
      testResult: type,
      analyst: 'Sistema',
      observations: details
    };
    setHistory(prev => [newEntry, ...prev].slice(0, 50)); // Keep last 50 entries
  };

  const handleAddRoute = (newRoute: Route) => {
    setRoutes(prev => [...prev, newRoute]);
    addHistoryEntry(newRoute, 'Cadastro', `Nova rota cadastrada: ${newRoute.name}`);
    setSearchTerm(''); // Clear search to ensure new route is visible
    setActiveTab('analysis'); // Redirect to Analysis for better visibility
    toast.success('Rota cadastrada com sucesso!');
  };

  const handleUpdateRoute = (updatedRoute: Route) => {
    setRoutes(prev => prev.map(r => r.id === updatedRoute.id ? updatedRoute : r));
    addHistoryEntry(updatedRoute, 'Edição', `Rota atualizada: ${updatedRoute.name}. Status: ${updatedRoute.status}`);
    setEditingRoute(null);
    setActiveTab('analysis');
    toast.success('Rota atualizada com sucesso!');
  };

  const handleDeleteRoute = (id: string) => {
    const routeToDelete = routes.find(r => r.id === id);
    if (routeToDelete) {
      addHistoryEntry(routeToDelete, 'Exclusão', `Rota excluída: ${routeToDelete.name}`);
    }
    setRoutes(prev => prev.filter(r => r.id !== id));
    toast.error('Rota excluída com sucesso!');
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
    { id: 'sellers', label: 'Vendedor', icon: User },
    { id: 'clients', label: 'Clientes', icon: Users },
    { id: 'calculator', label: 'Calcular Valor', icon: Calculator },
    { id: 'comparator', label: 'Comparador', icon: FileSearch },
    { id: 'receipts-main', label: 'Comprovante', icon: FileText },
    { id: 'tickets', label: 'Chamados', icon: TicketIcon },
    { id: 'settings', label: 'Configurações', icon: SettingsIcon },
  ];

  const criticalRoutesCount = processedRoutes.filter(r => r.asr < 20 || r.pdd > 5).length;

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
          {menuItems.map((item) => (
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
                  <p className="text-xs font-black text-slate-800 leading-none uppercase tracking-wider">Operador Técnico</p>
                  <p className="text-[10px] font-bold text-slate-400 mt-1">paulinhosheldom@gmail.com</p>
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
                {activeTab === 'classifier' && <CallClassifier />}
                {activeTab === 'finance' && <FinanceView />}
                {activeTab === 'receipts-main' && <ReceiptsView />}
                {activeTab === 'tickets' && <TicketsView />}
                {activeTab === 'register' && (
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
                )}
                {activeTab === 'analysis' && (
                  <RouteAnalysis 
                    routes={processedRoutes} 
                    onUpdate={handleUpdateRoute}
                    onEdit={handleEdit}
                    onDelete={handleDeleteRoute}
                    searchTerm={searchTerm}
                    onSearchChange={setSearchTerm}
                  />
                )}
                {activeTab === 'csv' && <CSVAnalysis />}
                {activeTab === 'comparator' && <CSVComparator />}
                {activeTab === 'calculator' && <ValueCalculator />}
                {activeTab === 'route-types' && (
                  <RouteTypesView 
                    routes={processedRoutes} 
                    searchTerm={searchTerm}
                    onSearchChange={setSearchTerm}
                  />
                )}
                { activeTab === 'sellers' && (
                  <SellersView 
                    sellers={sellers}
                    registrations={clientRegistrations}
                    onAddSeller={(newSeller) => {
                      const seller: Seller = {
                        ...newSeller,
                        id: `s-${Date.now()}`,
                        createdAt: new Date().toISOString()
                      };
                      setSellers(prev => [...prev, seller]);
                    }}
                    onRegisterClient={(newReg) => {
                      const reg: ClientRegistration = {
                        ...newReg,
                        id: `reg-${Date.now()}`,
                        createdAt: new Date().toISOString()
                      };
                      setClientRegistrations(prev => [...prev, reg]);
                      toast.success('Ficha de cliente cadastrada com sucesso!');
                    }}
                    onUpdateClient={(updatedReg) => {
                      setClientRegistrations(prev => prev.map(r => r.id === updatedReg.id ? updatedReg : r));
                    }}
                  />
                )}
                { activeTab === 'clients' && (
                  <ClientsView registrations={clientRegistrations} />
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
