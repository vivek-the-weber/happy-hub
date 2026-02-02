import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RatesRequest {
  storeId: string;
  deliveryPostcode: string;
  weight?: number;
  cod?: number;
}

interface CourierCompany {
  courier_company_id: number;
  courier_name: string;
  freight_charge: number;
  cod_charges: number;
  estimated_delivery_days: string;
  etd: string;
  rate: number;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { storeId, deliveryPostcode, weight, cod } = await req.json() as RatesRequest;

    // Validate required fields
    if (!storeId) {
      return new Response(
        JSON.stringify({ error: 'storeId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!deliveryPostcode || deliveryPostcode.length < 6) {
      return new Response(
        JSON.stringify({ error: 'Valid delivery postcode is required (6+ digits)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Fetching shipping rates for store ${storeId}, delivery postcode: ${deliveryPostcode}`);

    // Initialize Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch Shiprocket connection for this store
    const { data: connection, error: connError } = await supabase
      .from('shiprocket_connections')
      .select('token, pickup_postcode, default_weight')
      .eq('store_id', storeId)
      .maybeSingle();

    if (connError) {
      console.error('Database error:', connError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch store configuration' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!connection?.token) {
      console.log('No Shiprocket connection found for store');
      return new Response(
        JSON.stringify({ error: 'Shiprocket not configured for this store', notConfigured: true }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!connection.pickup_postcode) {
      console.log('No pickup postcode configured');
      return new Response(
        JSON.stringify({ error: 'Pickup postcode not configured', notConfigured: true }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build query params for Shiprocket API
    const params = new URLSearchParams({
      pickup_postcode: connection.pickup_postcode,
      delivery_postcode: deliveryPostcode,
      weight: String(weight || connection.default_weight || 0.5),
      cod: String(cod || 0),
    });

    console.log(`Calling Shiprocket API with params: ${params.toString()}`);

    // Call Shiprocket Serviceability API
    const shiprocketResponse = await fetch(
      `https://apiv2.shiprocket.in/v1/external/courier/serviceability/?${params}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${connection.token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!shiprocketResponse.ok) {
      const errorText = await shiprocketResponse.text();
      console.error('Shiprocket API error:', shiprocketResponse.status, errorText);
      
      // Handle token expiry
      if (shiprocketResponse.status === 401) {
        return new Response(
          JSON.stringify({ error: 'Shiprocket token expired. Seller needs to reconnect.', tokenExpired: true }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ error: 'Failed to fetch shipping rates from Shiprocket' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const shiprocketData = await shiprocketResponse.json();
    console.log('Shiprocket response status:', shiprocketData.status);

    const couriers: CourierCompany[] = shiprocketData.data?.available_courier_companies || [];

    if (couriers.length === 0) {
      console.log('No couriers available for this route');
      return new Response(
        JSON.stringify({ 
          error: 'Delivery not available to this area',
          notServiceable: true,
          pickupPostcode: connection.pickup_postcode,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Sort by rate to find cheapest
    const sortedByRate = [...couriers].sort((a, b) => a.rate - b.rate);
    const cheapest = sortedByRate[0];

    // Also find fastest delivery
    const sortedByDays = [...couriers].sort((a, b) => {
      // Parse estimated_delivery_days like "3-5" or "4-6"
      const getMinDays = (days: string) => {
        const match = days?.match(/(\d+)/);
        return match ? parseInt(match[1], 10) : 999;
      };
      return getMinDays(a.estimated_delivery_days) - getMinDays(b.estimated_delivery_days);
    });
    const fastest = sortedByDays[0];

    const response = {
      success: true,
      cheapestRate: cheapest.rate,
      cheapestCourier: cheapest.courier_name,
      fastestDelivery: fastest.estimated_delivery_days,
      fastestCourier: fastest.courier_name,
      courierName: cheapest.courier_name,
      etd: cheapest.estimated_delivery_days,
      couriers: sortedByRate.slice(0, 5).map(c => ({
        name: c.courier_name,
        rate: c.rate,
        etd: c.estimated_delivery_days,
      })),
      pickupPostcode: connection.pickup_postcode,
    };

    console.log('Returning rates:', response);

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
