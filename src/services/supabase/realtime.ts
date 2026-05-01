import { supabase } from './client';
import { mapKeysToCamelCase } from '../../lib/database';

/**
 * Serviço Realtime Supabase
 * Gerencia subscrições de WebSockets para tabelas críticas.
 */
export const realtimeService = {
  /**
   * Escuta todas as mudanças em uma tabela específica
   * @param table Nome da tabela (ex: 'transactions')
   * @param callback Função chamada ao receber uma atualização
   */
  subscribeToTable<T>(
    table: string, 
    callback: (payload: { eventType: string; new: T | null; old: T | null }) => void
  ) {
    const channel = supabase
      .channel(`public:${table}`)
      .on(
        'postgres_changes', 
        { event: '*', schema: 'public', table: table }, 
        (payload) => {
          const formattedPayload = {
            eventType: payload.eventType,
            new: payload.new ? (mapKeysToCamelCase(payload.new) as T) : null,
            old: payload.old ? (mapKeysToCamelCase(payload.old) as T) : null,
          };
          callback(formattedPayload);
        }
      )
      .subscribe();

    return channel;
  },

  /**
   * Encerra todas as subscrições de um canal
   */
  unsubscribe(channel: any) {
    supabase.removeChannel(channel);
  }
};
