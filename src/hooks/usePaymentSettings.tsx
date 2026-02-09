import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function usePaymentSettings(storeId: string | undefined) {
  return useQuery({
    queryKey: ['payment-settings', storeId],
    queryFn: async () => {
      if (!storeId) return null;
      const { data, error } = await supabase
        .from('seller_payment_settings')
        .select('*')
        .eq('store_id', storeId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!storeId,
  });
}

export function useUpsertPaymentSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ storeId, upiId }: { storeId: string; upiId: string }) => {
      const { data, error } = await supabase
        .from('seller_payment_settings')
        .upsert(
          { store_id: storeId, upi_id: upiId.toLowerCase().trim() },
          { onConflict: 'store_id' }
        )
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['payment-settings', variables.storeId] });
    },
  });
}

export function useHasPendingOrders(storeId: string | undefined) {
  return useQuery({
    queryKey: ['pending-orders', storeId],
    queryFn: async () => {
      if (!storeId) return false;
      const { data, error } = await supabase
        .from('orders')
        .select('id')
        .eq('store_id', storeId)
        .eq('status', 'pending')
        .limit(1);
      if (error) throw error;
      return (data?.length ?? 0) > 0;
    },
    enabled: !!storeId,
  });
}
