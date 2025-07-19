import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SyncRequest {
  client_id: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { client_id }: SyncRequest = await req.json();

    if (!client_id) {
      return new Response(JSON.stringify({ error: 'client_id is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Starting sync for client: ${client_id}`);

    // Get client configuration
    const { data: config, error: configError } = await supabase
      .from('client_configs')
      .select('*')
      .eq('client_id', client_id)
      .single();

    if (configError || !config) {
      console.error('Client config not found:', configError);
      return new Response(JSON.stringify({ error: 'Client configuration not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Log sync start
    const { error: logStartError } = await supabase
      .from('integration_logs')
      .insert({
        client_id,
        pos_type: config.pos_type,
        operation: 'manual_sync',
        status: 'pending',
        events_count: 0,
      });

    if (logStartError) {
      console.error('Error logging sync start:', logStartError);
    }

    // Simulate POS sync based on type
    let syncResult;
    let eventsCount = 0;

    try {
      if (config.pos_type === 'fudo') {
        // Simulate Fudo POS sync
        await new Promise(resolve => setTimeout(resolve, 2000));
        eventsCount = Math.floor(Math.random() * 50) + 10; // Random 10-60 events
        syncResult = { success: true, message: 'Fudo sync completed successfully' };
      } else if (config.pos_type === 'bistrosoft') {
        // Simulate BistroSoft sync
        await new Promise(resolve => setTimeout(resolve, 1500));
        eventsCount = Math.floor(Math.random() * 30) + 5; // Random 5-35 events
        syncResult = { success: true, message: 'BistroSoft sync completed successfully' };
      } else {
        throw new Error(`Unsupported POS type: ${config.pos_type}`);
      }

      // Log successful sync
      const { error: logSuccessError } = await supabase
        .from('integration_logs')
        .insert({
          client_id,
          pos_type: config.pos_type,
          operation: 'manual_sync',
          status: 'success',
          events_count: eventsCount,
        });

      if (logSuccessError) {
        console.error('Error logging sync success:', logSuccessError);
      }

      console.log(`Sync completed for client ${client_id}: ${eventsCount} events processed`);

      return new Response(JSON.stringify({
        success: true,
        message: syncResult.message,
        events_count: eventsCount,
        client_id,
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } catch (syncError) {
      console.error('Sync error:', syncError);

      // Log sync error
      const { error: logErrorError } = await supabase
        .from('integration_logs')
        .insert({
          client_id,
          pos_type: config.pos_type,
          operation: 'manual_sync',
          status: 'error',
          events_count: 0,
          error_message: syncError instanceof Error ? syncError.message : 'Unknown sync error',
        });

      if (logErrorError) {
        console.error('Error logging sync error:', logErrorError);
      }

      return new Response(JSON.stringify({
        success: false,
        error: syncError instanceof Error ? syncError.message : 'Unknown sync error',
        client_id,
      }), {
        status: 500,
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