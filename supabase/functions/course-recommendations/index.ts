import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface UserProfile {
  role: string;
  completedCourses: Array<{
    title: string;
    difficulty: string;
    score?: number;
    passed?: boolean;
  }>;
  currentSkillLevel: string;
  averageScore: number;
}

interface CourseRecommendation {
  course: any;
  reason: string;
  confidence: number;
  priority: 'high' | 'medium' | 'low';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Set the auth header for the client
    supabaseClient.auth.getUser = async () => {
      const response = await fetch(`${Deno.env.get('SUPABASE_URL')}/auth/v1/user`, {
        headers: { Authorization: authHeader }
      });
      const data = await response.json();
      return { data: { user: data }, error: null };
    };

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    console.log('Getting recommendations for user:', user.id);

    // Fetch user progress and completed courses
    const { data: userProgress, error: progressError } = await supabaseClient
      .from('user_course_progress')
      .select(`
        *,
        course:courses(
          id, title, difficulty, duration_minutes,
          instructor:instructors(name)
        )
      `)
      .eq('user_id', user.id);

    if (progressError) {
      console.error('Error fetching user progress:', progressError);
      throw progressError;
    }

    // Fetch user quiz attempts for scoring data
    const { data: quizAttempts, error: quizError } = await supabaseClient
      .from('user_quiz_attempts')
      .select(`
        score, total_questions, passed,
        quiz:quizzes(
          course:courses(title, difficulty)
        )
      `)
      .eq('user_id', user.id)
      .order('completed_at', { ascending: false });

    if (quizError) {
      console.error('Error fetching quiz attempts:', quizError);
    }

    // Fetch user role
    const { data: userRole, error: roleError } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (roleError) {
      console.error('Error fetching user role:', roleError);
    }

    // Fetch all available courses (not completed by user)
    const completedCourseIds = userProgress?.filter(p => p.status === 'completed').map(p => p.course_id) || [];
    
    const { data: availableCourses, error: coursesError } = await supabaseClient
      .from('courses')
      .select(`
        *,
        instructor:instructors(name, expertise)
      `)
      .eq('is_active', true)
      .not('id', 'in', `(${completedCourseIds.length > 0 ? completedCourseIds.join(',') : 'null'})`);

    if (coursesError) {
      console.error('Error fetching available courses:', coursesError);
      throw coursesError;
    }

    // Build user profile for AI analysis
    const completedCourses = userProgress?.filter(p => p.status === 'completed').map(p => ({
      title: p.course?.title || '',
      difficulty: p.course?.difficulty || '',
      score: quizAttempts?.find(qa => qa.quiz?.course?.title === p.course?.title)?.score,
      passed: quizAttempts?.find(qa => qa.quiz?.course?.title === p.course?.title)?.passed
    })) || [];

    const averageScore = quizAttempts?.length > 0 
      ? quizAttempts.reduce((sum, qa) => sum + (qa.score / qa.total_questions * 100), 0) / quizAttempts.length 
      : 0;

    const userProfile: UserProfile = {
      role: userRole?.role || 'user',
      completedCourses,
      currentSkillLevel: determineSkillLevel(completedCourses, averageScore),
      averageScore
    };

    console.log('User profile:', userProfile);
    console.log('Available courses:', availableCourses?.length);

    // Generate AI recommendations
    const recommendations = await generateAIRecommendations(userProfile, availableCourses || []);

    console.log('Generated recommendations:', recommendations);

