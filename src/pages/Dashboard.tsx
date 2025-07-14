import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
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
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Bienvenido a TUPÁ Hub</p>
        </div>
        <Button className="bg-gradient-warm shadow-warm">
          <Calendar className="h-4 w-4 mr-2" />
          Programar Asesoría
        </Button>
      </div>

      {/* Coffee of the Month */}
      <Card className="shadow-soft border-0">
        <CardHeader className="bg-gradient-warm text-white rounded-t-lg">
          <div className="flex items-center space-x-3">
            <Coffee className="h-8 w-8" />
            <div>
              <CardTitle className="text-xl">Café del Mes</CardTitle>
              <p className="text-white/90">Finca La Esperanza - Colombia</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-2">Perfil de Taza</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Notas de chocolate, caramelo y frutas rojas. Cuerpo medio, acidez balanceada.
                Ideal para espresso y métodos de filtrado.
              </p>
              <div className="flex space-x-2">
                <Badge variant="secondary">Chocolate</Badge>
                <Badge variant="secondary">Caramelo</Badge>
                <Badge variant="secondary">Frutas Rojas</Badge>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Estado de Stock</h4>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Stock Actual</span>
                    <span>24 kg / 40 kg</span>
                  </div>
                  <Progress value={60} className="h-2" />
                </div>
                <div className="flex items-center text-sm text-warning">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  Reposición recomendada en 5 días
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="hover:shadow-warm transition-shadow cursor-pointer group">
          <CardContent className="p-6 text-center">
            <Coffee className="h-8 w-8 mx-auto mb-3 text-secondary group-hover:scale-110 transition-transform" />
            <h3 className="font-semibold mb-1">Recetas</h3>
            <p className="text-sm text-muted-foreground">Ver preparaciones</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-warm transition-shadow cursor-pointer group">
          <CardContent className="p-6 text-center">
            <Package className="h-8 w-8 mx-auto mb-3 text-secondary group-hover:scale-110 transition-transform" />
            <h3 className="font-semibold mb-1">Reposición</h3>
            <p className="text-sm text-muted-foreground">Solicitar café</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-warm transition-shadow cursor-pointer group">
          <CardContent className="p-6 text-center">
            <GraduationCap className="h-8 w-8 mx-auto mb-3 text-secondary group-hover:scale-110 transition-transform" />
            <h3 className="font-semibold mb-1">Academia</h3>
            <p className="text-sm text-muted-foreground">Continuar curso</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-warm transition-shadow cursor-pointer group">
          <CardContent className="p-6 text-center">
            <FileText className="h-8 w-8 mx-auto mb-3 text-secondary group-hover:scale-110 transition-transform" />
            <h3 className="font-semibold mb-1">Recursos</h3>
            <p className="text-sm text-muted-foreground">Materiales</p>
          </CardContent>
        </Card>
      </div>

      {/* Stats Grid */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Consumo Mensual</CardTitle>
            <TrendingUp className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">28.5 kg</div>
            <p className="text-xs text-success">+12% vs mes anterior</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Progreso Academia</CardTitle>
            <GraduationCap className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">75%</div>
            <p className="text-xs text-muted-foreground">3 de 4 cursos completados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Baristas Activos</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">2 certificados este mes</p>
          </CardContent>
        </Card>
      </div>

      {/* AI Tip of the Month */}
      <Card className="border-secondary/20 bg-gradient-to-r from-secondary/5 to-transparent">
        <CardHeader>
          <CardTitle className="flex items-center text-secondary">
            <Coffee className="h-5 w-5 mr-2" />
            Consejo del Mes - IA TUPÁ
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm">
            <strong>Optimización de extracción:</strong> Basado en tu perfil de consumo, 
            recomendamos ajustar la molienda para el espresso a un grado más fino durante 
            las mañanas de alta humedad. Esto mejorará la consistencia de tus shots.
          </p>
          <Button variant="outline" size="sm" className="mt-3">
            Ver Tutorial Completo
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}