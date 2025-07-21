import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  TrendingDown, 
  Coffee, 
  Calendar,
  BarChart3,
  Package
} from 'lucide-react';

interface ConsumptionSummaryProps {
  weeklyTotal: number;
  monthlyTotal: number;
  weeklyChange: number;
  monthlyChange: number;
  topVariety: string;
  topFormat: string;
  efficiency: number;
  isLoading?: boolean;
}

export function ConsumptionSummary({
  weeklyTotal,
  monthlyTotal,
  weeklyChange,
  monthlyChange,
  topVariety,
  topFormat,
  efficiency,
  isLoading = false
}: ConsumptionSummaryProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="shadow-soft animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 bg-muted rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-muted rounded w-full"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Weekly Consumption */}
        <Card className="shadow-soft hover:shadow-warm transition-shadow">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Consumo Semanal</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{weeklyTotal}kg</div>
            <div className="flex items-center mt-2">
              {weeklyChange >= 0 ? (
                <TrendingUp className="h-4 w-4 text-success mr-1" />
              ) : (
                <TrendingDown className="h-4 w-4 text-destructive mr-1" />
              )}
              <span className={`text-xs ${weeklyChange >= 0 ? 'text-success' : 'text-destructive'}`}>
                {weeklyChange >= 0 ? '+' : ''}{weeklyChange}% vs semana anterior
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Monthly Consumption */}
        <Card className="shadow-soft hover:shadow-warm transition-shadow">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Consumo Mensual</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{monthlyTotal}kg</div>
            <div className="flex items-center mt-2">
              {monthlyChange >= 0 ? (
                <TrendingUp className="h-4 w-4 text-success mr-1" />
              ) : (
                <TrendingDown className="h-4 w-4 text-destructive mr-1" />
              )}
              <span className={`text-xs ${monthlyChange >= 0 ? 'text-success' : 'text-destructive'}`}>
                {monthlyChange >= 0 ? '+' : ''}{monthlyChange}% vs mes anterior
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Top Coffee Variety */}
        <Card className="shadow-soft hover:shadow-warm transition-shadow">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Variedad Principal</CardTitle>
              <Coffee className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold text-foreground mb-2">{topVariety}</div>
            <Badge variant="secondary" className="text-xs">
              Más consumida
            </Badge>
          </CardContent>
        </Card>

        {/* Consumption Efficiency */}
        <Card className="shadow-soft hover:shadow-warm transition-shadow">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Eficiencia</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{efficiency}%</div>
            <div className="mt-2">
              <Progress value={efficiency} className="h-2" />
              <p className="text-xs text-muted-foreground mt-1">Uso óptimo del stock</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Format Distribution */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="text-lg">Formato Más Consumido</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 bg-gradient-light rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Coffee className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="font-semibold text-foreground">{topFormat}</div>
                  <div className="text-sm text-muted-foreground">Preparación preferida</div>
                </div>
              </div>
              <Badge className="bg-primary/10 text-primary border-primary/20">
                Principal
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="text-lg">Acciones Rápidas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              variant="outline" 
              className="w-full justify-start"
              size="sm"
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Ver Análisis Detallado
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start"
              size="sm"
            >
              <Package className="h-4 w-4 mr-2" />
              Proyección de Stock
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start"
              size="sm"
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              Optimizar Consumo
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}