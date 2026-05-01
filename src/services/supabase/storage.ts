import { supabase, Result } from './client';

/**
 * Serviço de Storage e Execução Remota
 * Gerencia arquivos privados (faturas/relatórios) e invocações de lógica no servidor.
 */
export const storageService = {
  /**
   * Faz upload de um arquivo para um bucket privado
   */
  async uploadFile(bucket: string, path: string, file: File): Promise<Result<string>> {
    try {
      const { data, error } = await supabase.storage.from(bucket).upload(path, file, {
        upsert: true,
        contentType: file.type
      });
      
      if (error) return [null, error];
      return [data.path, null];
    } catch (err) {
      return [null, err as Error];
    }
  },

  /**
   * Gera uma URL pública (temporária ou não) para download
   */
  async getDownloadUrl(bucket: string, path: string): Promise<Result<string>> {
    try {
      const { data } = supabase.storage.from(bucket).getPublicUrl(path);
      return [data.publicUrl, null];
    } catch (err) {
      return [null, err as Error];
    }
  },

  /**
   * Executa uma Stored Procedure (RPC) no PostgreSQL
   */
  async executeRpc<T>(functionName: string, params: object = {}): Promise<Result<T>> {
    try {
      const { data, error } = await supabase.rpc(functionName, params);
      if (error) return [null, error];
      return [data as T, null];
    } catch (err) {
      return [null, err as Error];
    }
  },

  /**
   * Invoca uma Supabase Edge Function
   */
  async invokeFunction<T>(functionName: string, body: object = {}): Promise<Result<T>> {
    try {
      const { data, error } = await supabase.functions.invoke(functionName, {
        body: JSON.stringify(body),
      });
      if (error) return [null, error];
      return [data as T, null];
    } catch (err) {
      return [null, err as Error];
    }
  }
};
