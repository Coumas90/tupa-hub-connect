import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Coffee, Eye, EyeOff, Calendar, Clock, Building, User, Phone, Mail, Target, Settings, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface AdvisoryRequest {
  id: string;
  cafe_id: string;
  requester_name: string;
  requester_email: string;
  requester_phone?: string;
  company_name: string;
  company_size: string;
  advisory_type: string;
  priority: string;
  preferred_date?: string;
  preferred_time?: string;
  description: string;
  status: string;
  admin_notes?: string;
  scheduled_date?: string;
  created_at: string;
  updated_at: string;
  cafes: {
    name: string;
    owner_id: string;
  };
}

interface VisibilityConfig {
  id: string;
  cafe_id: string;
  is_visible: boolean;
  cafes: {
    name: string;
  };
}

const advisoryTypeLabels = {
  menu_optimization: 'Optimización de Menú',
  operations: 'Operaciones',
  training: 'Capacitación',
  marketing: 'Marketing',
  equipment: 'Equipamiento',
  sustainability: 'Sostenibilidad'
};

const priorityLabels = {
  low: 'Baja',
  medium: 'Media',
  high: 'Alta',
  urgent: 'Urgente'
};

const statusLabels = {
  pending: 'Pendiente',
  scheduled: 'Programada',
  completed: 'Completada',
  cancelled: 'Cancelada'
};

const priorityColors = {
  low: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-orange-100 text-orange-800',
  urgent: 'bg-red-100 text-red-800'
};

const statusColors = {
  pending: 'bg-blue-100 text-blue-800',
  scheduled: 'bg-purple-100 text-purple-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-gray-100 text-gray-800'
};

