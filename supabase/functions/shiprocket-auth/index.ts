import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Shiprocket tokens typically expire in 10 days
const TOKEN_EXPIRY_DAYS = 10;

// Calculate token expiry date
function calculateTokenExpiry(): string {
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + TOKEN_EXPIRY_DAYS);
  return expiryDate.toISOString();
}

// Helper function to fetch pickup locations from Shiprocket
async function fetchPickupLocations(token: string): Promise<{ postcode: string | null; locationName: string | null }> {
  try {
    console.log('Fetching pickup locations from Shiprocket...');
    const pickupResponse = await fetch(
      'https://apiv2.shiprocket.in/v1/external/settings/company/pickup',
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!pickupResponse.ok) {
      console.error('Pickup locations fetch failed:', pickupResponse.status);
      return { postcode: null, locationName: null };
    }

    const pickupData = await pickupResponse.json();
    const addresses = pickupData.data?.shipping_address || [];
    
    // Find primary location or use first one
    const primaryAddress = addresses.find((a: any) => a.is_primary_location === 1) || addresses[0];
    
    if (primaryAddress) {
      console.log('Found pickup location:', primaryAddress.pickup_location, 'Postcode:', primaryAddress.pin_code);
      return { 
        postcode: primaryAddress.pin_code || null, 
        locationName: primaryAddress.pickup_location || null 
      };
    }

    console.log('No pickup locations found');
    return { postcode: null, locationName: null };
  } catch (error) {
    console.error('Error fetching pickup locations:', error);
    return { postcode: null, locationName: null };
  }
}

