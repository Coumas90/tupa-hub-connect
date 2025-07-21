import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting certificate email sending...');
    
    const { courseId, userId, userEmail, userName } = await req.json();
    
    if (!courseId || !userId || !userEmail) {
      throw new Error('Missing required parameters: courseId, userId, userEmail');
    }

    // Initialize clients
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      throw new Error('RESEND_API_KEY not configured');
    }
    const resend = new Resend(resendApiKey);

    console.log('Fetching course and certificate data...');

    // Fetch course details
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select(`
        *,
        instructor:instructors(name)
      `)
      .eq('id', courseId)
      .single();

    if (courseError) {
      console.error('Course fetch error:', courseError);
      throw new Error('Course not found');
    }

    // Fetch user progress to get certificate URL
    const { data: progress, error: progressError } = await supabase
      .from('user_course_progress')
      .select('certificate_url')
      .eq('course_id', courseId)
      .eq('user_id', userId)
      .single();

    if (progressError || !progress?.certificate_url) {
      console.error('Progress/certificate fetch error:', progressError);
      throw new Error('Certificate not found. Please generate the certificate first.');
    }

    // Download certificate content
    console.log('Downloading certificate content...');
    const certificateResponse = await fetch(progress.certificate_url);
    if (!certificateResponse.ok) {
      throw new Error('Failed to download certificate');
    }
    const certificateContent = await certificateResponse.text();

    // Generate email content
    const emailHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: 'Arial', sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .logo { color: #b5651d; font-size: 32px; font-weight: bold; margin-bottom: 10px; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 10px; margin: 20px 0; }
          .course-info { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #b5651d; }
          .button { display: inline-block; background: #b5651d; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; font-size: 12px; color: #666; margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">☕ TUPÁ HUB</div>
            <h1>¡Felicitaciones por tu certificación!</h1>
          </div>
          
          <div class="content">
            <p>Estimado/a ${userName || 'estudiante'},</p>
            
            <p>¡Nos complace informarte que has completado exitosamente el curso y has obtenido tu certificación oficial!</p>
            
            <div class="course-info">
              <h3>📚 Detalles del Curso Completado:</h3>
              <ul>
                <li><strong>Curso:</strong> ${course.title}</li>
                <li><strong>Instructor:</strong> ${course.instructor?.name || 'Instructor TUPÁ'}</li>
                <li><strong>Nivel:</strong> ${course.difficulty}</li>
                <li><strong>Duración:</strong> ${Math.floor(course.duration_minutes / 60)}h ${course.duration_minutes % 60}min</li>
              </ul>
            </div>
            
            <p>Tu certificado está adjunto a este correo y también puedes accederlo desde tu panel de estudiante en cualquier momento.</p>
            
            <a href="${progress.certificate_url}" class="button">Ver Certificado Online</a>
            
            <p><strong>¿Qué sigue ahora?</strong></p>
            <ul>
              <li>Explora nuestros otros cursos especializados</li>
              <li>Únete a nuestra comunidad de baristas profesionales</li>
              <li>Comparte tu logro en redes sociales</li>
            </ul>
          </div>
          
          <div class="footer">
            <p>TUPÁ Hub - Academia Cafetera Profesional<br>
            Certificación avalada por Specialty Coffee Association (SCA)</p>
            
            <p>Si tienes alguna pregunta, no dudes en contactarnos.<br>
            ¡Seguimos creciendo juntos en el mundo del café! ☕</p>
          </div>
        </div>
      </body>
      </html>
    `;

    console.log('Sending email with certificate...');

    // Send email with certificate as attachment
    const emailResponse = await resend.emails.send({
      from: "TUPÁ Hub <onboarding@resend.dev>",
      to: [userEmail],
      subject: `🏆 ¡Tu certificado del curso "${course.title}" está listo!`,
      html: emailHTML,
      attachments: [
        {
          filename: `certificado-${course.title.toLowerCase().replace(/\s+/g, '-')}.html`,
          content: certificateContent,
          content_type: 'text/html'
        }
      ]
    });

    console.log('Email sent successfully:', emailResponse);

    return new Response(JSON.stringify({
      success: true,
      emailId: emailResponse.data?.id,
      message: 'Certificate sent successfully via email'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in send-certificate function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});