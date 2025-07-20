import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get the authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      console.error('Missing authorization header')
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Missing auth header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Set the auth header for the client
    supabase.auth.setAuth(authHeader.replace('Bearer ', ''))

    // Get user from JWT
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      console.error('Invalid user token:', userError)
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse request body
    const body = await req.json()
    const { location_id } = body

    if (!location_id) {
      return new Response(
        JSON.stringify({ error: 'location_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Setting location for user ${user.id} to ${location_id}`)

    // Get user's current group to validate access
    const { data: userData, error: userDataError } = await supabase
      .from('users')
      .select('group_id')
      .eq('id', user.id)
      .single()

    if (userDataError) {
      console.error('Error fetching user data:', userDataError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch user data' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!userData?.group_id) {
      console.error(`User ${user.id} has no group assigned`)
      return new Response(
        JSON.stringify({ error: 'User not assigned to any group' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify that the requested location belongs to the user's group
    const { data: location, error: locationError } = await supabase
      .from('locations')
      .select('id, name, group_id')
      .eq('id', location_id)
      .single()

    if (locationError) {
      console.error('Error fetching location:', locationError)
      return new Response(
        JSON.stringify({ error: 'Invalid location specified' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if user has access to this location
    if (location.group_id !== userData.group_id) {
      console.error(`User ${user.id} attempted to access location ${location_id} outside their group`)
      return new Response(
        JSON.stringify({ error: 'Forbidden: Access denied to location outside your group' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Update user's location preference
    const { error: updateError } = await supabase
      .from('users')
      .update({ location_id: location_id })
      .eq('id', user.id)

    if (updateError) {
      console.error('Error updating user location:', updateError)
      return new Response(
        JSON.stringify({ error: 'Failed to update location preference' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Successfully set location for user ${user.id} to ${location.name} (${location_id})`)

    // Fetch updated context: group, all locations, and active location
    const { data: group, error: groupError } = await supabase
      .from('groups')
      .select('*')
      .eq('id', userData.group_id)
      .single()

    if (groupError) {
      console.error('Error fetching group for context:', groupError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch updated group context' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Fetch all locations for the user's group
    const { data: allLocations, error: locationsError } = await supabase
      .from('locations')
      .select('*')
      .eq('group_id', userData.group_id)
      .order('name')

    if (locationsError) {
      console.error('Error fetching locations for context:', locationsError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch updated locations context' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Find the active location (the one we just set)
    const activeLocation = allLocations.find(loc => loc.id === location_id) || null

    const updatedContext = {
      group,
      locations: allLocations,
      activeLocation
    }

    console.log(`Context updated - Group: ${group?.name}, Active Location: ${activeLocation?.name}, Total Locations: ${allLocations.length}`)

    return new Response(
      JSON.stringify({
        success: true,
        message: `Location switched to ${location.name}`,
        data: updatedContext
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Unexpected error in set-location function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})