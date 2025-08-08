import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userEmail, userName, cafeName, token }: InvitationRequest = await req.json();

    const activationUrl = `${Deno.env.get("SUPABASE_URL")?.replace('/supabase', '')}/activate-account?token=${token}`;

    const emailResponse = await resend.emails.send({
      from: "TUPÁ Hub <onboarding@resend.dev>",
      to: [userEmail],
      subject: `🚀 Acceso de propietario a TUPÁ Hub`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .button { display:inline-block; padding:12px 24px; background-color:#8B5CF6; color:#fff; text-decoration:none; border-radius:8px; font-weight:bold; margin:20px 0; }
            .footer { margin-top: 30px; font-size: 0.9em; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Invitación como Propietario</h1>
              <p>Cliente: <strong>${cafeName}</strong></p>
            </div>
            <p>Hola <strong>${userName}</strong>,</p>
            <p>Te invitamos a unirte a TUPÁ Hub como <strong>Owner</strong> de <strong>${cafeName}</strong>. Desde aquí podrás gestionar tu equipo, recetas, consumo y pedidos.</p>
            <p>Para comenzar, activá tu cuenta haciendo clic en el siguiente botón:</p>
            <div style="text-align:center;">
              <a href="${activationUrl}" class="button">Activar mi cuenta</a>
            </div>
            <p>Si no esperabas esta invitación, podés ignorar este correo.</p>
            <div class="footer">
              <p>Equipo TUPÁ Hub</p>
              <p><small>Este enlace expira en 48 horas.</small></p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    return new Response(JSON.stringify({ success: true, messageId: emailResponse.data?.id }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("send-owner-invitation error", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
