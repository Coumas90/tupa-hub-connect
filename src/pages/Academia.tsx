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
  Loader2
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAcademy, type Course, type Quiz } from '@/hooks/useAcademy';


export default function Academia() {
  const { 
    courses, 
    loading, 
    error, 
    fetchQuiz, 
    updateCourseProgress, 
    submitQuizAttempt 
  } = useAcademy();
  
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [currentQuiz, setCurrentQuiz] = useState<Quiz | null>(null);
  const [showQuiz, setShowQuiz] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [userAnswers, setUserAnswers] = useState<number[]>([]);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [score, setScore] = useState(0);
  const [quizLoading, setQuizLoading] = useState(false);

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

  const generateCertificate = () => {
    // Crear HTML mejorado para el certificado
    const certificateHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Certificado TUPÁ Hub</title>
      <style>
        body { 
          font-family: 'Georgia', serif; 
          background: linear-gradient(135deg, #f8f4f1, #ede7e1);
          margin: 0; 
          padding: 40px;
          color: #2c1810;
        }
        .certificate {
          max-width: 800px;
          margin: 0 auto;
          background: white;
          border: 8px solid #b5651d;
          border-radius: 20px;
          padding: 60px;
          text-align: center;
          box-shadow: 0 15px 40px rgba(181, 101, 29, 0.2);
        }
        .logo { color: #b5651d; font-size: 48px; font-weight: bold; margin-bottom: 20px; }
        .title { font-size: 36px; color: #2c1810; margin: 30px 0; font-weight: bold; }
        .recipient { font-size: 28px; color: #b5651d; margin: 30px 0; font-style: italic; }
        .course { font-size: 24px; color: #2c1810; margin: 20px 0; font-weight: bold; }
        .details { font-size: 16px; color: #666; margin: 30px 0; line-height: 1.8; }
        .signature { margin-top: 60px; font-size: 14px; color: #999; }
      </style>
    </head>
    <body>
      <div class="certificate">
        <div class="logo">☕ TUPÁ HUB</div>
        <div class="title">CERTIFICADO DE FINALIZACIÓN</div>
        <div class="recipient">Se otorga a: Usuario TUPÁ</div>
        <div>Por completar exitosamente el curso:</div>
        <div class="course">${selectedCourse?.title}</div>
        <div class="details">
          Puntuación Obtenida: ${score}/${currentQuiz?.questions.length || 0} (${Math.round((score / (currentQuiz?.questions.length || 1)) * 100)}%)<br>
          Instructor: ${selectedCourse?.instructor?.name}<br>
          Fecha de Finalización: ${new Date().toLocaleDateString('es-AR')}<br>
          Duración del Curso: ${Math.floor((selectedCourse?.duration_minutes || 0) / 60)}h ${(selectedCourse?.duration_minutes || 0) % 60}min
        </div>
        <div class="signature">
          TUPÁ Hub - Academia Cafetera Profesional<br>
          Certificación avalada por Specialty Coffee Association (SCA)
        </div>
      </div>
    </body>
    </html>
    `;

    const blob = new Blob([certificateHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `certificado-${selectedCourse?.title.toLowerCase().replace(/\s+/g, '-')}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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
      <div className="p-6 space-y-6">
        {!selectedCourse ? (
          <>
            {/* Header */}
            <div className="flex justify-between items-center">
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

            {/* Courses Grid */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Cursos Disponibles</h2>
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
                        Has aprobado el curso. Tu certificado está listo para descargar.
                      </p>
                    </div>
                    <Button 
                      onClick={generateCertificate}
                      className="bg-gradient-primary hover:bg-primary/90"
                      size="lg"
                    >
                      <Award className="h-5 w-5 mr-2" />
                      Descargar Certificado
                    </Button>
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