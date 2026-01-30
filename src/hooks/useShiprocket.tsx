import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface ConnectParams {
  storeId: string;
  email: string;
  password: string;
}

interface DisconnectParams {
  storeId: string;
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-store'] });
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-store'] });
    },
  });
}
