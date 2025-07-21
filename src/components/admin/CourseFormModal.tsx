import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useAcademy, type Course, type Instructor } from '@/hooks/useAcademy';
import { Loader2 } from 'lucide-react';

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
  const { createCourse, updateCourse, instructors, fetchInstructors } = useAcademy();
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
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar Curso' : 'Crear Nuevo Curso'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="Título del curso"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="difficulty">Dificultad *</Label>
              <Select
                value={formData.difficulty}
                onValueChange={(value) => handleInputChange('difficulty', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar dificultad" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Principiante">Principiante</SelectItem>
                  <SelectItem value="Intermedio">Intermedio</SelectItem>
                  <SelectItem value="Avanzado">Avanzado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Descripción del curso"
              rows={3}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="duration">Duración (minutos) *</Label>
              <Input
                id="duration"
                type="number"
                value={formData.duration_minutes}
                onChange={(e) => handleInputChange('duration_minutes', parseInt(e.target.value))}
                placeholder="60"
                min="1"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="module_count">Número de Módulos</Label>
              <Input
                id="module_count"
                type="number"
                value={formData.module_count}
                onChange={(e) => handleInputChange('module_count', parseInt(e.target.value))}
                placeholder="0"
                min="0"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="instructor">Instructor</Label>
            <Select
              value={formData.instructor_id}
              onValueChange={(value) => handleInputChange('instructor_id', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar instructor" />
              </SelectTrigger>
              <SelectContent>
                {instructors.map((instructor) => (
                  <SelectItem key={instructor.id} value={instructor.id}>
                    {instructor.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="image_url">URL de Imagen</Label>
            <Input
              id="image_url"
              value={formData.image_url}
              onChange={(e) => handleInputChange('image_url', e.target.value)}
              placeholder="https://ejemplo.com/imagen.jpg"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              checked={formData.is_active}
              onCheckedChange={(checked) => handleInputChange('is_active', checked)}
            />
            <Label>Curso activo</Label>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isEditing ? 'Actualizar' : 'Crear'} Curso
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}