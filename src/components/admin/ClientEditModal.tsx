import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, TestTube } from 'lucide-react';

interface ClientConfig {
  id: string;
  client_id: string;
  pos_type: string;
  pos_version: string;
  sync_frequency: number;
  simulation_mode: boolean;
  api_key?: string;
}

interface ClientEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: ClientConfig | null;
  onUpdate: () => void;
}

export default function ClientEditModal({ 
  isOpen, 
  onClose, 
  client, 
  onUpdate 
}: ClientEditModalProps) {
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [formData, setFormData] = useState({
    pos_type: client?.pos_type || '',
    pos_version: client?.pos_version || 'v1',
    sync_frequency: client?.sync_frequency || 15,
    simulation_mode: client?.simulation_mode || false,
    api_key: client?.api_key || '',
    sync_frequency_mode: client?.sync_frequency ? (client.sync_frequency === 0 ? 'manual' : client.sync_frequency === 1440 ? 'daily' : 'weekly') : 'daily',
  });
  
  const { toast } = useToast();

  const testConnection = async () => {
    if (!client || !formData.api_key || formData.pos_type === 'ninguno') {
      toast({
        title: "Error",
        description: "Se requiere API Key y tipo POS para testear la conexión",
        variant: "destructive",
      });
      return;
    }

    try {
      setTesting(true);
      
      const { data, error } = await supabase.functions.invoke('test-pos-connection', {
        body: {
          pos_type: formData.pos_type,
          api_key: formData.api_key,
          client_id: client.client_id
        }
      });

      if (error) throw error;

      if (data?.success) {
        toast({
          title: "Conexión exitosa",
          description: `${data.message} - Versión: ${data.version}`,
        });
      } else {
        throw new Error(data?.error || 'Error de conexión');
      }
    } catch (error) {
      toast({
        title: "Error de conexión",
        description: error instanceof Error ? error.message : "No se pudo establecer conexión con el POS",
        variant: "destructive",
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    if (!client) return;
    
    try {
      setLoading(true);
      
      // Convert sync frequency mode to minutes
      let syncFrequency = formData.sync_frequency;
      if (formData.sync_frequency_mode === 'manual') {
        syncFrequency = 0;
      } else if (formData.sync_frequency_mode === 'daily') {
        syncFrequency = 1440; // 24 hours in minutes
      } else if (formData.sync_frequency_mode === 'weekly') {
        syncFrequency = 10080; // 7 days in minutes
      }
      
      const { error } = await supabase
        .from('client_configs')
        .update({
          pos_type: formData.pos_type,
          pos_version: formData.pos_version,
          sync_frequency: syncFrequency,
          simulation_mode: formData.simulation_mode,
          updated_at: new Date().toISOString()
        })
        .eq('id', client.id);

      if (error) throw error;

      toast({
        title: "Configuración actualizada",
        description: "Los cambios se han guardado correctamente",
      });

      onUpdate();
      onClose();
    } catch (error) {
      console.error('Error updating config:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar la configuración",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Editar Configuración de Integración POS</DialogTitle>
          <DialogDescription>
            Configuración de integración POS para {client?.client_id}
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="pos_type" className="text-right">
              POS Conectado
            </Label>
            <Select
              value={formData.pos_type}
              onValueChange={(value) => setFormData(prev => ({ ...prev, pos_type: value }))}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Seleccionar POS" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fudo">Fudo</SelectItem>
                <SelectItem value="bistrosoft">BistroSoft</SelectItem>
                <SelectItem value="ninguno">Ninguno</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="api_key" className="text-right">
              API Key
            </Label>
            <div className="col-span-3 space-y-2">
              <Input
                id="api_key"
                type="password"
                value={formData.api_key}
                onChange={(e) => setFormData(prev => ({ ...prev, api_key: e.target.value }))}
                placeholder="Ingrese la API Key"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={testConnection}
                disabled={testing || !formData.api_key || formData.pos_type === 'ninguno'}
                className="w-full"
              >
                {testing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Testeando...
                  </>
                ) : (
                  <>
                    <TestTube className="w-4 h-4 mr-2" />
                    Testear Conexión
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="sync_frequency_mode" className="text-right">
              Frecuencia
            </Label>
            <Select
              value={formData.sync_frequency_mode}
              onValueChange={(value) => setFormData(prev => ({ ...prev, sync_frequency_mode: value }))}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="manual">Manual</SelectItem>
                <SelectItem value="daily">Diario</SelectItem>
                <SelectItem value="weekly">Semanal</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="simulation_mode" className="text-right">
              Modo Simulación
            </Label>
            <Switch
              id="simulation_mode"
              checked={formData.simulation_mode}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, simulation_mode: checked }))}
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="pos_version" className="text-right">
              Versión POS
            </Label>
            <Select
              value={formData.pos_version}
              onValueChange={(value) => setFormData(prev => ({ ...prev, pos_version: value }))}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="v1">v1</SelectItem>
                <SelectItem value="v2">v2</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Guardando...
              </>
            ) : (
              "Guardar cambios"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}