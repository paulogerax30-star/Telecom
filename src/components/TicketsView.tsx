import React, { useState, useMemo } from 'react';
import { 
  Ticket as TicketIcon, 
  Plus, 
  Search, 
  Filter, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  MoreVertical, 
  ExternalLink, 
  Image as ImageIcon,
  MessageSquare,
  ChevronRight,
  X,
  Calendar,
  Building2,
  Tag
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { Ticket, TicketStatus } from '../types';
import { toast } from 'sonner';

const INITIAL_TICKETS: Ticket[] = [];

const SUPPLIERS = ['DATORA', 'CELL', 'AGITEL', 'MATRIX', 'NEWVOICE', 'SIP200', 'TENTEC', 'AE', '4PS', 'NETVOIP', 'BFT', 'GOSAT', 'ATOM'];

export default function TicketsView({ 
  tickets, 
  onAddTicket, 
  onUpdateTicket 
}: { 
  tickets: Ticket[], 
  onAddTicket: (t: Ticket) => void, 
  onUpdateTicket: (t: Ticket) => void 
}) {
  const [activeSupplier, setActiveSupplier] = useState('DATORA');
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddingTicket, setIsAddingTicket] = useState(false);

  const [newTicket, setNewTicket] = useState<Partial<Ticket>>({
    status: 'ABERTO',
    date: new Date().toISOString(),
    supplier: activeSupplier
  });

  const filteredTickets = useMemo(() => {
    return tickets.filter(t => 
      t.supplier === activeSupplier &&
      (t.reason.toLowerCase().includes(searchTerm.toLowerCase()) || 
       t.routeType.toLowerCase().includes(searchTerm.toLowerCase()) ||
       t.id.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [tickets, activeSupplier, searchTerm]);

  const handleAddTicket = () => {
    if (!newTicket.routeType || !newTicket.reason) {
      toast.error('Preencha os campos obrigatórios (Tipo de Rota e Motivo)');
      return;
    }

    const ticket: Ticket = {
      id: `T-${Math.floor(1000 + Math.random() * 9000)}`,
      date: newTicket.date || new Date().toISOString(),
      routeType: newTicket.routeType,
      reason: newTicket.reason,
      status: newTicket.status as TicketStatus,
      observations: newTicket.observations || '',
      supplier: activeSupplier,
      print: newTicket.print
    };

    onAddTicket(ticket);
    setIsAddingTicket(false);
    setNewTicket({ status: 'ABERTO', date: new Date().toISOString(), supplier: activeSupplier });
    toast.success('Chamado aberto com sucesso!');
  };

  const handleUpdateStatus = (id: string, newStatus: TicketStatus) => {
    const ticket = tickets.find(t => t.id === id);
    if (ticket) {
      onUpdateTicket({ ...ticket, status: newStatus });
      toast.success(`Status do chamado atualizado para ${newStatus}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Supplier Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 custom-scrollbar">
        {SUPPLIERS.map(supplier => (
          <button
            key={supplier}
            onClick={() => setActiveSupplier(supplier)}
            className={cn(
              "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shrink-0 border",
              activeSupplier === supplier 
                ? "bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-200" 
                : "bg-white text-slate-400 border-slate-200 hover:border-slate-300 hover:text-slate-600"
            )}
          >
            {supplier}
          </button>
        ))}
      </div>

      {/* Header & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
            <TicketIcon className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Gestão de Chamados</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Fornecedor: {activeSupplier}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative group">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
            <input 
              type="text" 
              placeholder="Buscar chamados..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500/20 outline-none w-64 font-bold"
            />
          </div>
          <button 
            onClick={() => setIsAddingTicket(true)}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
          >
            <Plus className="w-4 h-4" />
            Novo Chamado
          </button>
        </div>
      </div>

      {/* Tickets List */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Data / Hora</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Tipo de Rota</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Motivo</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Observações</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              <AnimatePresence mode="popLayout">
                {filteredTickets.length > 0 ? (
                  filteredTickets.map((ticket) => (
                    <motion.tr 
                      key={ticket.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="hover:bg-slate-50/50 transition-colors group"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span className="text-[11px] font-bold text-slate-600">
                            {new Date(ticket.date).toLocaleString('pt-BR')}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded-lg text-[10px] font-black uppercase tracking-wider border border-slate-200">
                          {ticket.routeType}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-xs font-bold text-slate-800">{ticket.reason}</p>
                      </td>
                      <td className="px-6 py-4">
                        <select
                          value={ticket.status}
                          onChange={(e) => handleUpdateStatus(ticket.id, e.target.value as TicketStatus)}
                          className={cn(
                            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border-none cursor-pointer outline-none transition-all",
                            ticket.status === 'FINALIZADO' ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200" : 
                            ticket.status === 'VERIFICADO' ? "bg-blue-100 text-blue-700 hover:bg-blue-200" :
                            "bg-amber-100 text-amber-700 hover:bg-amber-200"
                          )}
                        >
                          <option value="ABERTO">ABERTO</option>
                          <option value="VERIFICADO">VERIFICADO</option>
                          <option value="FINALIZADO">FINALIZADO</option>
                        </select>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-[11px] text-slate-500 font-medium max-w-xs truncate" title={ticket.observations}>
                          {ticket.observations}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </td>
                    </motion.tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300">
                          <TicketIcon className="w-6 h-6" />
                        </div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nenhum chamado encontrado para {activeSupplier}</p>
                      </div>
                    </td>
                  </tr>
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Ticket Modal */}
      <AnimatePresence>
        {isAddingTicket && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white">
                    <Plus className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Abrir Novo Chamado</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Destino: {activeSupplier}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsAddingTicket(false)}
                  className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-8 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tipo de Rota</label>
                    <div className="relative">
                      <Tag className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input 
                        type="text" 
                        placeholder="Ex: ITX, US, B|VERIFICADA"
                        value={newTicket.routeType || ''}
                        onChange={(e) => setNewTicket(prev => ({ ...prev, routeType: e.target.value }))}
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-500/20 outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Status Inicial</label>
                    <select 
                      value={newTicket.status}
                      onChange={(e) => setNewTicket(prev => ({ ...prev, status: e.target.value as TicketStatus }))}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-500/20 outline-none"
                    >
                      <option value="ABERTO">ABERTO</option>
                      <option value="VERIFICADO">VERIFICADO</option>
                      <option value="FINALIZADO">FINALIZADO</option>
                    </select>
                  </div>

                  <div className="md:col-span-2 space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Motivo / Erro</label>
                    <div className="relative">
                      <AlertCircle className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input 
                        type="text" 
                        placeholder="Ex: erro na comunicacao sip, audio estranho..."
                        value={newTicket.reason || ''}
                        onChange={(e) => setNewTicket(prev => ({ ...prev, reason: e.target.value }))}
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-500/20 outline-none"
                      />
                    </div>
                  </div>

                  <div className="md:col-span-2 space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Observações Técnicas</label>
                    <textarea 
                      placeholder="Detalhes adicionais sobre o problema..."
                      rows={3}
                      value={newTicket.observations || ''}
                      onChange={(e) => setNewTicket(prev => ({ ...prev, observations: e.target.value }))}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-500/20 outline-none resize-none"
                    />
                  </div>
                </div>
              </div>

              <div className="p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
                <button 
                  onClick={() => setIsAddingTicket(false)}
                  className="px-6 py-3 text-slate-500 font-black text-[10px] uppercase tracking-widest hover:bg-slate-100 rounded-xl transition-all"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleAddTicket}
                  className="px-8 py-3 bg-blue-600 text-white font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
                >
                  Abrir Chamado
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
