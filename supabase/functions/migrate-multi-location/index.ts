import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface MigrationSummary {
  groupsCreated: number;
  locationsCreated: number;
  usersUpdated: number;
  recipesUpdated: number;
  consumptionsUpdated: number;
  errors: string[];
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

    // Get user from JWT and verify admin access
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      console.error('Invalid user token:', userError)
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if user is admin
    const { data: isAdminResult, error: adminError } = await supabase.rpc('is_admin', { _user_id: user.id })
    
    if (adminError || !isAdminResult) {
      console.error('Non-admin user attempted migration:', user.id)
      return new Response(
        JSON.stringify({ error: 'Forbidden: Admin access required for migration' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Starting multi-location migration by admin user: ${user.id}`)

    const summary: MigrationSummary = {
      groupsCreated: 0,
      locationsCreated: 0,
      usersUpdated: 0,
      recipesUpdated: 0,
      consumptionsUpdated: 0,
      errors: []
    }

    // Parse request body for migration options
    const body = await req.json()
    const { dryRun = false, defaultGroupName = 'Main Café' } = body

    console.log(`Migration mode: ${dryRun ? 'DRY RUN' : 'LIVE'}, Default group: ${defaultGroupName}`)

    // Step 1: Check existing data and infer café structure
    console.log('Step 1: Analyzing existing data structure...')

    // Get all existing users to understand data scope
    const { data: existingUsers, error: usersError } = await supabase
      .from('users')
      .select('id, created_at')
      .is('group_id', null)

    if (usersError) {
      summary.errors.push(`Failed to fetch existing users: ${usersError.message}`)
    } else {
      console.log(`Found ${existingUsers?.length || 0} users without group assignment`)
    }

    // Get all existing recipes
    const { data: existingRecipes, error: recipesError } = await supabase
      .from('recipes')
      .select('id, name, created_at')
      .is('location_id', null)

    if (recipesError) {
      summary.errors.push(`Failed to fetch existing recipes: ${recipesError.message}`)
    } else {
      console.log(`Found ${existingRecipes?.length || 0} recipes without location assignment`)
    }

    // Get all existing consumptions
    const { data: existingConsumptions, error: consumptionsError } = await supabase
      .from('consumptions')
      .select('id, created_at')
      .is('location_id', null)

    if (consumptionsError) {
      summary.errors.push(`Failed to fetch existing consumptions: ${consumptionsError.message}`)
    } else {
      console.log(`Found ${existingConsumptions?.length || 0} consumptions without location assignment`)
    }

    // Step 2: Create default group and location if they don't exist
    console.log('Step 2: Creating default group and location...')

    if (!dryRun) {
      // Check if any groups already exist
      const { data: existingGroups, error: groupsCheckError } = await supabase
        .from('groups')
        .select('id, name')
        .limit(1)

      let defaultGroupId: string

      if (groupsCheckError) {
        summary.errors.push(`Failed to check existing groups: ${groupsCheckError.message}`)
        throw new Error('Migration failed during groups check')
      }

      if (existingGroups && existingGroups.length > 0) {
        // Use existing group
        defaultGroupId = existingGroups[0].id
        console.log(`Using existing group: ${existingGroups[0].name} (${defaultGroupId})`)
      } else {
        // Create new default group
        const { data: newGroup, error: groupCreateError } = await supabase
          .from('groups')
          .insert({ name: defaultGroupName })
          .select('id')
          .single()

        if (groupCreateError) {
          summary.errors.push(`Failed to create default group: ${groupCreateError.message}`)
          throw new Error('Migration failed during group creation')
        }

        defaultGroupId = newGroup.id
        summary.groupsCreated = 1
        console.log(`Created default group: ${defaultGroupName} (${defaultGroupId})`)
      }

      // Check if any locations exist for this group
      const { data: existingLocations, error: locationsCheckError } = await supabase
        .from('locations')
        .select('id, name, is_main')
        .eq('group_id', defaultGroupId)

      let defaultLocationId: string

      if (locationsCheckError) {
        summary.errors.push(`Failed to check existing locations: ${locationsCheckError.message}`)
        throw new Error('Migration failed during locations check')
      }

      const mainLocation = existingLocations?.find(loc => loc.is_main)
      
      if (mainLocation) {
        // Use existing main location
        defaultLocationId = mainLocation.id
        console.log(`Using existing main location: ${mainLocation.name} (${defaultLocationId})`)
      } else {
        // Create new default location
        const { data: newLocation, error: locationCreateError } = await supabase
          .from('locations')
          .insert({
            group_id: defaultGroupId,
            name: `${defaultGroupName} - Main Location`,
            is_main: true
          })
          .select('id')
          .single()

        if (locationCreateError) {
          summary.errors.push(`Failed to create default location: ${locationCreateError.message}`)
          throw new Error('Migration failed during location creation')
        }

        defaultLocationId = newLocation.id
        summary.locationsCreated = 1
        console.log(`Created default location: ${defaultGroupName} - Main Location (${defaultLocationId})`)
      }

      // Step 3: Backfill users
      console.log('Step 3: Backfilling user assignments...')

      if (existingUsers && existingUsers.length > 0) {
        const { error: usersUpdateError } = await supabase
          .from('users')
          .update({
            group_id: defaultGroupId,
            location_id: defaultLocationId
          })
          .is('group_id', null)

        if (usersUpdateError) {
          summary.errors.push(`Failed to update users: ${usersUpdateError.message}`)
        } else {
          summary.usersUpdated = existingUsers.length
          console.log(`Updated ${existingUsers.length} users with group and location`)
        }
      }

      // Step 4: Backfill recipes
      console.log('Step 4: Backfilling recipe locations...')

      if (existingRecipes && existingRecipes.length > 0) {
        const { error: recipesUpdateError } = await supabase
          .from('recipes')
          .update({ location_id: defaultLocationId })
          .is('location_id', null)

        if (recipesUpdateError) {
          summary.errors.push(`Failed to update recipes: ${recipesUpdateError.message}`)
        } else {
          summary.recipesUpdated = existingRecipes.length
          console.log(`Updated ${existingRecipes.length} recipes with location`)
        }
      }

      // Step 5: Backfill consumptions
      console.log('Step 5: Backfilling consumption locations...')

      if (existingConsumptions && existingConsumptions.length > 0) {
        const { error: consumptionsUpdateError } = await supabase
          .from('consumptions')
          .update({ location_id: defaultLocationId })
          .is('location_id', null)

        if (consumptionsUpdateError) {
          summary.errors.push(`Failed to update consumptions: ${consumptionsUpdateError.message}`)
        } else {
          summary.consumptionsUpdated = existingConsumptions.length
          console.log(`Updated ${existingConsumptions.length} consumptions with location`)
        }
      }

    } else {
      console.log('DRY RUN: Would have created/updated data structures')
      summary.groupsCreated = 1
      summary.locationsCreated = 1
      summary.usersUpdated = existingUsers?.length || 0
      summary.recipesUpdated = existingRecipes?.length || 0
      summary.consumptionsUpdated = existingConsumptions?.length || 0
    }

    // Final summary
    console.log('Migration completed successfully!')
    console.log(`Summary:
      - Groups created: ${summary.groupsCreated}
      - Locations created: ${summary.locationsCreated}
      - Users updated: ${summary.usersUpdated}
      - Recipes updated: ${summary.recipesUpdated}
      - Consumptions updated: ${summary.consumptionsUpdated}
      - Errors: ${summary.errors.length}`)

    if (summary.errors.length > 0) {
      console.error('Migration errors:', summary.errors)
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Migration completed ${dryRun ? '(DRY RUN)' : 'successfully'}`,
        summary,
        dryRun
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Unexpected error in migration function:', error)
    return new Response(
      JSON.stringify({ 
        success: false,
        error: 'Migration failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})