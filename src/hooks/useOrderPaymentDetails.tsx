import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface OrderPaymentDetails {
  id: string;
  store_id: string;
  total_amount: number;
  payment_code: string;
  code_status: string;
  code_expires_at: string | null;
  seller_upi_id_snapshot: string | null;
  status: string;
}

interface OrderPaymentResult {
  order: OrderPaymentDetails;
  storeName: string;
  storeCountry: string;
}

export function useOrderPaymentDetails(orderId: string | undefined) {
  return useQuery({
    queryKey: ['order-payment', orderId],
    queryFn: async (): Promise<OrderPaymentResult | null> => {
      if (!orderId) return null;

      // Expire stale codes first
      await supabase.rpc('expire_active_payment_codes');

      // Fetch order payment details via SECURITY DEFINER RPC
      const { data, error } = await supabase.rpc('get_order_payment_details', {
        p_order_id: orderId,
      });

      if (error) throw error;
      if (!data || (Array.isArray(data) && data.length === 0)) return null;

      const order: OrderPaymentDetails = Array.isArray(data) ? data[0] : data;

      // Fetch store name + country (stores are publicly readable)
      const { data: store } = await supabase
        .from('stores')
        .select('name, country')
        .eq('id', order.store_id)
        .maybeSingle();

      return {
        order,
        storeName: store?.name || 'Store',
        storeCountry: store?.country || 'IN',
      };
    },
    enabled: !!orderId,
    staleTime: 30_000,
  });
}
