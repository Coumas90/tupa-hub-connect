import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import ModuleAccessGuard from '@/components/ModuleAccessGuard';
import {
  GraduationCap,
  Play,
  CheckCircle,
  Clock,
  Award,
  BookOpen,
  Users,
  Star,
  X,
  ChevronRight,
  Loader2,
  TrendingUp,
  Target,
  Lightbulb,
  Download,
  Mail
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAcademy, type Course, type Quiz } from '@/hooks/useAcademy';
import { useCourseRecommendations, type CourseRecommendation } from '@/hooks/useCourseRecommendations';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';


export default function Academia() {
  const { 
    courses, 
    loading, 
    error, 
    fetchQuiz, 
    updateCourseProgress, 
    submitQuizAttempt 
  } = useAcademy();
  
  const { 
    recommendations, 
    userProfile: recommendationProfile, 
    loading: recommendationsLoading 
  } = useCourseRecommendations();
  
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [currentQuiz, setCurrentQuiz] = useState<Quiz | null>(null);
  const [showQuiz, setShowQuiz] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [userAnswers, setUserAnswers] = useState<number[]>([]);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [score, setScore] = useState(0);
  const [quizLoading, setQuizLoading] = useState(false);
  const [certificateLoading, setCertificateLoading] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const { toast } = useToast();

  const startCourse = async (course: Course) => {
    setSelectedCourse(course);
    setShowQuiz(false);
    setCurrentQuestion(0);
    setUserAnswers([]);
    setQuizCompleted(false);
    setScore(0);
    setCurrentQuiz(null);
    
    // Update course progress to in_progress if not started
    if (course.status === 'not_started') {
      await updateCourseProgress(course.id, 0, 'in_progress');
    }
  };

  const startQuiz = async () => {
    if (!selectedCourse) return;
    
    setQuizLoading(true);
    try {
      const quiz = await fetchQuiz(selectedCourse.id);
      if (quiz) {
        setCurrentQuiz(quiz);
        setShowQuiz(true);
        setCurrentQuestion(0);
        setUserAnswers([]);
        setQuizCompleted(false);
      }
    } finally {
      setQuizLoading(false);
    }
  };

  const handleAnswer = async (answerIndex: number) => {
    if (!currentQuiz || !selectedCourse) return;
    
    const newAnswers = [...userAnswers];
    newAnswers[currentQuestion] = answerIndex;
    setUserAnswers(newAnswers);

    if (currentQuestion < currentQuiz.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      // Quiz completed
      const finalScore = newAnswers.reduce((score, answer, index) => {
        return score + (answer === currentQuiz.questions[index].correct_answer_index ? 1 : 0);
      }, 0);
      setScore(finalScore);
      setQuizCompleted(true);
      
      // Submit quiz attempt
      const passed = (finalScore / currentQuiz.questions.length) * 100 >= currentQuiz.passing_score;
      await submitQuizAttempt(
        currentQuiz.id,
        newAnswers,
        finalScore,
        currentQuiz.questions.length,
        passed
      );
      
      // Update course progress to completed if passed
      if (passed) {
        await updateCourseProgress(selectedCourse.id, 100, 'completed');
      }
    }
  };

  const generateCertificate = async () => {
    if (!selectedCourse) return;
    
    setCertificateLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Error",
          description: "Debes estar autenticado para generar un certificado",
          variant: "destructive",
        });
        return;
      }

      const response = await supabase.functions.invoke('generate-certificate', {
        body: {
          courseId: selectedCourse.id,
          userId: user.id,
          userName: user.user_metadata?.full_name || user.email || 'Usuario TUPÁ'
        }
      });

      if (response.error) {
        throw new Error(response.error.message || 'Error al generar el certificado');
      }

      toast({
        title: "¡Certificado Generado!",
        description: "Tu certificado ha sido generado y guardado correctamente",
      });

      // Refresh the course to get the updated certificate URL
      window.location.reload();
      
    } catch (error) {
      console.error('Error generating certificate:', error);
      toast({
        title: "Error",
        description: error.message || "Error al generar el certificado",
        variant: "destructive",
      });
    } finally {
      setCertificateLoading(false);
    }
  };

  const sendCertificateByEmail = async () => {
    if (!selectedCourse) return;
    
    setEmailLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Error",
          description: "Debes estar autenticado para enviar el certificado",
          variant: "destructive",
        });
        return;
      }

      const response = await supabase.functions.invoke('send-certificate', {
        body: {
          courseId: selectedCourse.id,
          userId: user.id,
          userEmail: user.email,
          userName: user.user_metadata?.full_name || user.email || 'Usuario TUPÁ'
        }
      });

      if (response.error) {
        throw new Error(response.error.message || 'Error al enviar el certificado');
      }

      toast({
        title: "¡Certificado Enviado!",
        description: "El certificado ha sido enviado a tu correo electrónico",
      });
      
    } catch (error) {
      console.error('Error sending certificate:', error);
      toast({
        title: "Error",
        description: error.message || "Error al enviar el certificado por correo",
        variant: "destructive",
      });
    } finally {
      setEmailLoading(false);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Principiante': return 'bg-success/10 text-success border-success/20';
      case 'Intermedio': return 'bg-warning/10 text-warning border-warning/20';
      case 'Avanzado': return 'bg-destructive/10 text-destructive border-destructive/20';
      default: return 'bg-muted/10 text-muted-foreground border-muted/20';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-5 w-5 text-success" />;
      case 'in-progress': return <Clock className="h-5 w-5 text-warning" />;
      default: return <Play className="h-5 w-5 text-primary" />;
    }
  };

  // Loading state
  if (loading) {
    return (
      <ModuleAccessGuard module="Academia" requiredRole="barista">
        <div className="p-6 flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="text-muted-foreground">Cargando cursos...</p>
          </div>
        </div>
      </ModuleAccessGuard>
    );
  }

  // Error state
  if (error) {
    return (
      <ModuleAccessGuard module="Academia" requiredRole="barista">
        <div className="p-6 flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <p className="text-destructive">Error: {error}</p>
            <Button onClick={() => window.location.reload()}>
              Reintentar
            </Button>
          </div>
        </div>
      </ModuleAccessGuard>
    );
  }

  return (
    <ModuleAccessGuard module="Academia" requiredRole="barista">
      <div className="px-4 sm:px-6 py-4 sm:py-6 space-y-6">
        {!selectedCourse ? (
          <>
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <h1 className="text-3xl font-bold text-foreground">Academia TUPÁ</h1>
                <p className="text-muted-foreground">Desarrolla tus habilidades como barista profesional</p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-accent">68%</div>
                  <div className="text-xs text-muted-foreground">Progreso Total</div>
                </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">{courses.filter(c => c.status === 'completed').length}</div>
                    <div className="text-xs text-muted-foreground">Certificados</div>
                  </div>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid md:grid-cols-4 gap-4">
              <Card className="shadow-soft">
                <CardContent className="p-4 text-center">
                  <BookOpen className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <div className="text-xl font-bold">{courses.length}</div>
                  <div className="text-sm text-muted-foreground">Cursos Disponibles</div>
                </CardContent>
              </Card>
              <Card className="shadow-soft">
                <CardContent className="p-4 text-center">
                  <CheckCircle className="h-8 w-8 mx-auto mb-2 text-success" />
                  <div className="text-xl font-bold">{courses.filter(c => c.status === 'completed').length}</div>
                  <div className="text-sm text-muted-foreground">Completados</div>
                </CardContent>
              </Card>
              <Card className="shadow-soft">
                <CardContent className="p-4 text-center">
                  <Clock className="h-8 w-8 mx-auto mb-2 text-warning" />
                  <div className="text-xl font-bold">{courses.filter(c => c.status === 'in_progress').length}</div>
                  <div className="text-sm text-muted-foreground">En Progreso</div>
                </CardContent>
              </Card>
              <Card className="shadow-soft">
                <CardContent className="p-4 text-center">
                  <Award className="h-8 w-8 mx-auto mb-2 text-accent" />
                  <div className="text-xl font-bold">{courses.filter(c => c.status === 'completed').length}</div>
                  <div className="text-sm text-muted-foreground">Certificados</div>
                </CardContent>
              </Card>
            </div>

            {/* AI Recommendations Section */}
            {recommendations.length > 0 && (
              <Card className="shadow-glow border-primary/20">
                <CardHeader className="bg-gradient-light rounded-t-lg">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <TrendingUp className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">Recomendaciones Personalizadas</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Basado en tu progreso y perfil de aprendizaje
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  {recommendationProfile && (
                    <div className="mb-6 p-4 bg-secondary/10 rounded-lg">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                        <div>
                          <div className="text-lg font-bold text-primary">{recommendationProfile.completedCoursesCount}</div>
                          <div className="text-xs text-muted-foreground">Cursos Completados</div>
                        </div>
                        <div>
                          <div className="text-lg font-bold text-success">{recommendationProfile.averageScore}%</div>
                          <div className="text-xs text-muted-foreground">Puntuación Promedio</div>
                        </div>
                        <div>
                          <div className="text-lg font-bold text-accent">{recommendationProfile.skillLevel}</div>
                          <div className="text-xs text-muted-foreground">Nivel Actual</div>
                        </div>
                        <div>
                          <div className="text-lg font-bold text-warning">{recommendationProfile.role}</div>
                          <div className="text-xs text-muted-foreground">Rol</div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-4">
                    {recommendations.map((recommendation: CourseRecommendation, index) => (
                      <div
                        key={recommendation.course.id}
                        className={`p-4 rounded-lg border-2 transition-all hover:shadow-md ${
                          recommendation.priority === 'high' 
                            ? 'border-primary/30 bg-primary/5' 
                            : recommendation.priority === 'medium'
                            ? 'border-warning/30 bg-warning/5'
                            : 'border-muted/30 bg-muted/5'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <div className={`p-1.5 rounded-full ${
                                recommendation.priority === 'high' 
                                  ? 'bg-primary/20' 
                                  : recommendation.priority === 'medium'
                                  ? 'bg-warning/20'
                                  : 'bg-muted/20'
                              }`}>
                                {recommendation.priority === 'high' ? (
                                  <Target className="h-4 w-4 text-primary" />
                                ) : (
                                  <Lightbulb className="h-4 w-4 text-warning" />
                                )}
                              </div>
                              <div>
                                <h3 className="font-semibold text-lg">{recommendation.course.title}</h3>
                                <div className="flex items-center space-x-3 mt-1">
                                  <Badge className={`${getDifficultyColor(recommendation.course.difficulty)} border text-xs`}>
                                    {recommendation.course.difficulty}
                                  </Badge>
                                  <span className="text-xs text-muted-foreground">
                                    {Math.floor(recommendation.course.duration_minutes / 60)}h {recommendation.course.duration_minutes % 60}min
                                  </span>
                                  <Badge variant="outline" className={`text-xs ${
                                    recommendation.priority === 'high' ? 'border-primary text-primary' :
                                    recommendation.priority === 'medium' ? 'border-warning text-warning' :
                                    'border-muted text-muted-foreground'
                                  }`}>
                                    {recommendation.priority === 'high' ? 'Altamente Recomendado' :
                                     recommendation.priority === 'medium' ? 'Recomendado' : 'Sugerido'}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                            
                            <p className="text-sm text-muted-foreground mb-3">
                              {recommendation.course.description}
                            </p>
                            
                            <div className="flex items-start space-x-2 mb-3">
                              <Lightbulb className="h-4 w-4 text-accent mt-0.5 flex-shrink-0" />
                              <p className="text-sm italic text-accent">
                                <strong>¿Por qué este curso?</strong> {recommendation.reason}
                              </p>
                            </div>

                            {recommendation.course.instructor && (
                              <p className="text-xs text-muted-foreground">
                                Instructor: {recommendation.course.instructor.name}
                              </p>
                            )}
                          </div>

                          <div className="ml-4 flex-shrink-0">
                            <Button 
                              onClick={() => startCourse({
                                ...recommendation.course,
                                progress: 0,
                                status: 'not_started'
                              } as Course)}
                              className={`${
                                recommendation.priority === 'high' 
                                  ? 'bg-primary hover:bg-primary/90'
                                  : 'bg-secondary hover:bg-secondary/90'
                              }`}
                              size="sm"
                            >
                              <Play className="h-4 w-4 mr-2" />
                              Iniciar Curso
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Loading Recommendations */}
            {recommendationsLoading && (
              <Card className="shadow-soft">
                <CardContent className="p-6 text-center">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
                  <p className="text-muted-foreground">Generando recomendaciones personalizadas...</p>
                </CardContent>
              </Card>
            )}

            {/* Courses Grid */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Todos los Cursos</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {courses.map((course) => (
                  <Card key={course.id} className="shadow-soft hover:shadow-warm transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-primary/10 rounded-lg">
                            {getStatusIcon(course.status)}
                          </div>
                          <div>
                            <CardTitle className="text-lg">{course.title}</CardTitle>
                            <div className="flex items-center space-x-2 mt-1">
                              <Badge className={`${getDifficultyColor(course.difficulty)} border text-xs`}>
                                {course.difficulty}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {Math.floor(course.duration_minutes / 60)}h {course.duration_minutes % 60}min
                              </span>
                            </div>
                          </div>
                        </div>
                        {course.status === 'completed' && (
                          <Star className="h-5 w-5 text-accent fill-accent" />
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-sm text-muted-foreground">{course.description}</p>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Progreso</span>
                          <span>{course.progress}%</span>
                        </div>
                        <Progress value={course.progress} className="h-2" />
                      </div>

                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span className="flex items-center">
                          <Users className="h-3 w-3 mr-1" />
                          {course.instructor?.name || 'Instructor no disponible'}
                        </span>
                        <span>{course.module_count} módulos</span>
                      </div>

                      <Button 
                        onClick={() => startCourse(course)}
                        className="w-full bg-gradient-primary hover:bg-primary/90"
                        variant={course.status === 'completed' ? 'outline' : 'default'}
                      >
                        {course.status === 'completed' ? (
                          <>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Revisar Curso
                          </>
                        ) : course.status === 'in_progress' ? (
                          <>
                            <Play className="h-4 w-4 mr-2" />
                            Continuar
                          </>
                        ) : (
                          <>
                            <Play className="h-4 w-4 mr-2" />
                            Iniciar Curso
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </>
        ) : !showQuiz ? (
          // Course View
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <Button variant="outline" onClick={() => setSelectedCourse(null)}>
                <X className="h-4 w-4 mr-2" />
                Volver a Cursos
              </Button>
              <Badge className={`${getDifficultyColor(selectedCourse.difficulty)} border`}>
                {selectedCourse.difficulty}
              </Badge>
            </div>

            <Card className="shadow-warm">
              <CardHeader className="bg-gradient-light rounded-t-lg">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <GraduationCap className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl">{selectedCourse.title}</CardTitle>
                    <p className="text-muted-foreground">{selectedCourse.description}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-secondary/10 rounded-lg">
                    <Clock className="h-6 w-6 mx-auto mb-2 text-secondary" />
                    <div className="font-semibold">
                      {Math.floor(selectedCourse.duration_minutes / 60)}h {selectedCourse.duration_minutes % 60}min
                    </div>
                    <div className="text-sm text-muted-foreground">Duración</div>
                  </div>
                  <div className="text-center p-4 bg-secondary/10 rounded-lg">
                    <BookOpen className="h-6 w-6 mx-auto mb-2 text-secondary" />
                    <div className="font-semibold">{selectedCourse.module_count}</div>
                    <div className="text-sm text-muted-foreground">Módulos</div>
                  </div>
                  <div className="text-center p-4 bg-secondary/10 rounded-lg">
                    <Users className="h-6 w-6 mx-auto mb-2 text-secondary" />
                    <div className="font-semibold">{selectedCourse.instructor?.name || 'No disponible'}</div>
                    <div className="text-sm text-muted-foreground">Instructor</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Progreso del Curso</span>
                    <span>{selectedCourse.progress}%</span>
                  </div>
                  <Progress value={selectedCourse.progress} className="h-3" />
                </div>

                <div className="text-center space-y-4">
                  <p className="text-muted-foreground">
                    ¡Excelente! Has completado la parte teórica del curso. 
                    Es hora de poner a prueba tus conocimientos con nuestro quiz interactivo.
                  </p>
                  <Button 
                    onClick={startQuiz}
                    disabled={quizLoading}
                    className="bg-gradient-primary hover:bg-primary/90"
                    size="lg"
                  >
                    {quizLoading ? (
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    ) : (
                      <ChevronRight className="h-5 w-5 mr-2" />
                    )}
                    {quizLoading ? 'Cargando Quiz...' : 'Iniciar Quiz de Certificación'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : !showQuiz ? (
          // Quiz View
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <Button variant="outline" onClick={() => setShowQuiz(false)}>
                <X className="h-4 w-4 mr-2" />
                Salir del Quiz
              </Button>
              <Badge variant="outline">
                Pregunta {currentQuestion + 1} de {currentQuiz?.questions.length || 0}
              </Badge>
            </div>

            <Card className="shadow-warm max-w-2xl mx-auto">
              <CardHeader>
                <CardTitle>Quiz: {selectedCourse.title}</CardTitle>
                <Progress 
                  value={(currentQuestion / (currentQuiz?.questions.length || 1)) * 100} 
                  className="mt-4"
                />
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">
                    {currentQuiz?.questions[currentQuestion]?.question}
                  </h3>
                  <div className="space-y-3">
                    {currentQuiz?.questions[currentQuestion]?.options.map((option, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        className="w-full justify-start text-left h-auto p-4"
                        onClick={() => handleAnswer(index)}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-6 h-6 rounded-full border-2 border-muted-foreground flex items-center justify-center text-xs">
                            {String.fromCharCode(65 + index)}
                          </div>
                          <span>{option}</span>
                        </div>
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          // Quiz Results
          <div className="space-y-6">
            <Card className="shadow-glow max-w-2xl mx-auto">
              <CardHeader className="text-center bg-gradient-light rounded-t-lg">
                <div className="p-4 bg-success/10 rounded-full mx-auto w-fit mb-4">
                  <Award className="h-12 w-12 text-success" />
                </div>
                <CardTitle className="text-2xl">¡Quiz Completado!</CardTitle>
                <p className="text-muted-foreground">Has finalizado el quiz de certificación</p>
              </CardHeader>
              <CardContent className="p-6 space-y-6 text-center">
                <div className="space-y-2">
                  <div className="text-4xl font-bold text-success">
                    {score}/{currentQuiz?.questions.length || 0}
                  </div>
                  <div className="text-muted-foreground">
                    Puntuación: {Math.round((score / (currentQuiz?.questions.length || 1)) * 100)}%
                  </div>
                </div>

                {(currentQuiz && score >= (currentQuiz.questions.length * currentQuiz.passing_score / 100)) ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-success/10 border border-success/20 rounded-lg">
                      <CheckCircle className="h-8 w-8 text-success mx-auto mb-2" />
                      <p className="text-success font-semibold">¡Felicitaciones!</p>
                      <p className="text-success/80 text-sm">
                        Has aprobado el curso. Tu certificado está listo para generar.
                      </p>
                    </div>
                    
                    {/* Certificate Actions */}
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                      <Button 
                        onClick={generateCertificate}
                        disabled={certificateLoading}
                        className="bg-gradient-primary hover:bg-primary/90"
                        size="lg"
                      >
                        {certificateLoading ? (
                          <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        ) : (
                          <Download className="h-5 w-5 mr-2" />
                        )}
                        {certificateLoading ? 'Generando...' : 'Generar Certificado'}
                      </Button>
                      
                      <Button 
                        onClick={sendCertificateByEmail}
                        disabled={emailLoading}
                        variant="outline"
                        size="lg"
                      >
                        {emailLoading ? (
                          <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        ) : (
                          <Mail className="h-5 w-5 mr-2" />
                        )}
                        {emailLoading ? 'Enviando...' : 'Enviar por Email'}
                      </Button>
                    </div>
                    
                    {/* Show certificate link if available */}
                    {selectedCourse.certificate_url && (
                      <div className="p-3 bg-accent/10 border border-accent/20 rounded-lg">
                        <p className="text-accent text-sm mb-2">
                          ✅ Tu certificado ya está generado
                        </p>
                        <Button 
                          onClick={() => window.open(selectedCourse.certificate_url, '_blank')}
                          variant="outline"
                          size="sm"
                          className="w-full"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Ver Certificado
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="p-4 bg-warning/10 border border-warning/20 rounded-lg">
                      <Clock className="h-8 w-8 text-warning mx-auto mb-2" />
                      <p className="text-warning font-semibold">Casi lo logras</p>
                      <p className="text-warning/80 text-sm">
                        Necesitas al menos 70% para obtener el certificado. ¡Inténtalo de nuevo!
                      </p>
                    </div>
                    <Button 
                      onClick={startQuiz}
                      variant="outline"
                      size="lg"
                    >
                      <ChevronRight className="h-5 w-5 mr-2" />
                      Reintentar Quiz
                    </Button>
                  </div>
                )}

                <Button 
                  variant="outline" 
                  onClick={() => setSelectedCourse(null)}
                  className="w-full"
                >
                  Volver a Cursos
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </ModuleAccessGuard>
  );
}