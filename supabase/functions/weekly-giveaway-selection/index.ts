import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Participant {
  id: string;
  customer_name: string;
  customer_email: string;
  location_id: string;
  participated_at: string;
  locations: {
    id: string;
    name: string;
    address: string;
  };
}

interface Winner {
  participant_id: string;
  location_id: string;
  region: string;
  prize_code: string;
  week_of: string;
  participant_name: string;
  participant_email: string;
  location_name: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🎉 Starting weekly giveaway selection process...');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const resendApiKey = Deno.env.get('RESEND_API_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const resend = new Resend(resendApiKey);

    // Get the current week start date (Monday)
    const now = new Date();
    const currentDay = now.getDay();
    const daysToMonday = currentDay === 0 ? 6 : currentDay - 1; // Sunday = 0, Monday = 1
    const mondayOfThisWeek = new Date(now);
    mondayOfThisWeek.setDate(now.getDate() - daysToMonday);
    mondayOfThisWeek.setHours(0, 0, 0, 0);
    
    const weekOfDate = mondayOfThisWeek.toISOString().split('T')[0];

    console.log(`📅 Processing giveaway for week of: ${weekOfDate}`);

    // Check if we already selected winners for this week
    const { data: existingWinners, error: checkError } = await supabase
      .from('giveaway_winners')
      .select('id')
      .eq('week_of', weekOfDate);

    if (checkError) {
      throw new Error(`Error checking existing winners: ${checkError.message}`);
    }

