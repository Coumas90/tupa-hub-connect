import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Coffee, Clock, Building, Users, Target, Lightbulb } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const advisorySchema = z.object({
  requesterName: z.string().min(2, 'Nombre debe tener al menos 2 caracteres'),
  requesterEmail: z.string().email('Email inválido'),
  requesterPhone: z.string().optional(),
  companyName: z.string().min(2, 'Nombre de empresa requerido'),
  companySize: z.enum(['1-10', '11-50', '51-200', '200+']),
  advisoryType: z.enum(['menu_optimization', 'operations', 'training', 'marketing', 'equipment', 'sustainability']),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  preferredDate: z.date().optional(),
  preferredTime: z.string().optional(),
  description: z.string().min(10, 'Descripción debe tener al menos 10 caracteres'),
});

type AdvisoryFormData = z.infer<typeof advisorySchema>;

interface AdvisoryRequestFormProps {
  cafeId: string;
  onSuccess?: () => void;
}

const advisoryTypeLabels = {
  menu_optimization: 'Optimización de Menú',
  operations: 'Operaciones',
  training: 'Capacitación',
  marketing: 'Marketing',
  equipment: 'Equipamiento',
  sustainability: 'Sostenibilidad'
};

const advisoryTypeIcons = {
  menu_optimization: Coffee,
  operations: Building,
  training: Users,
  marketing: Target,
  equipment: Clock,
  sustainability: Lightbulb
};

const priorityLabels = {
  low: 'Baja',
  medium: 'Media',
  high: 'Alta',
  urgent: 'Urgente'
};

const companySizeLabels = {
  '1-10': '1-10 empleados',
  '11-50': '11-50 empleados',
  '51-200': '51-200 empleados',
  '200+': 'Más de 200 empleados'
};

export default function AdvisoryRequestForm({ cafeId, onSuccess }: AdvisoryRequestFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<AdvisoryFormData>({
    resolver: zodResolver(advisorySchema),
    defaultValues: {
      priority: 'medium',
      companySize: '1-10',
      advisoryType: 'operations'
    }
  });

  const onSubmit = async (data: AdvisoryFormData) => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('advisory_requests')
        .insert({
          cafe_id: cafeId,
          requester_name: data.requesterName,
          requester_email: data.requesterEmail,
          requester_phone: data.requesterPhone,
          company_name: data.companyName,
          company_size: data.companySize,
          advisory_type: data.advisoryType,
          priority: data.priority,
          preferred_date: data.preferredDate?.toISOString().split('T')[0],
          preferred_time: data.preferredTime,
          description: data.description,
        });

      if (error) throw error;

      toast({
        title: "Solicitud enviada",
        description: "Tu solicitud de asesoría ha sido enviada exitosamente. Te contactaremos pronto.",
      });

      form.reset();
      onSuccess?.();
    } catch (error) {
      console.error('Error submitting advisory request:', error);
      toast({
        title: "Error",
        description: "Hubo un problema al enviar tu solicitud. Intenta nuevamente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="text-center">
        <div className="flex items-center justify-center mb-4">
          <Coffee className="h-8 w-8 text-warm-primary mr-3" />
          <CardTitle className="text-2xl font-bold text-warm-primary">Solicitar Asesoría TUPÁ</CardTitle>
        </div>
        <CardDescription>
          Completa el formulario para solicitar una asesoría personalizada con nuestros expertos en café
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Información Personal */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-warm-primary border-b border-warm-primary/20 pb-2">
                Información de Contacto
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="requesterName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre Completo</FormLabel>
                      <FormControl>
                        <Input placeholder="Tu nombre completo" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="requesterEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="tu@email.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="requesterPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Teléfono (Opcional)</FormLabel>
                    <FormControl>
                      <Input placeholder="+54 11 1234-5678" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Información de la Empresa */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-warm-primary border-b border-warm-primary/20 pb-2">
                Información de la Empresa
              </h3>
              
              <FormField
                control={form.control}
                name="companyName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre de la Empresa</FormLabel>
                    <FormControl>
                      <Input placeholder="Nombre de tu cafetería o empresa" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="companySize"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tamaño de la Empresa</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona el tamaño" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(companySizeLabels).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Detalles de la Asesoría */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-warm-primary border-b border-warm-primary/20 pb-2">
                Detalles de la Asesoría
              </h3>
              
              <FormField
                control={form.control}
                name="advisoryType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Asesoría</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona el tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(advisoryTypeLabels).map(([value, label]) => {
                          const Icon = advisoryTypeIcons[value as keyof typeof advisoryTypeIcons];
                          return (
                            <SelectItem key={value} value={value}>
                              <div className="flex items-center gap-2">
                                <Icon className="h-4 w-4" />
                                {label}
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prioridad</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona la prioridad" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(priorityLabels).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            <div className={cn(
                              "flex items-center gap-2",
                              value === 'urgent' && "text-red-600",
                              value === 'high' && "text-orange-600",
                              value === 'medium' && "text-yellow-600",
                              value === 'low' && "text-green-600"
                            )}>
                              <div className={cn(
                                "w-2 h-2 rounded-full",
                                value === 'urgent' && "bg-red-600",
                                value === 'high' && "bg-orange-600",
                                value === 'medium' && "bg-yellow-600",
                                value === 'low' && "bg-green-600"
                              )} />
                              {label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="preferredDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Fecha Preferida</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Selecciona una fecha</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) =>
                              date < new Date() || date < new Date("1900-01-01")
                            }
                            initialFocus
                            className="pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="preferredTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hora Preferida</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descripción Detallada</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe los desafíos específicos que enfrentas y qué esperas lograr con la asesoría..."
                        className="min-h-[120px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-warm-primary to-warm-earth hover:from-warm-earth hover:to-warm-primary"
            >
              {isSubmitting ? "Enviando solicitud..." : "Enviar Solicitud de Asesoría"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}