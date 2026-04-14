import React from 'react';
import { AnalysisResults, TopicDashboard } from './types';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { 
  Activity, Clock, Phone, DollarSign, Globe, Shield, 
  TrendingUp, TrendingDown, AlertCircle, CheckCircle2 
} from 'lucide-react';
import { cn } from '../../lib/utils';

interface Props {
  results: AnalysisResults;
  activeTopic: string;
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

export default function DashboardRenderer({ results, activeTopic }: Props) {
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => setIsMounted(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const topic = results.topics.find(t => t.id === activeTopic);
  if (!topic) return null;

  const renderKPIs = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {topic.kpis.map((kpi, idx) => (
        <div key={idx} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{kpi.label}</p>
          <h4 className="text-2xl font-black text-slate-800">{kpi.value}</h4>
          {kpi.subValue && <p className="text-[10px] text-slate-400 mt-1 font-medium">{kpi.subValue}</p>}
        </div>
      ))}
    </div>
  );

  const renderOverview = () => {
    const { profile, score } = results;
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Score Card */}
          <div className="lg:col-span-1 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center">
            <div className="relative w-40 h-40 flex items-center justify-center mb-6">
              <svg className="w-full h-full -rotate-90">
                <circle cx="80" cy="80" r="70" fill="transparent" stroke="#F1F5F9" strokeWidth="12" />
                <circle 
                  cx="80" cy="80" r="70" fill="transparent" stroke={score.finalScore > 70 ? '#10B981' : score.finalScore > 40 ? '#F59E0B' : '#EF4444'} 
                  strokeWidth="12" strokeDasharray={440} strokeDashoffset={440 - (440 * score.finalScore) / 100}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-black text-slate-800">{score.finalScore}</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Score Global</span>
              </div>
            </div>
            <h3 className={cn(
              "text-xl font-black mb-2",
              score.classification === 'EXCELENTE' ? 'text-emerald-600' :
              score.classification === 'BOA' ? 'text-blue-600' :
              score.classification === 'REGULAR' ? 'text-amber-600' : 'text-rose-600'
            )}>
              {score.classification}
            </h3>
            <p className="text-xs text-slate-500 font-medium px-4">{score.explanation}</p>
            <div className="mt-6 w-full pt-6 border-t border-slate-100">
              <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase mb-2">
                <span>Confiança da Análise</span>
                <span>{score.confidence}%</span>
              </div>
              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: `${score.confidence}%` }}></div>
              </div>
            </div>
          </div>

          {/* Profile Summary */}
          <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-500" />
              Perfilamento do Arquivo
            </h3>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <ProfileItem label="Total de Registros" value={profile.rowCount.toLocaleString()} />
                <ProfileItem label="Colunas Detectadas" value={profile.columnCount.toString()} />
                <ProfileItem label="Tipo de Dataset" value={profile.datasetType.toUpperCase()} />
              </div>
              <div className="space-y-4">
                <ProfileItem label="Encoding" value={profile.encoding} />
                <ProfileItem label="Delimitador" value={profile.delimiter === ',' ? 'Vírgula' : 'Ponto e Vírgula'} />
                <ProfileItem label="Riqueza de Dados" value={`${profile.richnessScore}%`} />
              </div>
            </div>
            <div className="mt-8">
              <p className="text-[10px] font-black text-slate-400 uppercase mb-4">Mapeamento Semântico</p>
              <div className="flex flex-wrap gap-2">
                {profile.columns.filter(c => c.semanticMatch).map(c => (
                  <span key={c.name} className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-bold border border-slate-200">
                    {c.semanticMatch?.toUpperCase()}: {c.name}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Family Breakdown */}
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Distribuição de Pesos e Scores por Família</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {score.families.map(f => (
              <div key={f.name} className={cn("p-4 rounded-2xl border transition-all", f.available ? "bg-slate-50 border-slate-200" : "bg-slate-50/50 border-slate-100 opacity-50")}>
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase">{f.name}</p>
                    <p className="text-xs font-bold text-slate-600">Peso: {Math.round(f.appliedWeight)}%</p>
                  </div>
                  {f.available ? (
                    <span className="text-lg font-black text-slate-800">{Math.round(f.score)}</span>
                  ) : (
                    <span className="text-[10px] font-bold text-slate-400 uppercase">N/A</span>
                  )}
                </div>
                <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <div className={cn("h-full rounded-full", f.score > 70 ? "bg-emerald-500" : f.score > 40 ? "bg-amber-500" : "bg-rose-500")} style={{ width: `${f.score}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderPDD = () => {
    const pddCol = results.profile.columns.find(c => c.semanticMatch === 'pdd')?.name;
    if (!pddCol) return null;

    const pddData = results.data.map(r => parseFloat(r[pddCol]) || 0).filter(v => v > 0);
    const bins = [0, 3, 5, 8, 12, 20];
    const histogram = bins.map((bin, i) => {
      const nextBin = bins[i + 1] || 999;
      const count = pddData.filter(v => v >= bin && v < nextBin).length;
      return { 
        name: i === bins.length - 1 ? `> ${bin}s` : `${bin}-${nextBin}s`,
        count,
        percentage: (count / pddData.length) * 100
      };
    });

    return (
      <div className="space-y-6">
        {renderKPIs()}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-800 mb-6">Distribuição de PDD</h3>
            <div className="h-[300px] w-full">
              {isMounted && (
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                  <BarChart data={histogram}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-800 mb-6">Qualidade por Faixa</h3>
            <div className="h-[300px] w-full">
              {isMounted && (
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                  <PieChart>
                    <Pie
                      data={histogram}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="count"
                    >
                      {histogram.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderDuration = () => {
    const durCol = results.profile.columns.find(c => c.semanticMatch === 'duration')?.name;
    if (!durCol) return null;

    const durData = results.data.map(r => parseFloat(r[durCol]) || 0).filter(v => v > 0);
    const bins = [0, 5, 15, 30, 60, 120, 300];
    const histogram = bins.map((bin, i) => {
      const nextBin = bins[i + 1] || 9999;
      const count = durData.filter(v => v >= bin && v < nextBin).length;
      return { 
        name: i === bins.length - 1 ? `> ${bin}s` : `${bin}-${nextBin}s`,
        count,
        percentage: (count / durData.length) * 100
      };
    });

    return (
      <div className="space-y-6">
        {renderKPIs()}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-6">Distribuição de Duração (Segundos)</h3>
          <div className="h-[400px] w-full">
            {isMounted && (
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <AreaChart data={histogram}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="count" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.1} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderCost = () => {
    const valCol = results.profile.columns.find(c => c.semanticMatch === 'value')?.name;
    if (!valCol) return null;

    const costs = results.data.map(r => parseFloat(r[valCol]) || 0);
    const totalCost = costs.reduce((a, b) => a + b, 0);
    
    return (
      <div className="space-y-6">
        {renderKPIs()}
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm text-center">
          <DollarSign className="w-12 h-12 text-blue-500 mx-auto mb-4 opacity-20" />
          <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-2">Investimento Total Detectado</h3>
          <h2 className="text-6xl font-black text-blue-600 tracking-tighter">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalCost)}
          </h2>
          <p className="text-xs text-slate-400 mt-4 font-medium max-w-md mx-auto">
            Este valor representa a soma de todos os registros na coluna "{valCol}" identificada como valor financeiro.
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="animate-in fade-in duration-500">
      {activeTopic === 'overview' && renderOverview()}
      {activeTopic === 'pdd' && renderPDD()}
      {activeTopic === 'duration' && renderDuration()}
      {activeTopic === 'cost' && renderCost()}
      {/* Add other topics as needed */}
      {activeTopic !== 'overview' && activeTopic !== 'pdd' && activeTopic !== 'duration' && activeTopic !== 'cost' && (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200">
          <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-800">Dashboard em Desenvolvimento</h3>
          <p className="text-slate-500">O tópico "{topic.name}" foi detectado, mas a visualização detalhada está sendo processada.</p>
        </div>
      )}
    </div>
  );
}

function ProfileItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-slate-50">
      <span className="text-xs text-slate-500 font-medium">{label}</span>
      <span className="text-sm font-bold text-slate-800">{value}</span>
    </div>
  );
}
