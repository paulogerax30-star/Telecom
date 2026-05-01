import { supabase, Result } from './client';
import { mapKeysToSnakeCase, mapKeysToCamelCase } from '../../lib/database';

/**
 * Serviço de Banco de Dados Supabase
 * Provê métodos genéricos para CRUD com suporte a mapeamento de chaves e tratamento de RLS.
 */
export const dbService = {
  /**
   * Busca registros de uma tabela com filtros opcionais
   */
  async findMany<T>(table: string, query: object = {}): Promise<Result<T[]>> {
    try {
      let request = supabase.from(table).select('*');
      
      // Aplica filtros se existirem (ex: { status: 'ACTIVE' })
      Object.entries(query).forEach(([key, value]) => {
        request = request.eq(key, value);
      });

      const { data, error } = await request;
      
      if (error) return [null, this.handleError(error)];
      return [mapKeysToCamelCase(data) as T[], null];
    } catch (err) {
      return [null, err as Error];
    }
  },

  /**
   * Busca um único registro por ID
   */
  async findById<T>(table: string, id: string): Promise<Result<T>> {
    try {
      const { data, error } = await supabase.from(table).select('*').eq('id', id).single();
      if (error) return [null, this.handleError(error)];
      return [mapKeysToCamelCase(data) as T, null];
    } catch (err) {
      return [null, err as Error];
    }
  },

  /**
   * Insere um novo registro
   */
  async insert<T>(table: string, payload: any): Promise<Result<T>> {
    try {
      const snakePayload = mapKeysToSnakeCase(payload);
      const { data, error } = await supabase.from(table).insert([snakePayload]).select().single();
      
      if (error) return [null, this.handleError(error)];
      return [mapKeysToCamelCase(data) as T, null];
    } catch (err) {
      return [null, err as Error];
    }
  },

  /**
   * Atualiza um registro existente
   */
  async update<T>(table: string, id: string, payload: any): Promise<Result<T>> {
    try {
      const snakePayload = mapKeysToSnakeCase(payload);
      const { data, error } = await supabase.from(table).update(snakePayload).eq('id', id).select().single();
      
      if (error) return [null, this.handleError(error)];
      return [mapKeysToCamelCase(data) as T, null];
    } catch (err) {
      return [null, err as Error];
    }
  },

  /**
   * Remove um registro
   */
  async delete(table: string, id: string): Promise<Result<boolean>> {
    try {
      const { error } = await supabase.from(table).delete().eq('id', id);
      if (error) return [null, this.handleError(error)];
      return [true, null];
    } catch (err) {
      return [null, err as Error];
    }
  },

  /**
   * Tratamento de Erros Robusto (Focado em RLS e Banco)
   */
  handleError(error: any): Error {
    if (error.code === '42501') {
      return new Error('🚫 Violação de RLS: Você não tem permissão para realizar esta operação.');
    }
    if (error.code === '23505') {
      return new Error('⚠️ Registro duplicado encontrado.');
    }
    return new Error(error.message || 'Erro inesperado no banco de dados.');
  }
};
