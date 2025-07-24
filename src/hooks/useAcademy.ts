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
  certificate_url?: string;
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
  certificate_url?: string;
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

export interface CourseModule {
  id: string;
  course_id: string;
  title: string;
  description?: string;
  content?: string;
  duration_minutes?: number;
  order_index: number;
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

  // Fetch all courses (for admin) - includes inactive courses
  const fetchAllCourses = async () => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select(`
          *,
          instructor:instructors(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCourses((data || []) as Course[]);
    } catch (err) {
      console.error('Error fetching all courses:', err);
      setError('Failed to load courses');
    }
  };

  // Fetch instructors
  const fetchInstructors = async () => {
    try {
      const { data, error } = await supabase
        .from('instructors')
        .select('id, name')
        .order('name')
        .limit(50);

      if (error) throw error;
      
      // Debug logging for response size (development only)
      if (import.meta.env.DEV && data) {
        const responseSize = new Blob([JSON.stringify(data)]).size / 1024;
        const instructorCount = data.length;
        const avgSizePerInstructor = instructorCount > 0 ? responseSize / instructorCount : 0;
        
        console.log(`📊 Instructors Response Debug:`, {
          count: instructorCount,
          totalSizeKB: responseSize.toFixed(2),
          avgSizePerInstructorKB: avgSizePerInstructor.toFixed(3)
        });
      }
      
      setInstructors((data || []) as Instructor[]);
    } catch (err) {
      console.error('Error fetching instructors:', err);
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
        status: progress?.status || 'not_started',
        certificate_url: progress?.certificate_url
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

  // Fetch course modules
  const fetchCourseModules = async (courseId: string): Promise<CourseModule[]> => {
    try {
      const { data, error } = await supabase
        .from('course_modules')
        .select('*')
        .eq('course_id', courseId)
        .order('order_index');

      if (error) throw error;
      return (data || []) as CourseModule[];
    } catch (err) {
      console.error('Error fetching course modules:', err);
      throw err;
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

  // Admin functions
  const createCourse = async (courseData: any) => {
    try {
      const { error } = await supabase
        .from('courses')
        .insert(courseData);

      if (error) throw error;
    } catch (err: any) {
      console.error('Error creating course:', err);
      throw err;
    }
  };

  const updateCourse = async (courseId: string, courseData: any) => {
    try {
      const { error } = await supabase
        .from('courses')
        .update(courseData)
        .eq('id', courseId);

      if (error) throw error;
    } catch (err: any) {
      console.error('Error updating course:', err);
      throw err;
    }
  };

  const deleteCourse = async (courseId: string) => {
    try {
      const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', courseId);

      if (error) throw error;
    } catch (err: any) {
      console.error('Error deleting course:', err);
      throw err;
    }
  };

  const createCourseModule = async (courseId: string, moduleData: any) => {
    try {
      const { error } = await supabase
        .from('course_modules')
        .insert({ ...moduleData, course_id: courseId });

      if (error) throw error;
    } catch (err: any) {
      console.error('Error creating course module:', err);
      throw err;
    }
  };

  const updateCourseModule = async (moduleId: string, moduleData: any) => {
    try {
      const { error } = await supabase
        .from('course_modules')
        .update(moduleData)
        .eq('id', moduleId);

      if (error) throw error;
    } catch (err: any) {
      console.error('Error updating course module:', err);
      throw err;
    }
  };

  const deleteCourseModule = async (moduleId: string) => {
    try {
      const { error } = await supabase
        .from('course_modules')
        .delete()
        .eq('id', moduleId);

      if (error) throw error;
    } catch (err: any) {
      console.error('Error deleting course module:', err);
      throw err;
    }
  };

  const createQuiz = async (courseId: string, quizData: any) => {
    try {
      // First create the quiz
      const { data: quiz, error: quizError } = await supabase
        .from('quizzes')
        .insert({
          course_id: courseId,
          title: quizData.title,
          description: quizData.description,
          passing_score: quizData.passing_score
        })
        .select()
        .single();

      if (quizError) throw quizError;

      // Then create the questions
      const questions = quizData.questions.map((q: any) => ({
        quiz_id: quiz.id,
        question: q.question,
        options: q.options,
        correct_answer_index: q.correct_answer_index,
        explanation: q.explanation,
        order_index: q.order_index
      }));

      const { error: questionsError } = await supabase
        .from('quiz_questions')
        .insert(questions);

      if (questionsError) throw questionsError;
    } catch (err: any) {
      console.error('Error creating quiz:', err);
      throw err;
    }
  };

  const updateQuiz = async (quizId: string, quizData: any) => {
    try {
      // Update quiz info
      const { error: quizError } = await supabase
        .from('quizzes')
        .update({
          title: quizData.title,
          description: quizData.description,
          passing_score: quizData.passing_score
        })
        .eq('id', quizId);

      if (quizError) throw quizError;

      // Delete existing questions
      const { error: deleteError } = await supabase
        .from('quiz_questions')
        .delete()
        .eq('quiz_id', quizId);

      if (deleteError) throw deleteError;

      // Insert new questions
      const questions = quizData.questions.map((q: any) => ({
        quiz_id: quizId,
        question: q.question,
        options: q.options,
        correct_answer_index: q.correct_answer_index,
        explanation: q.explanation,
        order_index: q.order_index
      }));

      const { error: questionsError } = await supabase
        .from('quiz_questions')
        .insert(questions);

      if (questionsError) throw questionsError;
    } catch (err: any) {
      console.error('Error updating quiz:', err);
      throw err;
    }
  };

  const deleteQuiz = async (quizId: string) => {
    try {
      // Delete questions first (should cascade, but being explicit)
      const { error: questionsError } = await supabase
        .from('quiz_questions')
        .delete()
        .eq('quiz_id', quizId);

      if (questionsError) throw questionsError;

      // Delete quiz
      const { error } = await supabase
        .from('quizzes')
        .delete()
        .eq('id', quizId);

      if (error) throw error;
    } catch (err: any) {
      console.error('Error deleting quiz:', err);
      throw err;
    }
  };

  const refreshCourses = () => {
    fetchAllCourses();
  };

  // Initialize data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          fetchCourses(),
          fetchUserProgress(),
          fetchInstructors()
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
    fetchCourseModules,
    fetchInstructors,
    updateCourseProgress,
    submitQuizAttempt,
    getUserQuizAttempts,
    refreshCourses,
    // Admin functions
    createCourse,
    updateCourse,
    deleteCourse,
    createCourseModule,
    updateCourseModule,
    deleteCourseModule,
    createQuiz,
    updateQuiz,
    deleteQuiz,
    refetch: () => {
      fetchCourses();
      fetchUserProgress();
    }
  };
}