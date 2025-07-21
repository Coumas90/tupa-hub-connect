import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAcademy, type Course } from '@/hooks/useAcademy';
import { Plus, Edit, Trash2, BookOpen, Loader2 } from 'lucide-react';

interface CourseModule {
  id: string;
  title: string;
  description?: string;
  content?: string;
  duration_minutes?: number;
  order_index: number;
}

interface CourseModuleManagerProps {
  isOpen: boolean;
  onClose: () => void;
  course: Course | null;
  onSuccess: () => void;
}

export default function CourseModuleManager({
  isOpen,
  onClose,
  course,
  onSuccess
}: CourseModuleManagerProps) {
  const { fetchCourseModules, createCourseModule, updateCourseModule, deleteCourseModule } = useAcademy();
  const [modules, setModules] = useState<CourseModule[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingModule, setEditingModule] = useState<CourseModule | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    content: '',
    duration_minutes: 30,
    order_index: 1
  });
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && course) {
      loadModules();
    }
  }, [isOpen, course]);

  const loadModules = async () => {
    if (!course) return;
    
    setLoading(true);
    try {
      const moduleData = await fetchCourseModules(course.id);
      setModules(moduleData || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al cargar los módulos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!course) return;

    setLoading(true);
    try {
      if (editingModule) {
        await updateCourseModule(editingModule.id, formData);
        toast({
          title: "Éxito",
          description: "Módulo actualizado correctamente",
        });
      } else {
        await createCourseModule(course.id, formData);
        toast({
          title: "Éxito",
          description: "Módulo creado correctamente",
        });
      }
      
      setShowForm(false);
      setEditingModule(null);
      resetForm();
      loadModules();
    } catch (error) {
      toast({
        title: "Error",
        description: `Error al ${editingModule ? 'actualizar' : 'crear'} el módulo`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (module: CourseModule) => {
    setEditingModule(module);
    setFormData({
      title: module.title,
      description: module.description || '',
      content: module.content || '',
      duration_minutes: module.duration_minutes || 30,
      order_index: module.order_index
    });
    setShowForm(true);
  };

  const handleDelete = async (moduleId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este módulo?')) return;
    
    setLoading(true);
    try {
      await deleteCourseModule(moduleId);
      toast({
        title: "Éxito",
        description: "Módulo eliminado correctamente",
      });
      loadModules();
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al eliminar el módulo",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      content: '',
      duration_minutes: 30,
      order_index: modules.length + 1
    });
    setEditingModule(null);
  };

  const handleNewModule = () => {
    resetForm();
    setFormData(prev => ({ ...prev, order_index: modules.length + 1 }));
    setShowForm(true);
  };

  if (!course) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Gestión de Módulos - {course.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {!showForm ? (
            <>
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Módulos del Curso</h3>
                <Button onClick={handleNewModule}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nuevo Módulo
                </Button>
              </div>

              {loading ? (
                <div className="text-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                </div>
              ) : (
                <div className="space-y-3">
                  {modules.map((module) => (
                    <Card key={module.id}>
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-center">
                          <CardTitle className="text-base">
                            {module.order_index}. {module.title}
                          </CardTitle>
                          <div className="flex space-x-2">
                            <Button variant="outline" size="sm" onClick={() => handleEdit(module)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handleDelete(module.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <p className="text-sm text-muted-foreground mb-2">{module.description}</p>
                        {module.duration_minutes && (
                          <p className="text-xs text-muted-foreground">
                            Duración: {module.duration_minutes} minutos
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                  
                  {modules.length === 0 && (
                    <div className="text-center py-8">
                      <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No hay módulos en este curso</p>
                      <Button onClick={handleNewModule} className="mt-4">
                        Crear primer módulo
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <h3 className="text-lg font-semibold">
                {editingModule ? 'Editar Módulo' : 'Nuevo Módulo'}
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Título *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Título del módulo"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="order_index">Orden</Label>
                  <Input
                    id="order_index"
                    type="number"
                    value={formData.order_index}
                    onChange={(e) => setFormData(prev => ({ ...prev, order_index: parseInt(e.target.value) }))}
                    min="1"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Descripción del módulo"
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">Contenido</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Contenido del módulo (markdown soportado)"
                  rows={6}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration">Duración (minutos)</Label>
                <Input
                  id="duration"
                  type="number"
                  value={formData.duration_minutes}
                  onChange={(e) => setFormData(prev => ({ ...prev, duration_minutes: parseInt(e.target.value) }))}
                  min="1"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowForm(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {editingModule ? 'Actualizar' : 'Crear'} Módulo
                </Button>
              </div>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}