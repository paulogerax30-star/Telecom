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

  const fetchPermissions = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_permissions')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('Erro ao buscar permissões:', error);
        return null;
      }
      console.log('Permissões carregadas:', data);
      return data as UserPermissions;
    } catch (err) {
      console.error('Unexpected error fetching permissions:', err);
      return null;
    }
  };

  useEffect(() => {
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      
      if (currentUser) {
        fetchPermissions(currentUser.id).then(perms => {
          setPermissions(perms);
          setLoading(false);
        });
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      
      if (currentUser) {
        const perms = await fetchPermissions(currentUser.id);
        setPermissions(perms);
      } else {
        setPermissions(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const hasPermission = (permission: keyof Omit<UserPermissions, 'user_id' | 'role' | 'created_at' | 'updated_at'>) => {
    if (!permissions) return false;
    if (permissions.role === 'MASTER') return true;
    return !!permissions[permission];
  };

  const isMaster = permissions?.role === 'MASTER';

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setPermissions(null);
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
