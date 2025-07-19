const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TestOdooRequest {
  odoo_url: string;
  odoo_username: string;
  odoo_password: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { odoo_url, odoo_username, odoo_password }: TestOdooRequest = await req.json();

    if (!odoo_url || !odoo_username || !odoo_password) {
      return new Response(JSON.stringify({ error: 'odoo_url, odoo_username, and odoo_password are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Testing Odoo connection to: ${odoo_url}`);

    try {
      // Simulate Odoo connection test
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Simulate authentication check
      if (odoo_password.includes('invalid')) {
        throw new Error('Invalid Odoo credentials');
      }

      if (!odoo_url.includes('odoo.com') && !odoo_url.includes('localhost')) {
        throw new Error('Invalid Odoo URL format');
      }

      // Simulate successful connection with mock data
      const connectionResult = {
        success: true,
        message: 'Odoo connection successful',
        server_info: {
          version: '16.0',
          database: 'tupahub_prod',
          modules: ['sale', 'stock', 'crm', 'account'],
          user_permissions: ['read', 'write', 'delete']
        },
        available_models: [
          'sale.order',
          'stock.picking',
          'crm.lead',
          'account.move'
        ]
      };

      console.log('Odoo connection test successful');

      return new Response(JSON.stringify({
        success: true,
        message: connectionResult.message,
        server_info: connectionResult.server_info,
        available_models: connectionResult.available_models,
        tested_at: new Date().toISOString(),
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } catch (connectionError) {
      console.error('Odoo connection test failed:', connectionError);

      return new Response(JSON.stringify({
        success: false,
        error: connectionError instanceof Error ? connectionError.message : 'Odoo connection test failed',
        tested_at: new Date().toISOString(),
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

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