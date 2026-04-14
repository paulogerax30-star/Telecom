import React, { useMemo, useState } from 'react';
import { 
  Activity, 
  Search, 
  Filter, 
  ChevronDown, 
  ChevronUp, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Zap, 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  Layers,
  Info,
  Tag
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Route, RouteStatus } from '../types';
import { cn } from '../lib/utils';

interface RouteTypesViewProps {
  routes: Route[];
  searchTerm: string;
  onSearchChange: (value: string) => void;
}

export default function RouteTypesView({ routes, searchTerm, onSearchChange }: RouteTypesViewProps) {
  const [filterProvider, setFilterProvider] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string | 'all'>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [groupBy, setGroupBy] = useState<'type' | 'category'>('category');
  const [expandedTypes, setExpandedTypes] = useState<Record<string, boolean>>({});

  const providers = useMemo(() => ['all', ...Array.from(new Set(routes.map(r => r.provider)))], [routes]);
  const categories = useMemo(() => ['all', ...Array.from(new Set(routes.map(r => r.category)))], [routes]);

  const filteredRoutes = useMemo(() => {
    const search = searchTerm.toLowerCase();
    return routes.filter(route => {
      const matchesSearch = route.name.toLowerCase().includes(search);
      const matchesProvider = filterProvider === 'all' || route.provider === filterProvider;
      const matchesStatus = filterStatus === 'all' || route.status === filterStatus;
      const matchesCategory = filterCategory === 'all' || route.category === filterCategory;
      return matchesSearch && matchesProvider && matchesStatus && matchesCategory;
    });
  }, [routes, searchTerm, filterProvider, filterStatus, filterCategory]);

  const groupedRoutes = useMemo(() => {
    const groups: Record<string, Route[]> = {};
    filteredRoutes.forEach(route => {
      const key = groupBy === 'type' ? route.routeType : route.category;
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(route);
    });

    // Sort routes within each group by name
    Object.keys(groups).forEach(type => {
      groups[type].sort((a, b) => a.name.localeCompare(b.name));
    });

    return groups;
  }, [filteredRoutes]);

  const toggleType = (type: string) => {
    setExpandedTypes(prev => ({ ...prev, [type]: !prev[type] }));
  };

  const getSmartAlerts = (route: Route) => {
    const alerts = [];
    if (route.asr < 20) alerts.push({ type: 'error', message: 'ASR Crítica (< 20%)' });
    if (route.pdd > 5) alerts.push({ type: 'warning', message: 'PDD Alto (> 5s)' });
    if (route.acd < 20) alerts.push({ type: 'info', message: 'ACD Baixa (< 20s)' });
    return alerts;
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header & Filters */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/20">
              <Layers className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Tipos de Rotas</h2>
              <p className="text-xs text-slate-500 font-medium">Monitoramento e organização automática por categoria.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-slate-100 text-slate-600 text-[10px] font-black rounded-full uppercase tracking-wider">
              {Object.keys(groupedRoutes).length} Categorias
            </span>
            <span className="px-3 py-1 bg-blue-50 text-blue-600 text-[10px] font-black rounded-full uppercase tracking-wider">
              {filteredRoutes.length} Rotas Ativas
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar por nome da rota..." 
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select 
              value={filterProvider}
              onChange={(e) => setFilterProvider(e.target.value)}
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-[10px] font-black uppercase tracking-wider outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            >
              <option value="all">Todas Operadoras</option>
              {providers.filter(p => p !== 'all').map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-slate-400" />
            <select 
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-[10px] font-black uppercase tracking-wider outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            >
              <option value="all">Todas Categorias</option>
              {categories.filter(c => c !== 'all').map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-slate-400" />
            <select 
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-[10px] font-black uppercase tracking-wider outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            >
              <option value="all">Todos Status</option>
              <option value="Ativa">Ativa</option>
              <option value="Inativa">Inativa</option>
              <option value="Teste">Teste</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2">Agrupar por:</span>
          <button 
            onClick={() => setGroupBy('category')}
            className={cn(
              "px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
              groupBy === 'category' ? "bg-blue-600 text-white shadow-md shadow-blue-200" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
            )}
          >
            Categoria
          </button>
          <button 
            onClick={() => setGroupBy('type')}
            className={cn(
              "px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
              groupBy === 'type' ? "bg-blue-600 text-white shadow-md shadow-blue-200" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
            )}
          >
            Tipo (Tecnologia)
          </button>
        </div>
      </div>

      {/* Grouped View */}
      <div className="space-y-4">
        {Object.entries(groupedRoutes).map(([type, typeRoutes]) => (
          <div key={type} className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden transition-all hover:shadow-md">
            <button 
              onClick={() => toggleType(type)}
              className="w-full flex items-center justify-between p-5 bg-slate-50/50 hover:bg-slate-50 transition-colors border-b border-slate-100"
            >
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 bg-white border border-slate-200 rounded-lg flex items-center justify-center text-blue-600 shadow-sm">
                  <Layers className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">[{type}]</h3>
                  <p className="text-[10px] text-slate-500 font-bold">{typeRoutes.length} rotas vinculadas</p>
                </div>
              </div>
              {expandedTypes[type] ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
            </button>

            <AnimatePresence>
              {expandedTypes[type] !== false && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="p-4 overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left border-separate border-spacing-y-2">
                      <thead>
                        <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          <th className="px-4 py-2">Rota / Operadora</th>
                          <th className="px-4 py-2">Status</th>
                          <th className="px-4 py-2 text-right">Financeiro (R$)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {typeRoutes.map((route) => {
                          return (
                            <tr key={route.id} className="group bg-slate-50/30 hover:bg-blue-50/30 transition-colors rounded-xl overflow-hidden">
                              <td className="px-4 py-3 first:rounded-l-xl">
                                <div className="flex flex-col">
                                  <span className="text-xs font-black text-slate-800">{route.name}</span>
                                  <span className="text-[10px] font-bold text-slate-400 uppercase">{route.provider}</span>
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <span className={cn(
                                    "w-2 h-2 rounded-full",
                                    route.status === 'Ativa' ? "bg-emerald-500 animate-pulse" : 
                                    route.status === 'Inativa' ? "bg-rose-500" : "bg-amber-500"
                                  )} />
                                  <span className={cn(
                                    "text-[10px] font-black uppercase tracking-widest",
                                    route.status === 'Ativa' ? "text-emerald-600" : 
                                    route.status === 'Inativa' ? "text-rose-600" : "text-amber-600"
                                  )}>{route.status}</span>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-right last:rounded-r-xl">
                                <div className="flex flex-col">
                                  <span className="text-xs font-black text-emerald-600">Rec: {route.revenue.toFixed(2)}</span>
                                  <span className="text-[10px] font-bold text-rose-500">Cst: {route.totalCost.toFixed(2)}</span>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}

        {Object.keys(groupedRoutes).length === 0 && (
          <div className="bg-white p-20 rounded-3xl border border-slate-200 border-dashed text-center">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Layers className="w-10 h-10 text-slate-200" />
            </div>
            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight mb-2">Nenhuma rota encontrada</h3>
            <p className="text-slate-500 font-medium max-w-md mx-auto">Cadastre novas rotas ou ajuste os filtros para visualizar a organização por tipos.</p>
          </div>
        )}
      </div>
    </div>
  );
}
