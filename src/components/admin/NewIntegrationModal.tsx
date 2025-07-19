import { useState } from 'react';
import { sanitizeInput } from '@/utils/FormUtils';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, TestTube, CheckCircle, AlertCircle } from 'lucide-react';

interface NewIntegrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

// Mock client list - in production this would come from a clients table
const availableClients = [
  { id: 'cafe_central', name: 'Café Central' },
  { id: 'bistro_norte', name: 'Bistro Norte' },
  { id: 'cafe_el_molino', name: 'Café El Molino' },
  { id: 'restaurant_sur', name: 'Restaurant Sur' },
  { id: 'coffee_plaza', name: 'Coffee Plaza' },
  { id: 'bar_esquina', name: 'Bar Esquina' }
];

export default function NewIntegrationModal({ 
  isOpen, 
  onClose, 
  onSuccess 
}: NewIntegrationModalProps) {
  const [loading, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);
  const [formData, setFormData] = useState({
    client_id: '',
    pos_type: '',
    api_key: '',
    sync_frequency_mode: 'daily',
    simulation_mode: false,
    pos_version: 'v1',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const { toast } = useToast();

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.client_id) {
      newErrors.client_id = 'Debe seleccionar un cliente';
    }
    
    if (!formData.pos_type) {
      newErrors.pos_type = 'Debe seleccionar un tipo de POS';
    }
    
    if (formData.pos_type !== 'none' && !formData.api_key) {
      newErrors.api_key = 'API Key es requerida para este tipo de POS';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const testConnection = async () => {
    if (!formData.api_key || formData.pos_type === 'none') {
      toast({
        title: "Error",
        description: "Se requiere API Key y tipo POS para testear la conexión",
        variant: "destructive",
      });
      return;
    }

    try {
      setTesting(true);
      setTestResult(null);
      
      const { data, error } = await supabase.functions.invoke('test-pos-connection', {
        body: {
          pos_type: formData.pos_type,
          api_key: formData.api_key,
          client_id: formData.client_id
        }
      });

      if (error) throw error;

      if (data?.success) {
        setTestResult('success');
        toast({
          title: "Conexión exitosa",
          description: `${data.message} - Versión: ${data.version}`,
        });
      } else {
        setTestResult('error');
        throw new Error(data?.error || 'Error de conexión');
      }
    } catch (error) {
      setTestResult('error');
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
    if (!validateForm()) {
      return;
    }
    
    try {
      setSaving(true);
      
      // Convert sync frequency mode to minutes
      let syncFrequency = 15; // default
      if (formData.sync_frequency_mode === 'manual') {
        syncFrequency = 0;
      } else if (formData.sync_frequency_mode === 'daily') {
        syncFrequency = 1440; // 24 hours in minutes
      } else if (formData.sync_frequency_mode === 'weekly') {
        syncFrequency = 10080; // 7 days in minutes
      }

      // Check if client already has a configuration
      const { data: existingConfig } = await supabase
        .from('client_configs')
        .select('id')
        .eq('client_id', formData.client_id)
        .single();

      let result;
      if (existingConfig) {
        // Update existing configuration
        result = await supabase
          .from('client_configs')
          .update({
            pos_type: formData.pos_type,
            pos_version: formData.pos_version,
            sync_frequency: syncFrequency,
            simulation_mode: formData.simulation_mode,
            updated_at: new Date().toISOString()
          })
          .eq('client_id', formData.client_id);
      } else {
        // Insert new configuration
        result = await supabase
          .from('client_configs')
          .insert({
            client_id: formData.client_id,
            pos_type: formData.pos_type,
            pos_version: formData.pos_version,
            sync_frequency: syncFrequency,
            simulation_mode: formData.simulation_mode
          });
      }

      if (result.error) throw result.error;

      toast({
        title: "Integración guardada",
        description: `Integración POS para ${formData.client_id} ${existingConfig ? 'actualizada' : 'creada'} correctamente`,
      });

      // Reset form
      setFormData({
        client_id: '',
        pos_type: '',
        api_key: '',
        sync_frequency_mode: 'daily',
        simulation_mode: false,
        pos_version: 'v1',
      });
      setTestResult(null);
      setErrors({});

      onSuccess();
    } catch (error) {
      console.error('Error saving integration:', error);
      toast({
        title: "Error",
        description: "No se pudo guardar la integración",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setFormData({
      client_id: '',
      pos_type: '',
      api_key: '',
      sync_frequency_mode: 'daily',
      simulation_mode: false,
      pos_version: 'v1',
    });
    setTestResult(null);
    setErrors({});
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Agregar Nueva Integración POS</DialogTitle>
          <DialogDescription>
            Configure una nueva integración POS para un cliente
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="client_id" className="text-right">
              Cliente *
            </Label>
            <div className="col-span-3">
              <Select
                value={formData.client_id}
                onValueChange={(value) => setFormData(prev => ({ ...prev, client_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar cliente" />
                </SelectTrigger>
                <SelectContent>
                  {availableClients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.client_id && (
                <p className="text-sm text-red-500 mt-1">{errors.client_id}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="pos_type" className="text-right">
              Tipo POS *
            </Label>
            <div className="col-span-3">
              <Select
                value={formData.pos_type}
                onValueChange={(value) => setFormData(prev => ({ ...prev, pos_type: value, api_key: value === 'none' ? '' : prev.api_key }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar tipo POS" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fudo">Fudo</SelectItem>
                  <SelectItem value="bistrosoft">BistroSoft</SelectItem>
                  <SelectItem value="resto">Resto POS</SelectItem>
                  <SelectItem value="none">Ninguno</SelectItem>
                </SelectContent>
              </Select>
              {errors.pos_type && (
                <p className="text-sm text-red-500 mt-1">{errors.pos_type}</p>
              )}
            </div>
          </div>

          {formData.pos_type && formData.pos_type !== 'none' && (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="api_key" className="text-right">
                API Key *
              </Label>
              <div className="col-span-3 space-y-2">
                <div className="flex gap-2">
                  <Input
                    id="api_key"
                    type="password"
                    value={formData.api_key}
                    onChange={(e) => setFormData(prev => ({ ...prev, api_key: sanitizeInput(e.target.value) }))}
                    placeholder="Ingrese la API Key"
                    className="flex-1"
                  />
                  {testResult === 'success' && (
                    <CheckCircle className="w-5 h-5 text-green-500 mt-2" />
                  )}
                  {testResult === 'error' && (
                    <AlertCircle className="w-5 h-5 text-red-500 mt-2" />
                  )}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={testConnection}
                  disabled={testing || !formData.api_key}
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
                {errors.api_key && (
                  <p className="text-sm text-red-500">{errors.api_key}</p>
                )}
              </div>
            </div>
          )}

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

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="simulation_mode" className="text-right">
              Modo Simulación
            </Label>
            <div className="col-span-3 flex items-center space-x-2">
              <Switch
                id="simulation_mode"
                checked={formData.simulation_mode}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, simulation_mode: checked }))}
              />
              <Label htmlFor="simulation_mode" className="text-sm text-muted-foreground">
                {formData.simulation_mode ? 'Activado - No afectará datos reales' : 'Desactivado - Operaciones reales'}
              </Label>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Guardando...
              </>
            ) : (
              "Guardar Integración"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}