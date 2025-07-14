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
  Star
} from 'lucide-react';

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