    return new Response(JSON.stringify({ 
      recommendations,
      userProfile: {
        completedCoursesCount: completedCourses.length,
        averageScore: Math.round(averageScore),
        skillLevel: userProfile.currentSkillLevel,
        role: userProfile.role
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in course-recommendations function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      recommendations: [],
      userProfile: null
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function determineSkillLevel(completedCourses: any[], averageScore: number): string {
  if (completedCourses.length === 0) return 'Principiante';
  
  const advancedCourses = completedCourses.filter(c => c.difficulty === 'Avanzado').length;
  const intermediateCourses = completedCourses.filter(c => c.difficulty === 'Intermedio').length;
  
  if (advancedCourses >= 2 && averageScore >= 80) return 'Avanzado';
  if (intermediateCourses >= 1 || averageScore >= 70) return 'Intermedio';
  return 'Principiante';
}

async function generateAIRecommendations(userProfile: UserProfile, availableCourses: any[]): Promise<CourseRecommendation[]> {
  const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
  if (!openAIApiKey) {
    console.log('No OpenAI API key, using rule-based recommendations');
    return generateRuleBasedRecommendations(userProfile, availableCourses);
  }

  try {
    const prompt = `
Eres un experto en educación cafetera y desarrollo profesional para baristas. Analiza el perfil del usuario y recomienda los 3 mejores cursos de la lista disponible.

PERFIL DEL USUARIO:
- Rol: ${userProfile.role}
- Nivel de habilidad: ${userProfile.currentSkillLevel}
- Cursos completados: ${userProfile.completedCourses.length}
- Puntuación promedio: ${userProfile.averageScore.toFixed(1)}%
- Cursos previos: ${userProfile.completedCourses.map(c => `${c.title} (${c.difficulty}${c.score ? `, ${Math.round(c.score/c.total_questions*100)}%` : ''})`).join(', ')}

CURSOS DISPONIBLES:
${availableCourses.map((course, idx) => 
  `${idx + 1}. "${course.title}" - ${course.difficulty} - ${Math.floor(course.duration_minutes/60)}h ${course.duration_minutes%60}min - Instructor: ${course.instructor?.name || 'TBD'}`
).join('\n')}

CRITERIOS DE RECOMENDACIÓN:
1. Progresión natural de dificultad (no saltar niveles abruptamente)
2. Relevancia para el rol del usuario (admin, barista, etc.)
3. Complementar habilidades ya adquiridas
4. Considerar rendimiento previo para ajustar dificultad

Responde SOLO con un JSON válido en este formato exacto:
{
  "recommendations": [
    {
      "courseIndex": 0,
      "reason": "Razón específica y personal para esta recomendación",
      "confidence": 0.9,
      "priority": "high"
    }
  ]
}

Incluye máximo 3 recomendaciones, ordenadas por prioridad (high, medium, low).
`;

    console.log('Sending request to OpenAI...');
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { 
            role: 'system', 
            content: 'Eres un experto en educación cafetera. Responde SOLO con JSON válido, sin texto adicional.' 
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 1000
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;
    
    console.log('OpenAI response:', aiResponse);

    // Parse AI response
    const parsed = JSON.parse(aiResponse);
    
    return parsed.recommendations.map((rec: any) => ({
      course: availableCourses[rec.courseIndex],
      reason: rec.reason,
      confidence: rec.confidence,
      priority: rec.priority
    }));

  } catch (error) {
    console.error('Error with OpenAI API, falling back to rule-based:', error);
    return generateRuleBasedRecommendations(userProfile, availableCourses);
  }
}

function generateRuleBasedRecommendations(userProfile: UserProfile, availableCourses: any[]): CourseRecommendation[] {
  console.log('Generating rule-based recommendations');
  
  const recommendations: CourseRecommendation[] = [];
  
  // Rule 1: Skill level progression
  const nextDifficulty = userProfile.currentSkillLevel === 'Principiante' ? 'Intermedio' : 
                        userProfile.currentSkillLevel === 'Intermedio' ? 'Avanzado' : 'Avanzado';
  
  // Rule 2: Find courses matching progression
  const progressionCourses = availableCourses.filter(course => 
    course.difficulty === nextDifficulty || 
    (userProfile.completedCourses.length === 0 && course.difficulty === 'Principiante')
  );
  
  // Rule 3: Role-based recommendations
  const rolePriority = userProfile.role === 'admin' ? ['management', 'business', 'advanced'] :
                      userProfile.role === 'barista' ? ['practical', 'technique', 'fundamentals'] :
                      ['basics', 'introduction', 'fundamentals'];
  
  // Sort by relevance
  const sortedCourses = progressionCourses.sort((a, b) => {
    const aScore = rolePriority.some(keyword => 
      a.title.toLowerCase().includes(keyword) || 
      a.description?.toLowerCase().includes(keyword)
    ) ? 1 : 0;
    
    const bScore = rolePriority.some(keyword => 
      b.title.toLowerCase().includes(keyword) || 
      b.description?.toLowerCase().includes(keyword)
    ) ? 1 : 0;
    
    return bScore - aScore;
  });
  
  // Generate top 3 recommendations
  sortedCourses.slice(0, 3).forEach((course, index) => {
    const priority = index === 0 ? 'high' : index === 1 ? 'medium' : 'low';
    const reason = generateRuleBasedReason(course, userProfile, index);
    
    recommendations.push({
      course,
      reason,
      confidence: 0.8 - (index * 0.1),
      priority
    });
  });
  
  return recommendations;
}

function generateRuleBasedReason(course: any, userProfile: UserProfile, index: number): string {
  const reasons = [
    `Perfecto para tu nivel ${userProfile.currentSkillLevel} y te ayudará a avanzar al siguiente nivel`,
    `Complementa muy bien tus ${userProfile.completedCourses.length} cursos completados`,
    `Ideal para tu rol como ${userProfile.role} y desarrollar nuevas habilidades`,
  ];
  
  if (userProfile.averageScore >= 80) {
    return `Con tu excelente rendimiento (${userProfile.averageScore.toFixed(0)}%), este curso ${course.difficulty.toLowerCase()} será un gran desafío`;
  }
  
  if (userProfile.completedCourses.length === 0) {
    return 'Excelente punto de partida para comenzar tu journey en el mundo del café';
  }
  
  return reasons[index] || reasons[0];
}