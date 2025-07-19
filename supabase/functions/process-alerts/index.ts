import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AlertRequest {
  client_id: string;
  alert_type: 'consecutive_errors' | 'stale_sync' | 'status_change';
  error_count?: number;
  hours_since_sync?: number;
  old_status?: string;
  new_status?: string;
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

    const { client_id, alert_type, error_count, hours_since_sync, old_status, new_status }: AlertRequest = await req.json();

    if (!client_id || !alert_type) {
      return new Response(JSON.stringify({ error: 'client_id and alert_type are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Processing alert for client ${client_id}, type: ${alert_type}`);

    // Determine alert severity and message
    let severity: 'low' | 'medium' | 'high' | 'critical' = 'medium';
    let message = '';
    let shouldNotify = false;

    switch (alert_type) {
      case 'consecutive_errors':
        severity = error_count! >= 5 ? 'critical' : error_count! >= 3 ? 'high' : 'medium';
        message = `Cliente ${client_id} tiene ${error_count} errores consecutivos`;
        shouldNotify = error_count! >= 3;
        break;
      
      case 'stale_sync':
        severity = hours_since_sync! >= 72 ? 'critical' : hours_since_sync! >= 48 ? 'high' : 'medium';
        message = `Cliente ${client_id} sin sincronizar por ${hours_since_sync} horas`;
        shouldNotify = hours_since_sync! >= 48;
        break;
      
      case 'status_change':
        severity = new_status === 'error' ? 'high' : 'medium';
        message = `Cliente ${client_id} cambió de ${old_status} a ${new_status}`;
        shouldNotify = new_status === 'error';
        break;
    }

    // Log the alert in database
    const { error: logError } = await supabase
      .from('integration_logs')
      .insert({
        client_id,
        pos_type: 'system',
        operation: 'alert',
        status: 'info',
        events_count: 0,
        error_message: `ALERT [${severity.toUpperCase()}]: ${message}`
      });

    if (logError) {
      console.error('Error logging alert:', logError);
    }

    // Simulate notification sending if required
    if (shouldNotify) {
      // In a real implementation, this would:
      // 1. Send Slack notification
      // 2. Send email to operations team
      // 3. Create ticket in ticketing system
      // 4. Send SMS for critical alerts
      
      console.log(`NOTIFICATION SENT: [${severity.toUpperCase()}] ${message}`);
      
      // Simulate notification delay
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    const alertResult = {
      success: true,
      alert_processed: true,
      client_id,
      alert_type,
      severity,
      message,
      notification_sent: shouldNotify,
      timestamp: new Date().toISOString(),
      channels_notified: shouldNotify ? ['slack', 'email'] : [],
      escalation_level: severity === 'critical' ? 'immediate' : severity === 'high' ? 'urgent' : 'normal'
    };

    console.log('Alert processed successfully:', alertResult);

    return new Response(JSON.stringify(alertResult), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

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