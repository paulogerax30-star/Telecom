import React, { useState } from 'react';
import { Settings as SettingsIcon, Plus, Trash2, Save, Globe, Shield, Bell, Database } from 'lucide-react';
import { RouteCategory } from '../types';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

import UsersManager from './UsersManager';

interface SettingsProps {
  categories: RouteCategory[];
  onAddCategory: (category: string) => void;
  onRemoveCategory: (category: string) => void;
}

export default function Settings({ categories, onAddCategory, onRemoveCategory }: SettingsProps) {
  const [newCategory, setNewCategory] = useState('');
  const [activeTab, setActiveTab] = useState<'categories' | 'general' | 'security' | 'notifications'>('categories');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (newCategory.trim()) {
      onAddCategory(newCategory.trim());
      setNewCategory('');
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-600/20">
          <SettingsIcon className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight uppercase">Configurações</h2>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Gerencie as preferências e parâmetros operacionais do sistema.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Sidebar Settings Navigation */}
        <div className="space-y-2">
          {[
            { id: 'general', label: 'Geral', icon: Globe },
            { id: 'categories', label: 'Categorias', icon: Database },
            { id: 'security', label: 'Segurança & RBAC', icon: Shield },
            { id: 'notifications', label: 'Notificações', icon: Bell },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all",
                activeTab === item.id 
                  ? "bg-slate-900 text-white shadow-xl shadow-slate-200" 
                  : "text-slate-400 hover:bg-slate-50 hover:text-slate-600"
              )}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </button>
          ))}
        </div>

        {/* Settings Content */}
        <div className="md:col-span-3">
          <AnimatePresence mode="wait">
            {activeTab === 'categories' && (
              <motion.div
                key="categories"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-6"
              >
                {/* Categories Management */}
                <section className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm space-y-8">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-slate-800 uppercase tracking-tight">Gerenciar Categorias</h3>
                      <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Defina as classificações de rotas</p>
                    </div>
                    <span className="px-4 py-2 bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-widest rounded-xl border border-blue-100">
                      {categories.length} Categorias
                    </span>
                  </div>

                  <form onSubmit={handleAdd} className="flex gap-3">
                    <input
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      placeholder="Nova categoria (ex: Rota Internacional)"
                      className="flex-1 px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                    />
                    <button
                      type="submit"
                      className="px-8 py-4 bg-blue-600 text-white font-black uppercase tracking-widest rounded-2xl hover:bg-blue-700 shadow-xl shadow-blue-600/20 transition-all flex items-center gap-2 text-xs"
                    >
                      <Plus className="w-5 h-5" />
                      Adicionar
                    </button>
                  </form>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {categories.map((cat) => (
                      <div key={cat} className="group flex items-center justify-between p-5 bg-slate-50 rounded-2xl border border-slate-100 hover:border-blue-200 hover:bg-white transition-all">
                        <span className="text-sm font-black text-slate-700 uppercase tracking-tight">{cat}</span>
                        <button
                          onClick={() => onRemoveCategory(cat)}
                          className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </section>
              </motion.div>
            )}

            {activeTab === 'security' && (
              <motion.div
                key="security"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
              >
                <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm">
                  <UsersManager />
                </div>
              </motion.div>
            )}

            {(activeTab === 'general' || activeTab === 'notifications') && (
              <motion.div
                key="other"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
              >
                <section className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm space-y-8">
                  <h3 className="text-lg font-bold text-slate-800 uppercase tracking-tight">Preferências Adicionais</h3>
                  <div className="py-20 text-center">
                    <p className="text-xs font-black text-slate-300 uppercase tracking-widest italic">Módulo em desenvolvimento</p>
                  </div>
                </section>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
