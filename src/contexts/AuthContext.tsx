import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { UserPermissions } from '../types';

interface AuthContextType {
  user: User | null;
  permissions: UserPermissions | null;
  loading: boolean;
  hasPermission: (permission: keyof Omit<UserPermissions, 'user_id' | 'role' | 'created_at' | 'updated_at'>) => boolean;
  isMaster: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [permissions, setPermissions] = useState<UserPermissions | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchPermissions = async (userId: string, email?: string): Promise<UserPermissions | null> => {
    try {
      const { data, error } = await supabase
        .from('user_permissions')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        const perms = data as UserPermissions;
        setPermissions(perms);
        return perms;
      } else {
        const fallbackPerms = {
          role: email === 'paulinhosheldom@gmail.com' ? 'MASTER' : 'USER',
          can_view_finance: true,
          can_manage_routes: true,
          can_view_sellers: true,
          can_manage_tickets: true
        } as UserPermissions;
        setPermissions(fallbackPerms);
        return fallbackPerms;
      }
    } catch (err) {
      console.error('Erro ao buscar permissões:', err);
      const errorPerms = {
        role: email === 'paulinhosheldom@gmail.com' ? 'MASTER' : 'USER',
        can_view_finance: true,
        can_manage_routes: true,
        can_view_sellers: true,
        can_manage_tickets: true
      } as UserPermissions;
      setPermissions(errorPerms);
      return errorPerms;
    }
  };

  useEffect(() => {
    // Safety timeout: if auth check takes > 5 seconds, stop loading
    const timeout = setTimeout(() => {
      setLoading(false);
    }, 5000);

    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      
      if (currentUser) {
        fetchPermissions(currentUser.id).then(() => {
          setLoading(false);
          clearTimeout(timeout);
        });
      } else {
        setLoading(false);
        clearTimeout(timeout);
      }
    }).catch(() => {
      setLoading(false);
      clearTimeout(timeout);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      
      if (currentUser) {
        await fetchPermissions(currentUser.id);
      } else {
        setPermissions(null);
      }
      setLoading(false);
    });

    return () => {
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, []);

  const hasPermission = (permission: keyof Omit<UserPermissions, 'user_id' | 'role' | 'created_at' | 'updated_at'>) => {
    if (!permissions) return false;
    if (permissions.role === 'MASTER') return true;
    return !!permissions[permission];
  };

  const isMaster = permissions?.role === 'MASTER' || user?.email === 'paulinhosheldom@gmail.com';

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Erro ao encerrar sessão no Supabase:', error);
    } finally {
      setUser(null);
      setPermissions(null);
      localStorage.clear();
      sessionStorage.clear();
    }
  };

  const value = {
    user,
    permissions,
    loading,
    hasPermission,
    isMaster,
    signOut
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
