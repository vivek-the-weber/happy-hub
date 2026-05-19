import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface TrysyConnection {
  id: string;
  store_id: string;
  trysy_store_id: string;
  trysy_api_key: string;
  is_enabled: boolean;
  trysy_fee: number;
  created_at: string;
  updated_at: string;
}

export function useTrysyConnection(storeId: string | undefined) {
  return useQuery({
    queryKey: ['trysy-connection', storeId],
    queryFn: async () => {
      if (!storeId) return null;
      const { data, error } = await supabase
        .from('trysy_connections')
        .select('*')
        .eq('store_id', storeId)
        .maybeSingle();
      if (error) throw error;
      return data as TrysyConnection | null;
    },
    enabled: !!storeId,
  });
}

interface SaveParams {
  storeId: string;
  trysy_store_id: string;
  trysy_api_key: string;
  is_enabled: boolean;
}

export function useSaveTrysyConnection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ storeId, trysy_store_id, trysy_api_key, is_enabled }: SaveParams) => {
      const { data, error } = await supabase
        .from('trysy_connections')
        .upsert(
          {
            store_id: storeId,
            trysy_store_id,
            trysy_api_key,
            is_enabled,
          },
          { onConflict: 'store_id' }
        )
        .select()
        .single();
      if (error) throw error;
      return data as TrysyConnection;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['trysy-connection', variables.storeId] });
    },
  });
}

export function useDisconnectTrysy() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ storeId }: { storeId: string }) => {
      const { error } = await supabase
        .from('trysy_connections')
        .delete()
        .eq('store_id', storeId);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['trysy-connection', variables.storeId] });
    },
  });
}
