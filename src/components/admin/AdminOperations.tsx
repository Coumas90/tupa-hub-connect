import React, { useState } from 'react';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Edit, Building2, MapPin, Users, Settings } from 'lucide-react';
import { ContextualLoading } from '@/components/ui/loading-states';

export function AdminOperations() {
  const { loading } = useAdminAuth();
  const [activeTab, setActiveTab] = useState("organizations");
  
  if (loading) {
    return <ContextualLoading type="admin" message="Cargando operaciones..." />;
  }

  const organizations = [
    { id: 1, name: "Café Central", locations: 3, users: 12, status: "active" },
    { id: 2, name: "Bistro Premium", locations: 2, users: 8, status: "active" },
    { id: 3, name: "Coffee House", locations: 1, users: 4, status: "inactive" },
  ];

  const locations = [
    { id: 1, name: "Central Plaza", org: "Café Central", address: "Av. Principal 123", users: 5 },
    { id: 2, name: "Mall Norte", org: "Café Central", address: "Centro Comercial Norte", users: 4 },
    { id: 3, name: "Downtown", org: "Bistro Premium", address: "Calle 5 de Mayo 456", users: 6 },
  ];

  const users = [
    { id: 1, name: "Juan Pérez", email: "juan@cafecentral.com", role: "owner", org: "Café Central" },
    { id: 2, name: "María García", email: "maria@bistro.com", role: "owner", org: "Bistro Premium" },
    { id: 3, name: "Carlos López", email: "carlos@cafecentral.com", role: "manager", org: "Café Central" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Operaciones</h1>
        <p className="text-muted-foreground">
          Gestión de organizaciones, ubicaciones y usuarios
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="organizations">
            <Building2 className="w-4 h-4 mr-2" />
            Organizaciones
          </TabsTrigger>
          <TabsTrigger value="locations">
            <MapPin className="w-4 h-4 mr-2" />
            Ubicaciones
          </TabsTrigger>
          <TabsTrigger value="users">
            <Users className="w-4 h-4 mr-2" />
            Usuarios
          </TabsTrigger>
          <TabsTrigger value="system">
            <Settings className="w-4 h-4 mr-2" />
            Sistema
          </TabsTrigger>
        </TabsList>

        <TabsContent value="organizations" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Organizaciones</CardTitle>
                  <CardDescription>
                    Gestiona las organizaciones del sistema
                  </CardDescription>
                </div>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Nueva Organización
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {organizations.map((org) => (
                  <div key={org.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{org.name}</h3>
                        <Badge variant={org.status === 'active' ? 'default' : 'secondary'}>
                          {org.status === 'active' ? 'Activa' : 'Inactiva'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {org.locations} ubicaciones • {org.users} usuarios
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      <Edit className="w-4 h-4 mr-2" />
                      Editar
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="locations" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Ubicaciones</CardTitle>
                  <CardDescription>
                    Gestiona las ubicaciones por organización
                  </CardDescription>
                </div>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Nueva Ubicación
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {locations.map((location) => (
                  <div key={location.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="space-y-1">
                      <h3 className="font-medium">{location.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {location.org} • {location.address}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {location.users} usuarios asignados
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      <Edit className="w-4 h-4 mr-2" />
                      Editar
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Usuarios</CardTitle>
                  <CardDescription>
                    Gestiona usuarios y sus roles
                  </CardDescription>
                </div>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Invitar Usuario
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {users.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{user.name}</h3>
                        <Badge variant="outline">{user.role}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {user.email}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {user.org}
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      <Edit className="w-4 h-4 mr-2" />
                      Editar
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configuración del Sistema</CardTitle>
              <CardDescription>
                Configuraciones globales y mantenimiento
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Logs del Sistema</h3>
                    <p className="text-sm text-muted-foreground">Ver logs de actividad y errores</p>
                  </div>
                  <Button variant="outline">Ver Logs</Button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Respaldos</h3>
                    <p className="text-sm text-muted-foreground">Gestionar respaldos de datos</p>
                  </div>
                  <Button variant="outline">Configurar</Button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Integraciones</h3>
                    <p className="text-sm text-muted-foreground">Estado de integraciones POS y ERP</p>
                  </div>
                  <Button variant="outline">Monitorear</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}