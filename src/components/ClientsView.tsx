import React, { useState } from 'react';
import { 
  Users, 
  Search, 
  Building2, 
  Phone, 
  Globe, 
  ShieldCheck,
  ChevronRight,
  FileText,
  Calendar,
  User,
  DollarSign,
  Hash,
  Info,
  Database
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { ClientRegistration } from '../types';

interface ClientsViewProps {
  registrations: ClientRegistration[];
}

export default function ClientsView({ registrations }: ClientsViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState<ClientRegistration | null>(null);
  const [activeServer, setActiveServer] = useState<string>('TODOS');

  const filteredRegistrations = registrations.filter(reg => 
    reg.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    reg.cnpj.includes(searchTerm) ||
    reg.sellerName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Group by serverId for the tabs
  const allServers = Array.from(new Set(registrations.map(r => r.serverId || 'NÃO DEFINIDO'))).sort();
  const serversWithData = ['TODOS', ...allServers];

  const displayedClients = activeServer === 'TODOS' 
    ? filteredRegistrations 
    : filteredRegistrations.filter(reg => (reg.serverId || 'NÃO DEFINIDO') === activeServer);

  return (
    <div className="space-y-6 flex flex-col h-full">
      {/* Header & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 shrink-0">
        <div>
          <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Base de Clientes</h1>
          <p className="text-slate-500 font-medium mt-1">Gerenciamento de fichas de clientes por servidor.</p>
        </div>
        
        <div className="relative group">
          <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
          <input 
            type="text" 
            placeholder="Buscar por cliente, CNPJ ou vendedor..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-12 pr-6 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-blue-500/10 outline-none transition-all w-full md:w-96 shadow-sm"
          />
        </div>
      </div>

      {/* Excel-style Tabs */}
      <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl overflow-x-auto no-scrollbar shrink-0">
        {serversWithData.map((server) => {
          const count = server === 'TODOS' 
            ? filteredRegistrations.length 
            : filteredRegistrations.filter(r => (r.serverId || 'NÃO DEFINIDO') === server).length;
          
          return (
            <button
              key={server}
              onClick={() => setActiveServer(server)}
              className={cn(
                "px-6 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 whitespace-nowrap",
                activeServer === server
                  ? "bg-white text-blue-600 shadow-sm ring-1 ring-slate-200"
                  : "text-slate-500 hover:bg-white/50 hover:text-slate-700"
              )}
            >
              {server === 'TODOS' ? <Users className="w-3 h-3" /> : <Database className="w-3 h-3" />}
              {server}
              <span className={cn(
                "px-1.5 py-0.5 rounded text-[9px]",
                activeServer === server ? "bg-blue-50 text-blue-600" : "bg-slate-200 text-slate-500"
              )}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Clients Grid */}
      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
        {displayedClients.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 pb-8">
            {displayedClients.map((reg) => (
              <motion.div
                key={reg.id}
                layoutId={reg.id}
                onClick={() => setSelectedClient(reg)}
                className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-200 transition-all cursor-pointer group relative overflow-hidden"
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 shrink-0 group-hover:scale-110 transition-transform">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-black text-slate-900 uppercase tracking-tight text-[11px] line-clamp-1 group-hover:text-blue-600 transition-colors">{reg.clientName}</h3>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">{reg.cnpj}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[9px]">
                    <div className="flex items-center gap-1.5 text-slate-500 font-bold uppercase tracking-wider">
                      <User className="w-3 h-3 text-slate-300" />
                      Vendedor
                    </div>
                    <span className="text-slate-900 font-black uppercase">{reg.sellerName}</span>
                  </div>
                  
                  <div className="flex items-center justify-between text-[9px]">
                    <div className="flex items-center gap-1.5 text-slate-500 font-bold uppercase tracking-wider">
                      <Globe className="w-3 h-3 text-slate-300" />
                      Rotas
                    </div>
                    <div className="flex gap-1">
                      {reg.contractedRoutes.slice(0, 1).map(route => (
                        <span key={route} className="px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded text-[8px] font-black uppercase">{route}</span>
                      ))}
                      {reg.contractedRoutes.length > 1 && (
                        <span className="px-1.5 py-0.5 bg-slate-50 text-slate-500 rounded text-[8px] font-black uppercase">+{reg.contractedRoutes.length - 1}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[9px]">
                    <div className="flex items-center gap-1.5 text-slate-500 font-bold uppercase tracking-wider">
                      <Calendar className="w-3 h-3 text-slate-300" />
                      Data
                    </div>
                    <span className="text-slate-900 font-black uppercase">
                      {new Date(reg.createdAt).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-50 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">
                      Ficha #{reg.id.split('-')[1]}
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400 bg-white rounded-[40px] border-2 border-dashed border-slate-200">
            <Users className="w-16 h-16 mb-4 opacity-20" />
            <p className="font-black uppercase tracking-widest text-sm">Nenhum cliente encontrado</p>
            <p className="text-xs font-medium mt-2">Os clientes cadastrados aparecerão aqui.</p>
          </div>
        )}
      </div>

      {/* Client Detail Modal */}
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
              {/* Modal Header */}
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

              {/* Modal Content */}
              <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Left Column: Info & Routes */}
                  <div className="space-y-8">
                    <section className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                      <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Info className="w-3 h-3" /> Informações Gerais
                      </h3>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center py-2 border-b border-slate-50">
                          <span className="text-xs font-bold text-slate-500 uppercase">Vendedor</span>
                          <span className="text-xs font-black text-slate-900 uppercase">{selectedClient.sellerName}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-slate-50">
                          <span className="text-xs font-bold text-slate-500 uppercase">Contato</span>
                          <span className="text-xs font-black text-slate-900 uppercase">{selectedClient.contact}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-slate-50">
                          <span className="text-xs font-bold text-slate-500 uppercase">Servidor</span>
                          <span className="text-xs font-black text-blue-600 uppercase">{selectedClient.serverId || 'N/D'}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-slate-50">
                          <span className="text-xs font-bold text-slate-500 uppercase">Data Cadastro</span>
                          <span className="text-xs font-black text-slate-900 uppercase">
                            {new Date(selectedClient.createdAt).toLocaleString('pt-BR')}
                          </span>
                        </div>
                      </div>
                    </section>

                    <section className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                      <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Globe className="w-3 h-3" /> Rotas Contratadas
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedClient.contractedRoutes.map(route => (
                          <span key={route} className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-xl text-[10px] font-black uppercase border border-blue-100">
                            {route}
                          </span>
                        ))}
                      </div>
                    </section>

                    <section className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                      <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <DollarSign className="w-3 h-3" /> Tarifação & Cobrança
                      </h3>
                      <div className="space-y-4">
                        <div className="p-4 bg-slate-50 rounded-2xl">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Valores Detalhados</p>
                          <p className="text-sm font-bold text-slate-700 whitespace-pre-wrap">{selectedClient.rates || 'Não informado'}</p>
                        </div>
                        <div className="flex justify-between items-center py-2">
                          <span className="text-xs font-bold text-slate-500 uppercase">Tipo de Cobrança</span>
                          <span className="px-3 py-1 bg-blue-600 text-white rounded-lg text-[10px] font-black uppercase tracking-wider">
                            {selectedClient.billingType}
                          </span>
                        </div>
                      </div>
                    </section>
                  </div>

                  {/* Right Column: Technical & Notes */}
                  <div className="space-y-8">
                    <section className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                      <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <ShieldCheck className="w-3 h-3" /> Configurações Técnicas
                      </h3>
                      <div className="space-y-4">
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">IPs de Liberação</p>
                          <div className="p-4 bg-slate-900 rounded-2xl">
                            <code className="text-xs font-mono text-emerald-400 break-all">{selectedClient.ips || 'Nenhum IP informado'}</code>
                          </div>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-slate-50">
                          <span className="text-xs font-bold text-slate-500 uppercase">Canais Aproximados</span>
                          <span className="text-xs font-black text-slate-900 uppercase">{selectedClient.approxChannels || '0'}</span>
                        </div>
                      </div>
                    </section>

                    <section className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                      <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <FileText className="w-3 h-3" /> Observações Adicionais
                      </h3>
                      <div className="p-4 bg-amber-50/50 border border-amber-100 rounded-2xl min-h-[120px]">
                        <p className="text-sm font-medium text-slate-700 italic">
                          {selectedClient.additionalInfo || 'Nenhuma observação adicional registrada para este fechamento.'}
                        </p>
                      </div>
                    </section>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="bg-white px-8 py-6 border-t border-slate-200 flex justify-end shrink-0">
                <button 
                  onClick={() => setSelectedClient(null)}
                  className="px-8 py-3 bg-slate-900 text-white text-xs font-black uppercase tracking-widest rounded-2xl hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
                >
                  Fechar Visualização
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function X({ className }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
    </svg>
  );
}