// Helper to validate token by making a simple API call
async function validateToken(token: string): Promise<boolean> {
  try {
    const response = await fetch(
      'https://apiv2.shiprocket.in/v1/external/settings/company/pickup',
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );
    return response.ok;
  } catch {
    return false;
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = claimsData.claims.sub;
    const { action, email, password, storeId } = await req.json();

    if (action === 'connect') {
      // Validate inputs
      if (!email || !password || !storeId) {
        return new Response(
          JSON.stringify({ error: 'Email, password, and store ID are required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Verify user owns this store
      const { data: store, error: storeError } = await supabase
        .from('stores')
        .select('id, owner_id')
        .eq('id', storeId)
        .maybeSingle();

      if (storeError || !store) {
        console.error('Store lookup error:', storeError);
        return new Response(
          JSON.stringify({ error: 'Store not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (store.owner_id !== userId) {
        return new Response(
          JSON.stringify({ error: 'You do not own this store' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Call Shiprocket API to authenticate
      console.log('Authenticating with Shiprocket API...');
      const shiprocketResponse = await fetch('https://apiv2.shiprocket.in/v1/external/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const shiprocketData = await shiprocketResponse.json();

      if (!shiprocketResponse.ok || !shiprocketData.token) {
        console.error('Shiprocket auth failed:', shiprocketData);
        return new Response(
          JSON.stringify({ error: shiprocketData.message || 'Invalid Shiprocket credentials' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Fetch pickup locations after successful authentication
      const { postcode: pickupPostcode } = await fetchPickupLocations(shiprocketData.token);

      // Calculate token expiry
      const tokenExpiresAt = calculateTokenExpiry();

      // Insert into shiprocket_connections table with auto-fetched postcode and expiry
      const { error: insertError } = await supabase
        .from('shiprocket_connections')
        .insert({
          store_id: storeId,
          email: email,
          token: shiprocketData.token,
          pickup_postcode: pickupPostcode,
          token_expires_at: tokenExpiresAt,
        });

      if (insertError) {
        // Check if it's a unique constraint violation (already connected)
        if (insertError.code === '23505') {
          // Update existing connection instead
          const { error: updateError } = await supabase
            .from('shiprocket_connections')
            .update({
              email: email,
              token: shiprocketData.token,
              pickup_postcode: pickupPostcode,
              token_expires_at: tokenExpiresAt,
            })
            .eq('store_id', storeId);

          if (updateError) {
            console.error('Failed to update connection:', updateError);
            return new Response(
              JSON.stringify({ error: 'Failed to save connection' }),
              { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
        } else {
          console.error('Failed to insert connection:', insertError);
          return new Response(
            JSON.stringify({ error: 'Failed to save connection' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      console.log('Shiprocket connected successfully for store:', storeId, 'Pickup postcode:', pickupPostcode, 'Expires at:', tokenExpiresAt);
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Connected to Shiprocket successfully',
          pickup_postcode: pickupPostcode,
          token_expires_at: tokenExpiresAt,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else if (action === 'disconnect') {
      if (!storeId) {
        return new Response(
          JSON.stringify({ error: 'Store ID is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Verify user owns this store
      const { data: store, error: storeError } = await supabase
        .from('stores')
        .select('id, owner_id')
        .eq('id', storeId)
        .maybeSingle();

      if (storeError || !store) {
        return new Response(
          JSON.stringify({ error: 'Store not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (store.owner_id !== userId) {
        return new Response(
          JSON.stringify({ error: 'You do not own this store' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Delete from shiprocket_connections table
      const { error: deleteError } = await supabase
        .from('shiprocket_connections')
        .delete()
        .eq('store_id', storeId);

      if (deleteError) {
        console.error('Failed to disconnect:', deleteError);
        return new Response(
          JSON.stringify({ error: 'Failed to disconnect' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('Shiprocket disconnected for store:', storeId);
      return new Response(
        JSON.stringify({ success: true, message: 'Disconnected from Shiprocket' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else if (action === 'refresh-pickup') {
      if (!storeId) {
        return new Response(
          JSON.stringify({ error: 'Store ID is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Verify user owns this store
      const { data: store, error: storeError } = await supabase
        .from('stores')
        .select('id, owner_id')
        .eq('id', storeId)
        .maybeSingle();

      if (storeError || !store) {
        return new Response(
          JSON.stringify({ error: 'Store not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (store.owner_id !== userId) {
        return new Response(
          JSON.stringify({ error: 'You do not own this store' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get current Shiprocket connection
      const { data: connection, error: connError } = await supabase
        .from('shiprocket_connections')
        .select('token')
        .eq('store_id', storeId)
        .maybeSingle();

      if (connError || !connection) {
        return new Response(
          JSON.stringify({ error: 'No Shiprocket connection found. Please reconnect.' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Fetch pickup locations with stored token
      const { postcode: pickupPostcode, locationName } = await fetchPickupLocations(connection.token);

      if (!pickupPostcode) {
        return new Response(
          JSON.stringify({ error: 'No pickup location configured in Shiprocket. Token may be expired - try reconnecting.', tokenExpired: true }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Update the connection with new postcode
      const { error: updateError } = await supabase
        .from('shiprocket_connections')
        .update({ pickup_postcode: pickupPostcode })
        .eq('store_id', storeId);

      if (updateError) {
        console.error('Failed to update pickup postcode:', updateError);
        return new Response(
          JSON.stringify({ error: 'Failed to update pickup location' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('Pickup location refreshed for store:', storeId, 'Postcode:', pickupPostcode);
      return new Response(
        JSON.stringify({ 
          success: true, 
          pickup_location: locationName,
          pickup_postcode: pickupPostcode,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else if (action === 'validate-token') {
      // New action to validate if current token is still valid
      if (!storeId) {
        return new Response(
          JSON.stringify({ error: 'Store ID is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Verify user owns this store
      const { data: store, error: storeError } = await supabase
        .from('stores')
        .select('id, owner_id')
        .eq('id', storeId)
        .maybeSingle();

      if (storeError || !store) {
        return new Response(
          JSON.stringify({ error: 'Store not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (store.owner_id !== userId) {
        return new Response(
          JSON.stringify({ error: 'You do not own this store' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get current Shiprocket connection
      const { data: connection, error: connError } = await supabase
        .from('shiprocket_connections')
        .select('token, token_expires_at')
        .eq('store_id', storeId)
        .maybeSingle();

      if (connError || !connection) {
        return new Response(
          JSON.stringify({ valid: false, error: 'No Shiprocket connection found' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check if token is past expiry date
      const now = new Date();
      const expiresAt = connection.token_expires_at ? new Date(connection.token_expires_at) : null;
      
      if (expiresAt && now > expiresAt) {
        console.log('Token expired based on stored expiry date');
        return new Response(
          JSON.stringify({ valid: false, expired: true, expiresAt: connection.token_expires_at }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Actually validate by making an API call
      const isValid = await validateToken(connection.token);
      
      if (!isValid) {
        // Token is invalid, update expiry to now
        await supabase
          .from('shiprocket_connections')
          .update({ token_expires_at: new Date().toISOString() })
          .eq('store_id', storeId);
      }

      console.log('Token validation result for store:', storeId, 'Valid:', isValid);
      return new Response(
        JSON.stringify({ 
          valid: isValid, 
          expired: !isValid,
          expiresAt: connection.token_expires_at,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else {
      return new Response(
        JSON.stringify({ error: 'Invalid action. Use "connect", "disconnect", "refresh-pickup", or "validate-token"' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('Shiprocket auth error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
