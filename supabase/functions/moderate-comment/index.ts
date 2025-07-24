import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
}

interface ModerationRequest {
  feedback_id: string;
  comment: string;
  sentiment?: string;
}

interface N8nModerationResponse {
  toxicity_score: number;
  toxicity_label: string;
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
    const { feedback_id, comment, sentiment }: ModerationRequest = await req.json();

    if (!feedback_id || !comment) {
      return new Response(JSON.stringify({ 
        error: 'Missing required fields: feedback_id and comment' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`🔍 Starting AI moderation for feedback ${feedback_id}`);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get n8n webhook URL for toxicity analysis
    const n8nWebhookUrl = Deno.env.get('N8N_WEBHOOK_URL');
    if (!n8nWebhookUrl) {
      console.error('N8N_WEBHOOK_URL not configured');
      return new Response(JSON.stringify({ 
        error: 'AI moderation service not configured' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Call n8n workflow for toxicity detection using unitary/toxic-bert
    console.log('📡 Calling n8n for toxicity analysis...');
    const n8nResponse = await fetch(n8nWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: comment,
        model: 'unitary/toxic-bert',
        task: 'toxicity-detection'
      }),
    });

    if (!n8nResponse.ok) {
      console.error('N8n toxicity analysis failed:', n8nResponse.status, n8nResponse.statusText);
      // Create pending review with unknown toxicity
      await createPendingReview(supabase, feedback_id, comment, null, sentiment, true, 'toxicity-analysis-failed');
      return new Response(JSON.stringify({ 
        error: 'Toxicity analysis failed, sent to manual review' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const toxicityResult: N8nModerationResponse = await n8nResponse.json();
    console.log(`📊 Toxicity analysis result:`, toxicityResult);

    const toxicityScore = toxicityResult.toxicity_score * 100; // Convert to percentage
    const isLowToxicity = toxicityScore < 10; // Less than 10%
    const isPositiveSentiment = sentiment !== 'negative';

    // Auto-approval logic: low toxicity AND not negative sentiment
    const shouldAutoApprove = isLowToxicity && isPositiveSentiment;
    
    let moderationReason = '';
    if (!isLowToxicity) {
      moderationReason = `High toxicity score: ${toxicityScore.toFixed(2)}%`;
    } else if (!isPositiveSentiment) {
      moderationReason = `Negative sentiment detected: ${sentiment}`;
    }

    console.log(`🤖 Auto-approval decision: ${shouldAutoApprove ? 'APPROVED' : 'MANUAL_REVIEW'}`);
    console.log(`📈 Toxicity: ${toxicityScore.toFixed(2)}%, Sentiment: ${sentiment || 'unknown'}`);

    // Create pending review record
    await createPendingReview(
      supabase, 
      feedback_id, 
      comment, 
      toxicityScore, 
      sentiment || null,
      !shouldAutoApprove, // needs_validation
      shouldAutoApprove, // is_approved (null if needs validation)
      moderationReason,
      shouldAutoApprove // auto_approved
    );

    // Update feedback status based on decision
    const feedbackStatus = shouldAutoApprove ? 'approved' : 'under_review';
    const { error: updateError } = await supabase
      .from('feedbacks')
      .update({ comment_status: feedbackStatus })
      .eq('id', feedback_id);

    if (updateError) {
      console.error('Error updating feedback status:', updateError);
    }

    return new Response(JSON.stringify({
      success: true,
      feedback_id,
      auto_approved: shouldAutoApprove,
      toxicity_score: toxicityScore,
      sentiment: sentiment || null,
      status: feedbackStatus,
      reason: moderationReason || 'Auto-approved: low toxicity and positive sentiment'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ AI moderation error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

// Helper function to create pending review record
async function createPendingReview(
  supabase: any,
  feedbackId: string,
  comment: string,
  toxicityScore: number | null,
  sentiment: string | null,
  needsValidation: boolean,
  isApproved: boolean | null = null,
  moderationReason: string = '',
  autoApproved: boolean = false
) {
  const { error } = await supabase
    .from('pending_reviews')
    .insert({
      feedback_id: feedbackId,
      original_comment: comment,
      toxicity_score: toxicityScore,
      sentiment_result: sentiment,
      needs_validation: needsValidation,
      is_approved: isApproved,
      auto_approved: autoApproved,
      moderation_reason: moderationReason || null,
      reviewed_at: isApproved !== null ? new Date().toISOString() : null
    });

  if (error) {
    console.error('Error creating pending review:', error);
    throw error;
  }

  console.log(`✅ Created pending review for feedback ${feedbackId}`);
}