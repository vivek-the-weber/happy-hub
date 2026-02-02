import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ShippingCourier {
  name: string;
  rate: number;
  etd: string;
}

export interface ShippingRatesResult {
  success: boolean;
  cheapestRate: number;
  cheapestCourier: string;
  fastestDelivery: string;
  fastestCourier: string;
  courierName: string;
  etd: string;
  couriers: ShippingCourier[];
  pickupPostcode: string;
  // Error states
  error?: string;
  notConfigured?: boolean;
  notServiceable?: boolean;
  tokenExpired?: boolean;
  rateLimited?: boolean;
}

export function useShippingRates(
  storeId: string | undefined,
  deliveryPostcode: string | undefined,
  weight: number = 0.5
) {
  return useQuery({
    queryKey: ['shipping-rates', storeId, deliveryPostcode, weight],
    queryFn: async (): Promise<ShippingRatesResult> => {
      const { data, error } = await supabase.functions.invoke('shiprocket-rates', {
        body: { 
          storeId, 
          deliveryPostcode, 
          weight, 
          cod: 0 
        },
      });

      // Handle rate limiting
      if (data?.rateLimited) {
        return {
          success: false,
          error: 'Too many requests. Please wait a moment.',
          rateLimited: true,
        } as ShippingRatesResult;
      }

      if (error) {
        console.error('Shipping rates fetch error:', error);
        throw new Error(error.message);
      }

      return data as ShippingRatesResult;
    },
    enabled: !!storeId && !!deliveryPostcode && deliveryPostcode.length >= 6,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    retry: 1,
  });
}

// Hook to check if store has Shiprocket connected (for conditional UI)
export function useStoreShiprocketStatus(storeId: string | undefined, enabled: boolean = true) {
  return useQuery({
    queryKey: ['shiprocket-status', storeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shiprocket_connections')
        .select('pickup_postcode, default_weight')
        .eq('store_id', storeId!)
        .maybeSingle();

      if (error) throw error;

      return {
        hasShiprocket: !!data,
        pickupPostcode: data?.pickup_postcode || null,
        defaultWeight: data?.default_weight || 0.5,
      };
    },
    enabled: enabled && !!storeId,
    staleTime: 10 * 60 * 1000, // Cache for 10 minutes
  });
}
