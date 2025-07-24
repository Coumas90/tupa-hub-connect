import { useState, useEffect } from 'react';
import ModuleAccessGuard from '@/components/ModuleAccessGuard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Filter, Activity, AlertCircle, Users, CheckCircle, Clock, Settings, Plus } from 'lucide-react';
import LogsAndMonitoring from '@/components/LogsAndMonitoring';
import IntegrationTable from '@/components/admin/IntegrationTable';
import IntegrationMonitoring from '@/components/admin/IntegrationMonitoring';
import NewIntegrationModal from '@/components/admin/NewIntegrationModal';
import OdooManagement from '@/components/admin/OdooManagement';
import { QRDashboard } from '@/components/admin/QRDashboard';
import { getLogStats } from '@/lib/api/logs';
import { supabase } from '@/integrations/supabase/client';

interface DashboardStats {
  totalClients: number;
  activeClients: number;
  clientsWithErrors: number;
  eventsLast24h: number;
}

export default function AdminIntegrations() {
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'success' | 'error' | 'pending'>('all');
  const [selectedTab, setSelectedTab] = useState<'overview' | 'monitoring' | 'qr'>('overview');
  const [showNewIntegrationModal, setShowNewIntegrationModal] = useState(false);
  const [tableKey, setTableKey] = useState(0); // To force table re-render
  const [stats, setStats] = useState<DashboardStats>({
    totalClients: 0,
    activeClients: 0,
    clientsWithErrors: 0,
    eventsLast24h: 0
  });
  const { toast } = useToast();

  // Fetch dashboard statistics
  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      
      // Fetch client configs count
      const { data: configs, error: configsError } = await supabase
        .from('client_configs')
        .select('id, simulation_mode');

      if (configsError) throw configsError;

      // Fetch log statistics
      const logStats = await getLogStats();

      // Calculate dashboard stats
      const dashboardStats: DashboardStats = {
        totalClients: configs?.length || 0,
        activeClients: logStats.success,
        clientsWithErrors: logStats.error,
        eventsLast24h: logStats.last24Hours
      };

      setStats(dashboardStats);
    } catch (error) {
      console.error('Error fetching stats:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard statistics",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <ModuleAccessGuard requiredRole="admin">
        <div className="container mx-auto p-6">
          <Card>
            <CardHeader>
              <CardTitle>Cargando integraciones...</CardTitle>
            </CardHeader>
          </Card>
        </div>
      </ModuleAccessGuard>
    );
  }

  return (
    <ModuleAccessGuard requiredRole="admin">
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Administración de Integraciones</h1>
            <p className="text-muted-foreground">
              Gestiona las integraciones POS por cliente y configuración de Odoo
            </p>
          </div>
          
          <div className="flex gap-2">
            {selectedTab === 'overview' && (
              <Button
                onClick={() => setShowNewIntegrationModal(true)}
                className="bg-primary hover:bg-primary/90"
              >
                <Plus className="w-4 h-4 mr-2" />
                Agregar Integración POS
              </Button>
            )}
            
            <Button
              variant={selectedTab === 'overview' ? 'default' : 'outline'}
              onClick={() => setSelectedTab('overview')}
            >
              <Settings className="w-4 h-4 mr-2" />
              Integraciones
            </Button>
            <Button
              variant={selectedTab === 'monitoring' ? 'default' : 'outline'}
              onClick={() => setSelectedTab('monitoring')}
            >
              <Activity className="w-4 h-4 mr-2" />
              Monitoring
            </Button>
            <Button
              variant={selectedTab === 'qr' ? 'default' : 'outline'}
              onClick={() => setSelectedTab('qr')}
            >
              <Activity className="w-4 h-4 mr-2" />
              QR Codes
            </Button>
            
            {selectedTab === 'overview' && (
              <Select value={filter} onValueChange={(value) => setFilter(value as any)}>
                <SelectTrigger className="w-40">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="success">Exitoso</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                  <SelectItem value="pending">Pendiente</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
        </div>

        {selectedTab === 'overview' ? (
          <>
            {/* Metrics Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-blue-600" />
                    <div>
                      <div className="text-2xl font-bold text-blue-600">{stats.totalClients}</div>
                      <div className="text-sm text-muted-foreground">Clientes Total</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <div>
                      <div className="text-2xl font-bold text-green-600">{stats.activeClients}</div>
                      <div className="text-sm text-muted-foreground">Operativos</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-600" />
                    <div>
                      <div className="text-2xl font-bold text-red-600">{stats.clientsWithErrors}</div>
                      <div className="text-sm text-muted-foreground">Con Errores</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-purple-600" />
                    <div>
                      <div className="text-2xl font-bold text-purple-600">{stats.eventsLast24h}</div>
                      <div className="text-sm text-muted-foreground">Eventos (24h)</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Integraciones POS por Cliente</CardTitle>
                <CardDescription>
                  Gestión de configuraciones POS y monitoreo de sincronizaciones
                </CardDescription>
              </CardHeader>
              <CardContent>
                <IntegrationTable filter={filter} key={tableKey} />
              </CardContent>
            </Card>

            <OdooManagement />
          </>
        ) : selectedTab === 'monitoring' ? (
          <IntegrationMonitoring />
        ) : (
          <QRDashboard />
        )}

        <NewIntegrationModal 
          isOpen={showNewIntegrationModal}
          onClose={() => setShowNewIntegrationModal(false)}
          onSuccess={() => {
            setShowNewIntegrationModal(false);
            setTableKey(prev => prev + 1); // Force table refresh
            fetchStats(); // Refresh the stats after adding new integration
          }}
        />
      </div>
    </ModuleAccessGuard>
  );
}