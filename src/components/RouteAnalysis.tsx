import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Activity, 
  Edit, 
  Trash2, 
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Download,
  Zap,
  Shield,
  Layers,
  DollarSign,
  X,
  Mic,
  PhoneCall,
  UserCheck,
  Play,
  Check,
  RefreshCw,
  LogOut,
  Hash,
  VolumeX,
  BellOff
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { cn } from '../lib/utils';
import { Route, RouteCategory, RouteStatus } from '../types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface RouteAnalysisProps {
  routes: Route[];
  onUpdate: (route: Route) => void;
  onEdit: (route: Route) => void;
  onDelete: (id: string) => void;
  searchTerm: string;
  onSearchChange: (value: string) => void;
}

export default function RouteAnalysis({ 
  routes, 
  onUpdate, 
  onEdit, 
  onDelete, 
  searchTerm,
  onSearchChange
}: RouteAnalysisProps) {
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [routeToDelete, setRouteToDelete] = useState<Route | null>(null);
  
  // Analysis state
  const [testingRoute, setTestingRoute] = useState<Route | null>(null);
  const [testCount, setTestCount] = useState(0);
  const [testData, setTestData] = useState({
    pdd: '',
    hasAudio: true,
    respectsCallerId: true,
    hasDtmf: true,
    isChoppy: false,
    isSilent: false,
    isFalseRing: false
  });
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [testResults, setTestResults] = useState<{ score: number; message: string; color: string } | null>(null);

  const routeTypes = useMemo(() => ['all', ...Array.from(new Set(routes.map(r => r.routeType)))], [routes]);

  const filteredRoutes = useMemo(() => {
    const search = searchTerm.toLowerCase();
    const filtered = routes.filter(route => {
      const matchesSearch = route.name.toLowerCase().includes(search) || 
                           route.provider.toLowerCase().includes(search);
      const matchesType = filterType === 'all' || route.routeType === filterType;
      const matchesStatus = filterStatus === 'all' || route.status === filterStatus;
      return matchesSearch && matchesType && matchesStatus;
    });
    
    setCurrentPage(1);
    return filtered;
  }, [routes, searchTerm, filterType, filterStatus]);

  const paginatedRoutes = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredRoutes.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredRoutes, currentPage]);

  const totalPages = Math.ceil(filteredRoutes.length / itemsPerPage);

  const calculateScore = () => {
    let score = 100;
    const pddNum = parseFloat(testData.pdd);

    // PDD Penalty
    if (isNaN(pddNum)) score -= 10;
    else if (pddNum > 7) score -= 30;
    else if (pddNum > 4) score -= 15;

    // Audio Penalty
    if (!testData.hasAudio) score -= 50;
    if (testData.isSilent) score -= 60;
    if (testData.isChoppy) score -= 30;

    // CallerID Penalty
    if (!testData.respectsCallerId) score -= 20;

    // DTMF Penalty
    if (!testData.hasDtmf) score -= 40;

    // False Ring Penalty
    if (testData.isFalseRing) score -= 25;

    score = Math.max(0, score);

    let message = "Excelente";
    let color = "text-emerald-500";

    if (score < 40) {
      message = "Crítica";
      color = "text-rose-600";
    } else if (score < 70) {
      message = "Regular";
      color = "text-amber-500";
    } else if (score < 90) {
      message = "Boa";
      color = "text-blue-500";
    }

    return { score, message, color };
  };

  const handleFinishTest = () => {
    const result = calculateScore();
    setTestResults(result);
    
    if (testingRoute) {
      onUpdate({
        ...testingRoute,
        lastTestScore: result.score,
        lastTestDate: new Date().toISOString()
      });
    }
    
    toast.success(`Análise finalizada! Pontuação: ${result.score}/100 (${result.message})`);
  };

  const resetTestData = () => {
    setTestData({ 
      pdd: '', 
      hasAudio: true, 
      respectsCallerId: true,
      hasDtmf: true,
      isChoppy: false,
      isSilent: false,
      isFalseRing: false
    });
  };

  const handleExportCSV = () => {
    const headers = ['Nome', 'Tipo', 'Operadora', 'Bina', 'Categoria', 'Tarifa', 'Custo', 'Status'];
    const csvContent = [
      headers.join(','),
      ...filteredRoutes.map(r => [
        r.name,
        r.routeType,
        r.provider,
        r.binaType,
        r.category,
        r.rate,
        r.cost,
        r.status
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `relatorio_rotas_${format(new Date(), 'yyyyMMdd_HHmm')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Filters Bar */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[300px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Buscar por nome ou operadora..." 
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold"
          />
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-slate-400" />
            <select 
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="all">Todos os Tipos</option>
              {routeTypes.filter(t => t !== 'all').map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-slate-400" />
            <select 
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="all">Todos Status</option>
              <option value="Ativa">Ativa</option>
              <option value="Inativa">Inativa</option>
              <option value="Teste">Teste</option>
            </select>
          </div>

          <button 
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 text-white text-xs font-black rounded-xl hover:bg-slate-800 transition-all shadow-lg uppercase tracking-widest"
          >
            <Download className="w-4 h-4" />
            Exportar
          </button>
        </div>
      </div>

      {/* Routes Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Rota / Operadora</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Tipo / Bina</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Tarifa (R$)</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Último Teste</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedRoutes.map((route) => (
                <tr key={route.id} className="hover:bg-blue-50/30 transition-colors group">
                  <td className="px-6 py-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-black text-slate-800 text-sm uppercase tracking-tight">{route.name}</p>
                        {new Date().getTime() - new Date(route.createdAt).getTime() < 5 * 60 * 1000 && (
                          <span className="px-1.5 py-0.5 bg-blue-600 text-white text-[8px] font-black uppercase rounded animate-pulse">Novo</span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">{route.provider}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-xs font-black text-slate-700 uppercase tracking-tighter">{route.routeType}</span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">{route.binaType}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-black text-blue-600">R$ {route.rate.toFixed(4)}</span>
                      <span className="text-[10px] font-bold text-rose-500">Custo: {route.cost.toFixed(4)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
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
                  <td className="px-6 py-4">
                    {route.lastTestScore !== undefined && (
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1.5">
                          <div className={cn(
                            "w-1.5 h-1.5 rounded-full",
                            route.lastTestScore >= 90 ? "bg-emerald-500" :
                            route.lastTestScore >= 70 ? "bg-blue-500" :
                            route.lastTestScore >= 40 ? "bg-amber-500" : "bg-rose-500"
                          )} />
                          <span className="text-xs font-black text-slate-700">{route.lastTestScore}/100</span>
                        </div>
                        <span className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">
                          {format(new Date(route.lastTestDate!), 'dd/MM HH:mm', { locale: ptBR })}
                        </span>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => {
                          setTestingRoute(route);
                          setTestCount(1);
                          resetTestData();
                          setTestResults(null);
                        }}
                        title="Analisar Rota"
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/40 hover:scale-105 active:scale-95 animate-in fade-in slide-in-from-right-4 duration-500"
                      >
                        <Zap className="w-3.5 h-3.5 fill-current animate-pulse" />
                        Analisar
                      </button>
                      <button 
                        onClick={() => onEdit(route)}
                        title="Editar"
                        className="p-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => setRouteToDelete(route)}
                        title="Excluir"
                        className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Controls */}
        {filteredRoutes.length > 0 && (
          <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Mostrando <span className="text-slate-800">{(currentPage - 1) * itemsPerPage + 1}</span> a <span className="text-slate-800">{Math.min(currentPage * itemsPerPage, filteredRoutes.length)}</span> de <span className="text-slate-800">{filteredRoutes.length}</span> rotas
            </p>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="p-2 text-slate-500 hover:bg-slate-200 disabled:opacity-30 disabled:hover:bg-transparent rounded-xl transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={cn(
                      "w-8 h-8 text-xs font-black rounded-xl transition-all",
                      currentPage === page 
                        ? "bg-blue-600 text-white shadow-lg shadow-blue-200" 
                        : "text-slate-500 hover:bg-slate-200"
                    )}
                  >
                    {page}
                  </button>
                ))}
              </div>
              <button 
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="p-2 text-slate-500 hover:bg-slate-200 disabled:opacity-30 disabled:hover:bg-transparent rounded-xl transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {filteredRoutes.length === 0 && (
          <div className="p-20 text-center">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Search className="w-10 h-10 text-slate-200" />
            </div>
            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight mb-2">Nenhuma rota encontrada</h3>
            <p className="text-slate-500 font-medium max-w-md mx-auto">Ajuste os filtros ou realize uma nova busca para encontrar a rota desejada.</p>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {routeToDelete && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-8 text-center">
              <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-rose-100">
                <AlertCircle className="w-10 h-10 text-rose-600" />
              </div>
              <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight mb-2">Excluir Rota?</h3>
              <p className="text-slate-500 font-medium">
                Tem certeza que deseja excluir a rota <span className="font-black text-slate-800">{routeToDelete.name}</span>? 
                Esta ação é irreversível e removerá todos os dados vinculados.
              </p>
            </div>
            <div className="p-6 bg-slate-50 flex gap-4">
              <button 
                onClick={() => setRouteToDelete(null)}
                className="flex-1 px-6 py-3 text-slate-600 font-black uppercase tracking-widest hover:bg-slate-200 rounded-2xl transition-colors text-xs"
              >
                Cancelar
              </button>
              <button 
                onClick={() => {
                  onDelete(routeToDelete.id);
                  setRouteToDelete(null);
                }}
                className="flex-1 px-6 py-3 bg-rose-600 text-white font-black uppercase tracking-widest rounded-2xl hover:bg-rose-700 transition-all shadow-lg shadow-rose-200 text-xs"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Route Analysis Modal */}
      <AnimatePresence>
        {testingRoute && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[120] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-lg rounded-[32px] shadow-2xl overflow-hidden border border-white/20"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
                    <Activity className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Analisar Rota</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Teste em tempo real</p>
                  </div>
                </div>
                <button 
                  onClick={() => setTestingRoute(null)}
                  className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-8 space-y-8">
                {/* Route Info Header */}
                <div className="bg-slate-900 rounded-2xl p-6 text-white relative overflow-hidden">
                  <div className="relative z-10">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400">Rota Selecionada</span>
                    <h4 className="text-2xl font-black mt-1">{testingRoute.name}</h4>
                    <div className="flex items-center gap-4 mt-4">
                      <div className="flex items-center gap-2">
                        <Layers className="w-3 h-3 text-slate-400" />
                        <span className="text-[10px] font-bold uppercase text-slate-300">{testingRoute.routeType}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Shield className="w-3 h-3 text-slate-400" />
                        <span className="text-[10px] font-bold uppercase text-slate-300">{testingRoute.provider}</span>
                      </div>
                    </div>
                  </div>
                  <div className="absolute top-0 right-0 p-6">
                    <div className="bg-white/10 backdrop-blur-md rounded-xl px-4 py-2 text-center border border-white/10">
                      <p className="text-[8px] font-black uppercase tracking-widest text-blue-300">Testes Realizados</p>
                      <p className="text-xl font-black">{testCount}</p>
                    </div>
                  </div>
                  <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-blue-600/20 rounded-full blur-3xl" />
                </div>

                {testResults && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-slate-50 rounded-2xl p-6 border border-slate-200 text-center space-y-2"
                  >
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Resultado da Análise</p>
                    <div className="flex items-center justify-center gap-4">
                      <div className="text-4xl font-black text-slate-900">{testResults.score}<span className="text-lg text-slate-400">/100</span></div>
                      <div className="w-px h-10 bg-slate-200" />
                      <div className={cn("text-xl font-black uppercase tracking-tight", testResults.color)}>
                        {testResults.message}
                      </div>
                    </div>
                  </motion.div>
                )}

                <div className="space-y-6">
                  {/* PDD */}
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <PhoneCall className="w-3 h-3" /> PDD de Ring
                    </label>
                    <div className="relative">
                      <input 
                        type="text" 
                        placeholder="Ex: 3.8s"
                        value={testData.pdd}
                        onChange={(e) => setTestData(prev => ({ ...prev, pdd: e.target.value }))}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-300 uppercase">Segundos</span>
                    </div>
                  </div>

                  {/* Toggles Grid */}
                  <div className="grid grid-cols-2 gap-6">
                    {/* Audio Toggle */}
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <Mic className="w-3 h-3" /> Áudio Saindo?
                      </label>
                      <ToggleButton 
                        value={testData.hasAudio} 
                        onChange={(val) => setTestData(prev => ({ ...prev, hasAudio: val }))} 
                      />
                    </div>

                    {/* CallerID Toggle */}
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <UserCheck className="w-3 h-3" /> Respeita CallerID?
                      </label>
                      <ToggleButton 
                        value={testData.respectsCallerId} 
                        onChange={(val) => setTestData(prev => ({ ...prev, respectsCallerId: val }))} 
                      />
                    </div>

                    {/* DTMF Toggle */}
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <Hash className="w-3 h-3" /> Tem DTMF?
                      </label>
                      <ToggleButton 
                        value={testData.hasDtmf} 
                        onChange={(val) => setTestData(prev => ({ ...prev, hasDtmf: val }))} 
                      />
                    </div>

                    {/* Choppy Audio Toggle */}
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <Activity className="w-3 h-3" /> Áudio Picotando?
                      </label>
                      <ToggleButton 
                        value={testData.isChoppy} 
                        onChange={(val) => setTestData(prev => ({ ...prev, isChoppy: val }))} 
                        reverseColors
                      />
                    </div>

                    {/* Silent Call Toggle */}
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <VolumeX className="w-3 h-3" /> Chamada Muda?
                      </label>
                      <ToggleButton 
                        value={testData.isSilent} 
                        onChange={(val) => setTestData(prev => ({ ...prev, isSilent: val }))} 
                        reverseColors
                      />
                    </div>

                    {/* False Ring Toggle */}
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <BellOff className="w-3 h-3" /> Ring Falso?
                      </label>
                      <ToggleButton 
                        value={testData.isFalseRing} 
                        onChange={(val) => setTestData(prev => ({ ...prev, isFalseRing: val }))} 
                        reverseColors
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-4">
                {!testResults ? (
                  <>
                    <button 
                      onClick={() => {
                        setTestCount(prev => prev + 1);
                        resetTestData();
                        toast.info(`Iniciando teste #${testCount + 1} para ${testingRoute.name}`);
                      }}
                      className="flex-1 px-6 py-4 bg-white border border-slate-200 text-slate-700 font-black text-[10px] uppercase tracking-widest rounded-2xl hover:bg-slate-100 transition-all flex items-center justify-center gap-2 shadow-sm"
                    >
                      <Play className="w-4 h-4 text-blue-600" />
                      Testar Nova Rota
                    </button>
                    <button 
                      onClick={handleFinishTest}
                      className="flex-1 px-6 py-4 bg-blue-600 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 flex items-center justify-center gap-2"
                    >
                      <Check className="w-4 h-4" />
                      Finalizar Teste
                    </button>
                  </>
                ) : (
                  <>
                    <button 
                      onClick={() => {
                        setTestResults(null);
                        setTestCount(prev => prev + 1);
                        resetTestData();
                      }}
                      className="flex-1 px-6 py-4 bg-white border border-slate-200 text-slate-700 font-black text-[10px] uppercase tracking-widest rounded-2xl hover:bg-slate-100 transition-all flex items-center justify-center gap-2 shadow-sm"
                    >
                      <RefreshCw className="w-4 h-4 text-blue-600" />
                      Novo Teste
                    </button>
                    <button 
                      onClick={() => setTestingRoute(null)}
                      className="flex-1 px-6 py-4 bg-slate-900 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 flex items-center justify-center gap-2"
                    >
                      <LogOut className="w-4 h-4" />
                      Sair da Análise
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// --- Sub-components ---

function ToggleButton({ value, onChange, reverseColors = false }: { value: boolean, onChange: (val: boolean) => void, reverseColors?: boolean }) {
  const getActiveColor = () => {
    if (reverseColors) return value ? "text-rose-600" : "text-emerald-600";
    return value ? "text-blue-600" : "text-slate-400";
  };

  return (
    <div className="flex p-1 bg-slate-100 rounded-xl">
      <button 
        onClick={() => onChange(true)}
        className={cn(
          "flex-1 py-2 text-[10px] font-black uppercase rounded-lg transition-all",
          value ? `bg-white ${getActiveColor()} shadow-sm` : "text-slate-400"
        )}
      >
        Sim
      </button>
      <button 
        onClick={() => onChange(false)}
        className={cn(
          "flex-1 py-2 text-[10px] font-black uppercase rounded-lg transition-all",
          !value ? `bg-white ${reverseColors ? "text-emerald-600" : "text-rose-600"} shadow-sm` : "text-slate-400"
        )}
      >
        Não
      </button>
    </div>
  );
}
