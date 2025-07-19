// CSP Violation Report Handler
// Recibe y registra violaciones de Content Security Policy para análisis

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
}

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
    const report = await req.json();
    
    // Log the CSP violation report with detailed information
    console.warn('🔐 CSP Violation Report:', {
      timestamp: new Date().toISOString(),
      userAgent: req.headers.get('user-agent'),
      referer: req.headers.get('referer'),
      report: JSON.stringify(report, null, 2)
    });

    // Extract key violation details if available
    if (report['csp-report']) {
      const violation = report['csp-report'];
      console.warn('📊 Violation Details:', {
        blockedURI: violation['blocked-uri'],
        violatedDirective: violation['violated-directive'],
        originalPolicy: violation['original-policy'],
        documentURI: violation['document-uri'],
        sourceFile: violation['source-file'],
        lineNumber: violation['line-number']
      });
    }

    return new Response('Report received', { 
      status: 200, 
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/plain'
      }
    });

  } catch (error) {
    console.error('❌ Error processing CSP report:', error);
    return new Response('Error processing report', { 
      status: 500, 
      headers: corsHeaders 
    });
  }
});