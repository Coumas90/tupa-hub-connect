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

    console.log(`Fetching recipes for user: ${user.id}, all_locations: ${allLocations}, location_id: ${locationId}`)

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
        let activeLocation = locations.find(loc => loc.id === userData.location_id) ||
                           locations.find(loc => loc.is_main === true) ||
                           locations[0]

        activeLocationId = activeLocation.id
        console.log(`Using active location: ${activeLocation.name} (${activeLocationId})`)
      }
    }

    // Build the recipes query
    let recipesQuery = supabase
      .from('recipes')
      .select(`
        id,
        name,
        created_at,
        updated_at,
        location_id,
        locations:location_id (
          id,
          name,
          group_id
        )
      `)
      .order('name')

    // Apply location filtering
    if (!allLocations && activeLocationId) {
      recipesQuery = recipesQuery.eq('location_id', activeLocationId)
    } else if (!allLocations && userGroupId) {
      // If no specific location but not all locations, filter by user's group
      recipesQuery = recipesQuery.in('location_id', 
        supabase
          .from('locations')
          .select('id')
          .eq('group_id', userGroupId)
      )
    }

    const { data: recipes, error: recipesError } = await recipesQuery

    if (recipesError) {
      console.error('Error fetching recipes:', recipesError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch recipes' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Retrieved ${recipes?.length || 0} recipes`)

    return new Response(
      JSON.stringify({
        success: true,
        data: recipes || [],
        meta: {
          total: recipes?.length || 0,
          filtered_by_location: !allLocations,
          active_location_id: activeLocationId,
          user_group_id: userGroupId
        }
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Unexpected error in recipes function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})