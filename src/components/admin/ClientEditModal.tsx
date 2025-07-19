import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Save, X } from 'lucide-react';

interface ClientConfig {
  id: string;
  client_id: string;
  pos_type: string;
  pos_version: string;
  sync_frequency: number;
  simulation_mode: boolean;
  created_at: string;
  updated_at: string;
}

interface ClientEditModalProps {
  client: ClientConfig;
  onSave: (client: ClientConfig) => void;
  onClose: () => void;
}

const POS_TYPES = [
  { value: 'fudo', label: 'Fudo POS' },
  { value: 'bistrosoft', label: 'BistrSoft' },
  { value: 'generic', label: 'Generic POS' }
];

const POS_VERSIONS = [
  { value: 'v1', label: 'Version 1.0' },
  { value: 'v2', label: 'Version 2.0' },
  { value: 'latest', label: 'Latest' }
];

export default function ClientEditModal({ client, onSave, onClose }: ClientEditModalProps) {
  const [formData, setFormData] = useState<ClientConfig>(client);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(formData);
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof ClientConfig, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Configurar Cliente POS</DialogTitle>
          <DialogDescription>
            Edita la configuración de integración para {client.client_id}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Cliente ID - Solo lectura */}
          <div className="space-y-2">
            <Label htmlFor="client_id">Cliente ID</Label>
            <Input
              id="client_id"
              value={formData.client_id}
              disabled
              className="bg-muted"
            />
          </div>

          {/* POS Type */}
          <div className="space-y-2">
            <Label htmlFor="pos_type">Tipo de POS</Label>
            <Select
              value={formData.pos_type}
              onValueChange={(value) => handleInputChange('pos_type', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona el tipo de POS" />
              </SelectTrigger>
              <SelectContent>
                {POS_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* POS Version */}
          <div className="space-y-2">
            <Label htmlFor="pos_version">Versión del POS</Label>
            <Select
              value={formData.pos_version}
              onValueChange={(value) => handleInputChange('pos_version', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona la versión" />
              </SelectTrigger>
              <SelectContent>
                {POS_VERSIONS.map((version) => (
                  <SelectItem key={version.value} value={version.value}>
                    {version.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Sync Frequency */}
          <div className="space-y-2">
            <Label htmlFor="sync_frequency">Frecuencia de Sincronización (minutos)</Label>
            <Input
              id="sync_frequency"
              type="number"
              min="5"
              max="1440"
              value={formData.sync_frequency}
              onChange={(e) => handleInputChange('sync_frequency', parseInt(e.target.value) || 15)}
            />
            <p className="text-sm text-muted-foreground">
              Mínimo: 5 minutos, Máximo: 1440 minutos (24 horas)
            </p>
          </div>

          {/* Simulation Mode */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="simulation_mode">Modo Simulación</Label>
              <p className="text-sm text-muted-foreground">
                En modo simulación no se realizan cambios reales en el POS
              </p>
            </div>
            <Switch
              id="simulation_mode"
              checked={formData.simulation_mode}
              onCheckedChange={(checked) => handleInputChange('simulation_mode', checked)}
            />
          </div>

          {/* Metadata Information */}
          <div className="bg-muted/50 p-4 rounded-lg space-y-2">
            <h4 className="text-sm font-medium">Información del Sistema</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Creado:</span>
                <br />
                {new Date(formData.created_at).toLocaleString('es-AR')}
              </div>
              <div>
                <span className="text-muted-foreground">Actualizado:</span>
                <br />
                {new Date(formData.updated_at).toLocaleString('es-AR')}
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            <X className="w-4 h-4 mr-2" />
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Guardar Cambios
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}