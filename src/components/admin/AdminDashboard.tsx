import React from 'react';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Building2, MapPin, ShoppingCart } from 'lucide-react';
import { ContextualLoading } from '@/components/ui/loading-states';

export function AdminDashboard() {
  const { loading } = useAdminAuth();
  
  if (loading) {
    return <ContextualLoading type="admin" message="Cargando dashboard administrativo..." />;
  }

  const stats = [
    {
      title: "Total Organizaciones",
      value: "12",
      icon: Building2,
      description: "Organizaciones activas",
      trend: "+2 este mes"
    },
    {
      title: "Total Ubicaciones", 
      value: "34",
      icon: MapPin,
      description: "Ubicaciones registradas",
      trend: "+5 este mes"
    },
    {
      title: "Usuarios Activos",
      value: "156",
      icon: Users,
      description: "Usuarios en el sistema",
      trend: "+12 esta semana"
    },
    {
      title: "Órdenes Hoy",
      value: "89",
      icon: ShoppingCart,
      description: "Órdenes procesadas",
      trend: "+15% vs ayer"
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard Administrativo</h1>
        <p className="text-muted-foreground">
          Resumen general del sistema TUPÁ Hub
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">
                  {stat.description}
                </p>
                <Badge variant="secondary" className="mt-1">
                  {stat.trend}
                </Badge>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Actividad Reciente</CardTitle>
            <CardDescription>
              Últimas actividades en el sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Nueva organización registrada</p>
                  <p className="text-xs text-muted-foreground">Café Central - hace 2 horas</p>
                </div>
                <Badge>Nueva</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Usuario promocionado a Owner</p>
                  <p className="text-xs text-muted-foreground">juan@cafepremium.com - hace 4 horas</p>
                </div>
                <Badge variant="outline">Promoción</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Integración POS activada</p>
                  <p className="text-xs text-muted-foreground">Bistrosoft - hace 6 horas</p>
                </div>
                <Badge variant="secondary">Integración</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Estado del Sistema</CardTitle>
            <CardDescription>
              Monitoreo de servicios críticos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Base de Datos</span>
                <Badge className="bg-green-500">Operativo</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">API Supabase</span>
                <Badge className="bg-green-500">Operativo</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Integraciones POS</span>
                <Badge className="bg-green-500">Operativo</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Email Service</span>
                <Badge className="bg-yellow-500">Degradado</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}