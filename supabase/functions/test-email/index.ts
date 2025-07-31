import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Testing Resend email service...");

    // Initialize Resend
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    
    if (!resendApiKey) {
      console.error("RESEND_API_KEY is not set");
      return new Response(
        JSON.stringify({ 
          error: "RESEND_API_KEY no configurado",
          success: false 
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log("RESEND_API_KEY found, initializing client...");
    const resend = new Resend(resendApiKey);

    const { email } = await req.json();
    const testEmail = email || "comasnicolas+10@gmail.com";

    console.log(`Sending test email to: ${testEmail}`);

    // Send test email
    const emailResponse = await resend.emails.send({
      from: "TUPÁ Hub <noreply@resend.dev>",
      to: [testEmail],
      subject: "✅ Configuración de Email Confirmada - TUPÁ Hub",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #8B5A3C;">¡Email configurado correctamente!</h1>
          <p>Este es un email de prueba para confirmar que la configuración de Resend está funcionando correctamente en TUPÁ Hub.</p>
          <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 20px 0;">
            <h3>✅ Funcionalidades verificadas:</h3>
            <ul>
              <li>API Key de Resend válida</li>
              <li>Envío de emails funcionando</li>
              <li>Sistema de recuperación de contraseñas listo</li>
            </ul>
          </div>
          <p style="color: #6b7280; font-size: 14px;">
            Si recibes este email, tu sistema está listo para enviar emails de recuperación de contraseñas.
          </p>
          <p style="color: #6b7280; font-size: 14px;">
            Timestamp: ${new Date().toISOString()}
          </p>
        </div>
      `,
    });

    console.log("Email response:", emailResponse);

    if (emailResponse.error) {
      console.error("Resend error:", emailResponse.error);
      return new Response(
        JSON.stringify({ 
          error: "Error de Resend",
          details: emailResponse.error,
          success: false 
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: "Email de prueba enviado exitosamente",
        emailId: emailResponse.data?.id,
        response: emailResponse.data
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error("Error in test-email function:", error);
    return new Response(
      JSON.stringify({ 
        error: "Error interno",
        details: error.message,
        success: false 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);