import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RegisterTokenRequest {
  refresh_token: string;
  user_id: string;
  device_info?: {
    user_agent?: string;
    ip_address?: string;
    device_id?: string;
  };
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

    const { refresh_token, user_id, device_info }: RegisterTokenRequest = await req.json()

    if (!refresh_token || !user_id) {
      return new Response(
        JSON.stringify({ error: 'Refresh token and user ID required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Hash the refresh token for secure storage
    const encoder = new TextEncoder()
    const data = encoder.encode(refresh_token)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const token_hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

    // Store the hashed refresh token
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    const { error: insertError } = await supabaseClient
      .from('refresh_tokens')
      .insert({
        user_id: user_id,
        token_hash: token_hash,
        device_info: device_info || {},
        expires_at: expiresAt.toISOString()
      })

    if (insertError) {
      console.error('Failed to register refresh token:', insertError)
      return new Response(
        JSON.stringify({ error: 'Failed to register refresh token' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Enforce session limit (5 sessions max per user)
    await supabaseClient.rpc('enforce_session_limit', {
      target_user_id: user_id,
      max_sessions: 5
    })

    // Clean up expired tokens
    await supabaseClient.rpc('cleanup_expired_tokens')

    return new Response(
      JSON.stringify({ success: true, message: 'Refresh token registered successfully' }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Register refresh token error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})