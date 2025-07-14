import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
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
    category: 'Barista',
    level: 'Básico',
    duration: '2 horas',
    progress: 100,
    status: 'completed',
    lessons: 8,
    description: 'Aprende los principios básicos para preparar el espresso perfecto',
    instructor: 'Carlos Mendoza',
    rating: 4.9
  },
  {
    id: 2,
    title: 'Métodos de Filtrado Avanzados',
    category: 'Barista',
    level: 'Intermedio',
    duration: '3 horas',
    progress: 65,
    status: 'in-progress',
    lessons: 12,
    description: 'Domina V60, Chemex y otros métodos de preparación manual',
    instructor: 'Ana Rodríguez',
    rating: 4.8
  },
  {
    id: 3,
    title: 'Arte Latte y Presentación',
    category: 'Barista',
    level: 'Intermedio',
    duration: '2.5 horas',
    progress: 0,
    status: 'available',
    lessons: 10,
    description: 'Técnicas profesionales para crear arte en café con leche',
    instructor: 'Miguel Torres',
    rating: 4.7
  },
  {
    id: 4,
    title: 'Gestión de Cafetería',
    category: 'Encargado',
    level: 'Avanzado',
    duration: '4 horas',
    progress: 25,
    status: 'in-progress',
    lessons: 15,
    description: 'Administración eficiente y control de calidad en cafeterías',
    instructor: 'Laura Silva',
    rating: 4.9
  }
];

const getStatusColor = (status: string) => {
  switch (status) {
    case 'completed': return 'bg-success text-success-foreground';
    case 'in-progress': return 'bg-warning text-warning-foreground';
    default: return 'bg-muted text-muted-foreground';
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'completed': return CheckCircle;
    case 'in-progress': return Play;
    default: return BookOpen;
  }
};

