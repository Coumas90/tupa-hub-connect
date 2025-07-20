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

    // Parse query parameters
    const url = new URL(req.url)
    const allLocations = url.searchParams.get('all_locations') === 'true'
    const locationId = url.searchParams.get('location_id')

    console.log(`Fetching clients for user: ${user.id}, all_locations: ${allLocations}, location_id: ${locationId}`)

    // Check if user is admin when requesting all locations
    if (allLocations) {
      const { data: isAdminResult, error: adminError } = await supabase.rpc('is_admin', { _user_id: user.id })
      
      if (adminError) {
        console.error('Error checking admin status:', adminError)
        return new Response(
          JSON.stringify({ error: 'Failed to verify admin status' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      if (!isAdminResult) {
        console.warn(`Non-admin user ${user.id} attempted to access all locations`)
        return new Response(
          JSON.stringify({ error: 'Forbidden: Admin access required for all locations' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      console.log(`Admin user ${user.id} accessing all locations`)
    }

    // Get location context if not requesting all locations
    let activeLocationId = null
    let userGroupId = null

    if (!allLocations) {
      // First get user's group info
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

      userGroupId = userData.group_id

      // If specific location requested, validate access
      if (locationId) {
        const { data: requestedLocation, error: locationError } = await supabase
          .from('locations')
          .select('id, group_id, name')
          .eq('id', locationId)
          .single()

        if (locationError) {
          console.error('Error fetching requested location:', locationError)
          return new Response(
            JSON.stringify({ error: 'Invalid location specified' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // Check if user has access to this location
        if (requestedLocation.group_id !== userGroupId) {
          console.error(`User ${user.id} attempted to access location ${locationId} outside their group`)
          return new Response(
            JSON.stringify({ error: 'Forbidden: Access denied to location outside your group' }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        activeLocationId = locationId
        console.log(`Using requested location: ${requestedLocation.name} (${locationId})`)
      } else {
        // Get user's available locations and determine active one
        const { data: locations, error: locationsError } = await supabase
          .from('locations')
          .select('*')
          .eq('group_id', userGroupId)
          .order('name')

        if (locationsError || !locations || locations.length === 0) {
          console.error('Error fetching user locations:', locationsError)
          return new Response(
            JSON.stringify({ error: 'No accessible locations found' }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // Determine active location (user's assigned location or main location)
        const activeLocation = locations.find(loc => loc.id === userData.location_id) ||
                              locations.find(loc => loc.is_main === true) ||
                              (locations.length > 0 ? locations[0] : null)

        if (!activeLocation) {
          return new Response(
            JSON.stringify({ error: 'No accessible location found for user' }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        activeLocationId = activeLocation.id
        console.log(`Using active location: ${activeLocation.name} (${activeLocationId})`)
      }
    }

    // Build the clients query - Note: clients table doesn't have location_id, so we return all clients
    // This assumes clients are global or we need to add location_id to clients table
    let clientsQuery = supabase
      .from('clients')
      .select(`
        id,
        name,
        email,
        phone,
        address,
        created_at,
        updated_at,
        created_by,
        updated_by
      `)
      .order('name')

    // Note: Since clients table doesn't have location_id, we're returning all clients
    // In a real implementation, you might want to:
    // 1. Add location_id to clients table, or
    // 2. Filter clients based on related orders/transactions by location
    // For now, we'll return all clients but include metadata about the filtering context

    const { data: clients, error: clientsError } = await clientsQuery

    if (clientsError) {
      console.error('Error fetching clients:', clientsError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch clients' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Retrieved ${clients?.length || 0} clients`)

    return new Response(
      JSON.stringify({
        success: true,
        data: clients || [],
        meta: {
          total: clients?.length || 0,
          filtered_by_location: !allLocations,
          active_location_id: activeLocationId,
          user_group_id: userGroupId,
          note: 'Clients are currently global. Consider adding location_id for location-specific filtering.'
        }
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Unexpected error in clients function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})