import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import ModuleAccessGuard from '@/components/ModuleAccessGuard';
import {
  Plus,
  Edit,
  Trash2,
  BookOpen,
  Users,
  Clock,
  Award,
  GraduationCap,
  Loader2
} from 'lucide-react';
import { useAcademy, type Course } from '@/hooks/useAcademy';
import CourseFormModal from '@/components/admin/CourseFormModal';
import CourseModuleManager from '@/components/admin/CourseModuleManager';
import CourseQuizManager from '@/components/admin/CourseQuizManager';

export default function AdminCourses() {
  const { courses, loading, error, deleteCourse, refreshCourses } = useAcademy();
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [showFormModal, setShowFormModal] = useState(false);
  const [showModuleManager, setShowModuleManager] = useState(false);
  const [showQuizManager, setShowQuizManager] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    refreshCourses();
  }, []);

  const handleEditCourse = (course: Course) => {
    setSelectedCourse(course);
    setIsEditing(true);
    setShowFormModal(true);
  };

  const handleCreateCourse = () => {
    setSelectedCourse(null);
    setIsEditing(false);
    setShowFormModal(true);
  };

  const handleDeleteCourse = async (courseId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este curso?')) return;
    
    try {
      await deleteCourse(courseId);
      toast({
        title: "Éxito",
        description: "Curso eliminado correctamente",
      });
      refreshCourses();
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al eliminar el curso",
        variant: "destructive",
      });
    }
  };

  const handleManageModules = (course: Course) => {
    setSelectedCourse(course);
    setShowModuleManager(true);
  };

  const handleManageQuizzes = (course: Course) => {
    setSelectedCourse(course);
    setShowQuizManager(true);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Principiante': return 'bg-success/10 text-success border-success/20';
      case 'Intermedio': return 'bg-warning/10 text-warning border-warning/20';
      case 'Avanzado': return 'bg-destructive/10 text-destructive border-destructive/20';
      default: return 'bg-muted/10 text-muted-foreground border-muted/20';
    }
  };

  if (loading) {
    return (
      <ModuleAccessGuard requiredRole="admin">
        <div className="p-6 flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="text-muted-foreground">Cargando cursos...</p>
          </div>
        </div>
      </ModuleAccessGuard>
    );
  }

  if (error) {
    return (
      <ModuleAccessGuard requiredRole="admin">
        <div className="p-6 flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <p className="text-destructive">Error: {error}</p>
            <Button onClick={refreshCourses}>Reintentar</Button>
          </div>
        </div>
      </ModuleAccessGuard>
    );
  }

  return (
    <ModuleAccessGuard requiredRole="admin">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Gestión de Cursos</h1>
            <p className="text-muted-foreground">Administra cursos, módulos y quizzes de la Academia TUPÁ</p>
          </div>
          <Button onClick={handleCreateCourse} className="bg-primary hover:bg-primary/90">
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Curso
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <BookOpen className="h-8 w-8 mx-auto mb-2 text-primary" />
              <div className="text-xl font-bold">{courses.length}</div>
              <div className="text-sm text-muted-foreground">Total Cursos</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <GraduationCap className="h-8 w-8 mx-auto mb-2 text-success" />
              <div className="text-xl font-bold">{courses.filter(c => c.is_active).length}</div>
              <div className="text-sm text-muted-foreground">Cursos Activos</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Users className="h-8 w-8 mx-auto mb-2 text-accent" />
              <div className="text-xl font-bold">{new Set(courses.map(c => c.instructor_id)).size}</div>
              <div className="text-sm text-muted-foreground">Instructores</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Clock className="h-8 w-8 mx-auto mb-2 text-warning" />
              <div className="text-xl font-bold">
                {Math.round(courses.reduce((sum, c) => sum + c.duration_minutes, 0) / 60)}h
              </div>
              <div className="text-sm text-muted-foreground">Total Duración</div>
            </CardContent>
          </Card>
        </div>

        {/* Courses List */}
        <Card>
          <CardHeader>
            <CardTitle>Lista de Cursos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {courses.map((course) => (
                <div
                  key={course.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/5"
                >
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <BookOpen className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{course.title}</h3>
                      <p className="text-sm text-muted-foreground">{course.description}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge className={`${getDifficultyColor(course.difficulty)} border text-xs`}>
                          {course.difficulty}
                        </Badge>
                        <Badge variant={course.is_active ? "default" : "secondary"}>
                          {course.is_active ? "Activo" : "Inactivo"}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {Math.floor(course.duration_minutes / 60)}h {course.duration_minutes % 60}min
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {course.module_count} módulos
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {course.instructor?.name || 'Sin instructor'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleManageModules(course)}
                    >
                      <BookOpen className="h-4 w-4 mr-1" />
                      Módulos
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleManageQuizzes(course)}
                    >
                      <Award className="h-4 w-4 mr-1" />
                      Quizzes
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditCourse(course)}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteCourse(course.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Eliminar
                    </Button>
                  </div>
                </div>
              ))}
              
              {courses.length === 0 && (
                <div className="text-center py-8">
                  <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No hay cursos disponibles</p>
                  <Button onClick={handleCreateCourse} className="mt-4">
                    Crear primer curso
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Modals */}
        <CourseFormModal
          isOpen={showFormModal}
          onClose={() => setShowFormModal(false)}
          course={selectedCourse}
          isEditing={isEditing}
          onSuccess={() => {
            setShowFormModal(false);
            refreshCourses();
          }}
        />

        <CourseModuleManager
          isOpen={showModuleManager}
          onClose={() => setShowModuleManager(false)}
          course={selectedCourse}
          onSuccess={() => {
            setShowModuleManager(false);
            refreshCourses();
          }}
        />

        <CourseQuizManager
          isOpen={showQuizManager}
          onClose={() => setShowQuizManager(false)}
          course={selectedCourse}
          onSuccess={() => {
            setShowQuizManager(false);
            refreshCourses();
          }}
        />
      </div>
    </ModuleAccessGuard>
  );
}