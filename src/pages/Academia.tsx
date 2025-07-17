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
  ChevronRight
} from 'lucide-react';
import { useState } from 'react';

const courses = [
  {
    id: 1,
    title: 'Fundamentos del Espresso',
    description: 'Aprende los conceptos básicos para preparar el espresso perfecto',
    duration: '45 min',
    difficulty: 'Principiante',
    progress: 0,
    status: 'available',
    instructor: 'Carlos Rodriguez',
    modules: 6,
    quiz: {
      questions: [
        {
          question: '¿Cuál es el tiempo ideal de extracción para un espresso?',
          options: ['15-20 segundos', '20-30 segundos', '30-40 segundos', '40-50 segundos'],
          correct: 1
        },
        {
          question: '¿Qué cantidad de café molido necesitas para un espresso doble?',
          options: ['14-16g', '18-20g', '22-24g', '26-28g'],
          correct: 1
        }
      ]
    }
  },
  {
    id: 2,
    title: 'Métodos de Filtrado',
    description: 'Domina las técnicas de V60, Chemex y prensa francesa',
    duration: '60 min',
    difficulty: 'Intermedio',
    progress: 35,
    status: 'in-progress',
    instructor: 'Ana Martinez',
    modules: 8,
    quiz: {
      questions: [
        {
          question: '¿Cuál es la proporción ideal para V60?',
          options: ['1:15', '1:16', '1:17', '1:18'],
          correct: 1
        }
      ]
    }
  },
  {
    id: 3,
    title: 'Latte Art Avanzado',
    description: 'Técnicas profesionales para crear arte en leche',
    duration: '90 min',
    difficulty: 'Avanzado',
    progress: 100,
    status: 'completed',
    instructor: 'Diego Fernandez',
    modules: 10,
    quiz: {
      questions: [
        {
          question: '¿Qué temperatura debe tener la leche para latte art?',
          options: ['55-60°C', '60-65°C', '65-70°C', '70-75°C'],
          correct: 1
        }
      ]
    }
  }
];

