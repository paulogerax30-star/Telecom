import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : {
      auth: {
        getSession: async () => ({ data: { session: null } }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
        signOut: async () => {},
      },
      from: (table: string) => {
        const queryObj = {
          select: (columns?: string) => {
            const selectResult = Promise.resolve({ data: [], error: null }) as any;
            selectResult.order = () => Promise.resolve({ data: [], error: null });
            return selectResult;
          },
          insert: (data: any[]) => {
            const result = Promise.resolve({ data: null, error: null }) as any;
            result.select = () => Promise.resolve({ 
              data: data.map((d: any) => ({ ...d, id: d.id || crypto.randomUUID() })), 
              error: null 
            });
            return result;
          },
          update: (data: any) => {
            const result = Promise.resolve({ data: null, error: null }) as any;
            result.eq = () => Promise.resolve({ data: [data], error: null });
            return result;
          },
          delete: () => {
            const result = Promise.resolve({ data: null, error: null }) as any;
            result.eq = () => Promise.resolve({ data: null, error: null });
            return result;
          }
        };
        return queryObj as any;
      }
    } as any;

