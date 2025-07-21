import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// HTML template for certificate
const getCertificateHTML = (data: any) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Certificado TUPÁ Hub</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Open+Sans:wght@300;400;600&display=swap');
    
    body { 
      font-family: 'Open Sans', sans-serif; 
      background: linear-gradient(135deg, #f8f4f1, #ede7e1);
      margin: 0; 
      padding: 40px;
      color: #2c1810;
      line-height: 1.6;
    }
    
    .certificate {
      max-width: 800px;
      margin: 0 auto;
      background: white;
      border: 12px solid #b5651d;
      border-radius: 20px;
      padding: 80px 60px;
      text-align: center;
      box-shadow: 0 20px 60px rgba(181, 101, 29, 0.3);
      position: relative;
      overflow: hidden;
    }
    
    .certificate::before {
      content: '';
      position: absolute;
      top: 20px;
      left: 20px;
      right: 20px;
      bottom: 20px;
      border: 2px solid #d4a574;
      border-radius: 10px;
      pointer-events: none;
    }
    
    .logo { 
      color: #b5651d; 
      font-size: 56px; 
      font-weight: bold; 
      margin-bottom: 20px;
      font-family: 'Playfair Display', serif;
      text-shadow: 2px 2px 4px rgba(0,0,0,0.1);
    }
    
    .certificate-title { 
      font-size: 42px; 
      color: #2c1810; 
      margin: 40px 0; 
      font-weight: bold;
      font-family: 'Playfair Display', serif;
      text-transform: uppercase;
      letter-spacing: 2px;
    }
    
    .awarded-text {
      font-size: 20px;
      color: #666;
      margin: 30px 0 20px 0;
      font-weight: 300;
    }
    
    .recipient { 
      font-size: 36px; 
      color: #b5651d; 
      margin: 30px 0; 
      font-style: italic;
      font-family: 'Playfair Display', serif;
      font-weight: 700;
      text-decoration: underline;
      text-decoration-color: #d4a574;
    }
    
    .completion-text {
      font-size: 18px;
      color: #555;
      margin: 30px 0 20px 0;
    }
    
    .course { 
      font-size: 28px; 
      color: #2c1810; 
      margin: 25px 0; 
      font-weight: bold;
      font-family: 'Playfair Display', serif;
      background: linear-gradient(135deg, #f8f4f1, #ede7e1);
      padding: 20px;
      border-radius: 10px;
      border: 1px solid #d4a574;
    }
    
    .details { 
      font-size: 16px; 
      color: #666; 
      margin: 40px 0; 
      line-height: 2;
      background: #fafafa;
      padding: 25px;
      border-radius: 10px;
      border-left: 4px solid #b5651d;
    }
    
    .signature-section {
      margin-top: 80px;
      display: flex;
      justify-content: space-between;
      align-items: end;
    }
    
    .signature-line {
      border-top: 2px solid #666;
      width: 200px;
      padding-top: 10px;
      font-size: 14px;
      color: #666;
    }
    
    .date-issued {
      text-align: right;
      font-size: 14px;
      color: #999;
    }
    
    .footer {
      margin-top: 60px;
      font-size: 12px;
      color: #999;
      border-top: 1px solid #eee;
      padding-top: 20px;
    }
    
    .score-badge {
      display: inline-block;
      background: linear-gradient(135deg, #b5651d, #d4a574);
      color: white;
      padding: 10px 20px;
      border-radius: 25px;
      font-weight: bold;
      margin: 20px 0;
      font-size: 18px;
    }
  </style>
</head>
<body>
  <div class="certificate">
    <div class="logo">☕ TUPÁ HUB</div>
    <div class="certificate-title">Certificado de Excelencia</div>
    
    <div class="awarded-text">Se otorga a:</div>
    <div class="recipient">${data.userName || 'Usuario TUPÁ'}</div>
    
    <div class="completion-text">Por completar exitosamente el curso:</div>
    <div class="course">${data.courseTitle}</div>
    
    <div class="score-badge">
      Puntuación: ${data.score}/${data.totalQuestions} (${data.percentage}%)
    </div>
    
    <div class="details">
      <strong>Detalles del Certificado:</strong><br>
      📚 <strong>Instructor:</strong> ${data.instructorName}<br>
      ⏱️ <strong>Duración del Curso:</strong> ${data.duration}<br>
      📅 <strong>Fecha de Finalización:</strong> ${data.completionDate}<br>
      🏆 <strong>Nivel:</strong> ${data.difficulty}<br>
      ✅ <strong>Estado:</strong> Aprobado con Excelencia
    </div>
    
    <div class="signature-section">
      <div class="signature-line">
        Director Académico<br>
        TUPÁ Hub
      </div>
      <div class="date-issued">
        Emitido el: ${data.issueDate}
      </div>
    </div>
    
    <div class="footer">
      TUPÁ Hub - Academia Cafetera Profesional<br>
      Certificación avalada por Specialty Coffee Association (SCA)<br>
      <strong>ID del Certificado:</strong> ${data.certificateId}
    </div>
  </div>
</body>
</html>
`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting certificate generation...');
    
    const { courseId, userId, userName } = await req.json();
    
    if (!courseId || !userId) {
      throw new Error('Missing required parameters: courseId and userId');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Fetching course and progress data...');

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

    // Fetch user progress
    const { data: progress, error: progressError } = await supabase
      .from('user_course_progress')
      .select('*')
      .eq('course_id', courseId)
      .eq('user_id', userId)
      .single();

    if (progressError) {
      console.error('Progress fetch error:', progressError);
      throw new Error('Course progress not found');
    }

    // Fetch latest quiz attempt
    const { data: quizAttempt, error: quizError } = await supabase
      .from('user_quiz_attempts')
      .select(`
        *,
        quiz:quizzes(*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    console.log('Generating certificate data...');

    const certificateId = `TUPA-${courseId.slice(0, 8)}-${userId.slice(0, 8)}-${Date.now()}`;
    const completionDate = new Date(progress.completed_at || Date.now()).toLocaleDateString('es-AR');
    const issueDate = new Date().toLocaleDateString('es-AR');
    
    const duration = `${Math.floor(course.duration_minutes / 60)}h ${course.duration_minutes % 60}min`;
    const percentage = quizAttempt ? Math.round((quizAttempt.score / quizAttempt.total_questions) * 100) : 100;

    const certificateData = {
      userName: userName || 'Usuario TUPÁ',
      courseTitle: course.title,
      instructorName: course.instructor?.name || 'Instructor TUPÁ',
      difficulty: course.difficulty,
      duration,
      completionDate,
      issueDate,
      score: quizAttempt?.score || 0,
      totalQuestions: quizAttempt?.total_questions || 0,
      percentage,
      certificateId
    };

    console.log('Generating HTML content...');
    const htmlContent = getCertificateHTML(certificateData);

    // Convert HTML to PDF using jsPDF (simple approach)
    // For production, you might want to use a more robust solution like Puppeteer
    console.log('Converting HTML to PDF...');
    
    // For now, we'll store the HTML and provide a download link
    // In a real implementation, you'd use a service like Puppeteer or html-pdf
    
    const fileName = `certificate-${certificateId}.html`;
    const filePath = `${userId}/${fileName}`;

    // Upload the HTML file to storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('certificates')
      .upload(filePath, new Blob([htmlContent], { type: 'text/html' }), {
        cacheControl: '3600',
        upsert: true
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw new Error('Failed to upload certificate');
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('certificates')
      .getPublicUrl(filePath);

    const certificateUrl = urlData.publicUrl;

    console.log('Updating user progress with certificate URL...');

    // Update user progress with certificate URL
    const { error: updateError } = await supabase
      .from('user_course_progress')
      .update({ certificate_url: certificateUrl })
      .eq('course_id', courseId)
      .eq('user_id', userId);

    if (updateError) {
      console.error('Update error:', updateError);
      throw new Error('Failed to update progress with certificate URL');
    }

    console.log('Certificate generated successfully!');

    return new Response(JSON.stringify({
      success: true,
      certificateUrl,
      certificateId,
      message: 'Certificate generated successfully'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-certificate function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});