import React, { useState, useMemo, useCallback } from 'react';
import { 
  Upload, 
  FileText, 
  Search, 
  Filter, 
  BarChart3, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  Download, 
  Trash2, 
  ChevronRight, 
  Activity,
  Shield,
  Zap,
  Info,
  Database,
  ArrowUpRight,
  ArrowDownRight,
  Layers,
  PieChart as PieChartIcon,
  Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { CallRecord, CallClassification, TechnicalClass } from '../types';
import { mapColumns, classifyCall, calculateStats } from '../services/callClassifier';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area
} from 'recharts';

type ClassifierTab = 'import' | 'results' | 'dashboard' | 'rankings' | 'alerts';

export default function CallClassifier() {
  const [activeTab, setActiveTab] = useState<ClassifierTab>('import');
  const [rawData, setRawData] = useState<string>('');
  const [records, setRecords] = useState<CallRecord[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterClass, setFilterClass] = useState<string>('all');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setRawData(text);
      processData(text);
    };
    reader.readAsText(file);
  };

  const processData = useCallback((text: string) => {
    setIsAnalyzing(true);
    setTimeout(() => {
      try {
        const lines = text.split('\n').filter(line => line.trim());
        if (lines.length < 2) throw new Error('Dados insuficientes.');

        const headers = lines[0].split(',').map(h => h.trim());
        const mapping = mapColumns(headers);
        
        const newRecords = lines.slice(1).map((line, index) => {
          const values = line.split(',').map(v => v.trim());
          const record: any = { id: `call-${index}-${Date.now()}` };
          
          Object.entries(mapping).forEach(([field, header]) => {
            const headerIndex = headers.indexOf(header);
            if (headerIndex !== -1) {
              let val: any = values[headerIndex];
              // Convert types
              if (['pdd', 'ringTime', 'durationTotal', 'billsec', 'sipCode', 'revenue', 'cost', 'profit'].includes(field)) {
                val = parseFloat(val) || 0;
              } else if (['rtp', 'amd', 'voicemail'].includes(field)) {
                val = val.toLowerCase() === 'true' || val === '1' || val === 'yes';
              }
              record[field] = val;
            }
          });

          return classifyCall(record);
        });

        setRecords(newRecords);
        setActiveTab('results');
      } catch (error) {
        console.error('Erro ao processar dados:', error);
      } finally {
        setIsAnalyzing(false);
      }
    }, 500);
  }, []);

  const stats = useMemo(() => calculateStats(records), [records]);

  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      const matchesSearch = r.callId.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           r.destination.includes(searchTerm) ||
                           r.route.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesClass = filterClass === 'all' || r.classification === filterClass;
      return matchesSearch && matchesClass;
    });
  }, [records, searchTerm, filterClass]);

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#64748B'];

  return (
    <div className="space-y-6 pb-20">
      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm overflow-x-auto no-scrollbar">
        {[
          { id: 'import', label: 'Importação', icon: Upload },
          { id: 'results', label: 'Análise por Chamada', icon: Layers },
          { id: 'dashboard', label: 'Dashboards', icon: BarChart3 },
          { id: 'rankings', label: 'Rankings', icon: TrendingUp },
          { id: 'alerts', label: 'Alertas Técnicos', icon: AlertTriangle },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as ClassifierTab)}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap",
              activeTab === tab.id 
                ? "bg-blue-600 text-white shadow-lg shadow-blue-200" 
                : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
            )}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'import' && (
          <motion.div 
            key="import"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Upload de Arquivo</h3>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Arraste seu CSV ou clique para selecionar</p>
                  </div>
                </div>

                <div className="relative group">
                  <input 
                    type="file" 
                    accept=".csv"
                    onChange={handleFileUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div className="border-2 border-dashed border-slate-200 rounded-3xl p-12 flex flex-col items-center justify-center gap-4 group-hover:border-blue-400 group-hover:bg-blue-50/30 transition-all">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                      <FileText className="w-8 h-8 text-slate-400" />
                    </div>
                    <p className="text-sm font-bold text-slate-600">Clique para selecionar arquivo .csv</p>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Tamanho máximo: 50MB</p>
                  </div>
                </div>

                <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex gap-3">
                  <Info className="w-5 h-5 text-amber-600 shrink-0" />
                  <p className="text-[11px] text-amber-800 font-bold leading-relaxed">
                    O sistema reconhece automaticamente colunas como Call-ID, Destino, PDD, SIP Code, etc. 
                    Mesmo que os nomes variem, nossa IA adaptativa fará o mapeamento.
                  </p>
                </div>
              </div>

              <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600">
                    <Zap className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Colagem Manual</h3>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Cole seus dados diretamente aqui</p>
                  </div>
                </div>

                <textarea 
                  value={rawData}
                  onChange={(e) => setRawData(e.target.value)}
                  placeholder="Cole aqui as linhas do seu CSV (incluindo o cabeçalho)..."
                  className="w-full h-[250px] p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-mono focus:ring-2 focus:ring-blue-500/20 outline-none resize-none"
                />

                <button 
                  onClick={() => processData(rawData)}
                  disabled={!rawData || isAnalyzing}
                  className="w-full py-4 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg disabled:opacity-50"
                >
                  {isAnalyzing ? 'Analisando...' : 'Iniciar Classificação Inteligente'}
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'results' && (
          <motion.div 
            key="results"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            {/* Filters */}
            <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4 flex-1">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="Buscar por Call-ID, Destino ou Rota..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-500/20 outline-none"
                  />
                </div>
                <select 
                  value={filterClass}
                  onChange={(e) => setFilterClass(e.target.value)}
                  className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none"
                >
                  <option value="all">Todas as Classes</option>
                  <option value="EXCELENTE">Excelente</option>
                  <option value="BOA">Boa</option>
                  <option value="REGULAR">Regular</option>
                  <option value="RUIM">Ruim</option>
                  <option value="CRÍTICA">Crítica</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  {filteredRecords.length} chamadas filtradas
                </span>
                <button className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                  <Download className="w-4 h-4 text-slate-400" />
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50">
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Score / Classe</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Call-ID / Destino</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Rota / Fornecedor</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Métricas (PDD/DUR)</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Classificação Técnica</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Motivo Principal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredRecords.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shadow-sm",
                              r.score! >= 90 ? "bg-emerald-100 text-emerald-700" :
                              r.score! >= 75 ? "bg-blue-100 text-blue-700" :
                              r.score! >= 50 ? "bg-amber-100 text-amber-700" :
                              "bg-rose-100 text-rose-700"
                            )}>
                              {r.score}
                            </div>
                            <span className={cn(
                              "text-[10px] font-black uppercase tracking-widest",
                              r.score! >= 90 ? "text-emerald-600" :
                              r.score! >= 75 ? "text-blue-600" :
                              r.score! >= 50 ? "text-amber-600" :
                              "text-rose-600"
                            )}>
                              {r.classification}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-xs font-black text-slate-800 tracking-tight truncate max-w-[150px]">{r.callId}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase">{r.destination}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-xs font-black text-slate-800 uppercase">{r.route}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase">{r.supplier}</p>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-4">
                            <div className="flex flex-col">
                              <span className="text-[9px] font-black text-slate-400 uppercase">PDD</span>
                              <span className={cn("text-xs font-black", r.pdd > 8 ? "text-rose-500" : "text-slate-800")}>{r.pdd}s</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[9px] font-black text-slate-400 uppercase">DUR</span>
                              <span className="text-xs font-black text-slate-800">{r.billsec}s</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={cn(
                            "px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest",
                            r.technicalClass!.startsWith('SUCCESS') ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-rose-50 text-rose-600 border border-rose-100"
                          )}>
                            {r.technicalClass}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-[11px] font-bold text-slate-600 leading-tight">{r.reason}</p>
                          {r.secondaryReasons!.length > 0 && (
                            <p className="text-[9px] text-slate-400 font-medium mt-1 italic">{r.secondaryReasons!.join(', ')}</p>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'dashboard' && (
          <motion.div 
            key="dashboard"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="space-y-6"
          >
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <KPIStoreCard title="Total Chamadas" value={stats.stats.total} icon={Database} color="blue" />
              <KPIStoreCard title="Taxa de Sucesso" value={`${((stats.stats.answered / stats.stats.total) * 100).toFixed(1)}%`} icon={CheckCircle2} color="emerald" />
              <KPIStoreCard title="Score Médio" value={stats.stats.avgScore.toFixed(1)} icon={Shield} color="indigo" />
              <KPIStoreCard title="PDD Médio" value={`${stats.stats.avgPdd.toFixed(2)}s`} icon={Clock} color="amber" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Classification Distribution */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight mb-6">Distribuição de Qualidade</h3>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Excelente', value: records.filter(r => r.classification === 'EXCELENTE').length },
                          { name: 'Boa', value: records.filter(r => r.classification === 'BOA').length },
                          { name: 'Regular', value: records.filter(r => r.classification === 'REGULAR').length },
                          { name: 'Ruim', value: records.filter(r => r.classification === 'RUIM').length },
                          { name: 'Crítica', value: records.filter(r => r.classification === 'CRÍTICA').length },
                        ]}
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {COLORS.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Technical Class Distribution */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight mb-6">Falhas Técnicas por Categoria</h3>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={Object.entries(
                      records.reduce((acc: any, r) => {
                        if (!r.technicalClass!.startsWith('SUCCESS')) {
                          acc[r.technicalClass!] = (acc[r.technicalClass!] || 0) + 1;
                        }
                        return acc;
                      }, {})
                    ).map(([name, value]) => ({ name, value }))}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                      <XAxis dataKey="name" tick={{ fontSize: 10, fontWeight: 700 }} />
                      <YAxis tick={{ fontSize: 10, fontWeight: 700 }} />
                      <Tooltip />
                      <Bar dataKey="value" fill="#EF4444" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'rankings' && (
          <motion.div 
            key="rankings"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          >
            {/* Top Routes */}
            <RankingCard 
              title="Melhores Rotas" 
              data={stats.byRoute.slice(0, 5)} 
              icon={TrendingUp}
              color="emerald"
            />
            {/* Worst Routes */}
            <RankingCard 
              title="Rotas Críticas" 
              data={stats.byRoute.filter(r => r.avgScore < 50).sort((a, b) => a.avgScore - b.avgScore).slice(0, 5)} 
              icon={AlertTriangle}
              color="rose"
            />
            {/* Top Suppliers */}
            <RankingCard 
              title="Ranking Fornecedores" 
              data={stats.bySupplier.slice(0, 5)} 
              icon={Shield}
              color="blue"
            />
            {/* Top Clients */}
            <RankingCard 
              title="Maiores Clientes" 
              data={stats.byClient.slice(0, 5)} 
              icon={Database}
              color="indigo"
            />
          </motion.div>
        )}

        {activeTab === 'alerts' && (
          <motion.div 
            key="alerts"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            {stats.byRoute.filter(r => r.techRate > 10 || r.avgPdd > 8).map((r, idx) => (
              <div key={idx} className="bg-white p-6 rounded-3xl border border-rose-200 shadow-sm flex items-center justify-between gap-6 border-l-8 border-l-rose-500">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-rose-100 rounded-2xl flex items-center justify-center text-rose-600">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-lg font-black text-slate-900 uppercase tracking-tight">Alerta de Instabilidade: {r.name}</h4>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">
                      Taxa de falha técnica: <span className="text-rose-600">{r.techRate.toFixed(1)}%</span> | 
                      PDD Médio: <span className="text-rose-600">{r.avgPdd.toFixed(2)}s</span>
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Impacto Estimado</p>
                  <span className="px-3 py-1 bg-rose-600 text-white text-[10px] font-black rounded-full uppercase tracking-widest">Crítico</span>
                </div>
                <button className="px-6 py-2 bg-slate-900 text-white text-xs font-black rounded-xl uppercase tracking-widest hover:bg-slate-800 transition-all">
                  Ver Detalhes
                </button>
              </div>
            ))}
            {stats.byRoute.filter(r => r.techRate > 10 || r.avgPdd > 8).length === 0 && (
              <div className="bg-white p-20 rounded-3xl border border-slate-200 border-dashed text-center">
                <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                </div>
                <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight mb-2">Nenhum alerta técnico</h3>
                <p className="text-slate-500 font-medium max-w-md mx-auto">Todas as rotas e fornecedores estão operando dentro das faixas de normalidade.</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function KPIStoreCard({ title, value, icon: Icon, color }: any) {
  const colors: any = {
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
    indigo: "bg-indigo-50 text-indigo-600 border-indigo-100",
    amber: "bg-amber-50 text-amber-600 border-amber-100",
    rose: "bg-rose-50 text-rose-600 border-rose-100",
  };

  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
      <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center", colors[color])}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{title}</p>
        <h4 className="text-2xl font-black text-slate-900 tracking-tight">{value}</h4>
      </div>
    </div>
  );
}

function RankingCard({ title, data, icon: Icon, color }: any) {
  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center",
            color === 'emerald' ? "bg-emerald-100 text-emerald-600" :
            color === 'rose' ? "bg-rose-100 text-rose-600" :
            color === 'blue' ? "bg-blue-100 text-blue-600" : "bg-indigo-100 text-indigo-600"
          )}>
            <Icon className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">{title}</h3>
        </div>
        <button className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline">Ver Todos</button>
      </div>

      <div className="space-y-3">
        {data.map((item: any, idx: number) => (
          <div key={idx} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100 group hover:border-blue-200 transition-all">
            <div className="flex items-center gap-3">
              <span className="w-6 h-6 bg-white rounded-lg flex items-center justify-center text-[10px] font-black text-slate-400 shadow-sm">
                {idx + 1}
              </span>
              <div>
                <p className="text-xs font-black text-slate-800 uppercase">{item.name}</p>
                <p className="text-[9px] text-slate-400 font-bold uppercase">{item.volume} chamadas</p>
              </div>
            </div>
            <div className="text-right">
              <p className={cn(
                "text-sm font-black",
                item.avgScore >= 75 ? "text-emerald-600" :
                item.avgScore >= 50 ? "text-amber-600" : "text-rose-600"
              )}>
                {item.avgScore.toFixed(1)}
              </p>
              <p className="text-[9px] text-slate-400 font-bold uppercase">Score Médio</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
