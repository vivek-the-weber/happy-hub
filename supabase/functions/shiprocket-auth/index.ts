import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

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

      // Insert into shiprocket_connections table
      const { error: insertError } = await supabase
        .from('shiprocket_connections')
        .insert({
          store_id: storeId,
          email: email,
          token: shiprocketData.token,
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

      console.log('Shiprocket connected successfully for store:', storeId);
      return new Response(
        JSON.stringify({ success: true, message: 'Connected to Shiprocket successfully' }),
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

    } else {
      return new Response(
        JSON.stringify({ error: 'Invalid action. Use "connect" or "disconnect"' }),
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
