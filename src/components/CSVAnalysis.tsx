import React, { useState, useCallback, useMemo } from 'react';
import { 
  Upload, 
  FileText, 
  AlertCircle, 
  CheckCircle2, 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Phone, 
  Clock, 
  Award,
  Activity,
  Filter,
  Download,
  ChevronDown,
  ChevronUp,
  Search,
  Info,
  Database,
  Shield,
  Zap,
  Globe,
  Server,
  LayoutDashboard,
  History,
  Settings as SettingsIcon,
  ExternalLink,
  RefreshCw,
  ChevronRight,
  DollarSign
} from 'lucide-react';
import Papa from 'papaparse';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { toast } from 'sonner';

// Advanced Analysis Components
import { AnalysisEngine } from './analysis/AnalysisEngine';
import { AnalysisResults, TopicDashboard } from './analysis/types';
import DashboardRenderer from './analysis/DashboardRenderer';

export default function CSVAnalysis() {
  const [isDragging, setIsDragging] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<AnalysisResults | null>(null);
  const [activeTopic, setActiveTopic] = useState<string>('overview');
  const [viewMode, setViewMode] = useState<'dashboards' | 'profiling' | 'ranking'>('dashboards');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({
    key: 'score',
    direction: 'desc'
  });

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFile = (file: File) => {
    setIsAnalyzing(true);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: 'greedy',
      dynamicTyping: true,
      transformHeader: (header) => header.trim(),
      complete: (papaResults) => {
        try {
          const profile = AnalysisEngine.profile(papaResults.data, papaResults.meta.fields || []);
          const score = AnalysisEngine.calculateAdaptiveScore(profile, papaResults.data);
          const topics = AnalysisEngine.detectTopics(profile);

          // Enrich topics with KPIs
          topics.forEach(topic => {
            if (topic.id === 'overview') {
              topic.kpis = [
                { label: 'Total Chamadas', value: profile.rowCount.toLocaleString() },
                { label: 'Score Global', value: score.finalScore, subValue: score.classification },
                { label: 'Riqueza Dados', value: `${profile.richnessScore}%` },
                { label: 'Dataset', value: profile.datasetType.toUpperCase() }
              ];
            } else if (topic.id === 'pdd') {
              const pddCol = profile.columns.find(c => c.semanticMatch === 'pdd')?.name;
              if (pddCol) {
                const pdds = papaResults.data.map(r => parseFloat(r[pddCol]) || 0).filter(v => v > 0).sort((a, b) => a - b);
                const avg = pdds.reduce((a, b) => a + b, 0) / pdds.length;
                const p95 = pdds[Math.floor(pdds.length * 0.95)] || 0;
                topic.kpis = [
                  { label: 'PDD Médio', value: `${Math.round(avg)}s` },
                  { label: 'PDD P95', value: `${Math.round(p95)}s` },
                  { label: 'Mínimo', value: `${Math.round(pdds[0] || 0)}s` },
                  { label: 'Máximo', value: `${Math.round(pdds[pdds.length - 1] || 0)}s` }
                ];
              }
            }
          });

          setResults({
            profile,
            topics,
            score,
            data: papaResults.data,
            dictionary: {}
          });
          toast.success("Análise adaptativa concluída!");
        } catch (err: any) {
          toast.error("Erro no processamento: " + err.message);
        } finally {
          setIsAnalyzing(false);
        }
      },
      error: (error) => {
        setIsAnalyzing(false);
        toast.error("Erro ao ler o arquivo: " + error.message);
      }
    });
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && (file.type === "text/csv" || file.name.endsWith('.csv'))) {
      handleFile(file);
    } else {
      toast.error("Por favor, envie um arquivo CSV.");
    }
  }, []);

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      {!results && !isAnalyzing && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "border-2 border-dashed rounded-3xl p-12 transition-all duration-300 flex flex-col items-center justify-center text-center min-h-[500px]",
            isDragging ? "border-blue-500 bg-blue-50/50" : "border-slate-200 bg-white hover:border-slate-300"
          )}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
        >
          <div className="w-24 h-24 bg-blue-50 rounded-3xl flex items-center justify-center mb-8">
            <Upload className={cn("w-12 h-12 text-blue-500 transition-transform", isDragging && "scale-110")} />
          </div>
          <h2 className="text-3xl font-black text-slate-800 mb-4 tracking-tight">Análise Adaptativa Gerax</h2>
          <p className="text-slate-500 max-w-lg mb-10 text-lg font-medium leading-relaxed">
            Especialista sênior em telecom. Arraste seu CSV para uma análise profunda, 
            classificação adaptativa e dashboards automáticos baseados em evidência.
          </p>
          <input 
            type="file" 
            accept=".csv" 
            className="hidden" 
            id="csv-upload" 
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
          <label 
            htmlFor="csv-upload"
            className="px-10 py-4 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-700 transition-all shadow-xl shadow-blue-200 cursor-pointer flex items-center gap-3 text-lg"
          >
            <FileText className="w-6 h-6" />
            Iniciar Análise Técnica
          </label>
          <div className="mt-12 flex items-center gap-8 text-xs text-slate-400 font-black uppercase tracking-widest">
            <span className="flex items-center gap-2"><Shield className="w-4 h-4 text-emerald-500" /> Score Adaptativo</span>
            <span className="flex items-center gap-2"><Zap className="w-4 h-4 text-emerald-500" /> Perfilamento Automático</span>
            <span className="flex items-center gap-2"><Globe className="w-4 h-4 text-emerald-500" /> Inteligência Telecom</span>
          </div>
        </motion.div>
      )}

      {isAnalyzing && (
        <div className="flex flex-col items-center justify-center py-32 bg-white rounded-3xl border border-slate-200 shadow-sm">
          <div className="w-20 h-20 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin mb-6"></div>
          <h3 className="text-xl font-black text-slate-800 mb-2">Mapeando Estrutura do Dataset...</h3>
          <p className="text-slate-500 font-bold animate-pulse">Inferindo tipos, resolvendo semântica e calculando scores adaptativos.</p>
        </div>
      )}

      {results && (
        <div className="space-y-6 pb-12">
          {/* Top Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-800 leading-none">Análise Operacional Gerax</h2>
                <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Confiança: {Math.round(results.score.confidence)}% • {results.profile.rowCount} Registros</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setViewMode('dashboards')}
                className={cn(
                  "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all",
                  viewMode === 'dashboards' ? "bg-blue-600 text-white shadow-lg shadow-blue-200" : "text-slate-500 hover:bg-slate-100"
                )}
              >
                Dashboards
              </button>
              <button 
                onClick={() => setViewMode('ranking')}
                className={cn(
                  "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all",
                  viewMode === 'ranking' ? "bg-blue-600 text-white shadow-lg shadow-blue-200" : "text-slate-500 hover:bg-slate-100"
                )}
              >
                Ranking
              </button>
              <button 
                onClick={() => setViewMode('profiling')}
                className={cn(
                  "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all",
                  viewMode === 'profiling' ? "bg-blue-600 text-white shadow-lg shadow-blue-200" : "text-slate-500 hover:bg-slate-100"
                )}
              >
                Schema
              </button>
              <div className="w-px h-6 bg-slate-200 mx-2"></div>
              <button 
                onClick={() => setResults(null)}
                className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                title="Nova Análise"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Global Highlights */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-6 rounded-3xl text-white shadow-xl shadow-blue-200 flex flex-col justify-between min-h-[160px]">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-black uppercase tracking-widest opacity-80">Chamadas Realizadas</p>
                <Phone className="w-5 h-5 opacity-50" />
              </div>
              <div>
                <h3 className="text-4xl font-black tracking-tight">{results.profile.rowCount.toLocaleString()}</h3>
                <p className="text-[10px] font-bold mt-1 opacity-70">Total de registros processados</p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between min-h-[160px]">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">PDD Médio Global</p>
                <Zap className="w-5 h-5 text-amber-500 opacity-50" />
              </div>
              <div>
                <h3 className="text-4xl font-black text-slate-800 tracking-tight">
                  {(() => {
                    const pddCol = results.profile.columns.find(c => c.semanticMatch === 'pdd')?.name;
                    if (!pddCol) return 'N/A';
                    const pdds = results.data.map(r => parseFloat(r[pddCol]) || 0).filter(v => v > 0);
                    if (pdds.length === 0) return '0s';
                    const avg = pdds.reduce((a, b) => a + b, 0) / pdds.length;
                    return `${Math.round(avg)}s`;
                  })()}
                </h3>
                <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase">Média de estabelecimento de chamadas</p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between min-h-[160px]">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">TEMPO DE CHAMANDO</p>
                <Clock className="w-5 h-5 text-emerald-500 opacity-50" />
              </div>
              <div>
                <h3 className="text-4xl font-black text-slate-800 tracking-tight">
                  {(() => {
                    const durCol = results.profile.columns.find(c => c.semanticMatch === 'duration' || c.semanticMatch === 'billed_time')?.name;
                    if (!durCol) return 'N/A';
                    const totalSec = results.data.reduce((acc, r) => acc + (parseFloat(r[durCol]) || 0), 0);
                    const hours = Math.floor(totalSec / 3600);
                    const minutes = Math.floor((totalSec % 3600) / 60);
                    if (hours > 0) return `${hours}h ${minutes}m`;
                    return `${Math.round(totalSec / 60)} min`;
                  })()}
                </h3>
                <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase">Volume total de conversação</p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between min-h-[160px]">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Custo Total</p>
                <DollarSign className="w-5 h-5 text-blue-500 opacity-50" />
              </div>
              <div>
                <h3 className="text-4xl font-black text-blue-600 tracking-tight">
                  {(() => {
                    const valCol = results.profile.columns.find(c => c.semanticMatch === 'value')?.name;
                    if (!valCol) return 'N/A';
                    const totalVal = results.data.reduce((acc, r) => acc + (parseFloat(r[valCol]) || 0), 0);
                    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalVal);
                  })()}
                </h3>
                <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase">Investimento total no período</p>
              </div>
            </div>
          </div>

          {viewMode === 'dashboards' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Sidebar Topics */}
              <div className="lg:col-span-3 space-y-2">
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm mb-4">
                  <p className="text-[10px] font-black text-slate-400 uppercase mb-4 tracking-widest">Tópicos Detectados</p>
                  <div className="space-y-1">
                    {results.topics.map(topic => (
                      <button
                        key={topic.id}
                        onClick={() => setActiveTopic(topic.id)}
                        className={cn(
                          "w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold transition-all group",
                          activeTopic === topic.id 
                            ? "bg-blue-50 text-blue-700 border border-blue-100" 
                            : "text-slate-500 hover:bg-slate-50 border border-transparent"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          {topic.id === 'overview' && <LayoutDashboard className="w-4 h-4" />}
                          {topic.id === 'pdd' && <Zap className="w-4 h-4" />}
                          {topic.id === 'duration' && <Clock className="w-4 h-4" />}
                          {topic.id === 'temporal' && <History className="w-4 h-4" />}
                          {topic.id === 'cost' && <DollarSign className="w-4 h-4" />}
                          {topic.id === 'destination' && <Globe className="w-4 h-4" />}
                          {topic.id === 'technical' && <Shield className="w-4 h-4" />}
                          {topic.name}
                        </div>
                        <ChevronRight className={cn("w-4 h-4 transition-transform", activeTopic === topic.id ? "translate-x-0" : "-translate-x-2 opacity-0 group-hover:opacity-100 group-hover:translate-x-0")} />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-slate-800 p-5 rounded-2xl text-white shadow-xl">
                  <div className="flex items-center gap-2 mb-4">
                    <Award className="w-5 h-5 text-blue-400" />
                    <h3 className="font-black text-sm uppercase tracking-tight">Status Operacional</h3>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase mb-2">
                        <span>Score Adaptativo</span>
                        <span>{results.score.finalScore}/100</span>
                      </div>
                      <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500" style={{ width: `${results.score.finalScore}%` }}></div>
                      </div>
                    </div>
                    <div className={cn(
                      "p-3 rounded-xl border text-center",
                      results.score.classification === 'EXCELENTE' ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" :
                      results.score.classification === 'BOA' ? "bg-blue-500/10 border-blue-500/20 text-blue-400" :
                      "bg-amber-500/10 border-amber-500/20 text-amber-400"
                    )}>
                      <p className="text-xs font-black uppercase tracking-widest">{results.score.classification}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Dashboard Content */}
              <div className="lg:col-span-9">
                <DashboardRenderer results={results} activeTopic={activeTopic} />
              </div>
            </div>
          )}

          {viewMode === 'ranking' && (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in zoom-in duration-300">
              <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-black text-slate-800 mb-2">Ranking de CallerIDs</h3>
                  <p className="text-sm text-slate-500 font-medium">Classificação baseada em performance técnica (PDD e Duração).</p>
                </div>
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="Filtrar CLI..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500/20 outline-none w-64"
                  />
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-100">
                      <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">CallerID</th>
                      <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Chamadas</th>
                      <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">PDD Médio</th>
                      <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Duração Média</th>
                      <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Valor Total</th>
                      <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Score</th>
                      <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Classe</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {(() => {
                      const ranking = AnalysisEngine.calculateRanking(results.profile, results.data);
                      return ranking
                        .filter(r => r.id.toLowerCase().includes(searchTerm.toLowerCase()))
                        .sort((a, b) => b.score - a.score)
                        .map((cli) => (
                          <tr key={cli.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-8 py-4">
                              <p className="text-sm font-bold text-slate-800">{cli.id}</p>
                            </td>
                            <td className="px-8 py-4 text-sm font-bold text-slate-600">{cli.count}</td>
                            <td className="px-8 py-4 text-sm font-bold text-slate-600">{Math.round(cli.avgPdd)}s</td>
                            <td className="px-8 py-4 text-sm font-bold text-slate-600">{cli.avgDur.toFixed(0)}s</td>
                            <td className="px-8 py-4 text-sm font-black text-blue-600">
                              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cli.totalCost || 0)}
                            </td>
                            <td className="px-8 py-4">
                              <span className="text-sm font-black text-blue-600">{cli.score}</span>
                            </td>
                            <td className="px-8 py-4">
                              <span className={cn(
                                "px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider",
                                cli.classification === 'EXCELENTE' ? "bg-emerald-100 text-emerald-700" :
                                cli.classification === 'BOA' ? "bg-blue-100 text-blue-700" :
                                cli.classification === 'REGULAR' ? "bg-slate-100 text-slate-700" :
                                "bg-rose-100 text-rose-700"
                              )}>
                                {cli.classification}
                              </span>
                            </td>
                          </tr>
                        ));
                    })()}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {viewMode === 'profiling' && (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in zoom-in duration-300">
              <div className="p-8 border-b border-slate-100 bg-slate-50/50">
                <h3 className="text-xl font-black text-slate-800 mb-2">Dicionário Técnico e Schema</h3>
                <p className="text-sm text-slate-500 font-medium">Mapeamento automático de colunas e inferência de tipos telecom.</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-100">
                      <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Coluna Original</th>
                      <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Tipo Inferido</th>
                      <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Match Semântico</th>
                      <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Taxa de Nulos</th>
                      <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Amostra</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {results.profile.columns.map((col) => (
                      <tr key={col.name} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-8 py-4">
                          <p className="text-sm font-bold text-slate-800">{col.name}</p>
                        </td>
                        <td className="px-8 py-4">
                          <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-bold border border-slate-200 uppercase">
                            {col.type}
                          </span>
                        </td>
                        <td className="px-8 py-4">
                          {col.semanticMatch ? (
                            <span className="flex items-center gap-2 text-blue-600 font-black text-[10px] uppercase">
                              <CheckCircle2 className="w-3 h-3" />
                              {col.semanticMatch}
                            </span>
                          ) : (
                            <span className="text-slate-300 font-bold text-[10px] uppercase italic">Nenhum Match</span>
                          )}
                        </td>
                        <td className="px-8 py-4">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden w-16">
                              <div className="h-full bg-rose-500" style={{ width: `${col.nullRate * 100}%` }}></div>
                            </div>
                            <span className="text-xs font-bold text-slate-500">{Math.round(col.nullRate * 100)}%</span>
                          </div>
                        </td>
                        <td className="px-8 py-4">
                          <p className="text-[10px] font-mono text-slate-400 truncate max-w-[200px]">
                            {col.sampleValues.join(', ')}
                          </p>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
