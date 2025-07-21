import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Instructor {
  id: string;
  name: string;
  bio?: string;
  expertise?: string[];
  image_url?: string;
  email?: string;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  duration_minutes: number;
  difficulty: string;
  instructor_id: string;
  image_url?: string;
  module_count: number;
  is_active: boolean;
  instructor?: Instructor;
  progress?: number;
  status?: 'not_started' | 'in_progress' | 'completed';
}

export interface Quiz {
  id: string;
  course_id: string;
  title: string;
  description?: string;
  passing_score: number;
  questions: QuizQuestion[];
}

export interface QuizQuestion {
  id: string;
  quiz_id: string;
  question: string;
  options: any[];
  correct_answer_index: number;
  explanation?: string;
  order_index: number;
}

export interface UserCourseProgress {
  id: string;
  user_id: string;
  course_id: string;
  progress_percentage: number;
  status: 'not_started' | 'in_progress' | 'completed';
  started_at?: string;
  completed_at?: string;
  last_accessed_at?: string;
}

export interface UserQuizAttempt {
  id: string;
  user_id: string;
  quiz_id: string;
  score: number;
  total_questions: number;
  answers: any[];
  passed: boolean;
  attempt_number: number;
  completed_at: string;
}

export function useAcademy() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [userProgress, setUserProgress] = useState<Record<string, UserCourseProgress>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Fetch all courses with instructor data
  const fetchCourses = async () => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select(`
          *,
          instructor:instructors(*)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      setCourses((data || []) as Course[]);
    } catch (err) {
      console.error('Error fetching courses:', err);
      setError('Failed to load courses');
      toast({
        title: "Error",
        description: "Failed to load courses",
        variant: "destructive",
      });
    }
  };

  // Fetch user progress for all courses
  const fetchUserProgress = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('user_course_progress')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;

      const progressMap = (data || []).reduce((acc, progress) => {
        acc[progress.course_id] = progress;
        return acc;
      }, {});

      setUserProgress(progressMap);
    } catch (err) {
      console.error('Error fetching user progress:', err);
    }
  };

  // Get courses with progress data
  const getCoursesWithProgress = (): Course[] => {
    return courses.map(course => {
      const progress = userProgress[course.id];
      return {
        ...course,
        progress: progress?.progress_percentage || 0,
        status: progress?.status || 'not_started'
      };
    });
  };

  // Fetch quiz for a specific course
  const fetchQuiz = async (courseId: string): Promise<Quiz | null> => {
    try {
      const { data: quizData, error: quizError } = await supabase
        .from('quizzes')
        .select('*')
        .eq('course_id', courseId)
        .single();

      if (quizError) throw quizError;

      const { data: questionsData, error: questionsError } = await supabase
        .from('quiz_questions')
        .select('*')
        .eq('quiz_id', quizData.id)
        .order('order_index', { ascending: true });

      if (questionsError) throw questionsError;

      return {
        ...quizData,
        questions: (questionsData || []) as QuizQuestion[]
      };
    } catch (err) {
      console.error('Error fetching quiz:', err);
      toast({
        title: "Error",
        description: "Failed to load quiz",
        variant: "destructive",
      });
      return null;
    }
  };

  // Update course progress
  const updateCourseProgress = async (
    courseId: string, 
    progressPercentage: number, 
    status: 'not_started' | 'in_progress' | 'completed'
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const updateData = {
        user_id: user.id,
        course_id: courseId,
        progress_percentage: progressPercentage,
        status,
        last_accessed_at: new Date().toISOString(),
        ...(status === 'in_progress' && !userProgress[courseId]?.started_at && {
          started_at: new Date().toISOString()
        }),
        ...(status === 'completed' && {
          completed_at: new Date().toISOString()
        })
      };

      const { error } = await supabase
        .from('user_course_progress')
        .upsert(updateData, {
          onConflict: 'user_id,course_id'
        });

      if (error) throw error;

      // Update local state
      setUserProgress(prev => ({
        ...prev,
        [courseId]: {
          ...prev[courseId],
          ...updateData
        } as UserCourseProgress
      }));

      await fetchUserProgress(); // Refresh to get updated data
    } catch (err) {
      console.error('Error updating course progress:', err);
      toast({
        title: "Error",
        description: "Failed to update progress",
        variant: "destructive",
      });
    }
  };

  // Submit quiz attempt
  const submitQuizAttempt = async (
    quizId: string,
    answers: number[],
    score: number,
    totalQuestions: number,
    passed: boolean
  ): Promise<UserQuizAttempt | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      // Get previous attempts count
      const { data: previousAttempts } = await supabase
        .from('user_quiz_attempts')
        .select('attempt_number')
        .eq('user_id', user.id)
        .eq('quiz_id', quizId)
        .order('attempt_number', { ascending: false })
        .limit(1);

      const attemptNumber = (previousAttempts?.[0]?.attempt_number || 0) + 1;

      const { data, error } = await supabase
        .from('user_quiz_attempts')
        .insert({
          user_id: user.id,
          quiz_id: quizId,
          score,
          total_questions: totalQuestions,
          answers,
          passed,
          attempt_number: attemptNumber
        })
        .select()
        .single();

      if (error) throw error;

      return data as UserQuizAttempt;
    } catch (err) {
      console.error('Error submitting quiz attempt:', err);
      toast({
        title: "Error",
        description: "Failed to submit quiz",
        variant: "destructive",
      });
      return null;
    }
  };

  // Get user's quiz attempts for a specific quiz
  const getUserQuizAttempts = async (quizId: string): Promise<UserQuizAttempt[]> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('user_quiz_attempts')
        .select('*')
        .eq('user_id', user.id)
        .eq('quiz_id', quizId)
        .order('completed_at', { ascending: false });

      if (error) throw error;

      return (data || []) as UserQuizAttempt[];
    } catch (err) {
      console.error('Error fetching quiz attempts:', err);
      return [];
    }
  };

  // Initialize data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          fetchCourses(),
          fetchUserProgress()
        ]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  return {
    courses: getCoursesWithProgress(),
    instructors,
    userProgress,
    loading,
    error,
    fetchQuiz,
    updateCourseProgress,
    submitQuizAttempt,
    getUserQuizAttempts,
    refetch: () => {
      fetchCourses();
      fetchUserProgress();
    }
  };
}