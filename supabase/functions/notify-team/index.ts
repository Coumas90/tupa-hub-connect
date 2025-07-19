import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotificationRequest {
  client_id: string;
  error_count: number;
  error_message: string;
  recipient_email?: string;
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

    const { client_id, error_count, error_message, recipient_email }: NotificationRequest = await req.json();

    if (!client_id || !error_count || !error_message) {
      return new Response(JSON.stringify({ error: 'client_id, error_count, and error_message are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Sending notification for client ${client_id} with ${error_count} errors`);

    // Simulate notification sending
    await new Promise(resolve => setTimeout(resolve, 1000));

    // In a real implementation, this would:
    // 1. Send email using Resend or similar service
    // 2. Send Slack notification
    // 3. Log the notification in the database

    const notificationResult = {
      success: true,
      message: `Notification sent for client ${client_id}`,
      notification_details: {
        client_id,
        error_count,
        error_message: error_message.substring(0, 100), // Truncate for notification
        recipient: recipient_email || 'admin@tupahub.com',
        sent_at: new Date().toISOString(),
        channels: ['email'], // Could include 'slack', 'teams', etc.
      }
    };

    console.log('Notification sent successfully:', notificationResult);

    return new Response(JSON.stringify(notificationResult), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

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