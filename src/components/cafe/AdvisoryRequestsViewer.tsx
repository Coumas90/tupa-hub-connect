import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Coffee, Calendar, Clock, Building, User, Phone, Mail, Target, MessageSquare, Eye } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface AdvisoryRequest {
  id: string;
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
}

interface AdvisoryRequestsViewerProps {
  cafeId: string;
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

export default function AdvisoryRequestsViewer({ cafeId }: AdvisoryRequestsViewerProps) {
  const [requests, setRequests] = useState<AdvisoryRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<AdvisoryRequest | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchRequests();
  }, [cafeId]);

  const fetchRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('advisory_requests')
        .select('*')
        .eq('cafe_id', cafeId)
        .order('created_at', { ascending: false });

      if (error) {
        // If there's an error (likely due to RLS policy), it means the cafe doesn't have visibility
        console.log('No visibility for this cafe or no requests found');
        setRequests([]);
        return;
      }

      setRequests(data || []);
    } catch (error) {
      console.error('Error fetching requests:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las solicitudes de asesoría",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-warm-primary"></div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Solicitudes de Asesoría
        </CardTitle>
        <CardDescription>
          Revisa las solicitudes de asesoría enviadas a TUPÁ
        </CardDescription>
      </CardHeader>
      <CardContent>
        {requests.length === 0 ? (
          <div className="text-center py-8">
            <Coffee className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium">No hay solicitudes</h3>
            <p className="text-muted-foreground">
              Aún no has enviado solicitudes de asesoría o no tienes permisos para verlas
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Prioridad</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fecha Solicitada</TableHead>
                  <TableHead>Fecha Enviada</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((request) => (
                  <TableRow key={request.id}>
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
                      {request.preferred_date ? (
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>{format(new Date(request.preferred_date), 'dd/MM/yyyy', { locale: es })}</span>
                          {request.preferred_time && (
                            <span className="text-muted-foreground">{request.preferred_time}</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">No especificada</span>
                      )}
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
                            onClick={() => setSelectedRequest(request)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Ver Detalles
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                              <Coffee className="h-5 w-5" />
                              Detalles de la Solicitud de Asesoría
                            </DialogTitle>
                            <DialogDescription>
                              Información completa de tu solicitud
                            </DialogDescription>
                          </DialogHeader>

                          {selectedRequest && (
                            <div className="space-y-6">
                              {/* Información del Solicitante */}
                              <div className="space-y-4">
                                <h3 className="font-semibold text-lg border-b pb-2">Información del Solicitante</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div className="flex items-center gap-2">
                                    <User className="h-4 w-4 text-muted-foreground" />
                                    <span>{selectedRequest.requester_name}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Mail className="h-4 w-4 text-muted-foreground" />
                                    <span>{selectedRequest.requester_email}</span>
                                  </div>
                                  {selectedRequest.requester_phone && (
                                    <div className="flex items-center gap-2">
                                      <Phone className="h-4 w-4 text-muted-foreground" />
                                      <span>{selectedRequest.requester_phone}</span>
                                    </div>
                                  )}
                                  <div className="flex items-center gap-2">
                                    <Building className="h-4 w-4 text-muted-foreground" />
                                    <span>{selectedRequest.company_name}</span>
                                  </div>
                                </div>
                              </div>

                              {/* Detalles de la Asesoría */}
                              <div className="space-y-4">
                                <h3 className="font-semibold text-lg border-b pb-2">Detalles de la Asesoría</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div className="flex items-center gap-2">
                                    <Target className="h-4 w-4 text-muted-foreground" />
                                    <span>{advisoryTypeLabels[selectedRequest.advisory_type as keyof typeof advisoryTypeLabels]}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-muted-foreground">Prioridad:</span>
                                    <Badge className={priorityColors[selectedRequest.priority as keyof typeof priorityColors]}>
                                      {priorityLabels[selectedRequest.priority as keyof typeof priorityLabels]}
                                    </Badge>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-muted-foreground">Estado:</span>
                                    <Badge className={statusColors[selectedRequest.status as keyof typeof statusColors]}>
                                      {statusLabels[selectedRequest.status as keyof typeof statusLabels]}
                                    </Badge>
                                  </div>
                                  {selectedRequest.preferred_date && (
                                    <div className="flex items-center gap-2">
                                      <Calendar className="h-4 w-4 text-muted-foreground" />
                                      <span>{format(new Date(selectedRequest.preferred_date), 'dd/MM/yyyy', { locale: es })}</span>
                                      {selectedRequest.preferred_time && (
                                        <span className="text-muted-foreground">a las {selectedRequest.preferred_time}</span>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Descripción */}
                              <div className="space-y-2">
                                <h3 className="font-semibold">Descripción</h3>
                                <p className="text-sm text-muted-foreground p-3 bg-muted rounded-lg">
                                  {selectedRequest.description}
                                </p>
                              </div>

                              {/* Fecha Programada */}
                              {selectedRequest.scheduled_date && (
                                <div className="space-y-2">
                                  <h3 className="font-semibold">Fecha Programada</h3>
                                  <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
                                    <Clock className="h-4 w-4 text-green-600" />
                                    <span className="text-green-800">
                                      {format(new Date(selectedRequest.scheduled_date), 'dd/MM/yyyy HH:mm', { locale: es })}
                                    </span>
                                  </div>
                                </div>
                              )}

                              {/* Notas del Administrador */}
                              {selectedRequest.admin_notes && (
                                <div className="space-y-2">
                                  <h3 className="font-semibold">Notas de TUPÁ</h3>
                                  <p className="text-sm text-muted-foreground p-3 bg-blue-50 rounded-lg">
                                    {selectedRequest.admin_notes}
                                  </p>
                                </div>
                              )}
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}