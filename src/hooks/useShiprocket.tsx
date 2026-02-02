import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ShiprocketConnection {
  id: string;
  store_id: string;
  email: string;
  token: string;
  pickup_postcode: string | null;
  default_weight: number;
  created_at: string;
  updated_at: string;
}

interface ConnectParams {
  storeId: string;
  email: string;
  password: string;
}

interface DisconnectParams {
  storeId: string;
}

export function useShiprocketConnection(storeId: string | undefined) {
  return useQuery({
    queryKey: ['shiprocket-connection', storeId],
    queryFn: async () => {
      if (!storeId) return null;
      const { data, error } = await supabase
        .from('shiprocket_connections')
        .select('*')
        .eq('store_id', storeId)
        .maybeSingle();
      if (error) throw error;
      return data as ShiprocketConnection | null;
    },
    enabled: !!storeId,
  });
}

export function useUpdateShiprocketConnection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ storeId, pickup_postcode, default_weight }: {
      storeId: string;
      pickup_postcode?: string;
      default_weight?: number;
    }) => {
      const { data, error } = await supabase
        .from('shiprocket_connections')
        .update({ pickup_postcode, default_weight })
        .eq('store_id', storeId)
        .select()
        .single();
      if (error) throw error;
      return data as ShiprocketConnection;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['shiprocket-connection', variables.storeId] 
      });
    },
  });
}

export function useConnectShiprocket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ storeId, email, password }: ConnectParams) => {
      const { data, error } = await supabase.functions.invoke('shiprocket-auth', {
        body: {
          action: 'connect',
          storeId,
          email,
          password,
        },
      });

      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['shiprocket-connection', variables.storeId] });
    },
  });
}

export function useDisconnectShiprocket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ storeId }: DisconnectParams) => {
      const { data, error } = await supabase.functions.invoke('shiprocket-auth', {
        body: {
          action: 'disconnect',
          storeId,
        },
      });

      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['shiprocket-connection', variables.storeId] });
    },
  });
}
