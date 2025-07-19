import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TestConnectionRequest {
  pos_type: string;
  api_key: string;
  client_id?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { pos_type, api_key, client_id }: TestConnectionRequest = await req.json();

    if (!pos_type || !api_key) {
      return new Response(JSON.stringify({ error: 'pos_type and api_key are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Testing ${pos_type} connection for client: ${client_id || 'unknown'}`);

    // Simulate different connection tests based on POS type
    let connectionResult;

    try {
      if (pos_type === 'fudo') {
        // Simulate Fudo API connection test
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Simulate some failures for demo purposes
        if (api_key.includes('invalid')) {
          throw new Error('Invalid API key for Fudo POS');
        }
        
        connectionResult = {
          success: true,
          message: 'Fudo POS connection successful',
          version: 'v2.1.3',
          store_info: {
            name: 'Demo Store',
            location: 'Buenos Aires',
            status: 'active'
          }
        };
      } else if (pos_type === 'bistrosoft') {
        // Simulate BistroSoft API connection test
        await new Promise(resolve => setTimeout(resolve, 1200));
        
        if (api_key.includes('invalid')) {
          throw new Error('Invalid API key for BistroSoft POS');
        }
        
        connectionResult = {
          success: true,
          message: 'BistroSoft POS connection successful',
          version: 'v1.8.2',
          store_info: {
            name: 'Demo Bistro',
            location: 'Córdoba',
            status: 'active'
          }
        };
      } else {
        throw new Error(`Unsupported POS type: ${pos_type}`);
      }

      console.log(`Connection test successful for ${pos_type}`);

      return new Response(JSON.stringify({
        success: true,
        message: connectionResult.message,
        pos_type,
        version: connectionResult.version,
        store_info: connectionResult.store_info,
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } catch (connectionError) {
      console.error(`Connection test failed for ${pos_type}:`, connectionError);

      return new Response(JSON.stringify({
        success: false,
        error: connectionError instanceof Error ? connectionError.message : 'Connection test failed',
        pos_type,
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

  } catch (error) {
    console.error('Function error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});