export default function Academia() {
  const [cursoActivo, setCursoActivo] = useState<any>(null);
  const [preguntaActual, setPreguntaActual] = useState(0);
  const [respuestas, setRespuestas] = useState<{[key: number]: string}>({});
  const [mostrandoResultados, setMostrandoResultados] = useState(false);

  const preguntas = [
    {
      id: 1,
      pregunta: "¿Cuál es el ratio ideal para espresso?",
      opciones: ["1:1", "1:2", "1:3", "1:4"],
      correcta: "1:2"
    },
    {
      id: 2,
      pregunta: "¿A qué temperatura debe estar el agua para espresso?",
      opciones: ["85°C", "90°C", "93°C", "98°C"],
      correcta: "93°C"
    },
    {
      id: 3,
      pregunta: "¿Cuánto debe durar la extracción de un espresso?",
      opciones: ["15-20 segundos", "25-30 segundos", "35-40 segundos", "45-50 segundos"],
      correcta: "25-30 segundos"
    }
  ];

  const abrirCurso = (curso: any) => {
    setCursoActivo(curso);
    setPreguntaActual(0);
    setRespuestas({});
    setMostrandoResultados(false);
  };

  const responderPregunta = (respuesta: string) => {
    setRespuestas({
      ...respuestas,
      [preguntaActual]: respuesta
    });
  };

  const siguientePregunta = () => {
    if (preguntaActual < preguntas.length - 1) {
      setPreguntaActual(preguntaActual + 1);
    } else {
      setMostrandoResultados(true);
    }
  };

  const calcularPuntaje = () => {
    let correctas = 0;
    preguntas.forEach((pregunta, index) => {
      if (respuestas[index] === pregunta.correcta) {
        correctas++;
      }
    });
    return Math.round((correctas / preguntas.length) * 100);
  };

  const generarCertificado = () => {
    const puntaje = calcularPuntaje();
    if (puntaje >= 70) {
      alert(`¡Felicitaciones! Has aprobado con ${puntaje}% de aciertos. Tu certificado será enviado por email.`);
    } else {
      alert(`Necesitas al menos 70% para aprobar. Obtuviste ${puntaje}%. Puedes reintentar el curso.`);
    }
    setCursoActivo(null);
  };

  if (cursoActivo) {
    if (mostrandoResultados) {
      const puntaje = calcularPuntaje();
      return (
        <div className="p-6 space-y-6">
          <Card className="max-w-2xl mx-auto shadow-soft">
            <CardHeader className="bg-gradient-light rounded-t-lg text-center">
              <CardTitle className="text-2xl">Resultados del Quiz</CardTitle>
            </CardHeader>
            <CardContent className="p-8 text-center">
              <div className="space-y-6">
                <div className="p-6 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg">
                  <h3 className="text-3xl font-bold text-primary mb-2">{puntaje}%</h3>
                  <p className="text-muted-foreground">
                    {puntaje >= 70 ? '¡Excelente trabajo!' : 'Necesitas mejorar un poco más'}
                  </p>
                </div>
                
                <div className="space-y-3">
                  {preguntas.map((pregunta, index) => (
                    <div key={pregunta.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <span className="text-sm">Pregunta {index + 1}</span>
                      <div className="flex items-center space-x-2">
                        {respuestas[index] === pregunta.correcta ? (
                          <CheckCircle className="h-5 w-5 text-success" />
                        ) : (
                          <X className="h-5 w-5 text-destructive" />
                        )}
                        <span className="text-sm">
                          {respuestas[index] === pregunta.correcta ? 'Correcta' : 'Incorrecta'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex space-x-3">
                  {puntaje >= 70 ? (
                    <Button 
                      onClick={generarCertificado}
                      className="flex-1 bg-gradient-primary hover:bg-primary/90"
                    >
                      <Award className="h-4 w-4 mr-2" />
                      Generar Certificado
                    </Button>
                  ) : (
                    <Button 
                      onClick={() => {setCursoActivo(null);}}
                      className="flex-1 bg-gradient-primary hover:bg-primary/90"
                    >
                      Reintentar Curso
                    </Button>
                  )}
                  <Button variant="outline" onClick={() => setCursoActivo(null)}>
                    Volver a Cursos
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return (
      <div className="p-6 space-y-6">
        <Card className="max-w-2xl mx-auto shadow-soft">
          <CardHeader className="bg-gradient-light rounded-t-lg">
            <div className="flex justify-between items-center">
              <CardTitle>{cursoActivo.titulo}</CardTitle>
              <Button variant="outline" size="sm" onClick={() => setCursoActivo(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center space-x-2">
              <div className="flex-1 bg-muted rounded-full h-2">
                <div 
                  className="bg-gradient-primary h-2 rounded-full transition-all"
                  style={{ width: `${((preguntaActual + 1) / preguntas.length) * 100}%` }}
                />
              </div>
              <span className="text-sm text-muted-foreground">
                {preguntaActual + 1} de {preguntas.length}
              </span>
            </div>
          </CardHeader>
          <CardContent className="p-8">
            <div className="space-y-6">
              <h3 className="text-xl font-semibold mb-4">
                {preguntas[preguntaActual].pregunta}
              </h3>
              
              <div className="space-y-3">
                {preguntas[preguntaActual].opciones.map((opcion, index) => (
                  <Button
                    key={index}
                    variant={respuestas[preguntaActual] === opcion ? "default" : "outline"}
                    className={`w-full text-left justify-start h-auto p-4 ${
                      respuestas[preguntaActual] === opcion ? "bg-gradient-primary" : ""
                    }`}
                    onClick={() => responderPregunta(opcion)}
                  >
                    <span className="w-6 h-6 rounded-full border-2 border-current flex items-center justify-center mr-3 flex-shrink-0">
                      {String.fromCharCode(65 + index)}
                    </span>
                    {opcion}
                  </Button>
                ))}
              </div>

              <div className="flex justify-end">
                <Button 
                  onClick={siguientePregunta}
                  disabled={!respuestas[preguntaActual]}
                  className="bg-gradient-primary hover:bg-primary/90"
                >
                  {preguntaActual < preguntas.length - 1 ? 'Siguiente' : 'Finalizar Quiz'}
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Academia TUPÁ</h1>
          <p className="text-muted-foreground">Desarrolla tus habilidades cafeteras</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Progreso Total</p>
            <p className="text-2xl font-bold text-secondary">75%</p>
          </div>
          <Button className="bg-gradient-warm shadow-warm">
            <Award className="h-4 w-4 mr-2" />
            Mis Certificados
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <CheckCircle className="h-8 w-8 mx-auto mb-2 text-success" />
            <p className="text-2xl font-bold">3</p>
            <p className="text-sm text-muted-foreground">Completados</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <Clock className="h-8 w-8 mx-auto mb-2 text-warning" />
            <p className="text-2xl font-bold">2</p>
            <p className="text-sm text-muted-foreground">En Progreso</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <Award className="h-8 w-8 mx-auto mb-2 text-secondary" />
            <p className="text-2xl font-bold">3</p>
            <p className="text-sm text-muted-foreground">Certificados</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <Star className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
            <p className="text-2xl font-bold">4.8</p>
            <p className="text-sm text-muted-foreground">Rating Promedio</p>
          </CardContent>
        </Card>
      </div>

      {/* Course Cards */}
      <div className="grid lg:grid-cols-2 gap-6">
        {courses.map((course) => {
          const StatusIcon = getStatusIcon(course.status);
          return (
            <Card key={course.id} className="shadow-soft hover:shadow-warm transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${getStatusColor(course.status)}`}>
                      <StatusIcon className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{course.title}</CardTitle>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge variant="outline">{course.category}</Badge>
                        <Badge variant="secondary">{course.level}</Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span>{course.rating}</span>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">{course.description}</p>
                
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-1">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>{course.duration}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <BookOpen className="h-4 w-4 text-muted-foreground" />
                      <span>{course.lessons} lecciones</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>{course.instructor}</span>
                  </div>
                </div>
                
                {course.progress > 0 && (
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Progreso</span>
                      <span>{course.progress}%</span>
                    </div>
                    <Progress value={course.progress} className="h-2" />
                  </div>
                )}
                
                <div className="flex space-x-2">
                  {course.status === 'completed' ? (
                    <>
                      <Button className="flex-1">
                        <Award className="h-4 w-4 mr-2" />
                        Ver Certificado
                      </Button>
                      <Button variant="outline">
                        <Play className="h-4 w-4 mr-2" />
                        Repasar
                      </Button>
                    </>
                  ) : course.status === 'in-progress' ? (
                    <Button className="flex-1">
                      <Play className="h-4 w-4 mr-2" />
                      Continuar Curso
                    </Button>
                  ) : (
                    <Button className="flex-1" variant="outline">
                      <BookOpen className="h-4 w-4 mr-2" />
                      Comenzar Curso
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Learning Path */}
      <Card className="border-secondary/20 bg-gradient-to-r from-secondary/5 to-transparent">
        <CardHeader>
          <CardTitle className="flex items-center text-secondary">
            <GraduationCap className="h-5 w-5 mr-2" />
            Ruta de Aprendizaje Recomendada
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <p className="text-sm">
              Basado en tu rol como <strong>Encargado de Cafetería</strong>, 
              te recomendamos completar primero los cursos de gestión y luego 
              especializar en técnicas avanzadas de barista.
            </p>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">1. Gestión de Cafetería</Badge>
              <Badge variant="outline">2. Control de Calidad</Badge>
              <Badge variant="outline">3. Arte Latte Avanzado</Badge>
              <Badge variant="outline">4. Cata y Evaluación</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}