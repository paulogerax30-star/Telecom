import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { UserPermissions } from '../types';
import { Shield, ShieldAlert, Loader2, User as UserIcon, Check, X, UserPlus } from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import { cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';

export default function UsersManager() {
  const { user: currentUser, isMaster } = useAuth();
  const [users, setUsers] = useState<UserPermissions[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  
  // Form state for new user
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPermissions, setNewPermissions] = useState({
    can_view_finance: false,
    can_manage_routes: false,
    can_view_sellers: false,
    can_manage_tickets: false
  });

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('user_permissions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error: any) {
      toast.error('Erro ao carregar usuários: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isMaster) return;
    
    setUpdating('creating');
    try {
      const email = `${newUsername.toLowerCase().trim()}@gerax.local`;
      
      // 1. Create Auth User
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password: newPassword,
        options: {
          data: { username: newUsername }
        }
      });

      if (authError) throw authError;

      if (authData.user) {
        // 2. Update Permissions (The trigger handles the insert, we just update)
        // Wait a bit for the trigger to fire
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const { error: permError } = await supabase
          .from('user_permissions')
          .update({
            ...newPermissions,
            username: newUsername
          })
          .eq('user_id', authData.user.id);

        if (permError) throw permError;

        toast.success('Usuário criado com sucesso!');
        setNewUsername('');
        setNewPassword('');
        setNewPermissions({
          can_view_finance: false,
          can_manage_routes: false,
          can_view_sellers: false,
          can_manage_tickets: false
        });
        fetchUsers();
      }
    } catch (error: any) {
      toast.error('Erro ao criar usuário: ' + error.message);
    } finally {
      setUpdating(null);
    }
  };

  const togglePermission = async (userId: string, field: keyof UserPermissions, currentValue: any) => {
    if (!isMaster) return;
    setUpdating(`${userId}-${field}`);
    try {
      const { error } = await supabase
        .from('user_permissions')
        .update({ [field]: !currentValue })
        .eq('user_id', userId);

      if (error) throw error;
      
      setUsers(prev => prev.map(u => 
        u.user_id === userId ? { ...u, [field]: !currentValue } : u
      ));
      
      toast.success('Permissão atualizada!');
    } catch (error: any) {
      toast.error('Erro ao atualizar: ' + error.message);
    } finally {
      setUpdating(null);
    }
  };

  const changeRole = async (userId: string, currentRole: string) => {
    if (!isMaster) return;
    const newRole = currentRole === 'MASTER' ? 'USER' : 'MASTER';
    setUpdating(`${userId}-role`);
    try {
      const { error } = await supabase
        .from('user_permissions')
        .update({ role: newRole })
        .eq('user_id', userId);

      if (error) throw error;
      
      setUsers(prev => prev.map(u => 
        u.user_id === userId ? { ...u, role: newRole as any } : u
      ));
      
      toast.success(`Usuário agora é ${newRole}`);
    } catch (error: any) {
      toast.error('Erro ao mudar cargo: ' + error.message);
    } finally {
      setUpdating(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        <p className="text-slate-500 font-medium">Carregando usuários e permissões...</p>
      </div>
    );
  }

  // Only the Master 'pauloricardo' can manage users
  // We check the username from permissions or the email suffix
  const isAbsoluteMaster = currentUser?.email === 'pauloricardo@gerax.local' || isMaster;

  if (!isAbsoluteMaster) {
    return (
      <div className="py-12 text-center">
        <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto mb-4" />
        <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Acesso Restrito</h3>
        <p className="text-slate-500">Apenas o administrador Master pode gerenciar contas.</p>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      {/* Create New User Section */}
      <section className="bg-slate-50 p-8 rounded-[32px] border border-slate-200 space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
            <UserPlus className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Novo Funcionário</h3>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Registre um novo acesso ao terminal</p>
          </div>
        </div>

        <form onSubmit={handleCreateUser} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Login (Username)</label>
              <input 
                value={newUsername}
                onChange={e => setNewUsername(e.target.value.toLowerCase())}
                placeholder="ex: joao.silva"
                className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl font-bold outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Senha Inicial</label>
              <input 
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl font-bold outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
                required
              />
            </div>
          </div>

          <div className="space-y-6">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Permissões de Módulo</label>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Finanças', field: 'can_view_finance' },
                { label: 'Rotas', field: 'can_manage_routes' },
                { label: 'Vendedores', field: 'can_view_sellers' },
                { label: 'Suporte', field: 'can_manage_tickets' },
              ].map(p => (
                <button
                  key={p.field}
                  type="button"
                  onClick={() => setNewPermissions(prev => ({ ...prev, [p.field]: !prev[p.field as keyof typeof prev] }))}
                  className={cn(
                    "flex items-center justify-between p-4 rounded-2xl border transition-all",
                    newPermissions[p.field as keyof typeof newPermissions] 
                      ? "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-200" 
                      : "bg-white border-slate-200 text-slate-400"
                  )}
                >
                  <span className="text-[10px] font-black uppercase tracking-widest">{p.label}</span>
                  {newPermissions[p.field as keyof typeof newPermissions] ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                </button>
              ))}
            </div>
            <button
              type="submit"
              disabled={updating === 'creating'}
              className="w-full py-4 bg-slate-900 text-white font-black uppercase tracking-widest rounded-2xl hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 disabled:opacity-50"
            >
              {updating === 'creating' ? 'Criando...' : 'Finalizar Cadastro'}
            </button>
          </div>
        </form>
      </section>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800 tracking-tight uppercase">Usuários Ativos</h3>
              <p className="text-xs text-slate-500 font-medium">Controle granular de acessos ao sistema.</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {users.map((user) => (
            <motion.div 
              key={user.user_id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white p-6 rounded-[24px] border border-slate-200 shadow-sm hover:shadow-md transition-all group"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg transition-all",
                    user.role === 'MASTER' ? "bg-slate-900 shadow-slate-200" : "bg-slate-100 text-slate-400 shadow-transparent"
                  )}>
                    {user.role === 'MASTER' ? <ShieldAlert className="w-6 h-6" /> : <UserIcon className="w-6 h-6" />}
                  </div>
                  <div>
                    <h4 className="font-black text-slate-900 uppercase tracking-tight text-sm">
                      {user.username || user.user_id.substring(0, 8)}
                    </h4>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      {user.role === 'MASTER' ? 'Acesso Total (Master)' : 'Usuário Padrão'}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 md:gap-8">
                  {/* Role Toggle */}
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Role Master</span>
                    <button 
                      onClick={() => changeRole(user.user_id, user.role)}
                      disabled={updating === `${user.user_id}-role`}
                      className={cn(
                        "w-12 h-6 rounded-full transition-all relative",
                        user.role === 'MASTER' ? "bg-slate-900" : "bg-slate-200"
                      )}
                    >
                      <div className={cn(
                        "absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all",
                        user.role === 'MASTER' ? "right-1" : "left-1"
                      )} />
                    </button>
                  </div>

                  <div className="h-8 w-px bg-slate-100 hidden md:block"></div>

                  {/* Permissions Toggles */}
                  {[
                    { label: 'Financeiro', field: 'can_view_finance' as const },
                    { label: 'Rotas', field: 'can_manage_routes' as const },
                    { label: 'Vendedores', field: 'can_view_sellers' as const },
                    { label: 'Suporte', field: 'can_manage_tickets' as const },
                  ].map((perm) => (
                    <div key={perm.field} className="flex flex-col items-center gap-2">
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{perm.label}</span>
                      <button 
                        disabled={user.role === 'MASTER' || updating === `${user.user_id}-${perm.field}`}
                        onClick={() => togglePermission(user.user_id, perm.field, user[perm.field])}
                        className={cn(
                          "w-10 h-5 rounded-full transition-all relative flex items-center",
                          user.role === 'MASTER' ? "bg-blue-100 cursor-not-allowed" : 
                          user[perm.field] ? "bg-blue-600" : "bg-slate-200"
                        )}
                      >
                        <div className={cn(
                          "absolute w-3 h-3 bg-white rounded-full shadow-sm transition-all",
                          user.role === 'MASTER' || user[perm.field] ? "right-1" : "left-1"
                        )} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
