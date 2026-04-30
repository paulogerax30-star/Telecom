import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { UserPermissions } from '../types';
import { ShieldAlert, Home } from 'lucide-react';
import { motion } from 'motion/react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermission?: keyof Omit<UserPermissions, 'user_id' | 'role' | 'created_at' | 'updated_at'>;
  requireMaster?: boolean;
}

export default function ProtectedRoute({ children, requiredPermission, requireMaster }: ProtectedRouteProps) {
  const { user, isMaster, hasPermission, loading } = useAuth();

  if (loading) return null;

  if (!user) return null; // Should be handled by parent Auth check

  const authorized = isMaster || !requiredPermission || hasPermission(requiredPermission);

  if (!authorized) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="h-full flex flex-col items-center justify-center p-8 text-center"
      >
        <div className="w-24 h-24 bg-rose-50 rounded-[32px] flex items-center justify-center text-rose-500 mb-6 shadow-xl shadow-rose-100">
          <ShieldAlert className="w-12 h-12" />
        </div>
        <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight mb-2">Acesso Negado</h2>
        <p className="text-slate-500 max-w-md font-medium mb-8">
          Você não tem permissão para acessar este módulo. Caso acredite que isso seja um erro, entre em contato com o administrador Master.
        </p>
        <button 
          onClick={() => window.location.href = '/'}
          className="flex items-center gap-2 px-8 py-3 bg-slate-900 text-white font-black uppercase tracking-widest rounded-2xl hover:bg-slate-800 transition-all shadow-lg"
        >
          <Home className="w-4 h-4" />
          Voltar ao Dashboard
        </button>
      </motion.div>
    );
  }

  return <>{children}</>;
}
