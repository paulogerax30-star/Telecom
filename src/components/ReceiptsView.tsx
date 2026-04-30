import React, { useState, useMemo } from 'react';
import { 
  LayoutDashboard, 
  AlertCircle, 
  FileText, 
  CheckSquare, 
  History,
  Plus,
  Upload,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Search,
  Filter,
  Download,
  Eye,
  User,
  DollarSign,
  Calendar,
  ArrowRight,
  File,
  Image as ImageIcon
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '../lib/utils';
import { Pendency, Receipt, HistoryEntry, ReceiptStatus, PendencyStatus } from '../types';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie
} from 'recharts';

type TabType = 'dashboard' | 'pendencies' | 'receipts' | 'validation' | 'history';

export default function ReceiptsView({
  pendencies,
  receipts,
  onAddPendency,
  onAddReceipt,
  onUpdateReceipt,
  onUpdatePendency
}: {
  pendencies: Pendency[],
  receipts: Receipt[],
  onAddPendency: (p: Pendency) => void,
  onAddReceipt: (r: Receipt) => void,
  onUpdateReceipt: (r: Receipt) => void,
  onUpdatePendency: (p: Pendency) => void
}) {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  // Form states
  const [showAddPendency, setShowAddPendency] = useState(false);
  const [showAddReceipt, setShowAddReceipt] = useState(false);
  const [selectedPendencyForReceipt, setSelectedPendencyForReceipt] = useState<string | null>(null);

  // Stats for Dashboard
  const stats = useMemo(() => {
    const totalPendencies = pendencies.length;
    const totalReceipts = receipts.length;
    const validated = receipts.filter(r => r.status === 'VALIDATED').length;
    const divergent = receipts.filter(r => r.status === 'DIVERGENT').length;
    const awaiting = receipts.filter(r => r.status === 'PENDING').length;
    
    const valuePending = pendencies
      .filter(p => p.status === 'PENDING')
      .reduce((acc, p) => acc + p.amount, 0);
      
    const valueValidated = receipts
      .filter(r => r.status === 'VALIDATED')
      .reduce((acc, r) => acc + r.amount, 0);

    return {
      totalPendencies,
      totalReceipts,
      validated,
      divergent,
      awaiting,
      valuePending,
      valueValidated
    };
  }, [pendencies, receipts]);

  const addHistory = (action: string, details: string, prev?: string, next?: string) => {
    const entry: HistoryEntry = {
      id: Math.random().toString(36).substr(2, 9),
      userId: 'Admin', // Mock user
      action,
      details,
      previousStatus: prev,
      newStatus: next,
      timestamp: new Date().toISOString()
    };
    setHistory(prevHistory => [entry, ...prevHistory]);
  };

  const handleAddPendency = (amount: number, description: string) => {
    const newPendency: Pendency = {
      id: `P-${Math.random().toString(36).substr(2, 4).toUpperCase()}`,
      amount,
      description,
      createdAt: new Date().toISOString(),
      status: 'PENDING',
      responsibleUser: 'Admin'
    };
    onAddPendency(newPendency);
    addHistory('Criação de Pendência', `Pendência ${newPendency.id} criada no valor de R$ ${amount}`, undefined, 'PENDING');
    setShowAddPendency(false);
  };

  const handleAddReceipt = (amount: number, description: string, file: { url: string, name: string, type: string }, pendencyId?: string) => {
    const newReceipt: Receipt = {
      id: `R-${Math.random().toString(36).substr(2, 4).toUpperCase()}`,
      fileUrl: file.url,
      fileName: file.name,
      fileType: file.type,
      amount,
      date: format(new Date(), 'yyyy-MM-dd'),
      description,
      status: 'PENDING',
      linkedPendencyId: pendencyId,
      createdByUser: 'Admin',
      createdAt: new Date().toISOString()
    };
    onAddReceipt(newReceipt);
    
    if (pendencyId) {
      const pendency = pendencies.find(p => p.id === pendencyId);
      if (pendency) {
        onUpdatePendency({ ...pendency, status: 'LINKED' });
      }
      addHistory('Vínculo de Comprovante', `Comprovante ${newReceipt.id} vinculado à pendência ${pendencyId}`, 'PENDING', 'LINKED');
    } else {
      addHistory('Criação de Comprovante', `Comprovante ${newReceipt.id} criado no valor de R$ ${amount}`, undefined, 'PENDING');
    }
    
    setShowAddReceipt(false);
    setSelectedPendencyForReceipt(null);
  };

  const handleValidation = (receiptId: string, status: ReceiptStatus, observation: string) => {
    const receipt = receipts.find(r => r.id === receiptId);
    if (!receipt) return;

    const prevStatus = receipt.status;
    
    onUpdateReceipt({ ...receipt, status, observation });

    if (receipt.linkedPendencyId) {
      const pendencyStatus: PendencyStatus = status === 'VALIDATED' ? 'VALIDATED' : status === 'REJECTED' ? 'REJECTED' : 'DIVERGENT';
      const pendency = pendencies.find(p => p.id === receipt.linkedPendencyId);
      if (pendency) {
        onUpdatePendency({ ...pendency, status: pendencyStatus, observation });
      }
    }

    addHistory('Validação', `Comprovante ${receiptId} validado como ${status}`, prevStatus, status);
  };

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* Header & Tabs */}
      <div className="bg-white border-b border-slate-200 px-8 pt-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Gestão Financeira</h1>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Controle de Pendências e Comprovantes</p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setShowAddPendency(true)}
              className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
            >
              <Plus className="w-3.5 h-3.5" />
              Nova Pendência
            </button>
            <button 
              onClick={() => setShowAddReceipt(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
            >
              <Upload className="w-3.5 h-3.5" />
              Novo Comprovante
            </button>
          </div>
        </div>

        <div className="flex items-center gap-8">
          <TabButton active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={LayoutDashboard} label="Dashboard" />
          <TabButton active={activeTab === 'pendencies'} onClick={() => setActiveTab('pendencies')} icon={AlertCircle} label="Pendências" />
          <TabButton active={activeTab === 'receipts'} onClick={() => setActiveTab('receipts')} icon={FileText} label="Comprovantes" />
          <TabButton active={activeTab === 'validation'} onClick={() => setActiveTab('validation')} icon={CheckSquare} label="Validação" />
          <TabButton active={activeTab === 'history'} onClick={() => setActiveTab('history')} icon={History} label="Histórico" />
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
        {activeTab === 'dashboard' && <DashboardTab stats={stats} latestReceipts={receipts.slice(0, 5)} />}
        {activeTab === 'pendencies' && (
          <PendenciesTab 
            pendencies={pendencies} 
            onAttach={(id) => {
              setSelectedPendencyForReceipt(id);
              setShowAddReceipt(true);
            }} 
          />
        )}
        {activeTab === 'receipts' && <ReceiptsTab receipts={receipts} />}
        {activeTab === 'validation' && (
          <ValidationTab 
            receipts={receipts.filter(r => r.status === 'PENDING')} 
            pendencies={pendencies}
            onValidate={handleValidation}
          />
        )}
        {activeTab === 'history' && <HistoryTab history={history} />}
      </div>

      {/* Modals */}
      {showAddPendency && (
        <AddPendencyModal 
          onClose={() => setShowAddPendency(false)} 
          onSave={handleAddPendency} 
        />
      )}
      {showAddReceipt && (
        <AddReceiptModal 
          onClose={() => {
            setShowAddReceipt(false);
            setSelectedPendencyForReceipt(null);
          }} 
          onSave={handleAddReceipt}
          linkedPendencyId={selectedPendencyForReceipt}
        />
      )}
    </div>
  );
}

