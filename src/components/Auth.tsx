import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'motion/react';
import { LogIn, UserPlus, Mail, Lock, Loader2, Eye, EyeOff, CheckCircle2, ShieldCheck, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

type AuthMode = 'signin' | 'signup';

export default function Auth({ onAuthSuccess }: { onAuthSuccess: (user: any) => void }) {
  const [mode, setMode] = useState<AuthMode>('signin');
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const goToSignIn = () => {
    setMode('signin');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
  };

  const goToSignUp = () => {
    setMode('signup');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (mode === 'signup' && password !== confirmPassword) {
      toast.error('As senhas não coincidem!');
      return;
    }

    setLoading(true);

    try {
      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });
        
        if (error) throw error;
        
        if (data.user) {
          if (data.session) {
            toast.success('Conta criada e logada com sucesso!');
            onAuthSuccess(data.user);
          } else {
            toast.info('Conta criada! Verifique seu e-mail para confirmar o cadastro ou tente entrar.');
            goToSignIn();
          }
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            throw new Error('E-mail ou senha incorretos. Verifique se você já criou a conta na aba "Criar Conta".');
          }
          throw error;
        }
        toast.success('Acesso autorizado!');
        if (data.user) onAuthSuccess(data.user);
      }
    } catch (error: any) {
      console.error('Erro de Autenticação:', error);
      const message = error.message || 'Erro ao processar autenticação';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F172A] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
        <div className="absolute -top-[10%] -right-[10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[120px]" />
        <div className="absolute -bottom-[10%] -left-[10%] w-[50%] h-[50%] bg-indigo-600/10 rounded-full blur-[120px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white rounded-[40px] shadow-2xl overflow-hidden border border-slate-100"
      >
        <div className="p-10 bg-gradient-to-br from-blue-600 to-indigo-700 flex flex-col items-center justify-center text-white relative">
          {mode === 'signup' && (
            <button 
              onClick={goToSignIn}
              className="absolute top-6 left-6 flex items-center gap-2 text-white/70 hover:text-white transition-colors text-[10px] font-black uppercase tracking-widest"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar ao Login
            </button>
          )}
          <div className="w-16 h-16 bg-white/20 backdrop-blur-xl rounded-2xl flex items-center justify-center mb-4 shadow-xl">
            {mode === 'signin' ? <ShieldCheck className="w-8 h-8" /> : <UserPlus className="w-8 h-8" />}
          </div>
          <h1 className="text-3xl font-black tracking-tight mb-1">GERAX TELECOM</h1>
          <p className="text-blue-100 text-[10px] font-black uppercase tracking-[0.3em] opacity-70">
            {mode === 'signin' ? 'Terminal de Acesso' : 'Criação de Credenciais'}
          </p>
        </div>

        <div className="p-8">
          {/* Tabs */}
          <div className="flex bg-slate-100 p-1.5 rounded-2xl mb-8">
            <button 
              type="button"
              onClick={goToSignIn}
              className={cn(
                "flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                mode === 'signin' ? "bg-white text-blue-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
              )}
            >
              Entrar
            </button>
            <button 
              type="button"
              onClick={goToSignUp}
              className={cn(
                "flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                mode === 'signup' ? "bg-white text-blue-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
              )}
            >
              Criar Conta
            </button>
          </div>

          <form onSubmit={handleAuth} className="space-y-5">
            <div>
              <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Endereço de E-mail</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center group-focus-within:bg-blue-50 transition-all">
                  <Mail className="w-4 h-4 text-slate-400 group-focus-within:text-blue-500" />
                </div>
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-14 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-bold text-sm text-slate-700"
                  placeholder="admin@gerax.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Senha</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center group-focus-within:bg-blue-50 transition-all">
                  <Lock className="w-4 h-4 text-slate-400 group-focus-within:text-blue-500" />
                </div>
                <input 
                  type={showPassword ? "text" : "password"} 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-14 pr-12 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-bold text-sm text-slate-700"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <AnimatePresence>
              {mode === 'signup' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Confirmar Senha</label>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center group-focus-within:bg-blue-50 transition-all">
                      <CheckCircle2 className="w-4 h-4 text-slate-400 group-focus-within:text-blue-500" />
                    </div>
                    <input 
                      type={showPassword ? "text" : "password"} 
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full pl-14 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-bold text-sm text-slate-700"
                      placeholder="••••••••"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <button 
              disabled={loading}
              type="submit"
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black uppercase tracking-widest py-4.5 rounded-[18px] shadow-xl transition-all active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-50 mt-4"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : mode === 'signin' ? (
                <>
                  <LogIn className="w-4 h-4" />
                  Entrar no Sistema
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  Finalizar Cadastro
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">
              GERAX TELECOM &bull; SISTEMA DE ALTA DISPONIBILIDADE
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
