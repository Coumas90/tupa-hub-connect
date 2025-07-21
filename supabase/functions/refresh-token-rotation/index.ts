import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RefreshTokenRequest {
  refresh_token: string;
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

    const { refresh_token, device_info }: RefreshTokenRequest = await req.json()

    if (!refresh_token) {
      return new Response(
        JSON.stringify({ error: 'Refresh token required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Hash the incoming refresh token for lookup
    const encoder = new TextEncoder()
    const data = encoder.encode(refresh_token)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const token_hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

    // Check if token exists and is valid
    const { data: tokenRecord, error: tokenError } = await supabaseClient
      .from('refresh_tokens')
      .select('*')
      .eq('token_hash', token_hash)
      .eq('is_revoked', false)
      .gt('expires_at', new Date().toISOString())
      .single()

    if (tokenError || !tokenRecord) {
      // Token reuse detected - revoke all user sessions if we can identify the user
      if (tokenRecord?.user_id) {
        await supabaseClient.rpc('revoke_all_user_sessions', {
          target_user_id: tokenRecord.user_id
        })
        
        console.log(`Token reuse detected for user ${tokenRecord.user_id}. All sessions revoked.`)
      }

      return new Response(
        JSON.stringify({ 
          error: 'Invalid or expired refresh token',
          code: 'TOKEN_REUSE_DETECTED'
        }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Generate new token pair using Supabase Auth
    const { data: authData, error: authError } = await supabaseClient.auth.refreshSession({
      refresh_token: refresh_token
    })

    if (authError || !authData.session) {
      return new Response(
        JSON.stringify({ error: 'Failed to refresh session' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const newSession = authData.session
    const user_id = newSession.user.id

    // Hash the new refresh token
    const newTokenData = encoder.encode(newSession.refresh_token)
    const newHashBuffer = await crypto.subtle.digest('SHA-256', newTokenData)
    const newHashArray = Array.from(new Uint8Array(newHashBuffer))
    const new_token_hash = newHashArray.map(b => b.toString(16).padStart(2, '0')).join('')

    // Revoke the old token
    await supabaseClient
      .from('refresh_tokens')
      .update({ 
        is_revoked: true, 
        revoked_at: new Date().toISOString() 
      })
      .eq('id', tokenRecord.id)

    // Store the new hashed refresh token
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    const { error: insertError } = await supabaseClient
      .from('refresh_tokens')
      .insert({
        user_id: user_id,
        token_hash: new_token_hash,
        device_info: device_info || {},
        expires_at: expiresAt.toISOString(),
        parent_token_hash: token_hash // Track token family
      })

    if (insertError) {
      console.error('Failed to store new refresh token:', insertError)
      return new Response(
        JSON.stringify({ error: 'Failed to store refresh token' }),
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

    // Update last used timestamp
    await supabaseClient
      .from('refresh_tokens')
      .update({ last_used_at: new Date().toISOString() })
      .eq('token_hash', new_token_hash)

    return new Response(
      JSON.stringify({
        access_token: newSession.access_token,
        refresh_token: newSession.refresh_token,
        expires_in: newSession.expires_in,
        expires_at: newSession.expires_at,
        user: newSession.user
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Refresh token rotation error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})