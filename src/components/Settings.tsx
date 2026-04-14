import React, { useState } from 'react';
import { Settings as SettingsIcon, Plus, Trash2, Save, Globe, Shield, Bell, Database } from 'lucide-react';
import { RouteCategory } from '../types';
import { cn } from '../lib/utils';

interface SettingsProps {
  categories: RouteCategory[];
  onAddCategory: (category: string) => void;
  onRemoveCategory: (category: string) => void;
}

export default function Settings({ categories, onAddCategory, onRemoveCategory }: SettingsProps) {
  const [newCategory, setNewCategory] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (newCategory.trim()) {
      onAddCategory(newCategory.trim());
      setNewCategory('');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-600/20">
          <SettingsIcon className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Configurações do Sistema</h2>
          <p className="text-slate-500">Gerencie as preferências e parâmetros operacionais do Telecom Route Manager.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Sidebar Settings Navigation */}
        <div className="space-y-2">
          {[
            { id: 'general', label: 'Geral', icon: Globe },
            { id: 'categories', label: 'Categorias', icon: Database },
            { id: 'security', label: 'Segurança', icon: Shield },
            { id: 'notifications', label: 'Notificações', icon: Bell },
          ].map((item) => (
            <button
              key={item.id}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all",
                item.id === 'categories' 
                  ? "bg-blue-50 text-blue-600 border border-blue-100 shadow-sm" 
                  : "text-slate-500 hover:bg-slate-100 hover:text-slate-700"
              )}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </button>
          ))}
        </div>

        {/* Settings Content */}
        <div className="md:col-span-2 space-y-6">
          {/* Categories Management */}
          <section className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-800">Gerenciar Categorias</h3>
              <span className="px-3 py-1 bg-slate-100 text-slate-500 text-xs font-bold rounded-full">
                {categories.length} Categorias
              </span>
            </div>

            <form onSubmit={handleAdd} className="flex gap-3">
              <input
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="Nova categoria (ex: Rota Internacional)"
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              />
              <button
                type="submit"
                className="px-6 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition-all flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Adicionar
              </button>
            </form>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {categories.map((cat) => (
                <div key={cat} className="group flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-white transition-all">
                  <span className="text-sm font-semibold text-slate-700">{cat}</span>
                  <button
                    onClick={() => onRemoveCategory(cat)}
                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* General Preferences */}
          <section className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <h3 className="text-lg font-bold text-slate-800">Preferências de Exibição</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div>
                  <p className="text-sm font-bold text-slate-800">Modo Escuro</p>
                  <p className="text-xs text-slate-500">Ativar tema escuro para o painel operacional.</p>
                </div>
                <div className="w-12 h-6 bg-slate-200 rounded-full relative cursor-pointer">
                  <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm" />
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div>
                  <p className="text-sm font-bold text-slate-800">Alertas de Análise</p>
                  <p className="text-xs text-slate-500">Notificar quando uma rota exceder 7 dias sem análise.</p>
                </div>
                <div className="w-12 h-6 bg-blue-600 rounded-full relative cursor-pointer">
                  <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm" />
                </div>
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button className="px-8 py-2.5 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-900 transition-all flex items-center gap-2">
                <Save className="w-5 h-5" />
                Salvar Alterações
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
