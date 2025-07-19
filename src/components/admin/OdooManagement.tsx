import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Settings, TestTube, ExternalLink, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

export default function OdooManagement() {
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [odooConfig, setOdooConfig] = useState({
    odoo_url: 'https://tupahub.odoo.com',
    odoo_username: 'admin@tupahub.com',
    odoo_password: '',
    sync_entities: ['orders', 'stock']
  });

  const { toast } = useToast();

  // Mock connection status
  const connectionStatus: 'connected' | 'disconnected' | 'error' = 'connected';
  const lastSync = '2024-01-19 14:30:00';

  const availableEntities = [
    { id: 'orders', label: 'Órdenes' },
    { id: 'stock', label: 'Inventario' },
    { id: 'crm', label: 'CRM' },
    { id: 'invoices', label: 'Facturas' }
  ];

  const testOdooConnection = async () => {
    try {
      setTesting(true);
      
      const { data, error } = await supabase.functions.invoke('test-odoo-connection', {
        body: {
          odoo_url: odooConfig.odoo_url,
          odoo_username: odooConfig.odoo_username,
          odoo_password: odooConfig.odoo_password || 'demo-password'
        }
      });

      if (error) throw error;

      if (data?.success) {
        toast({
          title: "Conexión Odoo exitosa",
          description: `${data.message} - Versión: ${data.server_info?.version}`,
        });
      } else {
        throw new Error(data?.error || 'Error de conexión con Odoo');
      }
    } catch (error) {
      toast({
        title: "Error de conexión",
        description: error instanceof Error ? error.message : "No se pudo establecer conexión con Odoo",
        variant: "destructive",
      });
    } finally {
      setTesting(false);
    }
  };

  const saveOdooConfig = async () => {
    try {
      setSaving(true);
      
      // Simulate save operation
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Configuración guardada",
        description: "La configuración de Odoo se ha actualizado correctamente",
      });
      
      setIsConfigOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo guardar la configuración",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleEntityChange = (entityId: string, checked: boolean) => {
    setOdooConfig(prev => ({
      ...prev,
      sync_entities: checked 
        ? [...prev.sync_entities, entityId]
        : prev.sync_entities.filter(id => id !== entityId)
    }));
  };

  const getStatusBadge = () => {
    if (connectionStatus === 'connected') {
      return <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Conectado</Badge>;
    } else if (connectionStatus === 'disconnected') {
      return <Badge variant="secondary">Desconectado</Badge>;
    } else if (connectionStatus === 'error') {
      return <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" />Error</Badge>;
    } else {
      return <Badge variant="secondary">Desconocido</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ExternalLink className="w-5 h-5" />
              Configuración Odoo (Interno TUPÁ)
            </CardTitle>
            <CardDescription>
              Gestión de la conexión con Odoo para sincronización interna
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={testOdooConnection}
              disabled={testing}
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
            <Button
              variant="default"
              size="sm"
              onClick={() => setIsConfigOpen(true)}
            >
              <Settings className="w-4 h-4 mr-2" />
              Editar Configuración
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <div className="text-sm font-medium text-muted-foreground">URL de Odoo</div>
            <div className="font-mono text-sm">{odooConfig.odoo_url}</div>
          </div>
          
          <div className="space-y-2">
            <div className="text-sm font-medium text-muted-foreground">Estado de Conexión</div>
            <div>{getStatusBadge()}</div>
          </div>
          
          <div className="space-y-2">
            <div className="text-sm font-medium text-muted-foreground">Última Sincronización</div>
            <div className="text-sm">{lastSync}</div>
          </div>
        </div>
        
        <div className="mt-6">
          <div className="text-sm font-medium text-muted-foreground mb-2">Entidades Sincronizadas</div>
          <div className="flex gap-2 flex-wrap">
            {odooConfig.sync_entities.map(entity => {
              const entityLabel = availableEntities.find(e => e.id === entity)?.label || entity;
              return (
                <Badge key={entity} variant="outline">
                  {entityLabel}
                </Badge>
              );
            })}
          </div>
        </div>
      </CardContent>

      <Dialog open={isConfigOpen} onOpenChange={setIsConfigOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Editar Configuración Odoo</DialogTitle>
            <DialogDescription>
              Configurar la conexión y entidades a sincronizar con Odoo
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="odoo_url" className="text-right">
                URL Odoo
              </Label>
              <Input
                id="odoo_url"
                value={odooConfig.odoo_url}
                onChange={(e) => setOdooConfig(prev => ({ ...prev, odoo_url: e.target.value }))}
                className="col-span-3"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="odoo_username" className="text-right">
                Usuario
              </Label>
              <Input
                id="odoo_username"
                value={odooConfig.odoo_username}
                onChange={(e) => setOdooConfig(prev => ({ ...prev, odoo_username: e.target.value }))}
                className="col-span-3"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="odoo_password" className="text-right">
                Contraseña
              </Label>
              <Input
                id="odoo_password"
                type="password"
                value={odooConfig.odoo_password}
                onChange={(e) => setOdooConfig(prev => ({ ...prev, odoo_password: e.target.value }))}
                className="col-span-3"
                placeholder="••••••••"
              />
            </div>

            <div className="grid grid-cols-4 items-start gap-4">
              <Label className="text-right mt-2">
                Entidades
              </Label>
              <div className="col-span-3 space-y-2">
                {availableEntities.map(entity => (
                  <div key={entity.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={entity.id}
                      checked={odooConfig.sync_entities.includes(entity.id)}
                      onCheckedChange={(checked) => handleEntityChange(entity.id, checked as boolean)}
                    />
                    <Label htmlFor={entity.id} className="text-sm">
                      {entity.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsConfigOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={saveOdooConfig} disabled={saving}>
              {saving ? (
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
    </Card>
  );
}