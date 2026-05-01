import { supabase, Result } from './client';
import { User, Session, SignInWithPasswordCredentials, SignUpWithPasswordCredentials } from '@supabase/supabase-js';

/**
 * Serviço de Autenticação Supabase
 * Encapsula operações de identidade com tratamento de erros padronizado.
 */
export const authService = {
  /**
   * Realiza o cadastro de um novo usuário
   */
  async signUp(credentials: SignUpWithPasswordCredentials): Promise<Result<User>> {
    try {
      const { data, error } = await supabase.auth.signUp(credentials);
      if (error) return [null, error];
      return [data.user, null];
    } catch (err) {
      return [null, err as Error];
    }
  },

  /**
   * Realiza o login com e-mail e senha
   */
  async signIn(credentials: SignInWithPasswordCredentials): Promise<Result<{ user: User | null; session: Session | null }>> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword(credentials);
      if (error) return [null, error];
      return [data, null];
    } catch (err) {
      return [null, err as Error];
    }
  },

  /**
   * Encerra a sessão atual
   */
  async signOut(): Promise<Result<boolean>> {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) return [null, error];
      return [true, null];
    } catch (err) {
      return [null, err as Error];
    }
  },

  /**
   * Obtém a sessão atual
   */
  async getSession(): Promise<Result<Session>> {
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) return [null, error];
      return [data.session, null];
    } catch (err) {
      return [null, err as Error];
    }
  },

  /**
   * Escuta mudanças no estado de autenticação
   */
  onAuthStateChange(callback: (event: string, session: Session | null) => void) {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      callback(event, session);
    });
    return subscription;
  }
};
