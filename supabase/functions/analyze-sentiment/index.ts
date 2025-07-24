import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
}

interface SentimentRequest {
  feedback_id: string;
  text: string;
}

interface N8nSentimentResponse {
  sentiment: string;
  confidence: number;
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
    const { feedback_id, text }: SentimentRequest = await req.json();

    if (!feedback_id || !text) {
      return new Response(JSON.stringify({ 
        error: 'Missing required fields: feedback_id and text' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get n8n webhook URL from secrets
    const n8nWebhookUrl = Deno.env.get('N8N_WEBHOOK_URL');
    if (!n8nWebhookUrl) {
      console.error('N8N_WEBHOOK_URL not configured');
      return new Response(JSON.stringify({ 
        error: 'Sentiment analysis service not configured' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`🔍 Analyzing sentiment for feedback ${feedback_id}`);

    // Call n8n workflow for sentiment analysis
    const n8nResponse = await fetch(n8nWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: text,
        model: 'cardiffnlp/twitter-roberta-base-sentiment'
      }),
    });

    if (!n8nResponse.ok) {
      console.error('N8n workflow failed:', n8nResponse.status, n8nResponse.statusText);
      return new Response(JSON.stringify({ 
        error: 'Sentiment analysis failed' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const sentimentResult: N8nSentimentResponse = await n8nResponse.json();
    console.log(`📊 Sentiment result:`, sentimentResult);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Update feedback with sentiment
    const { error: updateError } = await supabase
      .from('feedbacks')
      .update({ 
        sentiment: sentimentResult.sentiment 
      })
      .eq('id', feedback_id);

    if (updateError) {
      console.error('Error updating feedback sentiment:', updateError);
      return new Response(JSON.stringify({ 
        error: 'Failed to update feedback sentiment' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`✅ Updated feedback ${feedback_id} with sentiment: ${sentimentResult.sentiment}`);

    return new Response(JSON.stringify({
      success: true,
      feedback_id,
      sentiment: sentimentResult.sentiment,
      confidence: sentimentResult.confidence
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Sentiment analysis error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});