    if (existingWinners && existingWinners.length > 0) {
      console.log('⚠️ Winners already selected for this week');
      return new Response(JSON.stringify({
        success: true,
        message: 'Winners already selected for this week',
        week_of: weekOfDate,
        existing_winners: existingWinners.length
      }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Get all participants from the past week (to be eligible for current week's drawing)
    const weekAgo = new Date(mondayOfThisWeek);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const { data: participants, error: participantsError } = await supabase
      .from('giveaway_participants')
      .select(`
        id,
        customer_name,
        customer_email,
        location_id,
        participated_at,
        locations!inner (
          id,
          name,
          address
        )
      `)
      .gte('participated_at', weekAgo.toISOString())
      .lt('participated_at', mondayOfThisWeek.toISOString());

    if (participantsError) {
      throw new Error(`Error fetching participants: ${participantsError.message}`);
    }

    if (!participants || participants.length === 0) {
      console.log('📭 No participants found for the past week');
      return new Response(JSON.stringify({
        success: true,
        message: 'No participants found for the past week',
        week_of: weekOfDate,
        participants_count: 0
      }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    console.log(`👥 Found ${participants.length} participants for selection`);

    // Group participants by region (using location address as region approximation)
    const regionMap = new Map<string, Participant[]>();

    participants.forEach((participant: any) => {
      const region = participant.locations.address?.split(',').slice(-2).join(',').trim() || 'Unknown Region';
      if (!regionMap.has(region)) {
        regionMap.set(region, []);
      }
      regionMap.get(region)!.push(participant);
    });

    console.log(`🗺️ Found ${regionMap.size} regions: ${Array.from(regionMap.keys()).join(', ')}`);

    // Select one random winner per region
    const winners: Winner[] = [];
    
    for (const [region, regionParticipants] of regionMap.entries()) {
      if (regionParticipants.length === 0) continue;
      
      // Select random participant from this region
      const randomIndex = Math.floor(Math.random() * regionParticipants.length);
      const selectedParticipant = regionParticipants[randomIndex];
      
      // Generate prize code
      const { data: prizeCodeData, error: prizeCodeError } = await supabase
        .rpc('generate_prize_code');
      
      if (prizeCodeError) {
        throw new Error(`Error generating prize code: ${prizeCodeError.message}`);
      }
      
      const winner: Winner = {
        participant_id: selectedParticipant.id,
        location_id: selectedParticipant.location_id,
        region: region,
        prize_code: prizeCodeData,
        week_of: weekOfDate,
        participant_name: selectedParticipant.customer_name,
        participant_email: selectedParticipant.customer_email,
        location_name: selectedParticipant.locations.name
      };

      winners.push(winner);
      console.log(`🏆 Selected winner for ${region}: ${winner.participant_name} from ${winner.location_name}`);
    }

    // Insert winners into database
    const winnersToInsert = winners.map(winner => ({
      participant_id: winner.participant_id,
      location_id: winner.location_id,
      region: winner.region,
      prize_code: winner.prize_code,
      week_of: winner.week_of,
      prize_description: 'Café gratis y postre sorpresa'
    }));

    const { data: insertedWinners, error: insertError } = await supabase
      .from('giveaway_winners')
      .insert(winnersToInsert)
      .select();

    if (insertError) {
      throw new Error(`Error inserting winners: ${insertError.message}`);
    }

    console.log(`✅ Successfully inserted ${insertedWinners?.length || 0} winners into database`);

    // Send congratulatory emails to winners
    const emailPromises = winners.map(async (winner) => {
      try {
        const emailResponse = await resend.emails.send({
          from: 'TUPÁ <premios@tupa.com>',
          to: [winner.participant_email],
          subject: '🎉 ¡Felicitaciones! Eres ganador del sorteo semanal TUPÁ',
          html: `
            <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; background: linear-gradient(135deg, #8B5CF6 0%, #06B6D4 100%); padding: 40px 20px;">
              <div style="background: white; border-radius: 16px; padding: 40px; box-shadow: 0 10px 30px rgba(0,0,0,0.1);">
                <!-- Header -->
                <div style="text-align: center; margin-bottom: 40px;">
                  <div style="background: linear-gradient(135deg, #8B5CF6, #06B6D4); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-size: 48px; font-weight: bold; margin-bottom: 10px;">
                    TUPÁ
                  </div>
                  <div style="font-size: 24px; color: #333; margin-bottom: 20px;">🎉 ¡Felicitaciones!</div>
                </div>

                <!-- Winner Info -->
                <div style="background: #f8fafc; border-radius: 12px; padding: 30px; margin-bottom: 30px; border-left: 6px solid #8B5CF6;">
                  <h2 style="color: #333; margin: 0 0 15px 0; font-size: 20px;">Hola ${winner.participant_name},</h2>
                  <p style="color: #666; font-size: 16px; line-height: 1.6; margin: 0;">
                    ¡Eres el ganador del sorteo semanal TUPÁ! Te has ganado un café gratis y un postre sorpresa en 
                    <strong style="color: #8B5CF6;">${winner.location_name}</strong>.
                  </p>
                </div>

                <!-- Prize Code -->
                <div style="text-align: center; margin: 40px 0;">
                  <div style="background: linear-gradient(135deg, #8B5CF6, #06B6D4); border-radius: 12px; padding: 20px; margin-bottom: 20px;">
                    <div style="color: white; font-size: 14px; margin-bottom: 10px; opacity: 0.9;">Tu código de premio:</div>
                    <div style="background: rgba(255,255,255,0.2); border-radius: 8px; padding: 15px; font-family: monospace; font-size: 24px; color: white; font-weight: bold; letter-spacing: 2px;">
                      ${winner.prize_code}
                    </div>
                  </div>
                  <p style="color: #666; font-size: 14px; margin: 0;">
                    Presenta este código al personal de la cafetería para reclamar tu premio.
                  </p>
                </div>

                <!-- Instructions -->
                <div style="background: #fef3c7; border-radius: 12px; padding: 25px; margin-bottom: 30px; border-left: 6px solid #f59e0b;">
                  <h3 style="color: #92400e; margin: 0 0 15px 0; font-size: 18px;">📋 Instrucciones:</h3>
                  <ul style="color: #92400e; margin: 0; padding-left: 20px;">
                    <li style="margin-bottom: 8px;">Dirígete a <strong>${winner.location_name}</strong></li>
                    <li style="margin-bottom: 8px;">Muestra este código al personal</li>
                    <li style="margin-bottom: 8px;">Válido hasta el próximo domingo a las 11:59 PM</li>
                    <li>No transferible ni canjeable por dinero</li>
                  </ul>
                </div>

                <!-- Footer -->
                <div style="text-align: center; padding-top: 30px; border-top: 2px solid #f1f5f9;">
                  <p style="color: #64748b; font-size: 14px; margin: 0 0 10px 0;">
                    ¡Gracias por participar en TUPÁ!
                  </p>
                  <p style="color: #94a3b8; font-size: 12px; margin: 0;">
                    Este es un email automático, por favor no respondas.
                  </p>
                </div>
              </div>
            </div>
          `,
        });

        console.log(`📧 Email sent to ${winner.participant_email}:`, emailResponse);

        // Update email status in database
        await supabase
          .from('giveaway_winners')
          .update({
            email_sent_at: new Date().toISOString(),
            email_status: 'sent'
          })
          .eq('participant_id', winner.participant_id)
          .eq('week_of', winner.week_of);

        return { success: true, email: winner.participant_email };
      } catch (emailError) {
        console.error(`❌ Failed to send email to ${winner.participant_email}:`, emailError);
        
        // Update email status as failed
        await supabase
          .from('giveaway_winners')
          .update({
            email_status: 'failed'
          })
          .eq('participant_id', winner.participant_id)
          .eq('week_of', winner.week_of);

        return { success: false, email: winner.participant_email, error: emailError.message };
      }
    });

    const emailResults = await Promise.all(emailPromises);
    const sentEmails = emailResults.filter(result => result.success).length;
    const failedEmails = emailResults.filter(result => !result.success).length;

    console.log(`📊 Email results: ${sentEmails} sent, ${failedEmails} failed`);

    return new Response(JSON.stringify({
      success: true,
      message: 'Weekly giveaway selection completed successfully',
      week_of: weekOfDate,
      winners_count: winners.length,
      regions: Array.from(regionMap.keys()),
      emails_sent: sentEmails,
      emails_failed: failedEmails,
      winners: winners.map(w => ({
        name: w.participant_name,
        location: w.location_name,
        region: w.region,
        prize_code: w.prize_code
      }))
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });

  } catch (error: any) {
    console.error('❌ Error in weekly giveaway selection:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
};

serve(handler);