export default function Academia() {
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [showQuiz, setShowQuiz] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [userAnswers, setUserAnswers] = useState([]);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [score, setScore] = useState(0);

  const startCourse = (course) => {
    setSelectedCourse(course);
    setShowQuiz(false);
    setCurrentQuestion(0);
    setUserAnswers([]);
    setQuizCompleted(false);
    setScore(0);
  };

  const startQuiz = () => {
    setShowQuiz(true);
    setCurrentQuestion(0);
    setUserAnswers([]);
    setQuizCompleted(false);
  };

  const handleAnswer = (answerIndex) => {
    const newAnswers = [...userAnswers];
    newAnswers[currentQuestion] = answerIndex;
    setUserAnswers(newAnswers);

    if (currentQuestion < selectedCourse.quiz.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      // Quiz completed
      const finalScore = newAnswers.reduce((score, answer, index) => {
        return score + (answer === selectedCourse.quiz.questions[index].correct ? 1 : 0);
      }, 0);
      setScore(finalScore);
      setQuizCompleted(true);
    }
  };

  const generateCertificate = () => {
    // Crear elemento de certificado para descargar
    const certificateContent = `
      CERTIFICADO DE FINALIZACIÓN
      
      Se otorga a: [Nombre del Usuario]
      Por completar exitosamente el curso:
      ${selectedCourse.title}
      
      Puntuación: ${score}/${selectedCourse.quiz.questions.length}
      Fecha: ${new Date().toLocaleDateString()}
      Instructor: ${selectedCourse.instructor}
      
      TUPÁ Hub - Academia Cafetera
    `;

    const blob = new Blob([certificateContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `certificado-${selectedCourse.title.toLowerCase().replace(/\s+/g, '-')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'Principiante': return 'bg-green-100 text-green-700 border-green-200';
      case 'Intermedio': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'Avanzado': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'in-progress': return <Clock className="h-5 w-5 text-yellow-600" />;
      default: return <Play className="h-5 w-5 text-primary" />;
    }
  };

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
                  <div className="text-2xl font-bold text-primary">2</div>
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
                  <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-600" />
                  <div className="text-xl font-bold">{courses.filter(c => c.status === 'completed').length}</div>
                  <div className="text-sm text-muted-foreground">Completados</div>
                </CardContent>
              </Card>
              <Card className="shadow-soft">
                <CardContent className="p-4 text-center">
                  <Clock className="h-8 w-8 mx-auto mb-2 text-yellow-600" />
                  <div className="text-xl font-bold">{courses.filter(c => c.status === 'in-progress').length}</div>
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
                              <span className="text-xs text-muted-foreground">{course.duration}</span>
                            </div>
                          </div>
                        </div>
                        {course.status === 'completed' && (
                          <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
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
                          {course.instructor}
                        </span>
                        <span>{course.modules} módulos</span>
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
                        ) : course.status === 'in-progress' ? (
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
                    <div className="font-semibold">{selectedCourse.duration}</div>
                    <div className="text-sm text-muted-foreground">Duración</div>
                  </div>
                  <div className="text-center p-4 bg-secondary/10 rounded-lg">
                    <BookOpen className="h-6 w-6 mx-auto mb-2 text-secondary" />
                    <div className="font-semibold">{selectedCourse.modules}</div>
                    <div className="text-sm text-muted-foreground">Módulos</div>
                  </div>
                  <div className="text-center p-4 bg-secondary/10 rounded-lg">
                    <Users className="h-6 w-6 mx-auto mb-2 text-secondary" />
                    <div className="font-semibold">{selectedCourse.instructor}</div>
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
                    className="bg-gradient-primary hover:bg-primary/90"
                    size="lg"
                  >
                    <ChevronRight className="h-5 w-5 mr-2" />
                    Iniciar Quiz de Certificación
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : !quizCompleted ? (
          // Quiz View
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <Button variant="outline" onClick={() => setShowQuiz(false)}>
                <X className="h-4 w-4 mr-2" />
                Salir del Quiz
              </Button>
              <Badge variant="outline">
                Pregunta {currentQuestion + 1} de {selectedCourse.quiz.questions.length}
              </Badge>
            </div>

            <Card className="shadow-warm max-w-2xl mx-auto">
              <CardHeader>
                <CardTitle>Quiz: {selectedCourse.title}</CardTitle>
                <Progress 
                  value={(currentQuestion / selectedCourse.quiz.questions.length) * 100} 
                  className="mt-4"
                />
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">
                    {selectedCourse.quiz.questions[currentQuestion].question}
                  </h3>
                  <div className="space-y-3">
                    {selectedCourse.quiz.questions[currentQuestion].options.map((option, index) => (
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
                <div className="p-4 bg-green-100 rounded-full mx-auto w-fit mb-4">
                  <Award className="h-12 w-12 text-green-600" />
                </div>
                <CardTitle className="text-2xl">¡Quiz Completado!</CardTitle>
                <p className="text-muted-foreground">Has finalizado el quiz de certificación</p>
              </CardHeader>
              <CardContent className="p-6 space-y-6 text-center">
                <div className="space-y-2">
                  <div className="text-4xl font-bold text-green-600">
                    {score}/{selectedCourse.quiz.questions.length}
                  </div>
                  <div className="text-muted-foreground">
                    Puntuación: {Math.round((score / selectedCourse.quiz.questions.length) * 100)}%
                  </div>
                </div>

                {score >= selectedCourse.quiz.questions.length * 0.7 ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                      <p className="text-green-800 font-semibold">¡Felicitaciones!</p>
                      <p className="text-green-700 text-sm">
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
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <Clock className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
                      <p className="text-yellow-800 font-semibold">Casi lo logras</p>
                      <p className="text-yellow-700 text-sm">
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