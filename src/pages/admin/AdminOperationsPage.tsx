import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import IntegrationTable from '@/components/admin/IntegrationTable';
import IntegrationMonitoring from '@/components/admin/IntegrationMonitoring';
import NewIntegrationModal from '@/components/admin/NewIntegrationModal';
import OdooManagement from '@/components/admin/OdooManagement';
import { ConsumptionCharts } from '@/components/admin/ConsumptionCharts';
import { ConsumptionFilters } from '@/components/admin/ConsumptionFilters';
import { Button } from '@/components/ui/button';
import { Plus, Settings, BarChart3 } from 'lucide-react';

export default function AdminOperationsPage() {
  const { section } = useParams<{ section?: string }>();
  const [showNewIntegrationModal, setShowNewIntegrationModal] = useState(false);
  const [tableKey, setTableKey] = useState(0);
  
  const activeTab = section || 'consumption';

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Operations Management</h1>
          <p className="text-muted-foreground">
            Gestión de operaciones, integraciones y análisis de consumo
          </p>
        </div>
        
        {activeTab === 'pos' && (
          <Button
            onClick={() => setShowNewIntegrationModal(true)}
            className="bg-primary hover:bg-primary/90"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nueva Integración POS
          </Button>
        )}
      </div>

      <Tabs value={activeTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="consumption" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Consumption Analytics
          </TabsTrigger>
          <TabsTrigger value="pos" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            POS Integrations
          </TabsTrigger>
          <TabsTrigger value="odoo" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Odoo Management
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="consumption" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Consumption Analytics</CardTitle>
              <CardDescription>
                Análisis detallado del consumo por ubicación y período
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <ConsumptionFilters onFiltersChange={() => {}} />
              <ConsumptionCharts />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="pos" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>POS Integrations</CardTitle>
                  <CardDescription>
                    Gestión de integraciones con sistemas de punto de venta
                  </CardDescription>
                </div>
                <Badge variant="secondary">
                  Tiempo real
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <IntegrationTable filter="all" key={tableKey} />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Integration Monitoring</CardTitle>
              <CardDescription>
                Monitoreo en tiempo real del estado de las integraciones
              </CardDescription>
            </CardHeader>
            <CardContent>
              <IntegrationMonitoring />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="odoo">
          <OdooManagement />
        </TabsContent>
      </Tabs>

      <NewIntegrationModal 
        isOpen={showNewIntegrationModal}
        onClose={() => setShowNewIntegrationModal(false)}
        onSuccess={() => {
          setShowNewIntegrationModal(false);
          setTableKey(prev => prev + 1);
        }}
      />
    </div>
  );
}