import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { userId, suspectedContamination, details } = await req.json()

    if (!userId || !suspectedContamination) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Log the contamination alert
    const { error: logError } = await supabaseClient
      .from('security_logs')
      .insert({
        event_type: 'contamination_alert',
        user_id: userId,
        details: {
          suspected_contamination: suspectedContamination,
          alert_details: details,
          timestamp: new Date().toISOString(),
        },
        severity: 'high'
      })

    if (logError) {
      console.error('Error logging contamination alert:', logError)
      return new Response(
        JSON.stringify({ error: 'Failed to log alert' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Check if this is a repeat offender
    const { data: recentAlerts, error: queryError } = await supabaseClient
      .from('security_logs')
      .select('id')
      .eq('user_id', userId)
      .eq('event_type', 'contamination_alert')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Last 24 hours
      .limit(5)

    if (queryError) {
      console.error('Error querying recent alerts:', queryError)
    }

    const alertCount = recentAlerts?.length || 0
    let escalationLevel = 'info'
    
    if (alertCount >= 3) {
      escalationLevel = 'critical'
      
      // Additional security measures for repeat contamination
      const { error: securityError } = await supabaseClient
        .from('security_logs')
        .insert({
          event_type: 'security_escalation',
          user_id: userId,
          details: {
            reason: 'Multiple contamination alerts',
            alert_count: alertCount,
            escalation_level: 'critical',
            timestamp: new Date().toISOString(),
          },
          severity: 'critical'
        })

      if (securityError) {
        console.error('Error logging security escalation:', securityError)
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        alertCount,
        escalationLevel,
        message: 'Contamination alert processed successfully' 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in contamination-alerts function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})