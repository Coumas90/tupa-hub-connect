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
      // 1. Create user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: formData.email,
        user_metadata: {
          full_name: formData.fullName,
          phone: formData.phone
        },
        email_confirm: false // User will confirm when activating account
      });

      if (authError) throw authError;

      if (!authData.user) {
        throw new Error('No se pudo crear el usuario');
      }

      // 2. Get current user location/cafe for cafe_id
      const { data: currentUser } = await supabase.auth.getUser();
      if (!currentUser.user) throw new Error('No se pudo obtener el usuario actual');

      const { data: userProfile } = await supabase
        .from('users')
        .select('location_id, group_id')
        .eq('id', currentUser.user.id)
        .single();

      // 3. Create user profile
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          location_id: userProfile?.location_id,
          group_id: userProfile?.group_id,
          created_by: currentUser.user.id
        });

      if (profileError) throw profileError;

      // 4. Assign barista role - this will trigger the invitation email
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: authData.user.id,
          role: formData.role
        });

      if (roleError) throw roleError;

      // 5. Get cafe name for the email
      const { data: cafeData } = await supabase
        .from('cafes')
        .select('name')
        .eq('id', userProfile?.group_id)
        .single();

      // 6. Generate invitation token
      const { data: tokenData } = await supabase.rpc('generate_invitation_token');
      
      if (!tokenData) throw new Error('No se pudo generar el token de invitación');

      // 7. Create invitation token record
      const { error: tokenError } = await supabase
        .from('invitation_tokens')
        .insert({
          token: tokenData,
          email: formData.email,
          user_id: authData.user.id,
          cafe_id: userProfile?.group_id,
          role: formData.role,
          created_by: currentUser.user.id
        });

      if (tokenError) throw tokenError;

      // 8. Send invitation email
      const { error: emailError } = await supabase.functions.invoke('send-barista-invitation', {
        body: {
          userEmail: formData.email,
          userName: formData.fullName,
          cafeName: cafeData?.name || 'Tu Cafetería',
          token: tokenData
        }
      });

      if (emailError) {
        console.error('Error sending email:', emailError);
        // Don't throw here - user was created successfully, just email failed
        toast({
          title: "Usuario creado",
          description: "El usuario fue creado pero hubo un problema enviando el email. Podés reenviar la invitación desde el panel de administración.",
          variant: "default"
        });
      } else {
        toast({
          title: "¡Invitación enviada!",
          description: `Se envió una invitación a ${formData.email}. El nuevo barista recibirá un email para activar su cuenta.`
        });
      }

      // Reset form and close modal
      setFormData({ fullName: '', email: '', role: 'barista', phone: '' });
      onOpenChange(false);
      onSuccess?.();

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