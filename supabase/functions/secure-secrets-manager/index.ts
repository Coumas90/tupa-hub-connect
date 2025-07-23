// Secure Secrets Manager for Production
// Handles secret injection with caching and security features

interface SecretRequest {
  secret_name: string;
  cache_ttl?: number; // Default 5 minutes
}

interface SecretResponse {
  success: boolean;
  cached: boolean;
  timestamp: string;
  error?: string;
}

// In-memory cache with TTL
const secretCache = new Map<string, { value: string; expires: number }>();

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

Deno.serve(async (req) => {
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
    const { secret_name, cache_ttl = 300 }: SecretRequest = await req.json();

    if (!secret_name) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Secret name is required' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 🔒 SECURITY: Validate secret name format (prevent injection)
    if (!/^[A-Z_][A-Z0-9_]*$/.test(secret_name)) {
      console.warn('⚠️ Invalid secret name format:', secret_name);
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Invalid secret name format' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const now = Date.now();
    const cacheKey = secret_name;

    // Check cache first
    const cached = secretCache.get(cacheKey);
    if (cached && cached.expires > now) {
      // 🔒 SECURITY: Never log actual secret values
      console.log(`✅ Secret cache hit: ${secret_name} (expires in ${Math.round((cached.expires - now) / 1000)}s)`);
      
      return new Response(JSON.stringify({
        success: true,
        cached: true,
        timestamp: new Date().toISOString()
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 🔑 Resolve from Supabase Secrets
    const secretValue = Deno.env.get(secret_name);
    
    if (!secretValue) {
      console.warn(`❌ Secret not found: ${secret_name}`);
      return new Response(JSON.stringify({ 
        success: false, 
        error: `Secret '${secret_name}' not configured in Supabase` 
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 💾 Cache the secret (5 minutes default)
    const ttlMs = cache_ttl * 1000;
    secretCache.set(cacheKey, {
      value: secretValue,
      expires: now + ttlMs
    });

    // 🧹 Cleanup expired cache entries
    for (const [key, entry] of secretCache.entries()) {
      if (entry.expires <= now) {
        secretCache.delete(key);
      }
    }

    // 🔒 SECURITY: Log access without exposing value
    console.log(`✅ Secret resolved and cached: ${secret_name} (TTL: ${cache_ttl}s)`);

    return new Response(JSON.stringify({
      success: true,
      cached: false,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    // 🔒 SECURITY: Don't expose internal errors
    console.error('❌ Secret manager error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Internal server error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

// Cache statistics for monitoring
setInterval(() => {
  const cacheSize = secretCache.size;
  const validEntries = Array.from(secretCache.values())
    .filter(entry => entry.expires > Date.now()).length;
  
  console.log(`📊 Secret cache stats: ${validEntries}/${cacheSize} valid entries`);
}, 60000); // Log every minute