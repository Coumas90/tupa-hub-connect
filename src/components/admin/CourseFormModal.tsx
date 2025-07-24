import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useAcademy, type Course, type Instructor } from '@/hooks/useAcademy';
import { Loader2, UserX } from 'lucide-react';

interface CourseFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  course?: Course | null;
  isEditing: boolean;
  onSuccess: () => void;
}

export default function CourseFormModal({
  isOpen,
  onClose,
  course,
  isEditing,
  onSuccess
}: CourseFormModalProps) {
  const { createCourse, updateCourse, instructors, fetchInstructors, loading: instructorsLoading } = useAcademy();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    difficulty: 'Principiante',
    duration_minutes: 60,
    instructor_id: '',
    image_url: '',
    is_active: true,
    module_count: 0
  });
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      fetchInstructors();
      
      if (isEditing && course) {
        setFormData({
          title: course.title,
          description: course.description,
          difficulty: course.difficulty,
          duration_minutes: course.duration_minutes,
          instructor_id: course.instructor_id || '',
          image_url: course.image_url || '',
          is_active: course.is_active,
          module_count: course.module_count
        });
      } else {
        setFormData({
          title: '',
          description: '',
          difficulty: 'Principiante',
          duration_minutes: 60,
          instructor_id: '',
          image_url: '',
          is_active: true,
          module_count: 0
        });
      }
    }
  }, [isOpen, isEditing, course, fetchInstructors]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isEditing && course) {
        await updateCourse(course.id, formData);
        toast({
          title: "Éxito",
          description: "Curso actualizado correctamente",
        });
      } else {
        await createCourse(formData);
        toast({
          title: "Éxito",
          description: "Curso creado correctamente",
        });
      }
      onSuccess();
    } catch (error) {
      toast({
        title: "Error",
        description: `Error al ${isEditing ? 'actualizar' : 'crear'} el curso`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto max-[400px]:max-w-[95vw] max-[400px]:m-2">
        <DialogHeader>
          <DialogTitle className="text-lg max-[400px]:text-base">
            {isEditing ? 'Editar Curso' : 'Crear Nuevo Curso'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 max-[400px]:space-y-6">
          {/* Mobile: Stack vertically, Desktop: Grid */}
          <div className="grid grid-cols-1 max-[400px]:space-y-4 sm:grid-cols-2 sm:gap-4">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-sm font-medium">Título *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="Título del curso"
                className="h-12 text-base max-[400px]:h-14 max-[400px]:text-base"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="difficulty" className="text-sm font-medium">Dificultad *</Label>
              <Select
                value={formData.difficulty}
                onValueChange={(value) => handleInputChange('difficulty', value)}
              >
                <SelectTrigger className="h-12 text-base max-[400px]:h-14">
                  <SelectValue placeholder="Seleccionar dificultad" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Principiante" className="h-12 text-base max-[400px]:h-14">Principiante</SelectItem>
                  <SelectItem value="Intermedio" className="h-12 text-base max-[400px]:h-14">Intermedio</SelectItem>
                  <SelectItem value="Avanzado" className="h-12 text-base max-[400px]:h-14">Avanzado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium">Descripción *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Descripción del curso"
              rows={3}
              className="min-h-[120px] text-base max-[400px]:min-h-[140px] max-[400px]:text-base resize-none"
              required
            />
          </div>

          {/* Mobile: Stack vertically, Desktop: Grid */}
          <div className="grid grid-cols-1 max-[400px]:space-y-4 sm:grid-cols-2 sm:gap-4">
            <div className="space-y-2">
              <Label htmlFor="duration" className="text-sm font-medium">Duración (minutos) *</Label>
              <Input
                id="duration"
                type="number"
                value={formData.duration_minutes}
                onChange={(e) => handleInputChange('duration_minutes', parseInt(e.target.value))}
                placeholder="60"
                min="1"
                className="h-12 text-base max-[400px]:h-14 max-[400px]:text-base"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="module_count" className="text-sm font-medium">Número de Módulos</Label>
              <Input
                id="module_count"
                type="number"
                value={formData.module_count}
                onChange={(e) => handleInputChange('module_count', parseInt(e.target.value))}
                placeholder="0"
                min="0"
                className="h-12 text-base max-[400px]:h-14 max-[400px]:text-base"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="instructor" className="text-sm font-medium">Instructor</Label>
            {instructorsLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-12 w-full max-[400px]:h-14" />
                <div className="text-sm text-muted-foreground">Cargando instructores...</div>
              </div>
            ) : instructors.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-muted-foreground/25 rounded-lg bg-muted/20 max-[400px]:p-8">
                <UserX className="h-8 w-8 text-muted-foreground mb-2 max-[400px]:h-10 max-[400px]:w-10" />
                <p className="text-sm text-muted-foreground text-center max-[400px]:text-base">
                  No se encontraron instructores
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={fetchInstructors}
                  className="mt-2 h-10 text-sm max-[400px]:h-12 max-[400px]:text-base max-[400px]:px-6"
                >
                  Recargar
                </Button>
              </div>
            ) : (
              <Select
                value={formData.instructor_id}
                onValueChange={(value) => handleInputChange('instructor_id', value)}
              >
                <SelectTrigger className="h-12 text-base max-[400px]:h-14">
                  <SelectValue placeholder="Seleccionar instructor" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {instructors.map((instructor) => (
                    <SelectItem 
                      key={instructor.id} 
                      value={instructor.id}
                      className="h-12 text-base max-[400px]:h-14"
                    >
                      {instructor.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="image_url" className="text-sm font-medium">URL de Imagen</Label>
            <Input
              id="image_url"
              value={formData.image_url}
              onChange={(e) => handleInputChange('image_url', e.target.value)}
              placeholder="https://ejemplo.com/imagen.jpg"
              className="h-12 text-base max-[400px]:h-14 max-[400px]:text-base"
            />
          </div>

          <div className="flex items-center space-x-3 max-[400px]:space-x-4">
            <Switch
              checked={formData.is_active}
              onCheckedChange={(checked) => handleInputChange('is_active', checked)}
              className="max-[400px]:scale-125"
            />
            <Label className="text-sm font-medium max-[400px]:text-base">Curso activo</Label>
          </div>

          {/* Mobile: Stack vertically with full width buttons, Desktop: Flex end */}
          <div className="flex flex-col max-[400px]:space-y-3 sm:flex-row sm:justify-end sm:space-x-2 sm:space-y-0 pt-4 max-[400px]:pt-6">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              className="h-12 text-base max-[400px]:h-14 max-[400px]:text-base order-2 sm:order-1"
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={loading}
              className="h-12 text-base max-[400px]:h-14 max-[400px]:text-base order-1 sm:order-2"
            >
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin max-[400px]:h-5 max-[400px]:w-5" />}
              {isEditing ? 'Actualizar' : 'Crear'} Curso
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}