import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BackfillResult {
  table: string;
  records_updated: number;
  success: boolean;
  error?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get the first admin user to use as the default created_by/updated_by
    const { data: adminUsers, error: adminError } = await supabaseClient
      .from('user_roles')
      .select('user_id')
      .eq('role', 'admin')
      .limit(1);

    if (adminError) {
      console.error('Error fetching admin user:', adminError);
      return new Response(JSON.stringify({ error: 'Could not find admin user' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const adminUserId = adminUsers?.[0]?.user_id;
    if (!adminUserId) {
      return new Response(JSON.stringify({ error: 'No admin user found' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // List of tables to backfill
    const tablesToBackfill = [
      'locations',
      'groups', 
      'users',
      'instructors',
      'course_modules',
      'quizzes',
      'quiz_questions',
      'user_course_progress',
      'user_quiz_attempts',
      'client_configs',
      'integration_logs',
      'pos_sync_logs',
      'pos_sync_status'
    ];

    const results: BackfillResult[] = [];

    for (const table of tablesToBackfill) {
      try {
        console.log(`Backfilling audit fields for table: ${table}`);

        // Update records where created_by or updated_by is null
        const { error: updateError, count } = await supabaseClient
          .from(table)
          .update({
            created_by: adminUserId,
            updated_by: adminUserId
          })
          .or('created_by.is.null,updated_by.is.null');

        if (updateError) {
          console.error(`Error updating ${table}:`, updateError);
          results.push({
            table,
            records_updated: 0,
            success: false,
            error: updateError.message
          });
        } else {
          console.log(`Updated ${count || 0} records in ${table}`);
          results.push({
            table,
            records_updated: count || 0,
            success: true
          });
        }
      } catch (error) {
        console.error(`Error processing table ${table}:`, error);
        results.push({
          table,
          records_updated: 0,
          success: false,
          error: error.message
        });
      }
    }

    const totalUpdated = results.reduce((sum, result) => sum + result.records_updated, 0);
    const successfulTables = results.filter(r => r.success).length;

    return new Response(JSON.stringify({
      message: 'Audit fields backfill completed',
      total_records_updated: totalUpdated,
      successful_tables: successfulTables,
      total_tables: tablesToBackfill.length,
      results
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Backfill error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});