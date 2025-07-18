import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import ModuleAccessGuard from '@/components/ModuleAccessGuard';
import {
  TrendingUp,
  Package,
  ShoppingCart,
  Calendar,
  BarChart3,
  AlertTriangle,
  Coffee,
  Download
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

const monthlyData = [
  { month: 'Ene', consumo: 12, estimado: 15 },
  { month: 'Feb', consumo: 18, estimado: 15 },
  { month: 'Mar', consumo: 14, estimado: 15 },
  { month: 'Abr', consumo: 22, estimado: 20 },
  { month: 'May', consumo: 19, estimado: 20 },
  { month: 'Jun', consumo: 25, estimado: 22 }
];

const purchaseHistory = [
  { id: 1, fecha: '2024-06-15', variedad: 'Finca La Esperanza', cantidad: '25kg', precio: '$112.500', estado: 'Entregado' },
  { id: 2, fecha: '2024-05-20', variedad: 'Montaña Azul', cantidad: '20kg', precio: '$95.000', estado: 'Entregado' },
  { id: 3, fecha: '2024-04-28', variedad: 'Finca La Esperanza', cantidad: '30kg', precio: '$135.000', estado: 'Entregado' },
  { id: 4, fecha: '2024-04-10', variedad: 'Origen Nariño', cantidad: '15kg', precio: '$82.500', estado: 'Entregado' },
  { id: 5, fecha: '2024-03-25', variedad: 'Finca La Esperanza', cantidad: '25kg', precio: '$112.500', estado: 'Entregado' }
];

const distributionData = [
  { name: 'Espresso', value: 45, color: '#8884d8' },
  { name: 'Filtrado', value: 30, color: '#82ca9d' },
  { name: 'Americano', value: 15, color: '#ffc658' },
  { name: 'Otros', value: 10, color: '#ff7300' }
];

const Consumo = (): JSX.Element => {
  const stockActual = 45;
  const consumoMensual = 28;
  const estimacionDias = 32;

  return (
    <ModuleAccessGuard module="Consumo" requiredRole="encargado">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Monitoreo de Consumo</h1>
            <p className="text-muted-foreground">Control de stock, consumo y reposición automática</p>
          </div>
          <Button className="bg-gradient-primary hover:bg-primary/90">
            <Package className="h-4 w-4 mr-2" />
            Reposición Automática
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-4">
          <Card className="shadow-soft">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">Stock Actual</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stockActual}kg</div>
              <div className="flex items-center space-x-2 mt-2">
                <Progress value={75} className="flex-1" />
                <span className="text-xs text-muted-foreground">75%</span>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">Consumo Mensual</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{consumoMensual}kg</div>
              <p className="text-xs text-green-600 mt-1">+12% vs mes anterior</p>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">Estimación Stock</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{estimacionDias} días</div>
              <p className="text-xs text-muted-foreground mt-1">Al ritmo actual</p>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">Estado</CardTitle>
                <AlertTriangle className="h-4 w-4 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <Badge className="bg-success/10 text-success border-success/20">Óptimo</Badge>
              <p className="text-xs text-muted-foreground mt-1">Stock suficiente</p>
            </CardContent>
          </Card>
        </div>

        {/* Gráficos */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Gráfico de Consumo Mensual */}
          <Card className="shadow-warm">
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="h-5 w-5 mr-2" />
                Consumo Mensual vs Estimado
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="consumo" fill="hsl(var(--primary))" name="Consumo Real" />
                    <Bar dataKey="estimado" fill="hsl(var(--secondary))" name="Estimado" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Gráfico de Distribución por Método */}
          <Card className="shadow-warm">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Coffee className="h-5 w-5 mr-2" />
                Distribución por Método
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {distributionData.map((item, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: item.color }}></div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium">{item.name}</span>
                        <span className="text-sm text-muted-foreground">{item.value}%</span>
                      </div>
                      <Progress value={item.value} className="h-2" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Historial de Compras */}
        <Card className="shadow-soft">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center">
                <ShoppingCart className="h-5 w-5 mr-2" />
                Historial de Compras
              </CardTitle>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {purchaseHistory.map((purchase) => (
                <div key={purchase.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Package className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="font-semibold">{purchase.variedad}</div>
                      <div className="text-sm text-muted-foreground">{purchase.fecha}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{purchase.cantidad}</div>
                    <div className="text-sm text-muted-foreground">{purchase.precio}</div>
                  </div>
                  <Badge className="bg-success/10 text-success border-success/20">
                    {purchase.estado}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recomendación de Reposición */}
        <Card className="shadow-glow border-accent/20">
          <CardHeader className="bg-gradient-light rounded-t-lg">
            <CardTitle className="flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2 text-accent" />
              Recomendación de Reposición
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-2">Análisis Automático</h4>
                <p className="text-muted-foreground mb-4">
                  Basado en tu consumo actual de <strong>28kg/mes</strong> y stock disponible de <strong>45kg</strong>, 
                  recomendamos realizar un pedido en los próximos <strong>15 días</strong> para evitar desabastecimiento.
                </p>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Cantidad sugerida:</span>
                    <span className="text-sm font-semibold">25kg</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Variedad recomendada:</span>
                    <span className="text-sm font-semibold">Finca La Esperanza</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Fecha ideal de pedido:</span>
                    <span className="text-sm font-semibold">En 15 días</span>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <Button className="w-full bg-gradient-primary hover:bg-primary/90" size="lg">
                  <Package className="h-5 w-5 mr-2" />
                  Solicitar Reposición Automática
                </Button>
                <Button variant="outline" className="w-full">
                  <Calendar className="h-5 w-5 mr-2" />
                  Programar Pedido
                </Button>
                <Button variant="outline" className="w-full">
                  <BarChart3 className="h-5 w-5 mr-2" />
                  Ver Análisis Detallado
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </ModuleAccessGuard>
  );
};

export default Consumo;