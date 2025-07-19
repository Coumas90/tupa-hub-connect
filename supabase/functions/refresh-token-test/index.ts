// Edge Function para simular refresh token con latencia controlada
// Solo para testing de carga - NO usar en producción

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
}

interface RefreshTokenRequest {
  refresh_token: string;
  user_id?: string;
  session_id?: string;
}

interface RefreshTokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
  user_id: string;
  session_id: string;
  issued_at: string;
  processing_time: number;
}

Deno.serve(async (req) => {
  const startTime = performance.now();
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { 
      status: 405, 
      headers: corsHeaders 
    });
  }

  try {
    // Simular latencia variable de procesamiento real
    const baseLatency = Math.random() * 100; // 0-100ms base
    const networkLatency = Math.random() * 50; // 0-50ms network sim
    const dbLatency = Math.random() * 30; // 0-30ms DB simulation
    
    const totalSimulatedLatency = baseLatency + networkLatency + dbLatency;
    await new Promise(resolve => setTimeout(resolve, totalSimulatedLatency));

    const body: RefreshTokenRequest = await req.json();
    
    // Validación básica
    if (!body.refresh_token) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing refresh_token',
          code: 'INVALID_REQUEST' 
        }), 
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Simular ocasionales errores de rate limiting (2% de las requests)
    if (Math.random() < 0.02) {
      return new Response(
        JSON.stringify({ 
          error: 'Rate limit exceeded',
          code: 'RATE_LIMIT',
          retry_after: 60 
        }), 
        { 
          status: 429, 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json',
            'Retry-After': '60'
          }
        }
      );
    }

    // Simular ocasionales errores de servidor (1% de las requests)
    if (Math.random() < 0.01) {
      console.error('🚨 Simulated server error for load testing');
      return new Response(
        JSON.stringify({ 
          error: 'Internal server error',
          code: 'SERVER_ERROR' 
        }), 
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Generar response exitoso
    const processingTime = performance.now() - startTime;
    const response: RefreshTokenResponse = {
      access_token: `test_token_${crypto.randomUUID()}`,
      expires_in: 3600, // 1 hora
      token_type: 'Bearer',
      user_id: body.user_id || crypto.randomUUID(),
      session_id: body.session_id || crypto.randomUUID(),
      issued_at: new Date().toISOString(),
      processing_time: Math.round(processingTime * 100) / 100 // 2 decimales
    };

    // Log para monitoreo durante el test
    console.log(`✅ Token refresh processed in ${response.processing_time}ms`);

    return new Response(
      JSON.stringify(response), 
      { 
        status: 200, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'X-Processing-Time': response.processing_time.toString()
        }
      }
    );

  } catch (error) {
    console.error('❌ Error in refresh-token-test:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Invalid JSON or processing error',
        code: 'PARSE_ERROR' 
      }), 
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});