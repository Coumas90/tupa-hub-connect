import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
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

const historialCompras = [
  { fecha: '2024-06-15', variedad: 'Finca La Esperanza - Origen', cantidad: '10kg', estado: 'Entregado', monto: '$45.000' },
  { fecha: '2024-05-20', variedad: 'Blend Especial House', cantidad: '8kg', estado: 'Entregado', monto: '$32.000' },
  { fecha: '2024-04-28', variedad: 'Finca La Esperanza - Origen', cantidad: '12kg', estado: 'Entregado', monto: '$54.000' },
  { fecha: '2024-04-10', variedad: 'Single Origin Premium', cantidad: '5kg', estado: 'Entregado', monto: '$28.500' }
];

export default function Consumo() {
  const stockActual = 65; // porcentaje
  const consumoMensual = 25; // kg
  const estimacionDias = 12;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Control de Consumo</h1>
          <p className="text-muted-foreground">Seguimiento detallado y reposición automática</p>
        </div>
        <Button className="bg-gradient-primary hover:bg-secondary/90">
          <ShoppingCart className="h-4 w-4 mr-2" />
          Reposición Automática
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="border-secondary/20">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Package className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Stock Actual</p>
                <p className="text-2xl font-bold">{stockActual}%</p>
              </div>
            </div>
            <Progress value={stockActual} className="mt-3" />
          </CardContent>
        </Card>

        <Card className="border-secondary/20">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-secondary/10 rounded-lg">
                <Coffee className="h-5 w-5 text-secondary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Consumo Mensual</p>
                <p className="text-2xl font-bold">{consumoMensual}kg</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-accent/20">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-accent/10 rounded-lg">
                <Calendar className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Estimación Stock</p>
                <p className="text-2xl font-bold">{estimacionDias} días</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-warning/20">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-warning/10 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Estado</p>
                <Badge variant="secondary" className="bg-warning/10 text-warning">
                  Reponer Pronto
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Consumo Mensual */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="h-5 w-5 mr-2 text-primary" />
              Consumo vs Estimado (6 meses)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="consumo" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={3}
                  name="Consumo Real (kg)"
                />
                <Line 
                  type="monotone" 
                  dataKey="estimado" 
                  stroke="hsl(var(--secondary))" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  name="Estimado (kg)"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Distribución por Método */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="h-5 w-5 mr-2 text-secondary" />
              Distribución por Método
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={[
                { metodo: 'Espresso', kg: 15 },
                { metodo: 'Filtrado', kg: 8 },
                { metodo: 'Cappuccino', kg: 2 }
              ]}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
                <XAxis dataKey="metodo" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Bar 
                  dataKey="kg" 
                  fill="hsl(var(--secondary))"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Historial de Compras */}
      <Card className="shadow-soft">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center">
            <ShoppingCart className="h-5 w-5 mr-2 text-accent" />
            Historial de Compras
          </CardTitle>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {historialCompras.map((compra, index) => (
              <div key={index} className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex-1">
                  <div className="flex items-center space-x-4">
                    <div>
                      <h4 className="font-semibold">{compra.variedad}</h4>
                      <p className="text-sm text-muted-foreground">{compra.fecha}</p>
                    </div>
                    <Separator orientation="vertical" className="h-8" />
                    <div>
                      <p className="font-medium">{compra.cantidad}</p>
                      <p className="text-sm text-muted-foreground">Cantidad</p>
                    </div>
                    <Separator orientation="vertical" className="h-8" />
                    <div>
                      <p className="font-bold text-primary">{compra.monto}</p>
                      <p className="text-sm text-muted-foreground">Total</p>
                    </div>
                  </div>
                </div>
                <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                  {compra.estado}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recomendación Automática */}
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
        <CardHeader>
          <CardTitle className="flex items-center text-primary">
            <Coffee className="h-5 w-5 mr-2" />
            Recomendación de Reposición
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold">Finca La Esperanza - Origen</h4>
              <p className="text-sm text-muted-foreground">
                Basado en tu consumo promedio, recomendamos reponer <strong>12kg</strong> antes del {new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toLocaleDateString()}
              </p>
            </div>
            <Button className="bg-gradient-primary hover:bg-primary/90">
              <ShoppingCart className="h-4 w-4 mr-2" />
              Reponer Ahora
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}