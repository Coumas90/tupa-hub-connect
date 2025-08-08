import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useForm } from 'react-hook-form';
import { createClientAndOwner, CreateClientPayload } from '@/lib/api/admin-clients';
import { useToast } from '@/hooks/use-toast';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreated?: () => void;
}

export function ClientCreateModal({ open, onOpenChange, onCreated }: Props) {
  const { register, handleSubmit, reset } = useForm<CreateClientPayload>();
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(false);

  const onSubmit = async (values: CreateClientPayload) => {
    try {
      setLoading(true);
      if (!values.clientName || !values.ownerName || !values.ownerEmail) {
        toast({ title: 'Faltan datos', description: 'Completá nombre del cliente, owner y email', variant: 'destructive' });
        return;
      }
      await createClientAndOwner(values);
      toast({ title: 'Cliente creado', description: 'Se envió la invitación al owner' });
      reset();
      onOpenChange(false);
      onCreated?.();
    } catch (e: any) {
      toast({ title: 'Error', description: e.message || 'No se pudo crear el cliente', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nuevo cliente</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Nombre del cliente</Label>
              <Input placeholder="Cafetería XYZ" {...register('clientName')} />
            </div>
            <div>
              <Label>Color de marca (opcional)</Label>
              <Input placeholder="#8B5CF6" {...register('brandColor')} />
            </div>
            <div>
              <Label>Owner - Nombre</Label>
              <Input placeholder="Juan Pérez" {...register('ownerName')} />
            </div>
            <div>
              <Label>Owner - Email</Label>
              <Input type="email" placeholder="owner@cafe.com" {...register('ownerEmail')} />
            </div>
            <div>
              <Label>Teléfono</Label>
              <Input placeholder="+54 11 ..." {...register('phone')} />
            </div>
            <div>
              <Label>Dirección</Label>
              <Input placeholder="Calle 123, CABA" {...register('address')} />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>Cancelar</Button>
            <Button type="submit" disabled={loading}>{loading ? 'Creando...' : 'Crear & Invitar'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
