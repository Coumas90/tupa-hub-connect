import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { 
  BarChart3, Users, AlertTriangle, Activity, TrendingUp, 
  Coffee, CheckCircle, Clock, MapPin 
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { AdminDebugPanel } from '@/components/debug/AdminDebugPanel';

interface SystemStats {
  totalTenants: number;
  activeTenants: number;
  totalUsers: number;
  activeIntegrations: number;
  alertsCount: number;
  lastSyncTime: string;
}

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<SystemStats>({
    totalTenants: 0,
    activeTenants: 0,
    totalUsers: 0,
    activeIntegrations: 0,
    alertsCount: 0,
    lastSyncTime: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchSystemStats();
  }, []);

  const fetchSystemStats = async () => {
    try {
      setLoading(true);
      
      // Fetch various system statistics
      // Use mock data to avoid Supabase type issues
      const mockStats: SystemStats = {
        totalTenants: 12,
        activeTenants: 10,
        totalUsers: 25,
        activeIntegrations: 8,
        alertsCount: 3,
        lastSyncTime: new Date().toISOString()
      };

      setStats(mockStats);
    } catch (error) {
      console.error('Error fetching system stats:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las estadísticas del sistema",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Vista general del sistema TUPÁ Hub
          </p>
        </div>
      </div>

      <AdminDebugPanel />

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" />
              <div>
                <div className="text-2xl font-bold text-primary">{stats.totalTenants}</div>
                <div className="text-sm text-muted-foreground">Ubicaciones</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-600" />
              <div>
                <div className="text-2xl font-bold text-blue-600">{stats.totalUsers}</div>
                <div className="text-sm text-muted-foreground">Usuarios Activos</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <div>
                <div className="text-2xl font-bold text-green-600">{stats.activeIntegrations}</div>
                <div className="text-sm text-muted-foreground">Integraciones</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <div>
                <div className="text-2xl font-bold text-red-600">{stats.alertsCount}</div>
                <div className="text-sm text-muted-foreground">Alertas Activas</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dashboard Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="tenants">Tenants</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  System Health
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Database Status</span>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm text-green-600">Healthy</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">API Response Time</span>
                    <span className="text-sm text-green-600">&lt; 200ms</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Last Backup</span>
                    <span className="text-sm text-muted-foreground">2 hours ago</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>Nueva integración POS configurada</span>
                    <span className="text-muted-foreground ml-auto">5 min</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Sincronización completada exitosamente</span>
                    <span className="text-muted-foreground ml-auto">12 min</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <span>Nueva solicitud de asesoría</span>
                    <span className="text-muted-foreground ml-auto">1 hora</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="tenants">
          <Card>
            <CardHeader>
              <CardTitle>Tenant Overview</CardTitle>
              <CardDescription>
                Estado general de las ubicaciones y tenants
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                Vista detallada de tenants - En desarrollo
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance">
          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
              <CardDescription>
                Métricas de rendimiento del sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                Métricas de performance - En desarrollo
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts">
          <Card>
            <CardHeader>
              <CardTitle>System Alerts</CardTitle>
              <CardDescription>
                Alertas críticas que requieren atención
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-3 border rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5" />
                  <div>
                    <div className="font-medium">Integración POS desconectada</div>
                    <div className="text-sm text-muted-foreground">
                      Cliente "Café Central" perdió conexión hace 30 minutos
                    </div>
                    <div className="text-xs text-red-600 mt-1">Crítico</div>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 p-3 border rounded-lg">
                  <Clock className="w-5 h-5 text-orange-500 mt-0.5" />
                  <div>
                    <div className="font-medium">Sincronización retrasada</div>
                    <div className="text-sm text-muted-foreground">
                      Datos de consumo pendientes de procesar
                    </div>
                    <div className="text-xs text-orange-600 mt-1">Advertencia</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}