// --- Sub-components ---

function TabButton({ active, onClick, icon: Icon, label }: any) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 pb-4 border-b-2 transition-all relative",
        active ? "border-blue-600 text-blue-600" : "border-transparent text-slate-400 hover:text-slate-600"
      )}
    >
      <Icon className="w-4 h-4" />
      <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
    </button>
  );
}

function DashboardTab({ stats, latestReceipts }: any) {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Pendências" value={stats.totalPendencies} color="slate" />
        <StatCard title="Comprovantes" value={stats.totalReceipts} color="blue" />
        <StatCard title="Validados" value={stats.validated} color="emerald" />
        <StatCard title="Aguardando" value={stats.awaiting} color="amber" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Com Divergência" value={stats.divergent} color="rose" />
        <StatCard title="Valor Pendente" value={`R$ ${stats.valuePending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} color="amber" />
        <StatCard title="Valor Validado" value={`R$ ${stats.valueValidated.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} color="emerald" />
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Últimos Comprovantes Cadastrados</h3>
        </div>
        <div className="divide-y divide-slate-100">
          {latestReceipts.map((r: any) => (
            <div key={r.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400">
                  {r.fileType.startsWith('image/') ? <ImageIcon className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                </div>
                <div>
                  <p className="text-xs font-black text-slate-900">{r.description || r.fileName}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">{format(new Date(r.createdAt), 'dd/MM/yyyy HH:mm')}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-black text-slate-900">R$ {r.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                <StatusBadge status={r.status} />
              </div>
            </div>
          ))}
          {latestReceipts.length === 0 && (
            <div className="p-12 text-center text-slate-400 text-[10px] font-black uppercase tracking-widest">
              Nenhum comprovante cadastrado
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PendenciesTab({ pendencies, onAttach }: any) {
  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in duration-500">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-slate-50/50 border-b border-slate-100">
            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">ID</th>
            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Valor</th>
            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Descrição</th>
            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Responsável</th>
            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {pendencies.map((p: any) => (
            <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
              <td className="px-6 py-4 text-xs font-black text-slate-900">{p.id}</td>
              <td className="px-6 py-4 text-xs font-black text-slate-900">R$ {p.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
              <td className="px-6 py-4">
                <p className="text-xs font-bold text-slate-700">{p.description}</p>
                <p className="text-[9px] text-slate-400 font-bold uppercase">{format(new Date(p.createdAt), 'dd/MM/yyyy')}</p>
              </td>
              <td className="px-6 py-4"><StatusBadge status={p.status} /></td>
              <td className="px-6 py-4 text-xs font-bold text-slate-600">{p.responsibleUser}</td>
              <td className="px-6 py-4 text-right">
                {p.status === 'PENDING' && (
                  <button 
                    onClick={() => onAttach(p.id)}
                    className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all"
                  >
                    Anexar Comprovante
                  </button>
                )}
              </td>
            </tr>
          ))}
          {pendencies.length === 0 && (
            <tr>
              <td colSpan={6} className="px-6 py-20 text-center text-slate-400 text-[10px] font-black uppercase tracking-widest">
                Nenhuma pendência cadastrada
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function ReceiptsTab({ receipts }: any) {
  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in duration-500">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-slate-50/50 border-b border-slate-100">
            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">ID</th>
            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Comprovante</th>
            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Valor</th>
            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Vínculo</th>
            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Usuário</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {receipts.map((r: any) => (
            <tr key={r.id} className="hover:bg-slate-50/50 transition-colors">
              <td className="px-6 py-4 text-xs font-black text-slate-900">{r.id}</td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400">
                    {r.fileType.startsWith('image/') ? <ImageIcon className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-700">{r.description || r.fileName}</p>
                    <p className="text-[9px] text-slate-400 font-bold uppercase">{format(new Date(r.date), 'dd/MM/yyyy')}</p>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 text-xs font-black text-slate-900">R$ {r.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
              <td className="px-6 py-4"><StatusBadge status={r.status} /></td>
              <td className="px-6 py-4 text-xs font-black text-blue-600">{r.linkedPendencyId || '-'}</td>
              <td className="px-6 py-4 text-xs font-bold text-slate-600">{r.createdByUser}</td>
            </tr>
          ))}
          {receipts.length === 0 && (
            <tr>
              <td colSpan={6} className="px-6 py-20 text-center text-slate-400 text-[10px] font-black uppercase tracking-widest">
                Nenhum comprovante cadastrado
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function ValidationTab({ receipts, pendencies, onValidate }: any) {
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);
  const [obs, setObs] = useState('');

  const linkedPendency = useMemo(() => {
    if (!selectedReceipt?.linkedPendencyId) return null;
    return pendencies.find((p: any) => p.id === selectedReceipt.linkedPendencyId);
  }, [selectedReceipt, pendencies]);

  const diff = useMemo(() => {
    if (!selectedReceipt || !linkedPendency) return 0;
    return selectedReceipt.amount - linkedPendency.amount;
  }, [selectedReceipt, linkedPendency]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in duration-500">
      {/* List of pending validations */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[600px]">
        <div className="p-6 border-b border-slate-100">
          <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Aguardando Validação</h3>
        </div>
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 custom-scrollbar">
          {receipts.map((r: any) => (
            <button 
              key={r.id}
              onClick={() => setSelectedReceipt(r)}
              className={cn(
                "w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-all text-left",
                selectedReceipt?.id === r.id ? "bg-blue-50/50 border-l-4 border-blue-600" : "border-l-4 border-transparent"
              )}
            >
              <div>
                <p className="text-xs font-black text-slate-900">{r.id}</p>
                <p className="text-[10px] font-bold text-slate-500 uppercase">{r.description || r.fileName}</p>
              </div>
              <p className="text-xs font-black text-slate-900">R$ {r.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            </button>
          ))}
          {receipts.length === 0 && (
            <div className="p-12 text-center text-slate-400 text-[10px] font-black uppercase tracking-widest">
              Tudo em dia!
            </div>
          )}
        </div>
      </div>

      {/* Validation Area */}
      <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-sm p-8 flex flex-col gap-8">
        {selectedReceipt ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Pendency Info */}
              <div className="space-y-4">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-2">Pendência Vinculada</h4>
                {linkedPendency ? (
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-xs text-slate-500">ID:</span>
                      <span className="text-xs font-black text-slate-900">{linkedPendency.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-slate-500">Valor:</span>
                      <span className="text-sm font-black text-slate-900">R$ {linkedPendency.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">{linkedPendency.description}</p>
                  </div>
                ) : (
                  <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sem pendência vinculada</p>
                  </div>
                )}
              </div>

              {/* Receipt Info */}
              <div className="space-y-4">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-2">Comprovante Anexado</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-xs text-slate-500">ID:</span>
                    <span className="text-xs font-black text-slate-900">{selectedReceipt.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-slate-500">Valor:</span>
                    <span className="text-sm font-black text-slate-900">R$ {selectedReceipt.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="aspect-video bg-slate-100 rounded-2xl overflow-hidden relative group">
                    {selectedReceipt.fileType.startsWith('image/') ? (
                      <img src={selectedReceipt.fileUrl} alt="Receipt" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                        <FileText className="w-10 h-10 text-blue-500" />
                        <span className="text-[10px] font-black text-slate-500 uppercase">{selectedReceipt.fileName}</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button className="px-4 py-2 bg-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg">Visualizar</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Comparison & Actions */}
            <div className="mt-auto space-y-6">
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Diferença de Valores</p>
                  <p className={cn(
                    "text-lg font-black",
                    diff === 0 ? "text-emerald-600" : "text-rose-600"
                  )}>
                    {diff === 0 ? 'Valores Iguais' : `Diferença: R$ ${Math.abs(diff).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                  </p>
                </div>
                {diff !== 0 && <AlertTriangle className="w-6 h-6 text-rose-500 animate-pulse" />}
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Observação da Validação</label>
                <textarea 
                  value={obs}
                  onChange={(e) => setObs(e.target.value)}
                  placeholder="Descreva o motivo da aprovação ou reprovação..."
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all h-24 resize-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <button 
                  onClick={() => {
                    onValidate(selectedReceipt.id, 'VALIDATED', obs);
                    setSelectedReceipt(null);
                    setObs('');
                  }}
                  className="flex items-center justify-center gap-2 py-4 bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Validar
                </button>
                <button 
                  onClick={() => {
                    onValidate(selectedReceipt.id, 'REJECTED', obs);
                    setSelectedReceipt(null);
                    setObs('');
                  }}
                  className="flex items-center justify-center gap-2 py-4 bg-rose-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-700 transition-all shadow-lg shadow-rose-200"
                >
                  <XCircle className="w-4 h-4" />
                  Reprovar
                </button>
                <button 
                  onClick={() => {
                    onValidate(selectedReceipt.id, 'DIVERGENT', obs);
                    setSelectedReceipt(null);
                    setObs('');
                  }}
                  className="flex items-center justify-center gap-2 py-4 bg-amber-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-amber-600 transition-all shadow-lg shadow-amber-200"
                >
                  <AlertTriangle className="w-4 h-4" />
                  Divergente
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center text-slate-400">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
              <CheckSquare className="w-10 h-10 text-slate-200" />
            </div>
            <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight mb-2">Selecione um item</h4>
            <p className="text-[10px] font-bold uppercase tracking-widest max-w-[240px]">Escolha um comprovante na lista ao lado para iniciar a conferência</p>
          </div>
        )}
      </div>
    </div>
  );
}

function HistoryTab({ history }: any) {
  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in duration-500">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-slate-50/50 border-b border-slate-100">
            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Data e Hora</th>
            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Usuário</th>
            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Ação</th>
            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Detalhes</th>
            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {history.map((h: any) => (
            <tr key={h.id} className="hover:bg-slate-50/50 transition-colors">
              <td className="px-6 py-4 text-xs font-bold text-slate-600">{format(new Date(h.timestamp), 'dd/MM/yyyy HH:mm:ss')}</td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-slate-100 rounded-full flex items-center justify-center">
                    <User className="w-3 h-3 text-slate-400" />
                  </div>
                  <span className="text-xs font-black text-slate-900">{h.userId}</span>
                </div>
              </td>
              <td className="px-6 py-4">
                <span className="px-2 py-1 bg-slate-100 text-slate-700 text-[9px] font-black rounded uppercase tracking-widest">{h.action}</span>
              </td>
              <td className="px-6 py-4 text-xs font-bold text-slate-700">{h.details}</td>
              <td className="px-6 py-4">
                {h.previousStatus && (
                  <div className="flex items-center gap-2">
                    <StatusBadge status={h.previousStatus} />
                    <ArrowRight className="w-3 h-3 text-slate-400" />
                    <StatusBadge status={h.newStatus} />
                  </div>
                )}
              </td>
            </tr>
          ))}
          {history.length === 0 && (
            <tr>
              <td colSpan={5} className="px-6 py-20 text-center text-slate-400 text-[10px] font-black uppercase tracking-widest">
                Nenhum histórico registrado
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

// --- Modals & Helpers ---

function AddPendencyModal({ onClose, onSave }: any) {
  const [amount, setAmount] = useState<number>(0);
  const [desc, setDesc] = useState('');

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl animate-in zoom-in duration-300">
        <div className="p-8 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Nova Pendência</h3>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors"><XCircle className="w-5 h-5 text-slate-400" /></button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Valor da Pendência (R$)</label>
              <div className="relative">
                <DollarSign className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="number" 
                  value={amount || ''}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  placeholder="0,00"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-black focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Descrição</label>
              <textarea 
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                placeholder="Motivo da pendência..."
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all h-24 resize-none"
              />
            </div>
          </div>

          <button 
            onClick={() => onSave(amount, desc)}
            disabled={!amount || !desc}
            className="w-full py-4 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 disabled:opacity-50"
          >
            Criar Pendência
          </button>
        </div>
      </div>
    </div>
  );
}

function AddReceiptModal({ onClose, onSave, linkedPendencyId }: any) {
  const [amount, setAmount] = useState<number>(0);
  const [desc, setDesc] = useState('');
  const [file, setFile] = useState<any>(null);

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl animate-in zoom-in duration-300">
        <div className="p-8 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Novo Comprovante</h3>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors"><XCircle className="w-5 h-5 text-slate-400" /></button>
          </div>

          {linkedPendencyId && (
            <div className="p-3 bg-blue-50 rounded-xl border border-blue-100 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-blue-600" />
              <span className="text-[10px] font-black text-blue-700 uppercase tracking-widest">Vinculado à: {linkedPendencyId}</span>
            </div>
          )}

          <div className="space-y-4">
            <div 
              onClick={() => {
                const isPdf = Math.random() > 0.5;
                if (isPdf) {
                  setFile({ url: '#', name: `doc_${Date.now()}.pdf`, type: 'application/pdf' });
                } else {
                  setFile({ url: `https://picsum.photos/seed/${Math.random()}/400/600`, name: `img_${Date.now()}.jpg`, type: 'image/jpeg' });
                }
              }}
              className={cn(
                "w-full aspect-video rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-2 cursor-pointer transition-all overflow-hidden relative",
                file ? "border-emerald-200 bg-emerald-50/30" : "border-slate-200 bg-slate-50 hover:bg-slate-100"
              )}
            >
              {file ? (
                file.type.startsWith('image/') ? (
                  <img src={file.url} alt="Receipt" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <FileText className="w-8 h-8 text-blue-500" />
                    <span className="text-[10px] font-black text-slate-700">{file.name}</span>
                  </div>
                )
              ) : (
                <>
                  <Upload className="w-6 h-6 text-slate-400" />
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Anexar Foto ou PDF</span>
                </>
              )}
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Valor do Comprovante (R$)</label>
              <div className="relative">
                <DollarSign className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="number" 
                  value={amount || ''}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  placeholder="0,00"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-black focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Descrição</label>
              <textarea 
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                placeholder="O que é este comprovante?"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all h-20 resize-none"
              />
            </div>
          </div>

          <button 
            onClick={() => onSave(amount, desc, file, linkedPendencyId)}
            disabled={!amount || !file}
            className="w-full py-4 bg-blue-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 disabled:opacity-50"
          >
            Salvar Comprovante
          </button>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, color }: any) {
  const colors: any = {
    slate: 'bg-slate-50 text-slate-900 border-slate-200',
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    rose: 'bg-rose-50 text-rose-600 border-rose-100'
  };

  return (
    <div className={cn("p-6 rounded-3xl border shadow-sm", colors[color])}>
      <p className="text-[10px] font-black uppercase tracking-widest mb-1 opacity-60">{title}</p>
      <p className="text-2xl font-black tracking-tight">{value}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const configs: any = {
    PENDING: { label: 'Pendente', color: 'bg-amber-100 text-amber-700', icon: Clock },
    LINKED: { label: 'Vinculado', color: 'bg-blue-100 text-blue-700', icon: FileText },
    VALIDATED: { label: 'Validado', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 },
    REJECTED: { label: 'Reprovado', color: 'bg-rose-100 text-rose-700', icon: XCircle },
    DIVERGENT: { label: 'Divergente', color: 'bg-orange-100 text-orange-700', icon: AlertTriangle }
  };

  const config = configs[status] || configs.PENDING;
  const Icon = config.icon;

  return (
    <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest", config.color)}>
      <Icon className="w-3 h-3" />
      {config.label}
    </span>
  );
}
