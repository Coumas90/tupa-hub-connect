import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface PasswordResetRequest {
  email: string;
  resetUrl: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      {
        status: 405,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }

  try {
    // Initialize Supabase client with service role
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Initialize Resend
    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

    const { email, resetUrl }: PasswordResetRequest = await req.json();

    if (!email || !resetUrl) {
      return new Response(
        JSON.stringify({ error: "Email and resetUrl are required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log(`Processing password reset for email: ${email}`);

    // For security reasons, we always return success even if email doesn't exist
    // This prevents email enumeration attacks
    
    // Generate unique token
    const token = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10); // 10 minutes from now

    // Check if we can find a user with this email in our database
    // We'll use a simple approach - try to insert the token and if it works, send email
    try {
      // Clean up expired tokens and save new token
      const { error: insertError } = await supabase
        .from("password_reset_tokens")
        .insert({
          user_email: email,
          token: token,
          expires_at: expiresAt.toISOString(),
        });

      if (insertError) {
        console.error("Error saving reset token:", insertError);
        // Still return success for security
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: "Si el email existe, recibirás un enlace de recuperación" 
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        );
      }

      // Send email with reset link
      const resetLink = `${resetUrl}?token=${token}`;
      
      const emailResponse = await resend.emails.send({
        from: "TUPÁ Hub <onboarding@resend.dev>",
        to: [email],
        subject: "Recupera tu contraseña - TUPÁ Hub",
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Recuperar Contraseña - TUPÁ Hub</title>
            <style>
              body { 
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; 
                margin: 0; 
                padding: 0; 
                background-color: #f8f9fa;
              }
              .container { 
                max-width: 600px; 
                margin: 0 auto; 
                background-color: #ffffff;
                border-radius: 8px;
                overflow: hidden;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
              }
              .header { 
                background: linear-gradient(135deg, #8B5A3C, #D4A574);
                color: white; 
                padding: 32px; 
                text-align: center;
              }
              .header h1 { 
                margin: 0; 
                font-size: 28px; 
                font-weight: bold;
              }
              .content { 
                padding: 32px; 
              }
              .content h2 {
                color: #8B5A3C;
                margin-top: 0;
                margin-bottom: 16px;
              }
              .content p {
                color: #4a5568;
                line-height: 1.6;
                margin-bottom: 16px;
              }
              .reset-button {
                display: inline-block;
                background: linear-gradient(135deg, #8B5A3C, #D4A574);
                color: white !important;
                text-decoration: none;
                padding: 16px 32px;
                border-radius: 8px;
                font-weight: bold;
                margin: 24px 0;
                text-align: center;
              }
              .warning {
                background-color: #fff3cd;
                border: 1px solid #ffeaa7;
                border-radius: 6px;
                padding: 16px;
                margin: 24px 0;
                color: #856404;
              }
              .footer {
                background-color: #f8f9fa;
                padding: 24px;
                text-align: center;
                color: #6c757d;
                font-size: 14px;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>☕ TUPÁ Hub</h1>
              </div>
              <div class="content">
                <h2>Recuperar Contraseña</h2>
                <p>Hola,</p>
                <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta TUPÁ Hub.</p>
                <p>Haz clic en el siguiente botón para crear una nueva contraseña:</p>
                
                <div style="text-align: center;">
                  <a href="${resetLink}" class="reset-button">
                    Restablecer Contraseña
                  </a>
                </div>
                
                <div class="warning">
                  <strong>⏰ Importante:</strong> Este enlace expira en 10 minutos por seguridad.
                </div>
                
                <p>Si no solicitaste este cambio, puedes ignorar este email. Tu contraseña permanecerá sin cambios.</p>
                
                <p>Por tu seguridad, nunca compartas este enlace con nadie.</p>
                
                <p>Saludos,<br>El equipo de TUPÁ Hub</p>
              </div>
              <div class="footer">
                <p>© 2025 TUPÁ Hub. Conectando el mundo del café de especialidad.</p>
                <p>Si tienes problemas con el botón, copia y pega este enlace en tu navegador:</p>
                <p style="word-break: break-all; color: #8B5A3C;">${resetLink}</p>
              </div>
            </div>
          </body>
          </html>
        `,
      });

      console.log("Password reset email sent successfully:", emailResponse);

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Email de recuperación enviado exitosamente",
          expiresIn: "10 minutos" 
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );

    } catch (emailError: any) {
      console.error("Error sending email:", emailError);
      // Still return success for security
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Si el email existe, recibirás un enlace de recuperación" 
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

  } catch (error: any) {
    console.error("Error in password-reset function:", error);
    return new Response(
      JSON.stringify({ 
        error: "Error interno del servidor",
        details: error.message 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);