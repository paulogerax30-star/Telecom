import React, { useMemo, useState, useEffect } from 'react';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  LineChart,
  Line,
  AreaChart,
  Area
} from 'recharts';
import { 
  Database, 
  TrendingUp, 
  Activity,
  Zap,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Shield,
  Layers,
  Clock
} from 'lucide-react';
import { Route, RouteHistory } from '../types';
import { cn } from '../lib/utils';
import { format, startOfMonth, isSameMonth } from 'date-fns';

interface DashboardProps {
  routes: Route[];
  history: RouteHistory[];
}

export default function Dashboard({ routes, history }: DashboardProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsMounted(true), 500);
    return () => clearTimeout(timer);
  }, []);

  const stats = useMemo(() => {
    const active = routes.filter(r => r.status === 'Ativa').length;
    const totalRevenue = routes.reduce((acc, r) => acc + (r.revenue || 0), 0);
    const totalProfit = routes.reduce((acc, r) => acc + (r.profit || 0), 0);
    const avgAsr = routes.length > 0 ? routes.reduce((acc, r) => acc + (r.asr || 0), 0) / routes.length : 0;
    
    return {
      total: routes.length,
      active,
      revenue: totalRevenue,
      profit: totalProfit,
      avgAsr: avgAsr.toFixed(1)
    };
  }, [routes]);

  // Simulated traffic data for the chart
  const trafficData = useMemo(() => {
    const data = [];
    for (let i = 0; i < 24; i++) {
      data.push({
        time: `${i}:00`,
        calls: Math.floor(Math.random() * 1000) + 500,
        asr: Math.floor(Math.random() * 30) + 60
      });
    }
    return data;
  }, []);

  const recentRoutes = useMemo(() => [...routes]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5), [routes]);

  return (
    <div className="space-y-6 pb-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-600/20">
            <Activity className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Operação NOC</h2>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Monitoramento em Tempo Real</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl shadow-sm">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
            <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Sistema Online</span>
          </div>
          <div className="px-4 py-2 bg-slate-900 text-white rounded-xl shadow-lg">
            <span className="text-xs font-black tabular-nums">{format(new Date(), "HH:mm:ss")}</span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total de Rotas" 
          value={stats.total} 
          icon={Database} 
          color="blue"
          trend="Infraestrutura"
        />
        <StatCard 
          title="Rotas Ativas" 
          value={stats.active} 
          icon={Zap} 
          color="green"
          trend={`${stats.active > 0 ? Math.round((stats.active / stats.total) * 100) : 0}% Disponibilidade`}
        />
        <StatCard 
          title="Receita Total" 
          value={`R$ ${stats.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} 
          icon={DollarSign} 
          color="emerald"
          trend="Acumulado"
        />
        <StatCard 
          title="ASR Média" 
          value={`${stats.avgAsr}%`} 
          icon={TrendingUp} 
          color="indigo"
          trend="Performance Global"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Traffic Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Tráfego de Chamadas (24h)</h3>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Volume de chamadas por hora</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-[10px] font-black text-slate-500 uppercase">Chamadas</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                <span className="text-[10px] font-black text-slate-500 uppercase">ASR %</span>
              </div>
            </div>
          </div>
          <div className="h-[350px] w-full">
            {isMounted && (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trafficData}>
                  <defs>
                    <linearGradient id="colorCalls" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis 
                    dataKey="time" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#94A3B8', fontSize: 10, fontWeight: 700 }}
                  />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 10, fontWeight: 700 }} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '12px' }}
                    itemStyle={{ fontSize: '12px', fontWeight: 900, textTransform: 'uppercase' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="calls" 
                    stroke="#3B82F6" 
                    strokeWidth={4} 
                    fillOpacity={1} 
                    fill="url(#colorCalls)" 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="asr" 
                    stroke="#10B981" 
                    strokeWidth={3} 
                    dot={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Recent Routes */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col">
          <div className="mb-8">
            <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Novas Rotas</h3>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Últimos cadastros realizados</p>
          </div>
          <div className="flex-1 space-y-4">
            {recentRoutes.map((route) => (
              <div key={route.id} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100 group hover:border-blue-200 transition-all">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-blue-600 shadow-sm group-hover:scale-110 transition-transform">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-slate-800 uppercase tracking-tight">{route.name}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">{route.routeType}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-black text-blue-600">R$ {route.rate.toFixed(4)}</p>
                  <span className={cn(
                    "px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest",
                    route.status === 'Ativa' ? "bg-emerald-100 text-emerald-600" : 
                    route.status === 'Inativa' ? "bg-rose-100 text-rose-600" : "bg-amber-100 text-amber-600"
                  )}>
                    {route.status}
                  </span>
                </div>
              </div>
            ))}
            {recentRoutes.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full py-12 text-center">
                <Database className="w-12 h-12 text-slate-200 mb-4" />
                <p className="text-xs font-bold text-slate-400 uppercase">Sem rotas cadastradas</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color, trend }: any) {
  const variants = {
    blue: { text: "text-blue-600", light: "bg-blue-50", border: "border-blue-100" },
    green: { text: "text-emerald-600", light: "bg-emerald-50", border: "border-emerald-100" },
    emerald: { text: "text-emerald-600", light: "bg-emerald-50", border: "border-emerald-100" },
    indigo: { text: "text-indigo-600", light: "bg-indigo-50", border: "border-indigo-100" },
  };

  const v = variants[color as keyof typeof variants];

  return (
    <div className={cn(
      "bg-white p-6 rounded-3xl border transition-all duration-300 hover:shadow-xl hover:-translate-y-1",
      v.border
    )}>
      <div className="flex items-start justify-between mb-4">
        <div className={cn("p-3 rounded-2xl", v.light)}>
          <Icon className={cn("w-6 h-6", v.text)} strokeWidth={2.5} />
        </div>
        <div className="text-right">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{title}</p>
          <h4 className="text-2xl font-black text-slate-800 tabular-nums tracking-tighter">{value}</h4>
        </div>
      </div>
      <div className="flex items-center gap-2 pt-4 border-t border-slate-50">
        <ArrowUpRight className="w-3 h-3 text-emerald-500" />
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{trend}</span>
      </div>
    </div>
  );
}
