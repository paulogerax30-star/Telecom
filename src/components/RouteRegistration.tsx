import React, { useState, useEffect, useMemo } from 'react';
import { 
  Save, X, Info, AlertCircle, Check, Database, Activity, 
  CheckCircle, Edit, Trash2, Search, ChevronDown, 
  Tag, DollarSign, Layers, PlusCircle, RefreshCw, Filter,
  User, Shield, Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { Route, RouteCategory, RouteStatus, BinaType } from '../types';
import { cn } from '../lib/utils';

interface RouteRegistrationProps {
  onAdd: (route: Route) => void;
  onUpdate: (route: Route) => void;
  onDelete: (id: string) => void;
  onEdit: (route: Route) => void;
  editingRoute: Route | null;
  routes: Route[];
  models: string[];
  onAddModel: (model: string) => void;
  searchTerm: string;
  onSearchChange: (value: string) => void;
}

const BINA_TYPES: BinaType[] = ['CLI Aberta', 'Fixa', 'Móvel', 'Mista', 'Sem Spam'];
const CATEGORIES: RouteCategory[] = ['Móvel-Móvel', 'Fixo-Fixo', 'Fixo-Móvel', 'Internacional'];
const STATUSES: RouteStatus[] = ['Ativa', 'Inativa', 'Teste'];

export default function RouteRegistration({ 
  onAdd, 
  onUpdate, 
  onDelete, 
  onEdit, 
  editingRoute, 
  routes, 
  models,
  onAddModel,
  searchTerm,
  onSearchChange
}: RouteRegistrationProps) {
  const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);
  const [typeSearch, setTypeSearch] = useState('');

  const filteredModels = useMemo(() => {
    return models.filter(m => m.toLowerCase().includes(typeSearch.toLowerCase()));
  }, [models, typeSearch]);

  const initialFormState: Partial<Route> = {
    name: '',
    routeType: '',
    provider: '',
    binaType: 'Sem Spam',
    category: 'Móvel-Móvel',
    rate: 0,
    cost: 0,
    status: 'Teste',
    observations: '',
    asr: 0,
    acd: 0,
    pdd: 0,
    totalCalls: 0,
    answeredCalls: 0,
    revenue: 0,
    totalCost: 0,
    profit: 0
  };

  const [formData, setFormData] = useState<Partial<Route>>(initialFormState);
  const [routeToDelete, setRouteToDelete] = useState<Route | null>(null);

  const filteredRoutes = useMemo(() => {
    const search = searchTerm.toLowerCase();
    return routes.filter(route => 
      route.name.toLowerCase().includes(search) || 
      route.provider.toLowerCase().includes(search) ||
      route.routeType.toLowerCase().includes(search)
    );
  }, [routes, searchTerm]);

  useEffect(() => {
    if (editingRoute) {
      setFormData(editingRoute);
    } else {
      setFormData(initialFormState);
    }
  }, [editingRoute]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name || !formData.routeType || !formData.provider) {
      toast.error("Preencha todos os campos obrigatórios!");
      return;
    }

    // Duplicate check
    const isDuplicate = routes.some(r => r.name.toLowerCase() === formData.name?.toLowerCase() && r.id !== editingRoute?.id);
    if (isDuplicate) {
      toast.error("Já existe uma rota com este nome!");
      return;
    }

    const now = new Date().toISOString();
    
    if (editingRoute) {
      onUpdate({
        ...editingRoute,
        ...formData,
      } as Route);
      toast.success("Rota atualizada com sucesso!");
    } else {
      onAdd({
        ...formData,
        id: Math.random().toString(36).substr(2, 9),
        createdAt: now,
      } as Route);
      toast.success("Rota cadastrada com sucesso!");
    }
    
    setFormData(initialFormState);
    if (editingRoute) onEdit(null as any);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const val = type === 'number' ? parseFloat(value) : value;
    setFormData(prev => ({ ...prev, [name]: val }));
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/50"
      >
        <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/20">
              <PlusCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 uppercase tracking-tight">
                {editingRoute ? 'Editar Rota' : 'Criar Rota'}
              </h3>
              <p className="text-xs text-slate-500 font-medium">Configure os parâmetros técnicos e comerciais da rota.</p>
            </div>
          </div>
          {editingRoute && (
            <button 
              onClick={() => onEdit(null as any)}
              className="px-4 py-1.5 bg-rose-50 text-rose-600 text-xs font-bold rounded-full border border-rose-100 flex items-center gap-2"
            >
              <X className="w-3 h-3" />
              CANCELAR EDIÇÃO
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Nome da Rota */}
            <div className="md:col-span-4 space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Tag className="w-3 h-3" /> Nome da Rota *
              </label>
              <input
                required
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Ex: TIM_SP_MOBILE"
                className="w-full px-4 py-2.5 rounded-xl border-2 border-slate-100 bg-slate-50/30 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none text-slate-800 font-bold text-sm"
              />
            </div>

            {/* Tipo de Rota (Dynamic Dropdown) */}
            <div className="md:col-span-4 space-y-2 relative">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Layers className="w-3 h-3" /> Tipo de Rota *
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsTypeDropdownOpen(!isTypeDropdownOpen)}
                  className={cn(
                    "w-full px-4 py-2.5 rounded-xl border-2 transition-all flex items-center justify-between outline-none font-bold text-sm",
                    isTypeDropdownOpen 
                      ? "border-blue-500 ring-4 ring-blue-500/10 bg-white" 
                      : "border-slate-100 bg-slate-50/30 hover:border-slate-200 text-slate-800"
                  )}
                >
                  <span className="truncate">{formData.routeType || 'Selecione ou crie um tipo'}</span>
                  <ChevronDown className={cn("w-4 h-4 text-slate-400 transition-transform duration-300", isTypeDropdownOpen && "rotate-180")} />
                </button>

                <AnimatePresence>
                  {isTypeDropdownOpen && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute z-50 top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden"
                    >
                      <div className="p-2 border-b border-slate-100 bg-slate-50/50">
                        <div className="relative">
                          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input
                            type="text"
                            placeholder="Pesquisar ou criar..."
                            value={typeSearch}
                            onChange={(e) => setTypeSearch(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                            onClick={(e) => e.stopPropagation()}
                            autoFocus
                          />
                        </div>
                      </div>
                      <div className="max-h-60 overflow-y-auto p-1.5 custom-scrollbar">
                        {filteredModels.map((mod) => (
                          <button
                            key={mod}
                            type="button"
                            onClick={() => {
                              setFormData(prev => ({ ...prev, routeType: mod }));
                              setIsTypeDropdownOpen(false);
                              setTypeSearch('');
                            }}
                            className={cn(
                              "w-full text-left px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-between group mb-0.5",
                              formData.routeType === mod 
                                ? "bg-blue-600 text-white shadow-md shadow-blue-600/20" 
                                : "hover:bg-slate-50 text-slate-700 hover:text-blue-600"
                            )}
                          >
                            {mod}
                            {formData.routeType === mod && <Check className="w-3 h-3" />}
                          </button>
                        ))}
                        {typeSearch && !models.includes(typeSearch) && (
                          <button
                            type="button"
                            onClick={() => {
                              onAddModel(typeSearch);
                              setFormData(prev => ({ ...prev, routeType: typeSearch }));
                              setIsTypeDropdownOpen(false);
                              setTypeSearch('');
                              toast.success(`Novo tipo "${typeSearch}" adicionado!`);
                            }}
                            className="w-full text-left px-3 py-3 rounded-lg text-xs font-bold text-blue-600 hover:bg-blue-50 transition-all flex items-center gap-2 border border-dashed border-blue-200 mt-1"
                          >
                            <PlusCircle className="w-3.5 h-3.5" />
                            Adicionar "{typeSearch}"
                          </button>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Operadora */}
            <div className="md:col-span-4 space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Zap className="w-3 h-3" /> Operadora *
              </label>
              <input
                required
                name="provider"
                value={formData.provider}
                onChange={handleChange}
                placeholder="Ex: TIM, VIVO, CLARO"
                className="w-full px-4 py-2.5 rounded-xl border-2 border-slate-100 bg-slate-50/30 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none text-slate-800 font-bold text-sm"
              />
            </div>

            {/* Tipo de Bina */}
            <div className="md:col-span-3 space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Shield className="w-3 h-3" /> Tipo de Bina
              </label>
              <select
                name="binaType"
                value={formData.binaType}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl border-2 border-slate-100 bg-slate-50/30 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none text-slate-800 font-bold text-sm appearance-none"
              >
                {BINA_TYPES.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            {/* Categoria */}
            <div className="md:col-span-3 space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Filter className="w-3 h-3" /> Categoria
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl border-2 border-slate-100 bg-slate-50/30 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none text-slate-800 font-bold text-sm appearance-none"
              >
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Tarifa */}
            <div className="md:col-span-2 space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <DollarSign className="w-3 h-3" /> Tarifa (R$/min)
              </label>
              <input
                type="number"
                step="0.0001"
                name="rate"
                value={formData.rate}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl border-2 border-slate-100 bg-slate-50/30 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none text-slate-800 font-bold text-sm"
              />
            </div>

            {/* Custo */}
            <div className="md:col-span-2 space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <DollarSign className="w-3 h-3" /> Custo (R$/min)
              </label>
              <input
                type="number"
                step="0.0001"
                name="cost"
                value={formData.cost}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl border-2 border-slate-100 bg-slate-50/30 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none text-slate-800 font-bold text-sm"
              />
            </div>

            {/* Status */}
            <div className="md:col-span-3 space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Activity className="w-3 h-3" /> Status
              </label>
              <div className="flex p-1 bg-slate-100 rounded-xl">
                {STATUSES.map(status => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, status }))}
                    className={cn(
                      "flex-1 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all",
                      formData.status === status 
                        ? (status === 'Ativa' ? "bg-emerald-500 text-white" : 
                           status === 'Inativa' ? "bg-rose-500 text-white" : "bg-amber-500 text-white")
                        : "text-slate-500 hover:text-slate-700"
                    )}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>

            {/* Observações */}
            <div className="md:col-span-9 space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Info className="w-3 h-3" /> Observações
              </label>
              <textarea
                name="observations"
                value={formData.observations}
                onChange={handleChange}
                rows={2}
                className="w-full px-4 py-2.5 rounded-xl border-2 border-slate-100 bg-slate-50/30 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none text-slate-800 font-medium text-sm resize-none"
              />
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 flex items-center justify-end gap-4">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              className="px-10 py-4 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-700 shadow-xl shadow-blue-600/20 transition-all flex items-center gap-3 text-sm uppercase tracking-widest"
            >
              <Save className="w-5 h-5" />
              {editingRoute ? 'Atualizar Rota' : 'Salvar Rota'}
            </motion.button>
          </div>
        </form>
      </motion.div>

      {/* Quick Search for existing routes */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-6">
        <div className="flex-1 relative">
          <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Buscar por nome, operadora ou tipo..." 
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold"
          />
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
          <Database className="w-4 h-4" />
          <span className="text-xs font-black uppercase tracking-wider">{routes.length} Rotas</span>
        </div>
      </div>

      {/* Routes List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRoutes.map((route) => (
          <div key={route.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:border-blue-300 transition-all group relative overflow-hidden">
            <div className={cn(
              "absolute top-0 left-0 w-1.5 h-full",
              route.status === 'Ativa' ? "bg-emerald-500" : 
              route.status === 'Inativa' ? "bg-rose-500" : "bg-amber-500"
            )} />
            
            <div className="flex items-start justify-between mb-4">
              <div>
                <h4 className="font-black text-slate-800 text-base leading-tight mb-1">{route.name}</h4>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-[10px] font-black uppercase tracking-wider">{route.routeType}</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">{route.provider}</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-black text-blue-600">R$ {route.rate.toFixed(4)}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Tarifa/min</p>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={cn(
                  "w-2 h-2 rounded-full",
                  route.status === 'Ativa' ? "bg-emerald-500 animate-pulse" : 
                  route.status === 'Inativa' ? "bg-rose-500" : "bg-amber-500"
                )} />
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{route.status}</span>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => onEdit(route)}
                  className="p-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setRouteToDelete(route)}
                  className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Delete Confirmation Modal */}
      {routeToDelete && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-8 text-center">
              <div className="w-20 h-20 bg-rose-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <AlertCircle className="w-10 h-10 text-rose-600" />
              </div>
              <h3 className="text-2xl font-black text-slate-800 mb-2 uppercase tracking-tight">Excluir Rota?</h3>
              <p className="text-slate-500 font-medium">
                Tem certeza que deseja excluir a rota <span className="font-bold text-slate-800">{routeToDelete.name}</span>? 
                Esta ação é irreversível.
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
                className="flex-1 px-6 py-3 bg-rose-600 text-white font-black uppercase tracking-widest hover:bg-rose-700 rounded-2xl transition-colors text-xs shadow-lg shadow-rose-200"
              >
                Confirmar Exclusão
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
