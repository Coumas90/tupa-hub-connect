import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { UserPlus, Mail, User, Building, Coffee } from 'lucide-react';

interface AddBaristaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export const AddBaristaModal: React.FC<AddBaristaModalProps> = ({
  open,
  onOpenChange,
  onSuccess
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    role: 'barista',
    phone: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Get current user
      const { data: currentUser, error: userError } = await supabase.auth.getUser();
      if (userError || !currentUser.user) {
        console.error('Error getting current user:', userError);
        throw new Error('No se pudo obtener el usuario actual. Por favor, intentá iniciar sesión nuevamente.');
      }

      // Call the edge function to create barista
      const { data, error } = await supabase.functions.invoke('create-barista', {
        body: {
          fullName: formData.fullName,
          email: formData.email,
          role: formData.role,
          phone: formData.phone,
          createdBy: currentUser.user.id
        }
      });

      if (error) throw error;

      if (data.success) {
        if (data.emailStatus === 'sent') {
          toast({
            title: "¡Invitación enviada!",
            description: `Se envió una invitación a ${formData.email}. El nuevo barista recibirá un email para activar su cuenta.`
          });
        } else {
          toast({
            title: "Usuario creado",
            description: "El usuario fue creado pero hubo un problema enviando el email. Podés reenviar la invitación desde el panel de administración.",
            variant: "default"
          });
        }

        // Reset form and close modal
        setFormData({ fullName: '', email: '', role: 'barista', phone: '' });
        onOpenChange(false);
        onSuccess?.();
      } else {
        throw new Error(data.error || 'Error desconocido');
      }

    } catch (error: any) {
      console.error('Error creating barista:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Error al crear el nuevo barista"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            Agregar Nuevo Barista
          </DialogTitle>
          <DialogDescription>
            Invitá a un nuevo miembro a formar parte de tu equipo en TUPÁ Hub
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Nombre completo
            </Label>
            <Input
              id="fullName"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              placeholder="Ej: María González"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email
            </Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="maria@ejemplo.com"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Teléfono (opcional)</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+54 11 2345-6789"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role" className="flex items-center gap-2">
              <Coffee className="h-4 w-4" />
              Rol
            </Label>
            <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="barista">Barista</SelectItem>
                <SelectItem value="barista_junior">Barista Junior</SelectItem>
                <SelectItem value="barista_senior">Barista Senior</SelectItem>
                <SelectItem value="encargado">Encargado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="bg-accent/10 p-4 rounded-lg">
            <p className="text-sm text-muted-foreground">
              <Coffee className="h-4 w-4 inline mr-1" />
              Se enviará un email de invitación a <strong>{formData.email || '[email]'}</strong> con un enlace para activar su cuenta en TUPÁ Hub.
            </p>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-gradient-primary hover:bg-primary/90"
            >
              {loading ? 'Enviando...' : 'Enviar Invitación'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};