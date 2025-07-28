import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface LocationContext {
  group: any;
  locations: any[];
  activeLocation: any;
}

interface RequestBody {
  preferredLocationId?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
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
    const token = authHeader.replace('Bearer ', '')
    if (!token) {
      console.error('Empty token after Bearer removal')
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Invalid token format' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    supabase.auth.setAuth(token)

    // Get user from JWT
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      console.error('Invalid user token:', userError)
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Processing location context for user: ${user.id}`)

    // Get request body for active location preference
    let requestBody: RequestBody = {}
    if (req.method === 'POST') {
      try {
        requestBody = await req.json()
      } catch (e) {
        console.log('No JSON body provided, using defaults')
      }
    }

    // Fetch user's group and location info
    const { data: userData, error: userDataError } = await supabase
      .from('users')
      .select('group_id, location_id')
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

    // Fetch group details
    const { data: group, error: groupError } = await supabase
      .from('groups')
      .select('*')
      .eq('id', userData.group_id)
      .single()

    if (groupError) {
      console.error('Error fetching group:', groupError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch group data' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Fetch available locations for the group
    const { data: locations, error: locationsError } = await supabase
      .from('locations')
      .select('*')
      .eq('group_id', userData.group_id)
      .order('name')

    if (locationsError) {
      console.error('Error fetching locations:', locationsError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch locations' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!locations || locations.length === 0) {
      console.error(`No locations found for group ${userData.group_id}`)
      return new Response(
        JSON.stringify({ error: 'No locations available for user group' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Determine active location
    let activeLocation: any = null

    // 1. Try session/request preference
    if (requestBody.preferredLocationId) {
      activeLocation = locations.find(loc => loc.id === requestBody.preferredLocationId) || null
      if (!activeLocation) {
        console.warn(`Preferred location ${requestBody.preferredLocationId} not available for user`)
      }
    }

    // 2. Try user's assigned location
    if (!activeLocation && userData.location_id) {
      activeLocation = locations.find(loc => loc.id === userData.location_id) || null
      if (!activeLocation) {
        console.warn(`User's assigned location ${userData.location_id} not found in available locations`)
      }
    }

    // 3. Default to main location
    if (!activeLocation) {
      activeLocation = locations.find(loc => loc.is_main === true) || null
    }

    // 4. Fallback to first available location
    if (!activeLocation && locations.length > 0) {
      activeLocation = locations[0]
    }

    if (!activeLocation) {
      console.error('No active location could be determined')
      return new Response(
        JSON.stringify({ error: 'No accessible location found' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify user has access to the active location (non-null assertion safe here due to check above)
    const hasAccess = locations.some(loc => loc.id === activeLocation!.id)
    if (!hasAccess) {
      console.error(`User ${user.id} lacks access to location ${activeLocation!.id}`)
      return new Response(
        JSON.stringify({ error: 'Access denied to requested location' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const locationContext: LocationContext = {
      group,
      locations,
      activeLocation: activeLocation!  // Non-null assertion safe due to check above
    }

    console.log(`Location context loaded - Group: ${group?.name}, Active Location: ${activeLocation!.name}, Available Locations: ${locations.length}`)

    return new Response(
      JSON.stringify({
        success: true,
        data: locationContext,
        user: {
          id: user.id,
          email: user.email
        }
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Unexpected error in location-context function:', error)
    
    // Enhanced error logging for debugging
    if (error instanceof Error) {
      console.error('Error name:', error.name)
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)
    }
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        ...(Deno.env.get('DENO_ENV') === 'development' && { 
          details: error instanceof Error ? error.message : String(error) 
        })
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})