export default function AdvisoryRequestsManager() {
  const [requests, setRequests] = useState<AdvisoryRequest[]>([]);
  const [visibilityConfigs, setVisibilityConfigs] = useState<VisibilityConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<AdvisoryRequest | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [updatingRequest, setUpdatingRequest] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch advisory requests
      const { data: requestsData, error: requestsError } = await supabase
        .from('advisory_requests')
        .select(`
          *,
          cafes (
            name,
            owner_id
          )
        `)
        .order('created_at', { ascending: false });

      if (requestsError) throw requestsError;

      // Fetch visibility configurations
      const { data: configsData, error: configsError } = await supabase
        .from('advisory_visibility_config')
        .select(`
          *,
          cafes (
            name
          )
        `);

      if (configsError) throw configsError;

      setRequests(requestsData || []);
      setVisibilityConfigs(configsData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las solicitudes de asesoría",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleVisibility = async (cafeId: string, currentVisibility: boolean) => {
    try {
      const { error } = await supabase
        .from('advisory_visibility_config')
        .update({ is_visible: !currentVisibility })
        .eq('cafe_id', cafeId);

      if (error) throw error;

      setVisibilityConfigs(configs =>
        configs.map(config =>
          config.cafe_id === cafeId
            ? { ...config, is_visible: !currentVisibility }
            : config
        )
      );

      toast({
        title: "Configuración actualizada",
        description: `Visibilidad ${!currentVisibility ? 'activada' : 'desactivada'} para la cafetería`,
      });
    } catch (error) {
      console.error('Error updating visibility:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar la configuración de visibilidad",
        variant: "destructive",
      });
    }
  };

  const updateRequest = async () => {
    if (!selectedRequest) return;

    setUpdatingRequest(true);
    try {
      const updateData: any = {
        admin_notes: adminNotes,
      };

      if (newStatus) {
        updateData.status = newStatus;
      }

      if (scheduledDate && newStatus === 'scheduled') {
        updateData.scheduled_date = scheduledDate;
      }

      const { error } = await supabase
        .from('advisory_requests')
        .update(updateData)
        .eq('id', selectedRequest.id);

      if (error) throw error;

      await fetchData();
      setSelectedRequest(null);
      setAdminNotes('');
      setNewStatus('');
      setScheduledDate('');

      toast({
        title: "Solicitud actualizada",
        description: "La solicitud ha sido actualizada exitosamente",
      });
    } catch (error) {
      console.error('Error updating request:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar la solicitud",
        variant: "destructive",
      });
    } finally {
      setUpdatingRequest(false);
    }
  };

  const getVisibilityForCafe = (cafeId: string) => {
    const config = visibilityConfigs.find(c => c.cafe_id === cafeId);
    return config?.is_visible ?? true;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-warm-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-warm-primary">Gestión de Asesorías</h1>
          <p className="text-muted-foreground">
            Administra las solicitudes de asesoría y configura la visibilidad por cafetería
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Coffee className="h-4 w-4" />
          {requests.length} solicitudes totales
        </div>
      </div>

      {/* Visibility Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configuración de Visibilidad por Cafetería
          </CardTitle>
          <CardDescription>
            Controla qué cafeterías pueden ver las solicitudes de asesoría
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {visibilityConfigs.map((config) => (
              <div
                key={config.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  {config.is_visible ? (
                    <Eye className="h-4 w-4 text-green-600" />
                  ) : (
                    <EyeOff className="h-4 w-4 text-red-600" />
                  )}
                  <span className="font-medium">{config.cafes.name}</span>
                </div>
                <Switch
                  checked={config.is_visible}
                  onCheckedChange={() => toggleVisibility(config.cafe_id, config.is_visible)}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Requests Table */}
      <Card>
        <CardHeader>
          <CardTitle>Solicitudes de Asesoría</CardTitle>
          <CardDescription>
            Revisa y gestiona todas las solicitudes recibidas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Solicitante</TableHead>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Cafetería</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Prioridad</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Visibilidad</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((request) => {
                  const isVisible = getVisibilityForCafe(request.cafe_id);
                  return (
                    <TableRow key={request.id} className={!isVisible ? 'opacity-50' : ''}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{request.requester_name}</div>
                          <div className="text-sm text-muted-foreground">{request.requester_email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{request.company_name}</div>
                          <div className="text-sm text-muted-foreground">{request.company_size}</div>
                        </div>
                      </TableCell>
                      <TableCell>{request.cafes.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {advisoryTypeLabels[request.advisory_type as keyof typeof advisoryTypeLabels]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={priorityColors[request.priority as keyof typeof priorityColors]}>
                          {priorityLabels[request.priority as keyof typeof priorityLabels]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={statusColors[request.status as keyof typeof statusColors]}>
                          {statusLabels[request.status as keyof typeof statusLabels]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {isVisible ? (
                            <Eye className="h-4 w-4 text-green-600" />
                          ) : (
                            <EyeOff className="h-4 w-4 text-red-600" />
                          )}
                          <span className="text-sm">
                            {isVisible ? 'Visible' : 'Oculta'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {format(new Date(request.created_at), 'dd/MM/yyyy', { locale: es })}
                      </TableCell>
                      <TableCell>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedRequest(request);
                                setAdminNotes(request.admin_notes || '');
                                setNewStatus(request.status);
                                setScheduledDate(request.scheduled_date || '');
                              }}
                            >
                              Ver Detalles
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle className="flex items-center gap-2">
                                <Coffee className="h-5 w-5" />
                                Solicitud de Asesoría - {request.requester_name}
                              </DialogTitle>
                              <DialogDescription>
                                Detalles completos de la solicitud y opciones de gestión
                              </DialogDescription>
                            </DialogHeader>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              {/* Información del Solicitante */}
                              <div className="space-y-4">
                                <h3 className="font-semibold text-lg border-b pb-2">Información del Solicitante</h3>
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2">
                                    <User className="h-4 w-4 text-muted-foreground" />
                                    <span>{request.requester_name}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Mail className="h-4 w-4 text-muted-foreground" />
                                    <span>{request.requester_email}</span>
                                  </div>
                                  {request.requester_phone && (
                                    <div className="flex items-center gap-2">
                                      <Phone className="h-4 w-4 text-muted-foreground" />
                                      <span>{request.requester_phone}</span>
                                    </div>
                                  )}
                                  <div className="flex items-center gap-2">
                                    <Building className="h-4 w-4 text-muted-foreground" />
                                    <span>{request.company_name}</span>
                                  </div>
                                </div>
                              </div>

                              {/* Detalles de la Asesoría */}
                              <div className="space-y-4">
                                <h3 className="font-semibold text-lg border-b pb-2">Detalles de la Asesoría</h3>
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2">
                                    <Target className="h-4 w-4 text-muted-foreground" />
                                    <span>{advisoryTypeLabels[request.advisory_type as keyof typeof advisoryTypeLabels]}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                                    <Badge className={priorityColors[request.priority as keyof typeof priorityColors]}>
                                      {priorityLabels[request.priority as keyof typeof priorityLabels]}
                                    </Badge>
                                  </div>
                                  {request.preferred_date && (
                                    <div className="flex items-center gap-2">
                                      <Calendar className="h-4 w-4 text-muted-foreground" />
                                      <span>{format(new Date(request.preferred_date), 'dd/MM/yyyy', { locale: es })}</span>
                                      {request.preferred_time && (
                                        <span className="text-muted-foreground">a las {request.preferred_time}</span>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Descripción */}
                            <div className="space-y-2">
                              <h3 className="font-semibold">Descripción</h3>
                              <p className="text-sm text-muted-foreground p-3 bg-muted rounded-lg">
                                {request.description}
                              </p>
                            </div>

                            {/* Gestión de la Solicitud */}
                            <div className="space-y-4 border-t pt-4">
                              <h3 className="font-semibold">Gestión de la Solicitud</h3>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label htmlFor="status">Estado</Label>
                                  <Select value={newStatus} onValueChange={setNewStatus}>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Seleccionar estado" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {Object.entries(statusLabels).map(([value, label]) => (
                                        <SelectItem key={value} value={value}>
                                          {label}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>

                                {newStatus === 'scheduled' && (
                                  <div className="space-y-2">
                                    <Label htmlFor="scheduledDate">Fecha Programada</Label>
                                    <Input
                                      type="datetime-local"
                                      value={scheduledDate}
                                      onChange={(e) => setScheduledDate(e.target.value)}
                                    />
                                  </div>
                                )}
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor="adminNotes">Notas del Administrador</Label>
                                <Textarea
                                  placeholder="Agregar notas internas sobre esta solicitud..."
                                  value={adminNotes}
                                  onChange={(e) => setAdminNotes(e.target.value)}
                                  className="min-h-[100px]"
                                />
                              </div>

                              <Button
                                onClick={updateRequest}
                                disabled={updatingRequest}
                                className="w-full"
                              >
                                {updatingRequest ? "Actualizando..." : "Actualizar Solicitud"}
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {requests.length === 0 && (
            <div className="text-center py-8">
              <Coffee className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium">No hay solicitudes</h3>
              <p className="text-muted-foreground">
                Aún no se han recibido solicitudes de asesoría
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}