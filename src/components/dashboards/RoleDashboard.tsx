import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from '@/components/ui/progress';
import { 
  Coffee, TrendingUp, Users, BookOpen, Package, Calendar, 
  BarChart3, Clock, Award, DollarSign, ShoppingCart, 
  GraduationCap, Star, Target, AlertCircle 
} from "lucide-react";
import { useEnhancedAuth } from '@/hooks/useEnhancedAuth';
import { useSmartNavigation } from '@/utils/routing/redirects';
import { Roles } from '@/constants/roles';

interface DashboardWidget {
  id: string;
  title: string;
  icon: React.ElementType;
  content: React.ReactNode;
  span?: number; // Grid column span
  permission?: string[];
}

interface RoleDashboardProps {
  userRole: string;
  isAdmin: boolean;
  activeLocation?: any;
  activeCafe?: any;
}

export function RoleDashboard({ userRole, isAdmin, activeLocation, activeCafe }: RoleDashboardProps) {
  const { navigateToOperation, navigateToTenant } = useSmartNavigation();

  // Quick stats mock data (would come from API)
  const mockStats = {
    todaySales: 1250,
    salesGrowth: 12,
    activeStaff: 8,
    pendingOrders: 3,
    lowStock: 2,
    coursesCompleted: 7,
    avgRating: 4.8,
    monthlyTarget: 85
  };

  const getWidgetsForRole = (): DashboardWidget[] => {
    const baseWidgets: DashboardWidget[] = [];

    if (isAdmin) {
      return [
        {
          id: 'system-overview',
          title: 'Visión General del Sistema',
          icon: BarChart3,
          span: 2,
          content: (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">47</div>
                  <p className="text-sm text-muted-foreground">Locaciones Activas</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">95%</div>
                  <p className="text-sm text-muted-foreground">Uptime Sistema</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Usuarios Activos</span>
                  <span className="text-sm font-semibold">234</span>
                </div>
                <Progress value={78} className="h-2" />
                <p className="text-xs text-muted-foreground">+15% este mes</p>
              </div>
            </div>
          )
        },
        {
          id: 'alerts',
          title: 'Alertas del Sistema',
          icon: AlertCircle,
          content: (
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <div className="h-2 w-2 bg-red-500 rounded-full mt-2 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium">Stock crítico</p>
                  <p className="text-xs text-muted-foreground">3 locaciones</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="h-2 w-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium">Sincronización pendiente</p>
                  <p className="text-xs text-muted-foreground">POS Fudo - Cliente 12</p>
                </div>
              </div>
            </div>
          )
        }
      ];
    }

    switch (userRole?.toLowerCase()) {
      case Roles.OWNER:
        return [
          {
            id: 'revenue',
            title: 'Ingresos Hoy',
            icon: DollarSign,
            content: (
              <div className="space-y-2">
                <div className="text-2xl font-bold">${mockStats.todaySales.toLocaleString()}</div>
                <div className="flex items-center space-x-1">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-green-500">+{mockStats.salesGrowth}%</span>
                  <span className="text-sm text-muted-foreground">vs ayer</span>
                </div>
              </div>
            )
          },
          {
            id: 'performance',
            title: 'Rendimiento Mensual',
            icon: Target,
            content: (
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm">Meta del Mes</span>
                  <span className="text-sm font-semibold">{mockStats.monthlyTarget}%</span>
                </div>
                <Progress value={mockStats.monthlyTarget} className="h-2" />
                <p className="text-xs text-muted-foreground">
                  ${(25000 * mockStats.monthlyTarget / 100).toLocaleString()} de $25,000
                </p>
              </div>
            )
          },
          {
            id: 'staff-overview',
            title: 'Equipo de Trabajo',
            icon: Users,
            content: (
              <div className="space-y-2">
                <div className="text-2xl font-bold">{mockStats.activeStaff}</div>
                <p className="text-sm text-muted-foreground">Baristas activos</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => navigateToOperation('staff')}
                  className="w-full"
                >
                  Gestionar Equipo
                </Button>
              </div>
            )
          },
          {
            id: 'inventory-alerts',
            title: 'Inventario',
            icon: Package,
            content: (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Stock Bajo</span>
                  <Badge variant={mockStats.lowStock > 0 ? "destructive" : "default"}>
                    {mockStats.lowStock} items
                  </Badge>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => navigateToOperation('inventory')}
                  className="w-full"
                >
                  Ver Inventario
                </Button>
              </div>
            )
          }
        ];

      case Roles.MANAGER:
        return [
          {
            id: 'operations',
            title: 'Operaciones Diarias',
            icon: Clock,
            content: (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2 text-center">
                  <div>
                    <div className="text-lg font-bold">{mockStats.pendingOrders}</div>
                    <p className="text-xs text-muted-foreground">Pedidos Pendientes</p>
                  </div>
                  <div>
                    <div className="text-lg font-bold">{mockStats.activeStaff}</div>
                    <p className="text-xs text-muted-foreground">Staff Activo</p>
                  </div>
                </div>
                <Button 
                  size="sm" 
                  onClick={() => navigateToOperation('consumption')}
                  className="w-full"
                >
                  Ver Operaciones
                </Button>
              </div>
            )
          },
          {
            id: 'team-performance',
            title: 'Rendimiento del Equipo',
            icon: BarChart3,
            content: (
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Productividad</span>
                  <span className="text-sm font-semibold">92%</span>
                </div>
                <Progress value={92} className="h-2" />
                <div className="grid grid-cols-2 gap-2 mt-3 text-center">
                  <div>
                    <div className="text-sm font-bold">{mockStats.coursesCompleted}</div>
                    <p className="text-xs text-muted-foreground">Cursos Completados</p>
                  </div>
                  <div>
                    <div className="text-sm font-bold">{mockStats.avgRating}</div>
                    <p className="text-xs text-muted-foreground">Rating Promedio</p>
                  </div>
                </div>
              </div>
            )
          },
          {
            id: 'training',
            title: 'Capacitación',
            icon: GraduationCap,
            content: (
              <div className="space-y-2">
                <p className="text-sm font-medium">Próxima Sesión</p>
                <p className="text-xs text-muted-foreground">Latte Art Avanzado</p>
                <p className="text-xs text-muted-foreground">Mañana, 10:00 AM</p>
                <Button 
                  size="sm" 
                  onClick={() => navigateToTenant('academy')}
                  className="w-full mt-2"
                >
                  Ver Academia
                </Button>
              </div>
            )
          }
        ];

      case Roles.BARISTA:
        return [
          {
            id: 'daily-tasks',
            title: 'Tareas de Hoy',
            icon: Coffee,
            span: 2,
            content: (
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <div className="text-lg font-bold">24</div>
                    <p className="text-xs text-muted-foreground">Recetas Disponibles</p>
                  </div>
                  <div className="p-3 bg-green-500/10 rounded-lg">
                    <div className="text-lg font-bold text-green-600">3</div>
                    <p className="text-xs text-muted-foreground">Cursos Pendientes</p>
                  </div>
                  <div className="p-3 bg-orange-500/10 rounded-lg">
                    <div className="text-lg font-bold text-orange-600">1</div>
                    <p className="text-xs text-muted-foreground">Nueva Receta</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    size="sm" 
                    onClick={() => navigateToOperation('recipes')}
                    className="bg-gradient-primary"
                  >
                    Ver Recetas
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => navigateToTenant('academy')}
                  >
                    Continuar Curso
                  </Button>
                </div>
              </div>
            )
          },
          {
            id: 'skills',
            title: 'Mi Progreso',
            icon: Award,
            content: (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Nivel Barista</span>
                  <Badge className="bg-gradient-primary">Intermedio</Badge>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-xs">Experiencia</span>
                    <span className="text-xs">75%</span>
                  </div>
                  <Progress value={75} className="h-2" />
                </div>
                <div className="flex items-center space-x-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm">Próximo logro: Expert</span>
                </div>
              </div>
            )
          }
        ];

      case 'client':
      default:
        return [
          {
            id: 'quick-access',
            title: 'Acceso Rápido',
            icon: ShoppingCart,
            span: 2,
            content: (
              <div className="grid grid-cols-2 gap-3">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => navigateToOperation('recipes')}
                  className="flex flex-col h-auto py-3"
                >
                  <Coffee className="h-5 w-5 mb-1" />
                  <span className="text-xs">Recetas</span>
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => navigateToOperation('consumption')}
                  className="flex flex-col h-auto py-3"
                >
                  <TrendingUp className="h-5 w-5 mb-1" />
                  <span className="text-xs">Consumo</span>
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => navigateToOperation('staff')}
                  className="flex flex-col h-auto py-3"
                >
                  <Users className="h-5 w-5 mb-1" />
                  <span className="text-xs">Mi Equipo</span>
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => navigateToTenant('academy')}
                  className="flex flex-col h-auto py-3"
                >
                  <GraduationCap className="h-5 w-5 mb-1" />
                  <span className="text-xs">Academia</span>
                </Button>
              </div>
            )
          },
          {
            id: 'overview',
            title: 'Resumen',
            icon: BarChart3,
            content: (
              <div className="space-y-2">
                <div className="text-center">
                  <div className="text-lg font-bold">Todo en orden</div>
                  <p className="text-xs text-muted-foreground">Sistema funcionando correctamente</p>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span>Stock</span>
                    <span className="text-green-600">✓ Óptimo</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span>Equipo</span>
                    <span className="text-green-600">✓ Activo</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span>Capacitación</span>
                    <span className="text-yellow-600">⚡ 3 pendientes</span>
                  </div>
                </div>
              </div>
            )
          }
        ];
    }
  };

  const widgets = getWidgetsForRole();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {widgets.map((widget) => (
        <Card 
          key={widget.id} 
          className={`hover:shadow-md transition-shadow animate-fade-in ${
            widget.span === 2 ? 'md:col-span-2' : ''
          }`}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{widget.title}</CardTitle>
            <widget.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {widget.content}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}