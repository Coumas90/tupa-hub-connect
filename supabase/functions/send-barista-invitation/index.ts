import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.52.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface InvitationRequest {
  userEmail: string;
  userName: string;
  cafeName: string;
  token: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userEmail, userName, cafeName, token }: InvitationRequest = await req.json();

    console.log(`Sending invitation email to ${userEmail} for cafe ${cafeName}`);

    const activationUrl = `${Deno.env.get("SUPABASE_URL")?.replace('/supabase', '')}/activate-account?token=${token}`;

    const emailResponse = await resend.emails.send({
      from: "TUPÁ Hub <onboarding@resend.dev>",
      to: [userEmail],
      subject: `✨ ¡Bienvenido a TUPÁ Hub, ${userName}!`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .coffee-emoji { font-size: 2em; }
            .button { 
              display: inline-block; 
              padding: 12px 24px; 
              background-color: #8B5CF6; 
              color: white; 
              text-decoration: none; 
              border-radius: 8px; 
              font-weight: bold;
              margin: 20px 0;
            }
            .footer { margin-top: 30px; font-size: 0.9em; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="coffee-emoji">☕️</div>
              <h1>¡Bienvenido a TUPÁ Hub!</h1>
            </div>
            
            <p>Hola <strong>${userName}</strong> 👋,</p>
            
            <p>Fuiste invitado a formar parte de <strong>${cafeName}</strong> dentro del ecosistema TUPÁ ☕️</p>
            
            <p>TUPÁ es una plataforma creada para ayudar a cafeterías como la tuya a sacar el mejor café posible. Desde recetas, fichas técnicas, videos, hasta asistencia en tiempo real.</p>
            
            <p>👉 Hacé clic en el siguiente enlace para activar tu cuenta y acceder a todos los recursos:</p>
            
            <div style="text-align: center;">
              <a href="${activationUrl}" class="button">🔗 Unirme a TUPÁ Hub</a>
            </div>
            
            <p>Si no estabas esperando esta invitación, podés ignorar este correo.</p>
            
            <p>¡Nos vemos en el próximo espresso!</p>
            
            <div class="footer">
              <p><strong>El equipo de TUPÁ ☕️🌎</strong></p>
              <p><small>Este enlace expira en 48 horas. Si ya fue usado o expiró, contactá con tu responsable para reenviar la invitación.</small></p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ 
      success: true, 
      messageId: emailResponse.data?.id 
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-barista-invitation function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);