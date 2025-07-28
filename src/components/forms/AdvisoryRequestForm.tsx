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
import { CalendarIcon, Coffee, Clock, Building, Users, Target, GraduationCap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const baristaTrainingSchema = z.object({
  requesterName: z.string().min(2, 'Nombre debe tener al menos 2 caracteres'),
  requesterEmail: z.string().email('Email inválido'),
  requesterPhone: z.string().optional(),
  cafeAddress: z.string().min(5, 'Dirección completa de la cafetería requerida'),
  machineType: z.enum(['semi_automatic', 'automatic', 'super_automatic', 'manual']),
  numberOfBaristas: z.number().min(1, 'Debe especificar al menos 1 barista').max(20, 'Máximo 20 baristas por sesión'),
  trainingType: z.enum(['basic', 'intermediate', 'advanced', 'latte_art', 'coffee_cupping']),
  preferredDate: z.date().optional(),
  preferredTime: z.string().optional(),
  duration: z.enum(['2_hours', '4_hours', '6_hours', 'full_day']),
  specialRequests: z.string().optional(),
});

type BaristaTrainingFormData = z.infer<typeof baristaTrainingSchema>;

interface BaristaTrainingFormProps {
  cafeId: string;
  onSuccess?: () => void;
}

const machineTypeLabels = {
  semi_automatic: 'Semiautomática',
  automatic: 'Automática',
  super_automatic: 'Superautomática',
  manual: 'Manual/Lever'
};

const trainingTypeLabels = {
  basic: 'Básico - Fundamentos del Espresso',
  intermediate: 'Intermedio - Técnicas Avanzadas',
  advanced: 'Avanzado - Calibración y Ajustes',
  latte_art: 'Latte Art - Arte en Leche',
  coffee_cupping: 'Catación y Análisis Sensorial'
};

const durationLabels = {
  '2_hours': '2 horas',
  '4_hours': '4 horas (medio día)',
  '6_hours': '6 horas',
  'full_day': 'Día completo (8 horas)'
};

export default function BaristaTrainingForm({ cafeId, onSuccess }: BaristaTrainingFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<BaristaTrainingFormData>({
    resolver: zodResolver(baristaTrainingSchema),
    defaultValues: {
      trainingType: 'basic',
      machineType: 'semi_automatic',
      duration: '4_hours',
      numberOfBaristas: 1
    }
  });

  const onSubmit = async (data: BaristaTrainingFormData) => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('advisory_requests')
        .insert({
          cafe_id: cafeId,
          requester_name: data.requesterName,
          requester_email: data.requesterEmail,
          requester_phone: data.requesterPhone,
          company_name: data.cafeAddress, // Using company_name field for cafe address
          company_size: `${data.numberOfBaristas}_baristas`, // Using company_size for number of baristas
          advisory_type: 'barista_training', // Fixed type for barista training
          priority: 'medium', // Default priority for training requests
          preferred_date: data.preferredDate?.toISOString().split('T')[0],
          preferred_time: data.preferredTime,
          description: `Capacitación de Baristas - Tipo: ${trainingTypeLabels[data.trainingType]}, Máquina: ${machineTypeLabels[data.machineType]}, Duración: ${durationLabels[data.duration]}, Baristas: ${data.numberOfBaristas}. Solicitudes especiales: ${data.specialRequests || 'Ninguna'}`,
        });

      if (error) throw error;

      toast({
        title: "Capacitación solicitada",
        description: "Tu solicitud de capacitación para baristas ha sido enviada. Te contactaremos pronto.",
      });

      form.reset();
      onSuccess?.();
    } catch (error) {
      console.error('Error submitting training request:', error);
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
          <GraduationCap className="h-8 w-8 text-warm-primary mr-3" />
          <CardTitle className="text-2xl font-bold text-warm-primary">Capacitación de Baristas In-House</CardTitle>
        </div>
        <CardDescription>
          Solicita una capacitación personalizada para tus baristas en tu cafetería
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
                name="cafeAddress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dirección de la Cafetería</FormLabel>
                    <FormControl>
                      <Input placeholder="Dirección completa donde se realizará la capacitación" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Información de la Capacitación */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-warm-primary border-b border-warm-primary/20 pb-2">
                Detalles de la Capacitación
              </h3>
              
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="trainingType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Capacitación</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona el tipo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.entries(trainingTypeLabels).map(([value, label]) => (
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

                <FormField
                  control={form.control}
                  name="machineType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Máquina de Espresso</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Tipo de máquina de espresso" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.entries(machineTypeLabels).map(([value, label]) => (
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="numberOfBaristas"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Número de Baristas</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          max="20"
                          placeholder="¿Cuántos baristas participarán?"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="duration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duración de la Capacitación</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Duración estimada" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.entries(durationLabels).map(([value, label]) => (
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
              
              {/* Fecha y Hora */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-warm-primary border-b border-warm-primary/20 pb-2">
                  Programación
                </h3>
                
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
              </div>

              <FormField
                control={form.control}
                name="specialRequests"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Solicitudes Especiales (Opcional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Menciona cualquier requerimiento específico, objetivos de la capacitación, o temas particulares que te gustaría cubrir..."
                        className="min-h-[100px]"
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
              {isSubmitting ? "Enviando solicitud..." : "Solicitar Capacitación de Baristas"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}