import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Coffee, MessageSquare, Star, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface ContactFormModalProps {
  children?: React.ReactNode;
}

export default function ContactFormModal({ children }: ContactFormModalProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    business_type: '',
    message: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase
        .from('contact_requests')
        .insert([formData]);

      if (error) throw error;

      toast({
        title: "¡Solicitud enviada con éxito!",
        description: "Nos pondremos en contacto contigo pronto para coordinar tu cata de café.",
      });

      setFormData({
        name: '',
        email: '',
        phone: '',
        company: '',
        business_type: '',
        message: ''
      });
      setOpen(false);
    } catch (error) {
      console.error('Error submitting contact request:', error);
      toast({
        title: "Error al enviar solicitud",
        description: "Por favor intenta nuevamente.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button className="bg-gradient-to-r from-warm-primary to-warm-earth hover:from-warm-earth hover:to-warm-primary text-white font-semibold px-8 py-3 rounded-full transition-all duration-300 shadow-lg hover:shadow-xl">
            <Coffee className="mr-2 h-5 w-5" />
            Proba TUPÁ Gratis
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-warm-primary flex items-center gap-2">
            <Coffee className="h-6 w-6" />
            Solicita tu Cata Gratis
          </DialogTitle>
          <DialogDescription className="text-warm-secondary">
            Completa el formulario y descubre cómo TUPÁ puede transformar tu negocio de café
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="p-4 text-center border-warm-primary/20">
            <CardContent className="p-0">
              <Coffee className="h-8 w-8 text-warm-primary mx-auto mb-2" />
              <h3 className="font-semibold text-sm">Cata Personalizada</h3>
              <p className="text-xs text-muted-foreground">Café premium seleccionado para tu negocio</p>
            </CardContent>
          </Card>
          <Card className="p-4 text-center border-warm-primary/20">
            <CardContent className="p-0">
              <MessageSquare className="h-8 w-8 text-warm-primary mx-auto mb-2" />
              <h3 className="font-semibold text-sm">Asesoría Gratuita</h3>
              <p className="text-xs text-muted-foreground">Consultoría sin costo para optimizar tu café</p>
            </CardContent>
          </Card>
          <Card className="p-4 text-center border-warm-primary/20">
            <CardContent className="p-0">
              <Star className="h-8 w-8 text-warm-primary mx-auto mb-2" />
              <h3 className="font-semibold text-sm">Sin Compromiso</h3>
              <p className="text-xs text-muted-foreground">Conoce TUPÁ sin ninguna obligación</p>
            </CardContent>
          </Card>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre completo *</Label>
              <Input
                id="name"
                required
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Tu nombre"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                required
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="tu@email.com"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="+54 9 11 1234-5678"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company">Empresa</Label>
              <Input
                id="company"
                value={formData.company}
                onChange={(e) => handleInputChange('company', e.target.value)}
                placeholder="Nombre de tu empresa"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="business_type">Tipo de negocio</Label>
            <Select value={formData.business_type} onValueChange={(value) => handleInputChange('business_type', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona tu tipo de negocio" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cafeteria">Cafetería</SelectItem>
                <SelectItem value="restaurante">Restaurante</SelectItem>
                <SelectItem value="oficina">Oficina</SelectItem>
                <SelectItem value="hotel">Hotel</SelectItem>
                <SelectItem value="panaderia">Panadería</SelectItem>
                <SelectItem value="bar">Bar</SelectItem>
                <SelectItem value="otro">Otro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Mensaje</Label>
            <Textarea
              id="message"
              value={formData.message}
              onChange={(e) => handleInputChange('message', e.target.value)}
              placeholder="Cuéntanos sobre tu negocio y qué te interesa de TUPÁ..."
              rows={4}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !formData.name || !formData.email}
              className="flex-1 bg-gradient-to-r from-warm-primary to-warm-earth hover:from-warm-earth hover:to-warm-primary"
            >
              {isLoading ? (
                "Enviando..."
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Solicitar Cata Gratis
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}