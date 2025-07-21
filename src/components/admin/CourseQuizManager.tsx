import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAcademy, type Course, type Quiz } from '@/hooks/useAcademy';
import { Plus, Edit, Trash2, Award, Loader2, X } from 'lucide-react';

interface QuizQuestion {
  id?: string;
  question: string;
  options: string[];
  correct_answer_index: number;
  explanation?: string;
  order_index: number;
}

interface CourseQuizManagerProps {
  isOpen: boolean;
  onClose: () => void;
  course: Course | null;
  onSuccess: () => void;
}

export default function CourseQuizManager({
  isOpen,
  onClose,
  course,
  onSuccess
}: CourseQuizManagerProps) {
  const { fetchQuiz, createQuiz, updateQuiz, deleteQuiz } = useAcademy();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    passing_score: 70,
    questions: [] as QuizQuestion[]
  });
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && course) {
      loadQuiz();
    }
  }, [isOpen, course]);

  const loadQuiz = async () => {
    if (!course) return;
    
    setLoading(true);
    try {
      const quizData = await fetchQuiz(course.id);
      if (quizData) {
        setQuiz(quizData);
        setFormData({
          title: quizData.title,
          description: quizData.description || '',
          passing_score: quizData.passing_score,
          questions: quizData.questions.map(q => ({
            id: q.id,
            question: q.question,
            options: q.options,
            correct_answer_index: q.correct_answer_index,
            explanation: q.explanation,
            order_index: q.order_index
          }))
        });
      } else {
        setQuiz(null);
        resetForm();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al cargar el quiz",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!course) return;

    if (formData.questions.length === 0) {
      toast({
        title: "Error",
        description: "Debes agregar al menos una pregunta",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      if (quiz) {
        await updateQuiz(quiz.id, formData);
        toast({
          title: "Éxito",
          description: "Quiz actualizado correctamente",
        });
      } else {
        await createQuiz(course.id, formData);
        toast({
          title: "Éxito",
          description: "Quiz creado correctamente",
        });
      }
      
      setShowForm(false);
      loadQuiz();
    } catch (error) {
      toast({
        title: "Error",
        description: `Error al ${quiz ? 'actualizar' : 'crear'} el quiz`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteQuiz = async () => {
    if (!quiz || !confirm('¿Estás seguro de que quieres eliminar este quiz?')) return;
    
    setLoading(true);
    try {
      await deleteQuiz(quiz.id);
      toast({
        title: "Éxito",
        description: "Quiz eliminado correctamente",
      });
      setQuiz(null);
      resetForm();
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al eliminar el quiz",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: course ? `Quiz: ${course.title}` : '',
      description: '',
      passing_score: 70,
      questions: []
    });
  };

  const addQuestion = () => {
    setFormData(prev => ({
      ...prev,
      questions: [...prev.questions, {
        question: '',
        options: ['', '', '', ''],
        correct_answer_index: 0,
        explanation: '',
        order_index: prev.questions.length + 1
      }]
    }));
  };

  const updateQuestion = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      questions: prev.questions.map((q, i) => 
        i === index ? { ...q, [field]: value } : q
      )
    }));
  };

  const updateQuestionOption = (questionIndex: number, optionIndex: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      questions: prev.questions.map((q, i) => 
        i === questionIndex 
          ? { ...q, options: q.options.map((opt, j) => j === optionIndex ? value : opt) }
          : q
      )
    }));
  };

  const removeQuestion = (index: number) => {
    setFormData(prev => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index)
        .map((q, i) => ({ ...q, order_index: i + 1 }))
    }));
  };

  if (!course) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Gestión de Quiz - {course.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {!showForm ? (
            <>
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Quiz del Curso</h3>
                <div className="flex space-x-2">
                  {quiz ? (
                    <>
                      <Button variant="outline" onClick={() => setShowForm(true)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Editar Quiz
                      </Button>
                      <Button variant="outline" onClick={handleDeleteQuiz}>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Eliminar Quiz
                      </Button>
                    </>
                  ) : (
                    <Button onClick={() => setShowForm(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Crear Quiz
                    </Button>
                  )}
                </div>
              </div>

              {loading ? (
                <div className="text-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                </div>
              ) : quiz ? (
                <Card>
                  <CardHeader>
                    <CardTitle>{quiz.title}</CardTitle>
                    <p className="text-sm text-muted-foreground">{quiz.description}</p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-medium">Puntaje mínimo para aprobar:</p>
                          <p className="text-2xl font-bold text-primary">{quiz.passing_score}%</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Número de preguntas:</p>
                          <p className="text-2xl font-bold text-primary">{quiz.questions.length}</p>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-medium mb-2">Preguntas:</h4>
                        <div className="space-y-2">
                          {quiz.questions.map((question, index) => (
                            <div key={question.id} className="p-3 border rounded-lg">
                              <p className="font-medium">{index + 1}. {question.question}</p>
                              <div className="mt-2 space-y-1">
                                {question.options.map((option, optIndex) => (
                                  <p 
                                    key={optIndex}
                                    className={`text-sm pl-4 ${
                                      optIndex === question.correct_answer_index 
                                        ? 'text-success font-medium' 
                                        : 'text-muted-foreground'
                                    }`}
                                  >
                                    {String.fromCharCode(65 + optIndex)}. {option}
                                    {optIndex === question.correct_answer_index && ' ✓'}
                                  </p>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="text-center py-8">
                  <Award className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No hay quiz para este curso</p>
                  <Button onClick={() => setShowForm(true)} className="mt-4">
                    Crear quiz
                  </Button>
                </div>
              )}
            </>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <h3 className="text-lg font-semibold">
                {quiz ? 'Editar Quiz' : 'Crear Nuevo Quiz'}
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Título *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Título del quiz"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="passing_score">Puntaje mínimo (%)</Label>
                  <Input
                    id="passing_score"
                    type="number"
                    value={formData.passing_score}
                    onChange={(e) => setFormData(prev => ({ ...prev, passing_score: parseInt(e.target.value) }))}
                    min="1"
                    max="100"
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
                  placeholder="Descripción del quiz"
                  rows={2}
                />
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="font-medium">Preguntas</h4>
                  <Button type="button" onClick={addQuestion} variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar Pregunta
                  </Button>
                </div>

                {formData.questions.map((question, qIndex) => (
                  <Card key={qIndex}>
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-base">Pregunta {qIndex + 1}</CardTitle>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeQuestion(qIndex)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label>Pregunta *</Label>
                        <Textarea
                          value={question.question}
                          onChange={(e) => updateQuestion(qIndex, 'question', e.target.value)}
                          placeholder="Escribe la pregunta..."
                          rows={2}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Opciones de respuesta *</Label>
                        {question.options.map((option, oIndex) => (
                          <div key={oIndex} className="flex items-center space-x-2">
                            <input
                              type="radio"
                              name={`correct-${qIndex}`}
                              checked={question.correct_answer_index === oIndex}
                              onChange={() => updateQuestion(qIndex, 'correct_answer_index', oIndex)}
                            />
                            <Input
                              value={option}
                              onChange={(e) => updateQuestionOption(qIndex, oIndex, e.target.value)}
                              placeholder={`Opción ${String.fromCharCode(65 + oIndex)}`}
                              required
                            />
                          </div>
                        ))}
                      </div>

                      <div className="space-y-2">
                        <Label>Explicación (opcional)</Label>
                        <Textarea
                          value={question.explanation || ''}
                          onChange={(e) => updateQuestion(qIndex, 'explanation', e.target.value)}
                          placeholder="Explicación de la respuesta correcta..."
                          rows={2}
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
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
                  {quiz ? 'Actualizar' : 'Crear'} Quiz
                </Button>
              </div>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}