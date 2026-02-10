import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface OrderTrackingData {
  id: string;
  store_id: string;
  total_amount: number;
  status: string;
  payment_code: string;
  customer_name: string;
}

interface OrderTrackingResult {
  order: OrderTrackingData;
  storeName: string;
  storeCountry: string;
  storePhone: string | null;
}

export function useOrderTracking(orderId: string | undefined, token: string | null) {
  return useQuery({
    queryKey: ['order-tracking', orderId, token],
    queryFn: async (): Promise<OrderTrackingResult | null> => {
      if (!orderId || !token) return null;

      const { data, error } = await supabase.rpc('get_order_tracking', {
        p_order_id: orderId,
        p_token: token,
      } as any);

      if (error) throw error;
      if (!data || (Array.isArray(data) && data.length === 0)) return null;

      const order: OrderTrackingData = Array.isArray(data) ? data[0] : data;

      // Fetch store name, country, and phone
      const { data: store } = await supabase
        .from('stores')
        .select('name, country, whatsapp_number')
        .eq('id', order.store_id)
        .maybeSingle();

      return {
        order,
        storeName: store?.name || 'Store',
        storeCountry: store?.country || 'IN',
        storePhone: store?.whatsapp_number || null,
      };
    },
    enabled: !!orderId && !!token,
    refetchInterval: 15_000, // Poll every 15s for status updates
  });
}
