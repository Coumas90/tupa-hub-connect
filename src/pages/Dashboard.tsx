import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import ModuleAccessGuard from '@/components/ModuleAccessGuard';
import WeatherCard from '@/components/WeatherCard';
import { useNavigate } from 'react-router-dom';
import {
  Coffee,
  Package,
  GraduationCap,
  FileText,
  TrendingUp,
  AlertCircle,
  Calendar,
  Users
} from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();

  return (
    <ModuleAccessGuard module="Dashboard" requiredRole="cliente">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Bienvenido a TUPÁ Hub</h1>
            <p className="text-muted-foreground">Tu plataforma integral de gestión cafetera</p>
          </div>
          <Button className="bg-gradient-primary hover:bg-primary/90">
            <Calendar className="h-4 w-4 mr-2" />
            Programar Asesoría
          </Button>
        </div>

        {/* Clima y Café del Mes */}
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

        {/* Acciones Rápidas */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Acciones Rápidas</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card 
              className="shadow-soft hover:shadow-warm transition-shadow cursor-pointer"
              onClick={() => navigate('/recetas')}
            >
              <CardContent className="p-6 text-center">
                <div className="p-4 bg-primary/10 rounded-full mx-auto mb-4 w-fit">
                  <Coffee className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">Recetas</h3>
                <p className="text-sm text-muted-foreground">Consulta y crea nuevas recetas</p>
              </CardContent>
            </Card>

            <Card 
              className="shadow-soft hover:shadow-warm transition-shadow cursor-pointer"
              onClick={() => navigate('/reposicion')}
            >
              <CardContent className="p-6 text-center">
                <div className="p-4 bg-destructive/10 rounded-full mx-auto mb-4 w-fit">
                  <Package className="h-8 w-8 text-destructive" />
                </div>
                <h3 className="font-semibold mb-2">Reposición</h3>
                <p className="text-sm text-muted-foreground">Solicita café nuevo</p>
              </CardContent>
            </Card>

            <Card 
              className="shadow-soft hover:shadow-warm transition-shadow cursor-pointer"
              onClick={() => navigate('/academia')}
            >
              <CardContent className="p-6 text-center">
                <div className="p-4 bg-accent/10 rounded-full mx-auto mb-4 w-fit">
                  <GraduationCap className="h-8 w-8 text-accent" />
                </div>
                <h3 className="font-semibold mb-2">Academia</h3>
                <p className="text-sm text-muted-foreground">Continúa tu capacitación</p>
              </CardContent>
            </Card>

            <Card 
              className="shadow-soft hover:shadow-warm transition-shadow cursor-pointer"
              onClick={() => navigate('/recursos')}
            >
              <CardContent className="p-6 text-center">
                <div className="p-4 bg-secondary/10 rounded-full mx-auto mb-4 w-fit">
                  <FileText className="h-8 w-8 text-secondary" />
                </div>
                <h3 className="font-semibold mb-2">Recursos</h3>
                <p className="text-sm text-muted-foreground">Material técnico y promocional</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Grid de Estadísticas */}
        <div className="grid md:grid-cols-3 gap-6">
          <Card 
            className="shadow-soft hover:shadow-warm transition-shadow cursor-pointer"
            onClick={() => navigate('/consumo')}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">Consumo Mensual</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">24.8kg</div>
              <p className="text-xs text-muted-foreground">+12% vs mes anterior</p>
              <Progress value={75} className="mt-3" />
            </CardContent>
          </Card>

          <Card 
            className="shadow-soft hover:shadow-warm transition-shadow cursor-pointer"
            onClick={() => navigate('/academia')}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">Progreso Academia</CardTitle>
                <GraduationCap className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">68%</div>
              <p className="text-xs text-muted-foreground">2 cursos completados</p>
              <Progress value={68} className="mt-3" />
            </CardContent>
          </Card>

          <Card 
            className="shadow-soft hover:shadow-warm transition-shadow cursor-pointer"
            onClick={() => navigate('/mi-equipo')}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">Baristas Activos</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">8</div>
              <p className="text-xs text-muted-foreground">6 certificados</p>
              <Progress value={75} className="mt-3" />
            </CardContent>
          </Card>
        </div>

        {/* Consejo de IA del Mes */}
        <Card className="shadow-glow border-accent/20">
          <CardHeader className="bg-gradient-light rounded-t-lg">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-accent/10 rounded-lg">
                <AlertCircle className="h-5 w-5 text-accent" />
              </div>
              <div>
                <CardTitle>Consejo IA del Mes</CardTitle>
                <p className="text-sm text-muted-foreground">Optimización personalizada para tu cafetería</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <p className="text-muted-foreground mb-4">
              Basado en tu patrón de consumo actual, recomendamos ajustar la molienda para el espresso matutino 
              un punto más fino. Esto mejorará la extracción en un 8% y potenciará las notas frutales del café actual.
            </p>
            <Button variant="outline" className="w-full">
              <AlertCircle className="h-4 w-4 mr-2" />
              Ver Análisis Completo
            </Button>
          </CardContent>
        </Card>
      </div>
    </ModuleAccessGuard>
  );
}