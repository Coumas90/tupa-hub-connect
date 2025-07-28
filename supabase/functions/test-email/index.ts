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

    // Send simple test email
    const emailResponse = await resend.emails.send({
      from: "Test <onboarding@resend.dev>",
      to: [testEmail],
      subject: "Test Email - TUPÁ Hub",
      html: `
        <h1>Test Email</h1>
        <p>Si recibes este email, Resend está funcionando correctamente.</p>
        <p>Timestamp: ${new Date().toISOString()}</p>
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