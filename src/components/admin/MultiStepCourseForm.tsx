import { useState } from 'react';
import RichTextEditor from './RichTextEditor';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useAcademy } from '@/hooks/useAcademy';
import { 
  Plus, 
  Trash2, 
  ChevronRight, 
  ChevronLeft, 
  Save, 
  Upload,
  BookOpen,
  Video,
  HelpCircle,
  Eye,
  Loader2
} from 'lucide-react';

interface Lesson {
  id: string;
  title: string;
  content: string;
  videoUrl?: string;
  quiz?: Quiz;
}

interface Section {
  id: string;
  title: string;
  lessons: Lesson[];
}

interface Quiz {
  question: string;
  options: string[];
  correctAnswer: number;
}

interface CourseFormData {
  title: string;
  description: string;
  category: string;
  difficulty: string;
  duration_minutes: number;
  instructor_id: string;
  sections: Section[];
  isDraft: boolean;
}

interface MultiStepCourseFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function MultiStepCourseForm({ isOpen, onClose, onSuccess }: MultiStepCourseFormProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const { instructors, fetchInstructors, createCourse } = useAcademy();
  const { toast } = useToast();

  const [formData, setFormData] = useState<CourseFormData>({
    title: '',
    description: '',
    category: '',
    difficulty: 'Principiante',
    duration_minutes: 60,
    instructor_id: '',
    sections: [{
      id: '1',
      title: 'Introducción',
      lessons: [{
        id: '1',
        title: 'Lección 1',
        content: '',
        videoUrl: ''
      }]
    }],
    isDraft: false
  });

  const addSection = () => {
    const newSection: Section = {
      id: Date.now().toString(),
      title: `Sección ${formData.sections.length + 1}`,
      lessons: [{
        id: Date.now().toString() + '_1',
        title: 'Nueva Lección',
        content: ''
      }]
    };
    setFormData(prev => ({
      ...prev,
      sections: [...prev.sections, newSection]
    }));
  };

  const addLesson = (sectionId: string) => {
    setFormData(prev => ({
      ...prev,
      sections: prev.sections.map(section => 
        section.id === sectionId 
          ? {
              ...section,
              lessons: [...section.lessons, {
                id: Date.now().toString(),
                title: `Lección ${section.lessons.length + 1}`,
                content: ''
              }]
            }
          : section
      )
    }));
  };

  const updateLesson = (sectionId: string, lessonId: string, updates: Partial<Lesson>) => {
    setFormData(prev => ({
      ...prev,
      sections: prev.sections.map(section => 
        section.id === sectionId 
          ? {
              ...section,
              lessons: section.lessons.map(lesson =>
                lesson.id === lessonId ? { ...lesson, ...updates } : lesson
              )
            }
          : section
      )
    }));
  };

  const handleSave = async (isDraft: boolean) => {
    setLoading(true);
    try {
      const courseData = {
        ...formData,
        isDraft,
        is_active: !isDraft,
        module_count: formData.sections.reduce((acc, section) => acc + section.lessons.length, 0)
      };
      
      await createCourse(courseData);
      toast({
        title: "Éxito",
        description: isDraft ? "Curso guardado como borrador" : "Curso publicado correctamente",
      });
      onSuccess();
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al guardar el curso",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="title">Título del Curso *</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            placeholder="Ej: Técnicas Avanzadas de Barista"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="category">Categoría</Label>
          <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar categoría" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="barista">Barista</SelectItem>
              <SelectItem value="latte-art">Latte Art</SelectItem>
              <SelectItem value="specialty-coffee">Café Especializado</SelectItem>
              <SelectItem value="business">Negocio Cafetero</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descripción *</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Describe el contenido y objetivos del curso..."
          rows={4}
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>Dificultad</Label>
          <Select value={formData.difficulty} onValueChange={(value) => setFormData(prev => ({ ...prev, difficulty: value }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Principiante">Principiante</SelectItem>
              <SelectItem value="Intermedio">Intermedio</SelectItem>
              <SelectItem value="Avanzado">Avanzado</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="duration">Duración (min)</Label>
          <Input
            id="duration"
            type="number"
            value={formData.duration_minutes}
            onChange={(e) => setFormData(prev => ({ ...prev, duration_minutes: parseInt(e.target.value) }))}
          />
        </div>
        <div className="space-y-2">
          <Label>Instructor</Label>
          <Select value={formData.instructor_id} onValueChange={(value) => setFormData(prev => ({ ...prev, instructor_id: value }))}>
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
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Contenido del Curso</h3>
        <Button onClick={addSection} variant="outline" size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Agregar Sección
        </Button>
      </div>

      {formData.sections.map((section, sectionIndex) => (
        <Card key={section.id} className="border-l-4 border-l-primary">
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <Input
                value={section.title}
                onChange={(e) => {
                  const newSections = [...formData.sections];
                  newSections[sectionIndex].title = e.target.value;
                  setFormData(prev => ({ ...prev, sections: newSections }));
                }}
                className="font-semibold text-lg border-none p-0 focus-visible:ring-0"
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => addLesson(section.id)}
              >
                <Plus className="h-4 w-4 mr-1" />
                Lección
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {section.lessons.map((lesson) => (
              <div key={lesson.id} className="border rounded-lg p-4 space-y-3">
                <Input
                  value={lesson.title}
                  onChange={(e) => updateLesson(section.id, lesson.id, { title: e.target.value })}
                  placeholder="Título de la lección"
                />
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Contenido de la Lección</Label>
                  <RichTextEditor
                    content={lesson.content}
                    onChange={(content) => updateLesson(section.id, lesson.id, { content })}
                    placeholder="Escribe el contenido de la lección..."
                  />
                </div>
                <div className="flex space-x-2">
                  <Input
                    value={lesson.videoUrl || ''}
                    onChange={(e) => updateLesson(section.id, lesson.id, { videoUrl: e.target.value })}
                    placeholder="URL del video (opcional)"
                  />
                  <Button variant="outline" size="sm">
                    <Video className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Quizzes y Evaluaciones</h3>
      {formData.sections.map((section) => (
        <Card key={section.id}>
          <CardHeader>
            <CardTitle className="text-base">{section.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {section.lessons.map((lesson) => (
              <div key={lesson.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-center mb-3">
                  <span className="font-medium">{lesson.title}</span>
                  <Button variant="outline" size="sm">
                    <HelpCircle className="h-4 w-4 mr-2" />
                    Agregar Quiz
                  </Button>
                </div>
                {lesson.quiz && (
                  <div className="bg-muted/30 p-3 rounded">
                    <p className="text-sm text-muted-foreground">Quiz configurado</p>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const renderPreview = () => (
    <div className="space-y-4">
      <div className="p-4 border rounded-lg">
        <h3 className="font-bold text-lg">{formData.title || 'Título del curso'}</h3>
        <p className="text-sm text-muted-foreground mt-1">{formData.description || 'Descripción...'}</p>
        <div className="flex space-x-2 mt-3">
          <Badge variant="outline">{formData.difficulty}</Badge>
          <Badge variant="secondary">{formData.duration_minutes}min</Badge>
        </div>
      </div>

      <div className="space-y-2">
        <h4 className="font-semibold text-sm">Estructura del Curso</h4>
        {formData.sections.map((section, index) => (
          <div key={section.id} className="ml-2">
            <div className="flex items-center space-x-2 py-1">
              <BookOpen className="h-4 w-4 text-primary" />
              <span className="text-sm">{section.title}</span>
            </div>
            {section.lessons.map((lesson) => (
              <div key={lesson.id} className="ml-6 flex items-center space-x-2 py-1">
                <div className="w-2 h-2 bg-muted rounded-full" />
                <span className="text-xs text-muted-foreground">{lesson.title}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Crear Nuevo Curso</DialogTitle>
        </DialogHeader>

        <div className="flex space-x-6 h-[70vh]">
          {/* Main Form */}
          <div className="flex-1 overflow-y-auto">
            {/* Steps Header */}
            <div className="flex items-center justify-between mb-6 p-4 bg-muted/30 rounded-lg">
              {[1, 2, 3].map((step) => (
                <div key={step} className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    currentStep >= step ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                  }`}>
                    {step}
                  </div>
                  <span className={`ml-2 text-sm ${currentStep >= step ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {step === 1 ? 'Info General' : step === 2 ? 'Contenido' : 'Quizzes'}
                  </span>
                  {step < 3 && <ChevronRight className="h-4 w-4 mx-4 text-muted-foreground" />}
                </div>
              ))}
            </div>

            {/* Step Content */}
            <div className="space-y-6">
              {currentStep === 1 && renderStep1()}
              {currentStep === 2 && renderStep2()}
              {currentStep === 3 && renderStep3()}
            </div>
          </div>

          {/* Sidebar Preview */}
          <div className="w-80 border-l pl-6">
            <div className="flex items-center space-x-2 mb-4">
              <Eye className="h-4 w-4" />
              <h3 className="font-semibold">Vista Previa</h3>
            </div>
            <div className="overflow-y-auto h-full">
              {renderPreview()}
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center pt-4 border-t">
          <div className="space-x-2">
            <Button
              variant="outline"
              onClick={() => handleSave(true)}
              disabled={loading}
            >
              {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Guardar Borrador
            </Button>
            <Button
              onClick={() => handleSave(false)}
              disabled={loading || !formData.title}
            >
              {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
              Publicar Curso
            </Button>
          </div>

          <div className="space-x-2">
            {currentStep > 1 && (
              <Button variant="outline" onClick={() => setCurrentStep(currentStep - 1)}>
                <ChevronLeft className="h-4 w-4 mr-2" />
                Anterior
              </Button>
            )}
            {currentStep < 3 && (
              <Button onClick={() => setCurrentStep(currentStep + 1)}>
                Siguiente
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}