import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface CourseRecommendation {
  course: {
    id: string;
    title: string;
    description: string;
    difficulty: string;
    duration_minutes: number;
    instructor_id: string;
    module_count: number;
    is_active: boolean;
    progress?: number;
    status?: 'not_started' | 'in_progress' | 'completed';
    instructor?: {
      name: string;
    };
  };
  reason: string;
  confidence: number;
  priority: 'high' | 'medium' | 'low';
}

export interface UserRecommendationProfile {
  completedCoursesCount: number;
  averageScore: number;
  skillLevel: string;
  role: string;
}

export const useCourseRecommendations = () => {
  const [recommendations, setRecommendations] = useState<CourseRecommendation[]>([]);
  const [userProfile, setUserProfile] = useState<UserRecommendationProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('User not authenticated');
        return;
      }

      console.log('Fetching recommendations...');

      const { data, error: functionError } = await supabase.functions.invoke('course-recommendations', {
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
      });

      if (functionError) {
        throw functionError;
      }

      console.log('Recommendations response:', data);

      setRecommendations(data.recommendations || []);
      setUserProfile(data.userProfile);

      if (data.recommendations?.length === 0) {
        toast({
          title: "Sin recomendaciones",
          description: "Completa algunos cursos para obtener recomendaciones personalizadas",
        });
      }

    } catch (err: any) {
      console.error('Error fetching recommendations:', err);
      setError(err.message || 'Error loading recommendations');
      toast({
        title: "Error",
        description: "No se pudieron cargar las recomendaciones",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, []);

  return {
    recommendations,
    userProfile,
    loading,
    error,
    refetch: fetchRecommendations
  };
};