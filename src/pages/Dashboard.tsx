import { useEffect, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from '@/components/ui/progress';
import ModuleAccessGuard from '@/components/ModuleAccessGuard';
import WeatherCard from '@/components/WeatherCard';
import AdvisoryRequestModal from '@/components/modals/AdvisoryRequestModal';
import { Coffee, TrendingUp, Users, BookOpen, MapPin, Building, GraduationCap, Package, Calendar } from "lucide-react";
import { useLocationContext } from "@/contexts/LocationContext";
import { useSmartNavigation } from "@/utils/routing/redirects";
import { useAuthGuard } from '@/hooks/useAuthGuard';

export default function Dashboard() {
  const location = useLocation();
  const params = useParams();
  const { activeLocation, activeCafe, loading } = useLocationContext();
  const { navigateToOperation, navigateToTenant } = useSmartNavigation();
  const { isAuthenticated } = useAuthGuard({ requireAuth: true });

  // Determine dashboard context (role-based view for tenant routes)
  const isInTenantContext = location.pathname.startsWith('/tenants/');
  const dashboardRole = params.role || 'overview'; // overview, owner, manager, barista

  if (!isAuthenticated || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const DashboardContent = () => (
    <div className="container mx-auto px-6 py-8 space-y-8">
      {/* Header Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {isInTenantContext ? (
                <>
                  Dashboard {dashboardRole !== 'overview' && `- ${dashboardRole.charAt(0).toUpperCase() + dashboardRole.slice(1)}`}
                </>
              ) : (
                'Bienvenido a TUPÁ Hub'
              )}
            </h1>
            <p className="text-muted-foreground">
              {activeLocation ? (
                <span className="flex items-center mt-1">
                  <MapPin className="h-4 w-4 mr-1" />
                  {activeLocation.name}
                  {activeLocation.address && (
                    <span className="ml-2 text-xs">• {activeLocation.address}</span>
                  )}
                </span>
              ) : (
                'Tu plataforma integral de gestión cafetera'
              )}
            </p>
          </div>
          
          {activeCafe && (
            <div className="text-right">
              <Badge variant="secondary" className="mb-2">
                <Building className="h-3 w-3 mr-1" />
                {activeCafe.cafe_name}
              </Badge>
              <AdvisoryRequestModal cafeId={activeCafe.cafe_id}>
                <Button className="bg-gradient-to-r from-warm-primary to-warm-earth hover:from-warm-earth hover:to-warm-primary">
                  <Calendar className="h-4 w-4 mr-2" />
                  Programar Asesoría
                </Button>
              </AdvisoryRequestModal>
            </div>
          )}
        </div>

        {/* Role-specific context for tenant dashboards */}
        {isInTenantContext && dashboardRole !== 'overview' && (
          <div className="bg-muted/50 rounded-lg p-4">
            <h2 className="font-semibold text-sm mb-2">
              {dashboardRole === 'owner' && 'Vista de Propietario'}
              {dashboardRole === 'manager' && 'Vista de Encargado'}
              {dashboardRole === 'barista' && 'Vista de Barista'}
            </h2>
            <p className="text-sm text-muted-foreground">
              {dashboardRole === 'owner' && 'Acceso completo a todas las funciones y reportes del negocio.'}
              {dashboardRole === 'manager' && 'Gestión operativa, personal y reportes de rendimiento.'}
              {dashboardRole === 'barista' && 'Herramientas para el día a día: recetas, academia y recursos.'}
            </p>
          </div>
        )}
      </div>

      {/* Weather and Coffee of the Month - only for legacy view */}
      {!isInTenantContext && (
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <WeatherCard />
          </div>
          <div className="lg:col-span-2">
            <Card className="shadow-warm border-accent/20 h-full">
              <CardHeader className="bg-gradient-light rounded-t-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-accent/10 rounded-lg">
                      <Coffee className="h-8 w-8 text-accent" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">Café del Mes</CardTitle>
                      <p className="text-muted-foreground">Finca La Esperanza - Huila, Colombia</p>
                    </div>
                  </div>
                  <Badge className="bg-gradient-primary text-white">Activo</Badge>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-2">Perfil de Sabor</h4>
                    <p className="text-muted-foreground mb-4">
                      Notas frutales de arándano y chocolate, con acidez brillante y cuerpo medio.
                    </p>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Stock Actual</span>
                        <span className="text-sm font-semibold">28kg</span>
                      </div>
                      <Progress value={85} className="h-2" />
                      <p className="text-xs text-muted-foreground">85% disponible</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div className="p-3 bg-secondary/10 rounded-lg">
                        <p className="text-sm text-muted-foreground">Origen</p>
                        <p className="font-semibold">Huila</p>
                      </div>
                      <div className="p-3 bg-secondary/10 rounded-lg">
                        <p className="text-sm text-muted-foreground">Proceso</p>
                        <p className="font-semibold">Lavado</p>
                      </div>
                      <div className="p-3 bg-secondary/10 rounded-lg">
                        <p className="text-sm text-muted-foreground">Altura</p>
                        <p className="font-semibold">1650m</p>
                      </div>
                      <div className="p-3 bg-secondary/10 rounded-lg">
                        <p className="text-sm text-muted-foreground">Varietal</p>
                        <p className="font-semibold">Caturra</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Quick Actions Grid */}
      <div>
        <h2 className="text-xl font-semibold mb-4">
          {isInTenantContext ? 'Acceso Rápido' : 'Acciones Rápidas'}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="cursor-pointer hover:shadow-md transition-shadow" 
                onClick={() => isInTenantContext ? navigateToOperation('recipes') : navigateToTenant('operations/recipes')}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Recetas</CardTitle>
              <Coffee className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">24</div>
              <p className="text-xs text-muted-foreground">
                +2 nuevas esta semana
              </p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => isInTenantContext ? navigateToOperation('consumption') : navigateToTenant('operations/consumption')}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Consumo</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$2,340</div>
              <p className="text-xs text-muted-foreground">
                +12% desde el mes pasado
              </p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => isInTenantContext ? navigateToOperation('staff') : navigateToTenant('operations/staff')}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Mi Equipo</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">8</div>
              <p className="text-xs text-muted-foreground">
                Baristas activos
              </p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => isInTenantContext ? navigateToTenant('academy') : navigateToTenant('academy')}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Academia</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">3</div>
              <p className="text-xs text-muted-foreground">
                Cursos pendientes
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Migration Helper for Legacy Users */}
      {!isInTenantContext && activeLocation?.slug && (
        <Card className="border-primary/50 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-primary">🚀 Nueva Experiencia Disponible</CardTitle>
            <CardDescription>
              Prueba nuestra nueva interfaz con URLs más amigables y navegación mejorada
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => navigateToTenant('dashboard/overview')}
              className="w-full"
            >
              Probar Nueva Experiencia
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );

  return isInTenantContext ? (
    <DashboardContent />
  ) : (
    <ModuleAccessGuard module="Dashboard" requiredRole="cliente">
      <DashboardContent />
    </ModuleAccessGuard>
  );
}